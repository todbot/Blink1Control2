
## NOTES

Random notes


### App capability changes / To-do's
- TODO: Add "go back to last pattern" or "return to previous state" color pattern
-- (maybe via a "pattern stack" and new patterns like "red always")
- TODO: Support multiple blink(1)s (especially in upcoming IFTTT update)
- DONE: Special patterns like '~off' and '~stop:patternname'
- IFTTT rule_name can be matching rule or specific patternname or special patternname
-  (maybe restructure app to not need IFTTT "rules"?)
- Patterns should allow multiple LEDs to change per step (take array of {color,ledn,time})
- DONE: TODO: Add 'enable' flag to each rule in Mail & Tools
- TODO: partition code into client & server so webpack doesn't bundle server code
- DONE : TODO: what about 'parametric patterns', e.g. "blink 5 times, fill in color & on/off time"
- TODO: Number() vs parseInt() in `PatternsService._parsePatternStr()`?
- TODO: global shortcut, see: https://github.com/atom/electron/blob/master/docs/api/global-shortcut.md

### Meta Patterns
- Normally patterns are created, then specified for playing, by `id` (or `name` in some cases)
- There exist special "meta" patterns that dynamically create a pattern or cause an actionType
- These special meta-patterns can take the form:
  - `#<hexcolor>` -- Set a specific color on all LEDs e.g. "#FF00FF", "#000000", or "#ccaabb"
  - `~off` -- Turn blink(1) off completely (stop patterns, set to dark)
  - `~blink-color-count` -- blink color-dark-color-dark, count times. e.g. `~blink-white-3`, `~blink-#ff0000-5`
  - `~pattern:<patternstr>` -- Play a pattern in string form. e.g. `~pattern:3,#ff00ff,0.5,0,#00ff00,1.3,0`

### URL / Script / Tool color & pattern matching
- In general, try to match previous behavior at https://github.com/todbot/blink1/blob/master/docs/blink1control-file-script-url-format.md
- In configuration, now specify "parse as color", "parse as pattern", or "parse as JSON"
- In "parse as color", look for hex color codes, "color: [foo]" and parse "[foo]" as color name
- In "parse as pattern", look for "pattern: [foo]" and parse "[foo]" as pattern name (including meta-patterns)
- In "parse as JSON", accept either 'color' or 'pattern' keys

### App menu, Tray menu, window closing, window hiding
- By default, closing the window doesn't exist Blink1Control, just hides the window
- On Mac, must `Menu.setApplicationMenu()` to allow Cmd-Q to quit while also allowing red-X to close window but not exist

###  Event Sources structure
- Event searcher lives in `src/server/<sourcename>Service.js`
- Config lives in config.eventRules[] and each rule must contain: enabled, type, name
- Form to set config lives in `src/component/gui/<sourcename>Form.js`
- toolTable.js loads forms, ask them to format themselves for tables,

### Event log API  
- Event sources are responsible to triggering patterns via PatternsService or colors via Blink1Service (FIXME: change this?)
- Event sources also log events via `logger.addEvent(event)`
- Events logged via addEvent are used for human-display by ToolTable and RecentEvents
- Structure of event is:
        event = {
            date: [Date],
            type: ['trigger','info','error'],
            source: [event source, e.g. 'mail', 'ifttt', 'file', etc.],
            id: [name of event source, e.g. 'red demo'],
            text: [message of event, e.g. number of unread msgs, error details]
        }

#### General architecture

- `remote.require()` is based off of project root dir, but `require()` is based of cwd
- `remote.require()` vs `require()` in renderer process

- There exist singleton services like: Blink1Service, PatternsService, IftttService, MailService
  - these all live in the renderer process
- New proposed service: EventService - console.log replacement & recent event display
  - (e.g. eventsvc.log("Did a thing", {type:'debug', from:'VirtualBlink1'}) (use introspection?)
- NO: now everything lives in renderer process.  Only thing in main process is "main.js" window & menu handling

#### Prepping node-hid
-  do `npm run postinstall` (done automatically on `npm install`)

#### Building on Windows
- Can't use my standard MinGW rxvt shell
- Instead, open up Node's "Node Command Prompt" from Start menu
- May need to install webpack & webpack-dev-server globally: `npm install -g webpack` ??
- 'webpack --display-error-details' to help debug

### Slow GUI issues
- console.log() in renderer really seems to slow down GUI
- Created "logger" that is mostly disabled


#### node-hid or usb-detection causing app hanging?
- needed to do `usb-detection.stopMonitoring()`
- for now, disable use of "usb-detection" and use polling (which can be turned off in config)



## old notes

#### Prepping node-hid
- See 'preinstall' target in package.json
- also see: https://github.com/voodootikigod/node-serialport/issues/538#issuecomment-184251385

#### Packaging
```
 ./node_modules/.bin/electron-packager ./ Blink1ControlJs --platform=darwin --arch=x64 --version=0.30.6 --icon=./src/images/blink1-icon0-bw.png --out=build --version-string.CompanyName=ThingM --version-string.ProductName=Blink1ControlJs --version-string.ProductVersion=0.0.69
```
but doesn't change Mac app icon (or I'm doing something wrong)
See:
- https://github.com/maxogden/electron-packager
- http://www.mylifeforthecode.com/using-electron-packager-to-package-an-electron-app/
- https://github.com/shama/letswritecode/blob/master/packaging-distributing-electron-apps/package.json
- https://github.com/ThorstenHans/electron-angular-es6
- https://github.com/szwacz/electron-boilerplate/blob/master/tasks/release.js
- https://github.com/teseve/teseve
