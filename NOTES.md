
## NOTES

Random notes / documentation while developing the app


### App capability changes / To-do's
- TODO: Add "go back to last pattern" or "return to previous state" color pattern
    - (maybe via a "pattern stack" and new patterns like "red always")
- DONE: Special patterns like '~off' and '~stop:patternname'  (check: work in ApiServer?)
- TODO: IFTTT rule_name can be matching rule or specific patternname or special patternname
-  (maybe restructure app to not need IFTTT "rules"?)
- TODO: Patterns should allow multiple LEDs to change per step (take array of {color,ledn,time})
- DONE: TODO: Add 'enable' flag to each rule in Mail & Tools
- TODO: partition code into client & server so webpack doesn't bundle server code
- DONE : TODO: what about 'parametric patterns', e.g. "blink 5 times, fill in color & on/off time"
- TODO: Number() vs parseInt() in `PatternsService._parsePatternStr()`?
- TODO: global shortcut, see: https://github.com/atom/electron/blob/master/docs/api/global-shortcut.md
- TODO: Support multiple blink(1)s (especially in upcoming IFTTT update)
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


### General Program structure
- Event Source --> Color Pattern --> blink(1) changes color
- The user creates an "event source" to fetch events from outside of Blink1Control2 (say, IFTTT, IMAP, a URL,  etc).  
  - Each event source runs async from the others. Some sources may periodically poll their source for changes.
- An event source triggers a "color pattern" to play.  
  - This color pattern is normally a pre-defined color pattern in the color patterns list.
- Multiple event sources are active concurrently
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
- Devices are sorted in device list by serialnumber
- Lowest-numbered serialnumber wins "default device"
    - unless `config.Blink1Service.deviceToUse` is set to non-zero
- `blink1_id` is used to address a specific device.
    - it is current index into device list
    - but one day should also allow this to be serialnumber


#### General architecture

- `remote.require()` is based off of project root dir, but `require()` is based of cwd
- `remote.require()` vs `require()` in renderer process

- There exist singleton services like: Blink1Service, PatternsService, IftttService, MailService
  - these all live in the renderer process
- New proposed service: EventService - console.log replacement & recent event display
  - (e.g. eventsvc.log("Did a thing", {type:'debug', from:'VirtualBlink1'}) (use introspection?)
- NO: now everything lives in renderer process.  Only thing in main process is "main.js" window & menu handling


### Packaging & Releasing
- Currently using `electron-package`.
- TODO: look into using `electron-builder`

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
