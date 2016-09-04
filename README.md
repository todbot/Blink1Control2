# Blink1Control2

Blink1Control written in ElectronJs, ReactJs and NodeJs.

<img src="./docs/blink1control2-screenshot1.png" width="425">
<img src="./docs/blink1control2-screenshot2.png" width="425">

See [NOTES.md](NOTES.md) for more info.

### Setup steps (for development)

```
$ npm install
$ npm run postinstall
$ npm run watch &
$ npm run startdev
```
Or to emulate a production run:
```
$ npm install
$ npm run postinstall
$ npm run webpack
$ npm run start
```

### Build steps (for production)

#### Mac OS X:

```
$ npm install
$ npm run postinstall
$ npm run webpack
$ npm run dist:mac
```

Packaging deltas from standard electron-builder
```
$ mv dist/mac/Blink2Control2-{version}.dmg dist/mac/Blink2Control2-{version}-mac.dmg

```
#### Windows:

```
$ npm install
$ npm run webpack
$ npm run dist:win
```

Packaging deltas from standard electron-builder
```
 mv dist/Blink1Control2-win32-x64.zip  dist/win/Blink1Control2-{version}-win32-x64.zip
```

### Publishing

Steps:
- Create tag in git repository
- Make release on github
- Copy files from dev boxes to github release page
    - dist/mac/Blink1Control2-{version}-mac.dmg
    - dist/mac/Blink1Control2-{version}-mac.zip
    - dist/win/Blink1Control2.Setup-{version}-win32-x64.exe
    - dist/Blink1Control2-{version}-win32-x64.zip
- Write release notes (changelog)
- Publish release
- Check release
    - Download each version, unzip / install / launch to test
- Publish announcement
