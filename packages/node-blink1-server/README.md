# node-blink1-server

HTTP REST API server for [blink(1)](https://blink1.thingm.com/) USB LED notification devices.

Version 2 — rewritten from the ground up to match the full
[Blink1Control2](https://github.com/todbot/Blink1Control2) API surface, including named color
patterns, multi-device support, and a Node.js library interface.

Supports plug and unplug of blink(1) while the server is running.


## Installation & running

### One-off with npx (no install required)

```
npx node-blink1-server
npx node-blink1-server 8080
npx node-blink1-server --port 8080 --host 0.0.0.0
```

### Global install

```
npm install -g node-blink1-server
blink1-server             # starts on localhost:8934
blink1-server 8080
blink1-server --port 8080 --host 0.0.0.0
```

### From source

```
git clone https://github.com/todbot/node-blink1-server.git
cd node-blink1-server
npm install
npm start              # localhost:8934
npm start -- 8080      # port 8080
```

### Persistent server with pm2

For production use or boot persistence, use [pm2](https://pm2.keymetrics.io/):

```
npm install -g pm2
pm2 start blink1-server -- --port 8934
pm2 startup            # configure to start on boot
pm2 save
```

### Note on native module rebuild

`node-blink1` contains a native C++ addon. If you switch Node.js versions or use this package
inside an Electron app (which has its own ABI), you need to rebuild the native module:

```
npm run clean
npm install
```

When used inside an Electron app via a `file:` reference, rebuild against Electron's ABI instead:

```
./node_modules/.bin/electron-rebuild -f -w node-blink1
```


## CLI usage

```
blink1-server [port]
blink1-server --port <port> --host <host>
```

| Option | Default | Description |
|--------|---------|-------------|
| `port` (positional or `--port`) | `8934` | HTTP port to listen on |
| `--host` | `localhost` | Bind address (`0.0.0.0` for all interfaces) |


## REST API

All endpoints are HTTP GET. Query parameters use standard URL encoding.

### Common query parameters

| Parameter | Alias | Description |
|-----------|-------|-------------|
| `rgb` | | Hex color, e.g. `%23ff00ff` (URL-encoded `#ff00ff`) |
| `time` | | Fade time in **seconds** (e.g. `0.5`) |
| `millis` | | Fade time in **milliseconds** (e.g. `500`) — takes priority over `time` |
| `ledn` | | LED number: `0` = all, `1` = top, `2` = bottom (default: `0`) |
| `blink1_id` | `id` | Device serial number to target (omit for default device) |

---

### Device info

| Endpoint | Description |
|----------|-------------|
| `GET /blink1` | List connected device serial numbers and IFTTT key |
| `GET /blink1/id` | Same as above |
| `GET /blink1/enumerate` | Re-scan for devices, then list |

### Color control

| Endpoint | Description |
|----------|-------------|
| `GET /blink1/fadeToRGB?rgb=<hex>&time=<secs>` | Fade to a specific color |
| `GET /blink1/lastColor` | Return current color state |
| `GET /blink1/on` | Fade to white |
| `GET /blink1/off` | Fade to black (stops any playing pattern) |
| `GET /blink1/red` | Named color shortcuts |
| `GET /blink1/green` | |
| `GET /blink1/blue` | |
| `GET /blink1/cyan` | |
| `GET /blink1/yellow` | |
| `GET /blink1/magenta` | |
| `GET /blink1/random` | Random color |
| `GET /blink1/blink?rgb=<hex>&count=<n>&time=<secs>` | Blink N times |

### Pattern control

A **pattern** is a named sequence of `{color, time, ledn}` steps. System patterns are built in;
user patterns are added via the API and persist in the config file (when a config file is provided).

| Endpoint | Query params | Description |
|----------|-------------|-------------|
| `GET /blink1/patterns` | | List all patterns |
| `GET /blink1/pattern/queue` | | List currently-playing pattern queue |
| `GET /blink1/pattern/play` | `pname` or `name` | Play a pattern by name |
| `GET /blink1/pattern/stop` | `pname` or `name` (optional) | Stop a pattern, or all if omitted |
| `GET /blink1/pattern/add` | `name`, `pattern` | Add a pattern from a pattern string |
| `GET /blink1/pattern/del` | `name` or `id` | Delete a user pattern |

#### Pattern strings

Pattern strings encode a repeating color sequence:

```
repeats,#color1,secs1,ledn1,#color2,secs2,ledn2,...
```

Examples:
```
3,#ff0000,0.3,0,#000000,0.3,0          # red blink 3x
0,#ff0000,0.5,1,#0000ff,0.5,2          # alternating red/blue forever (repeats=0)
```

#### Special (meta) patterns

These pattern names are interpreted directly without needing a pre-defined pattern:

| Name | Example | Description |
|------|---------|-------------|
| `#rrggbb` | `#ff00ff` | Fade to that hex color |
| `~off` | | Stop all patterns and fade to black |
| `~blink:<color>-<count>` | `~blink:#ff0000-5` | Blink color N times |
| `~blink:<color>-<count>-<secs>` | `~blink:#ff0000-5-0.3` | Blink with custom timing |
| `~pattern:<name>:<patternstr>` | `~pattern:mypatt:3,#ff0000,0.3,0` | Play an inline pattern |


## Examples

```sh
$ blink1-server &

# Device info
$ curl 'http://localhost:8934/blink1'
{
  "blink1_serialnums": [ "AB0026C1" ],
  "blink1_id": "DEADBEEFAB0026C1",
  "status": "blink1 id"
}

# Fade to blue over 2.5 seconds on LED 2
$ curl 'http://localhost:8934/blink1/fadeToRGB?rgb=%230000ff&time=2.5&ledn=2'
{
  "blink1_serialnums": [ "AB0026C1" ],
  "lastColor": "#0000ff",
  "lastTime": 2.5,
  "lastMillis": 2500,
  "lastLedn": 2,
  "cmd": "fadeToRGB",
  "status": "success"
}

# Blink red 5 times
$ curl 'http://localhost:8934/blink1/blink?rgb=%23ff0000&count=5&time=0.3'

# Play a built-in pattern
$ curl 'http://localhost:8934/blink1/pattern/play?pname=red+flash'

# Add and play a custom pattern
$ curl 'http://localhost:8934/blink1/pattern/add?name=police&pattern=6,%23ff0000,0.3,1,%230000ff,0.3,2,%23000000,0.1,0'
$ curl 'http://localhost:8934/blink1/pattern/play?pname=police'

# Stop all patterns
$ curl 'http://localhost:8934/blink1/pattern/stop'

# Play a meta-pattern inline (no pre-defined pattern needed)
$ curl 'http://localhost:8934/blink1/pattern/play?pname=~blink:%23ff00ff-3-0.5'
```


## Testing

Three test suites, all using the built-in `node:test` runner (no extra dependencies).

```sh
npm test                       # unit + HTTP integration — no device needed
npm run test:hardware          # hardware-in-the-loop — skips if no device found
node --test test/blink1Service.test.js   # single file
```

| Suite | File | Requires device |
|-------|------|----------------|
| blink1Service unit | `test/blink1Service.test.js` | No |
| patternsService unit | `test/patternsService.test.js` | No |
| apiServer HTTP integration | `test/apiServer.test.js` | No |
| Hardware-in-the-loop | `test/blink1Hardware.test.js` | Yes (skipped if absent) |

The hardware suite actually lights up the device — run it in an environment where that's acceptable. It covers device detection, `fadeToColor`, pattern playback, `writePatternToBlink1`, and all color/blink/pattern HTTP endpoints end-to-end.


## Node.js library usage

```js
var createBlink1Server = require('node-blink1-server');

var server = createBlink1Server({
    apiConfig:      { port: 8934, host: 'localhost' },
    blink1Config:   { deviceRescan: true, enableGamma: false },
    patternsConfig: { playingSerialize: false },
    patterns:       [],   // array of saved user pattern objects
});

// The server object is an EventEmitter
server.on('status',          function(s)       { console.log(s.type, s.text); });
server.on('deviceUpdated',   function()         { /* blink1 list changed */ });
server.on('patternsChanged', function(patterns) { /* persist patterns array */ });
server.on('configChanged',   function(key, val) { /* persist config value */ });

server.start();

// Access underlying service singletons directly if needed
server.blink1Service.fadeToColor(500, '#ff0000', 0);
server.patternsService.playPatternFrom('myapp', 'red flash');
server.apiServer.stop(function() { console.log('stopped'); });
```

### Factory options

| Option | Type | Description |
|--------|------|-------------|
| `apiConfig` | object | `{ port, host }` — HTTP server config |
| `blink1Config` | object | `{ deviceRescan, enableGamma, blink1ToUse, hostId }` |
| `patternsConfig` | object | `{ playingSerialize }` — serialize pattern playback |
| `patterns` | Array | Saved user pattern objects to pre-load |
| `logger` | object | Optional logger with `.msg()` and `.error()` methods |

### Events emitted

| Event | Arguments | Description |
|-------|-----------|-------------|
| `status` | `{type, source, id, text}` | Service status / error updates |
| `deviceUpdated` | | blink(1) device list changed |
| `patternsChanged` | `patternsArray` | User patterns were saved or deleted |
| `configChanged` | `key, value` | A config value changed (e.g. `hostId`) |


## Differences from v1

| Feature | v1 | v2 |
|---------|----|----|
| Named patterns | No | Yes — play, stop, add, delete |
| Multi-device | No | Yes — `blink1_id` on all endpoints |
| Pattern persistence | No | Via `patternsChanged` event |
| Library API | No | Yes — `createBlink1Server()` factory |
| Config system | None | Plain objects / CLI args |
| Events | None | EventEmitter on server object |
