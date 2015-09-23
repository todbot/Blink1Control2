
## NOTES

Random notes

#### General architecture
-- Objects that touch the net or disk run in main process and live in `./src/server`
-- GUI lives in renderer process and makes remote calls to objects in main 

#### `remote.require()`` vs `require()` in renderer process
- `remote.require()` is based off of project root dir, but `require()` is based of cwd

#### Building on Windows
- Can't use my standard MinGW rxvt shell
- Instead, open up Node's "Node Command Prompt" from Start menu

### Slow GUI issues
- console.log() in renderer really seems to slow down GUI

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

#### node-hid or usb-detection causing app hanging?
- needed to do `usb-detection.stopMonitoring()`
-
