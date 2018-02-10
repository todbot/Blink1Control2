# Blink1Control2

Blink1Control is the desktop application for controlling and hooking events to blink(1). It is the primary user-level application for controlling blink(1). It is an event-based system for triggering blink(1) color patterns. Those events can be on your computer or on the Net.

Blink1Control2 is the current version, written in Electron, Node.js, and React.

<img src="./docs/blink1control2-screenshot1.png" width="425"><img src="./docs/blink1control2-screenshot2.png" width="425">


### Downloads
There are pre-built app downloads for Mac OS X, Windows, and Linux in the [releases area](https://github.com/todbot/Blink1Control2/releases).

* [Download for Mac, Windows, and Linux](https://github.com/todbot/Blink1Control2/releases).

### Setup steps (for development)

You will need a working C compiler setup for Node projects.
You can find details for that here:
https://github.com/node-hid/node-hid#compiling-from-source

Start a hot-reloading content server and the application:
```
npm install
npm run watch &
npm run startdev
```

Or to emulate a production run:
```
npm install        # installs all dependencies locally
npm run webpack    # packs app, there will be some warnings, ignore
npm run start      # starts the packaged app
npm run dist:draft # create relocatable app and installer(s), in "dist" dir
```

#### Linux:

Install udev rules file in `/etc/udev/rules.d/51-blink1.rules` with contents:
```
SUBSYSTEM=="input", GROUP="input", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE:="666", GROUP="plugdev"
KERNEL=="hidraw*", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE="0666", GROUP="plugdev"
```
And install the rules with:
```
sudo udevadm control --reload-rules
```
Then unplug and replug the blink(1) device.

Install the following pre-requisites:

- libgnome-keyring-dev
- icnsutils
- xz-utils
- rpm
- bsdtar
- libusb-1.0.0-dev
- libudev-dev

(see: https://github.com/electron-userland/electron-builder/issues/1407)

### Other info
- [Publishing.md](Publishing.md) for info on publishing binaries
- [NOTES.md](NOTES.md) for random behind-the-scenes thoughts
