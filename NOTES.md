
## NOTES

Random notes / documentation while developing the app
===

### Electron Modernization — Phase 3 Complete (2026-03-29)

Phases 1–3 of the Electron modernization (see `recommendations.md`) are done.
Tested working on macOS 15 and Ubuntu 24 with Electron 34.

**What changed:**

- All singleton services (`Blink1Service`, `PatternsService`, `ApiServer`, all event services)
  moved from renderer (`maingui.js`) to main process (`main.js`)
- `app/preload.js` created: exposes `window.electronAPI` via `contextBridge`
- `mainWindow` now uses `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`
  (`sandbox: false` needed so preload can `require()` Node modules like `./configuration`)
- `@electron/remote` fully removed
- webpack `target` changed from `'electron-renderer'` to `'web'`
  (renderer has no `nodeIntegration`; Node built-ins are now bundled as polyfills)
- Dev server port centralized in `devPort.js` (single source of truth, currently 9090);
  `index-dev.html` is now loaded as `http://localhost:9090/index-dev.html` (not a `file://` URL)
- `maingui.js` is now thin: CSS/font requires, `MenuMaker` calls, React root render only

**Key IPC architecture:**

- Services push state to renderer via `mainWindow.webContents.send('blink1:state', ...)` and `'patterns:state'`
- `setSendState()` is called *after* `initialize()` so the first push has populated data
- `mainWindow.webContents.on('did-finish-load')` re-pushes current state to handle the
  timing race where the renderer loads after services have already initialized
- `isQuitting` guard on all `webContents.send()` calls prevents "object destroyed" errors on quit

**IPC serialization rules — things that must be converted before crossing IPC:**

- `tinycolor` objects → call `.toHexString()` in the renderer before `ipcRenderer.send()`
- `setTimeout` Timeout handles → strip from objects in `_getState()` (done in `patternsService._getState`)
- Any class instance → serialize to plain JSON-compatible value first

**Startup timing guard:**

Several form components (`mailForm`, `iftttForm`, `skypeForm`, `timeForm`, `preferencesModal`)
access `patterns[0].id` at init time. Guard all such accesses:
```js
patterns.length ? patterns[0].id : ''
```

---

NOTE: consider notes below as historical info. most of these are out-of-date as of Nov 2017

### IMAP searching issues

- Gmail and others do not set UNSEEN correctly to mark read messages. 

#### Debugging IMAP:
```
curl --url "imaps://imap.gmail.com/INBOX;UID=1:*" --user "testing@gmail.com:${GMAIL_APP_PASSWORDD" -X "SEARCH UNSEEN"
# Fetch flags for a specific UID
curl --url "imaps://mail.example.com/INBOX;UID=119" --user "user:pass" -X "FETCH 119 (FLAGS)"
# python one-liner-ish
python3 -c "
  import imaplib
  m = imaplib.IMAP4_SSL('mail.example.com')
  m.login('user', 'pass')
  m.select('INBOX')
  print('UNSEEN:', m.search(None, 'UNSEEN'))
  print('ALL:', m.search(None, 'ALL'))
  "
```

### App capability changes / To-do's
- TODO: Entirely rethink color pattern architecture
    - maybe instead "assign pattern to blink1 ledn" is primary UI

- IDEA: How to set patterns to LEDA / LEDB?
- MAYBE: "Set pattern to LEDA / LEDB" option
- DONE-ish: Add "go back to last pattern" or "return to previous state" color pattern
-- Still need to "return to original state"
- TODO: put 'patternSerial' in config & preferences
    - (maybe via a "pattern stack" and new patterns like "red always")
- DONE: Special patterns like '~off' and '~stop:patternname'  (check: work in ApiServer?)
- DONE: IFTTT rule_name can be matching rule or specific patternname or special patternname
-  (maybe restructure app to not need IFTTT "rules"?)
- TODO: Patterns should allow multiple LEDs to change per step (take array of {color,ledn,time})
- DONE: TODO: Add 'enable' flag to each rule in Mail & Tools
- DONE: partition code into client & server so webpack doesn't bundle server code
- DONE : TODO: what about 'parametric patterns', e.g. "blink 5 times, fill in color & on/off time"
- TODO: Number() vs parseInt() in `PatternsService._parsePatternStr()`?
- DONE: global shortcut, see: https://github.com/atom/electron/blob/master/docs/api/global-shortcut.md
- DONE: Support multiple blink(1)s (especially in upcoming IFTTT update)
    - partially working, verify with:
        - `curl 'http://localhost:8934/blink1/id'`
        - `curl 'http://localhost:8934/blink1/fadeToRGB?rgb=%230000ff&blink1_id=1'`
    - but to fully support need to modify:
        - All Event Source Forms (write config) Drop-down combobox if multiple blink1s present?
        - All Event Source Services (read config)
        - Blink1Status UI, how is that going to work?
        - ApiServer
        - BigButton maybe?
        - ToolTable and/or EventList?
        - Preferences dialog?
- TODO: Fix ImapSearcher's "new mail" issues.
    - TODO?: doesn't seem to re-trigger when more new mail happens
    - DONE: does retrigger every time on restart (save last msgid in config?)


### General Program structure
- Event Source --> Color Pattern --> blink(1) changes color
- The user creates an "event source" to fetch events from outside of Blink1Control2 (say, IFTTT, IMAP, a URL,  etc).  
  - Each event source runs async from the others. Some sources may periodically poll their source for changes.
- Event source triggers a "color pattern" to play.  
  - This color pattern is normally a pre-defined color pattern in the color patterns list.
- Multiple event sources can be active concurrently
- Multiple color patterns can play concurrently (* note: maybe add priorities or stack option)

### Color Patterns
- Color patterns consist of a name, a list of {color,time,ledn} tuples, and number of repeats.
  - The "name" is a unique name for that color pattern
  - The tuple is:
      - "color" is the color to change to
      - "time" is the time it takes to get to that color,
      - "ledn" is which LED of the blink(1) to alter (0=all/1=top/2=bottom)
  - The "repeats" is a number from 0 - 9
      - where "0" means always repeat, and "1" means play once.

### Meta Patterns
- Normally patterns are created, then specified for playing, by `id` (or `name` in some cases)
- There exist special "meta" patterns that dynamically create a pattern or cause an actionType
- These special meta-patterns can take the form:
  - `#<hexcolor>` -- Set a specific color on all LEDs e.g. "#FF00FF", "#000000", or "#ccaabb"
  - `~off` -- Turn blink(1) off completely (stop patterns, set to dark)
  - `~blink:color-count` -- blink color-dark-color-dark, count times. e.g. `~blink:white-3`, `~blink:#ff0000-5`
  - `~blink:color-count-time` -- blink color-dark-color-dark, count times, blink time in secs e.g. `~blink:white-3-1.3`, `~blink:#ff0000-5-0.1`
  - `~pattern:<name>:<patternstr>` -- Play a pattern in string form. e.g. `~pattern:bob:3,#ff00ff,0.5,0,#00ff00,1.3,0`

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
- Event source service code lives in `src/server/<sourcename>Service.js`
- GUI form to for user to create rules on event source is in `src/components/gui/<sourcename>Form.js`
- Event source rules config ives in `config.eventRules[]` and each rule must contain: `enabled`, `type`, `name`, `actionType`
- `src/components/gui/toolTable.js` loads forms, ask them to format themselves for tables (not really, should ask Service maybe?)
- Each event source has its own config in `config.eventServices{}` by name of service (e.g. `iftttService`)

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

### Multiple blink(1) device support
- App works fine with no blink(1) devices
- When no devices are present, `Blink1Service.scanForDevices()` runs every 5 seconds
- `scanForDevices()` is only done on app start, if no devices, or on device removal
    - thus adding a device will not automatically detect if one is already plugged in
- When devices are found, they are opened and added to device list
- Device removal is detected by attempting to command device and failing.  
    - (this was done because `usb-detection` package had issues in 2015, it was updated recently. check if it works)
- Devices are sorted in device list by serialnumber string
- Lowest-numbered serialnumber wins "default device"
    - unless `config.Blink1Service.deviceToUse` is set to non-zero
- `blink1id` is used to address a specific device.
    - it is the serial number of the blink1
    - if blink1id is undefined or zero, use first device or default device
    - was (is) also index into device list
- QUESTION: what about resetting of IFTTT Key on device change?


#### General architecture

- `remote.require()` is based off of project root dir, but `require()` is based of CWD
- `remote.require()` vs `require()` in renderer process

- There exist singleton services like: Blink1Service, PatternsService, IftttService, MailService
  - these all live in the renderer process
- New proposed service: EventService - console.log replacement & recent event display
  - (e.g. eventsvc.log("Did a thing", {type:'debug', from:'VirtualBlink1'}) (use introspection?)
- NO: now everything lives in renderer process.  Only thing in main process is "main.js" window & menu handling


### Packaging & Releasing
- Currently using `electron-builder`


### Slow GUI issues
- console.log() in renderer really seems to slow down GUI
- Created "logger" that is mostly disabled


#### node-hid or usb-detection causing app hanging?
- needed to do `usb-detection.stopMonitoring()`
- Disable use of `usb-detection` for now and use polling (which can be turned off in config)

#### Creating Help page
- Currently "Blink1Control2-manual.pages" not in github
- Export as ePub
- Use Calibre to convert ePub to HTMLZ
- Rename .htmlz to .zip, Unzip file
- Copy contents to "app/help" directory

#### Building on Windows
- Use standard Powershell with git installed and "windows-build-tools"
  as described here: https://github.com/node-hid/node-hid#compiling-from-source
