# Blink1Control2

Blink1Control written in Electron, Node.js, and React.

<img src="./docs/blink1control2-screenshot1.png" width="425">
<img src="./docs/blink1control2-screenshot2.png" width="425">

See [NOTES.md](NOTES.md) for more info.

### Setup steps (for development)

```
$ npm install
$ npm run postinstall
$ npm run watch &
$ npm run startdev   # (or npm run startdev:win on Windows)
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
$ npm run dist
```

Packaging deltas from standard electron-builder
```
$ mv dist/mac/Blink2Control2-{version}.dmg dist/mac/Blink2Control2-{version}-mac.dmg

```
#### Windows:

```
$ npm install
$ npm run webpack
$ npm run dist
$ npm run dist:win32bit  # build windows 32bit
```


#### Linux:

Install the following pre-requisites:
```
- libgnome-keyring-dev
- icnsutils
- graphicsmagick
- xz-utils
- rpm
- bsdtar
- libusb-1.0.0-dev
```
(see: https://github.com/electron-userland/electron-builder/issues/1407)
