# Blink1Control2

Blink1Control is a desktop application for controlling and hooking events to blink(1). It is the primary user-level application for blink(1). It is an event-based system for triggering blink(1) color patterns. Those events can from on your computer or from the Net.  Blink1Control2 is the latest version.

<img src="./docs/blink1control2-screenshot1.png" width="400"><img src="./docs/blink1control2-screenshot2.png" width="400">

Blink1Control2 features:
- Configurable buttons for immediately setting blink(1) color
- Mail alerts new mail / keyword match for IMAP / Gmail
- Time-based alerts for visual alarms
- Trigger based on custom URL, JSON, file, or script output
- Integration with IFTTT.com

### Downloads
There are pre-built app downloads for Mac OS X, Windows, and Linux in the [releases area](https://github.com/todbot/Blink1Control2/releases).

* [Download for Mac, Windows, and Linux](https://github.com/todbot/Blink1Control2/releases).

### Setup steps (for development)

Blink1Control2 is written in Electron, Node.js, and React.

You will need a working C compiler setup for Node projects.
You can find details for that here:
https://github.com/node-hid/node-hid#compiling-from-source

Start a hot-reloading content server and the application:
```
yarn
yarn dev
```

Or to build for a production app:
```
yarn
yarn dist
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

- `libgnome-keyring-dev icnsutils xz-utils rpm bsdtar libusb-1.0.0-dev libudev-dev`

(see: https://github.com/electron-userland/electron-builder/issues/1407)

### Other info
- [Publishing.md](Publishing.md) for info on publishing binaries
- [NOTES.md](NOTES.md) for random behind-the-scenes thoughts
