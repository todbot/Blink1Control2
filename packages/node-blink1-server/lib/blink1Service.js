// blink1Service.js — Manages connected blink(1) USB devices via node-blink1.
// Responsibilities: scanning for devices at startup, opening HID handles,
// fading to color (with per-device current-state tracking across up to 4 devices
// and 2 LEDs each), writing patterns to device flash, and "toy" animation modes
// (moodlight, colorcycle, party, strobe). Notifies registered listeners and an
// optional sendState callback on every state change.
// Dependencies (log, emitter) are injected via init().

"use strict";

var Blink1   = require('node-blink1');
var tinycolor = require('tinycolor2');
var utils    = require('./utils');

var maxBlink1s      = 4;
var maxLEDsPerBlink1 = 2;

var listeners = [];
var _sendState = null;

var blink1s = [];
var currentBlink1Id = '';

var defaultPatternStr =
    "0," +
    "#ff0000,0.5,1,#ff0000,0.5,2,#000000,0.5,0," +
    "#00ff00,0.5,1,#00ff00,0.5,2,#000000,0.5,0," +
    "#0000ff,0.5,1,#0000ff,0.5,2,#000000,0.5,0," +
    "#808080,1.0,0,#000000,1.0,0,"               +
    "#ffffff,0.5,1,#000000,0.5,1,"               +
    "#ffffff,0.5,2,#000000,1.0,2,"               +
    "#000000,1.0,0";

var currentState = [];
for (var i = 0; i < maxBlink1s; i++) {
    var cs = new Array(maxLEDsPerBlink1);
    cs.fill(tinycolor('#10100' + i));
    currentState.push({ colors: cs, millis: 100, ledn: 0 });
}

// Injected dependencies. init() sets these; defaults are silent no-ops.
var _log     = { msg: function() {}, warn: console.warn, error: console.error };
var _emitter = null;

var Blink1Service = {
    deviceScanner: null,
    defaultPatternStr: defaultPatternStr,
    toy: { enable: false, timer: null, interval: 0, mode: 'off', value: 0 },
    conf: {},

    // Inject dependencies. Call before start().
    init: function(services) {
        if (services.log)     { _log     = services.log; }
        if (services.emitter) { _emitter = services.emitter; }
    },

    start: function(conf) {
        this.conf = conf || {};
        listeners = [];
        this._removeAllDevices();
        this.scanForDevices();
    },

    reloadConfig: function(conf) {
        _log.msg("Blink1Service.reloadConfig");
        if (conf !== undefined) { this.conf = conf; }
        Blink1Service._removeAllDevices();
        Blink1Service.scanForDevices();
    },

    scanForDevices: function() {
        _log.msg("Blink1Service.scanForDevices");
        var serials = Blink1.devices();
        serials.sort();
        serials.reverse();
        serials.map(function(s) { Blink1Service._addDevice(s); });

        if (serials.length === 0) {
            if (this.conf.deviceRescan) {
                if (this.deviceScanner) { clearTimeout(this.deviceScanner); }
                this.deviceScanner = setTimeout(this.scanForDevices.bind(this), 5000);
            }
        }
    },

    _addDevice: function(serialnumber) {
        _log.msg("Blink1Service._addDevice:", serialnumber);
        serialnumber = serialnumber.toUpperCase();
        var olddev = blink1s.find(function(b) { return b.serial === serialnumber; });
        if (!olddev) {
            _log.msg("Blink1Service._addDevice: new serial", serialnumber);
            blink1s.push({ serial: serialnumber, device: null });
        }
        setTimeout(function() { Blink1Service._setupFoundDevices(); }, 500);
    },

    _setupFoundDevices: function() {
        var self = this;
        _log.msg("Blink1Service._setupFoundDevices", blink1s, "conf:", self.conf);
        blink1s.map(function(b) {
            if (!b.device) {
                _log.msg("Blink1Service._setupFoundDevices: opening", b.serial);
                try {
                    b.device = new Blink1(b.serial.toLowerCase());
                } catch(err) {
                    try {
                        b.device = new Blink1(b.serial);
                    } catch(err2) {
                        _log.error('Blink1Service._setupFoundDevices: cannot open', b.serial, err2.message);
                        // Leave b.device null; hardware calls will be no-ops for this device
                    }
                }
            }
        });
        if (_emitter) { _emitter.emit('deviceUpdated'); }
        Blink1Service.notifyChange();
    },

    _removeDevice: function(serialnumber) {
        _log.msg("Blink1Service._removeDevice: current devices:", blink1s);
        blink1s = blink1s.filter(function(blink1) {
            if (blink1.serial.toUpperCase() === serialnumber) {
                if (blink1.device) { blink1.device.close(); }
                return false;
            }
            return true;
        });
        Blink1Service.notifyChange();
        setTimeout(this.scanForDevices.bind(this), 5000);
    },

    _removeAllDevices: function() {
        _log.msg("Blink1Service._removeAllDevices");
        blink1s.forEach(function(b1) {
            if (b1.device) { b1.device.close(); b1.device = null; }
        });
        blink1s = [];
        _log.msg("Blink1Service._removeAllDevices: done");
    },

    _fadeToRGB: function(millis, color, ledn, blink1idx) {
        if (blink1s[blink1idx] && blink1s[blink1idx].device) {
            var crgb = color.toRgb();
            try {
                var b1 = blink1s[blink1idx].device;
                b1.enableDegamma = (this.conf.enableGamma !== undefined) ? this.conf.enableGamma : false;
                b1.fadeToRGB(millis, crgb.r, crgb.g, crgb.b, ledn);
            } catch(err) {
                _log.error('Blink1Service._fadeToRGB: error', err);
                this._removeDevice(blink1s[blink1idx].serial);
                currentBlink1Id = 0;
            }
        }
    },

    getAllSerials: function() {
        return blink1s.map(function(b) { return b.serial; });
    },

    isConnected: function() {
        var cnt = 0;
        blink1s.map(function(b1) { if (b1.device) { cnt++; } });
        return cnt;
    },

    getStatusString: function() {
        var cnt = this.isConnected();
        return (cnt > 1) ? cnt + " devices connected" : (cnt) ? "device connected" : "no device connected";
    },

    serialNumber: function() {
        return this.isConnected() ? blink1s[0].serial : '';
    },

    serialNumberForDisplay: function() {
        return this.isConnected() ? this.serialNumber() : '-';
    },

    getIftttKey: function() {
        var s = this.serialNumber() || '00000000';
        return this.getHostId() + s;
    },

    getHostId: function() {
        if (!this.conf.hostId) {
            var id = utils.generateRandomHostId();
            this.setHostId(id);
        }
        return this.conf.hostId;
    },

    setHostId: function(id) {
        id = id.toUpperCase();
        if (!/^[0-9A-F]{8}$/.test(id)) { return false; }
        this.conf.hostId = id;
        if (_emitter) { _emitter.emit('configChanged', 'hostId', id); }
        this.notifyChange();
        return true;
    },

    setCurrentBlink1Id: function(id) {
        _log.msg("setCurrentBlink1Id:", id);
        currentBlink1Id = id;
        this.notifyChange();
    },

    getCurrentBlink1Id: function() { return currentBlink1Id; },

    setCurrentLedN: function(n, blink1id) {
        currentState[this.idToBlink1Index(blink1id)].ledn = n;
        this.notifyChange();
    },

    getCurrentLedN: function(blink1id) {
        return currentState[this.idToBlink1Index(blink1id)].ledn;
    },

    setCurrentMillis: function(m, blink1id) {
        currentState[this.idToBlink1Index(blink1id)].millis = m;
        this.notifyChange();
    },

    getCurrentMillis: function(blink1id) {
        return currentState[this.idToBlink1Index(blink1id)].millis;
    },

    getCurrentColor: function(blink1id, ledn) {
        var blink1idx = this.idToBlink1Index(blink1id);
        if (ledn === undefined) {
            ledn = currentState[blink1idx].ledn;
            ledn = (ledn > 0) ? ledn - 1 : ledn;
        }
        var color = currentState[blink1idx].colors[ledn];
        return color !== undefined ? color : tinycolor('#000000');
    },

    getCurrentColors: function(blink1id) {
        return currentState[this.idToBlink1Index(blink1id)].colors;
    },

    idToBlink1Index: function(blink1id) {
        var blink1idx = 0;
        if (!blink1id && blink1id !== 0) {
            if (this.conf.blink1ToUse)        { blink1id = this.conf.blink1ToUse; }
            else if (currentBlink1Id)         { blink1id = currentBlink1Id; }
            else                              { blink1id = 0; }
        }
        if (blink1id >= 0 && blink1id < blink1s.length) { return blink1id; }
        blink1id = blink1id.toString().toUpperCase();
        blink1s.map(function(b, idx) {
            if (blink1id.toUpperCase() === b.serial) { blink1idx = idx; }
        });
        return blink1idx;
    },

    fadeToColor: function(millis, color, ledn, blink1_id) {
        ledn = ledn || 0;
        if (typeof color === 'string') { color = tinycolor(color); }
        var blink1Idx = this.idToBlink1Index(blink1_id);
        var colors = currentState[blink1Idx].colors;
        if (ledn === 0) { colors = colors.fill(color); }
        else            { colors[ledn - 1] = color; }
        currentState[blink1Idx] = { ledn: ledn, millis: millis, colors: colors };
        this.notifyChange();
        this._fadeToRGB(millis / 2, color, ledn, blink1Idx);
    },

    off: function(blink1id) {
        var self = this;
        self.toyStop();
        if (blink1id === undefined && blink1s.length > 0) {
            blink1s.map(function(serial, idx) { self.fadeToColor(100, '#000000', 0, idx); });
        } else {
            self.fadeToColor(100, '#000000', 0, blink1id);
        }
    },

    writePatternToBlink1: function(pattern, fill, blink1id) {
        _log.msg("writePatternToBlink1:");
        var blink1idx = this.idToBlink1Index(blink1id);
        var colors = pattern.colors;
        if (!colors) { return "no colors in pattern"; }
        var pattlen = colors.length;
        if (pattlen < 32) {
            for (var i = 0; i < 32 - pattlen; i++) {
                var c = { rgb: '#000000', time: 0, ledn: 0 };
                colors.push(fill ? colors[i] : c);
            }
        }
        if (blink1s[blink1idx] && blink1s[blink1idx].device) {
            var blink1dev = blink1s[blink1idx].device;
            for (var i = 0; i < colors.length; i++) {
                var color = tinycolor(colors[i].rgb);
                var crgb  = color.toRgb();
                var ms    = colors[i].time * 1000;
                var ledn  = colors[i].ledn;
                _log.msg("Blink1Service.writePatternLine:", i, ",crgb:", crgb, ", millis:", ms, ",ledn:", ledn);
                try {
                    blink1dev.setLedN(ledn);
                    blink1dev.writePatternLine(ms, crgb.r, crgb.g, crgb.b, i);
                } catch(err) {
                    _log.error('Blink1Service.writePatternToBlink1: error', err);
                }
            }
            try { blink1dev.savePattern(); } catch(err) {
                _log.msg("Blink1Service.writePatternLine: savePattern exception (expected)");
            }
        } else {
            _log.msg("Blink1Service.writePatternToBlink1: no blink1 device");
            return "no blink1 device";
        }
    },

    toyStop: function() {
        this.toy.mode = '';
        this.toy.enable = false;
        if (this.toy.timer) { clearTimeout(this.toy.timer); }
    },

    toyStart: function(mode) {
        if      (mode === 'moodlight')  { this.toy.interval = 5000; }
        else if (mode === 'colorcycle') { this.toy.interval = 30; this.toy.value = Math.floor(Math.random() * 360); }
        else if (mode === 'party')      { this.toy.interval = 100; }
        else if (mode === 'strobe')     { this.toy.interval = 100; this.toy.value = '#FFFFFF'; }
        else { _log.msg("Blink1Service: unknown toy mode:", mode); return; }
        this.toy.mode = mode;
        this.toy.enable = true;
        this.toyDo();
    },

    toyDo: function() {
        var rledn = Math.floor(Math.random() * 2) + 1;
        var rhue  = Math.floor(Math.random() * 360);
        if (!this.toy.enable) { return; }
        if      (this.toy.mode === 'moodlight')  { this.fadeToColor(this.toy.interval * 2, tinycolor({h: rhue, s: 1, v: 0.75}), rledn); }
        else if (this.toy.mode === 'colorcycle') { this.toy.value = (this.toy.value > 360) ? 0 : this.toy.value + 2; this.fadeToColor(100, tinycolor({h: this.toy.value, s: 1, v: 1}), 0); }
        else if (this.toy.mode === 'party')      { this.fadeToColor(this.toy.interval, tinycolor({h: rhue, s: 1, v: 1}), rledn); }
        else if (this.toy.mode === 'strobe')     { this.toy.value = (this.toy.value === '#000000') ? '#FFFFFF' : '#000000'; this.fadeToColor(this.toy.interval, this.toy.value, 0); }
        this.toy.timer = setTimeout(this.toyDo.bind(this), this.toy.interval);
    },

    addChangeListener:    function(cb, name) { listeners.push({name: name, callback: cb}); },
    removeChangeListener: function(name)     { listeners = listeners.filter(function(l) { return l.name !== name; }); },

    notifyChange: function() {
        listeners.forEach(function(l) { if (l.callback) l.callback(); });
        if (_sendState) { _sendState(Blink1Service._getState()); }
    },

    setSendState: function(fn) {
        _sendState = fn;
        if (fn) { fn(Blink1Service._getState()); }
    },

    _getState: function() {
        var self = this;
        var colorPerSerial  = {};
        var millisPerSerial = {};
        var lednPerSerial   = {};
        var colorsPerSerial = {};
        blink1s.forEach(function(b) {
            var idx      = self.idToBlink1Index(b.serial);
            var ledn     = currentState[idx].ledn;
            var colorLedn = (ledn > 0) ? ledn - 1 : 0;
            colorPerSerial[b.serial]  = (currentState[idx].colors[colorLedn] || tinycolor('#000000')).toHexString();
            millisPerSerial[b.serial] = currentState[idx].millis;
            lednPerSerial[b.serial]   = ledn;
            colorsPerSerial[b.serial] = currentState[idx].colors.map(function(c) { return c.toHexString(); });
        });
        var defaultColor = self.getCurrentColor() ? self.getCurrentColor().toHexString() : '#000000';
        colorPerSerial['']  = defaultColor;
        millisPerSerial[''] = self.getCurrentMillis() || 100;
        lednPerSerial['']   = self.getCurrentLedN()   || 0;
        colorsPerSerial[''] = (currentState[0] ? currentState[0].colors.map(function(c) { return c.toHexString(); }) : ['#000000', '#000000']);
        return {
            currentColor:            defaultColor,
            currentColorPerSerial:   colorPerSerial,
            currentMillis:           millisPerSerial[''],
            currentMillisPerSerial:  millisPerSerial,
            currentLedn:             lednPerSerial[''],
            currentLednPerSerial:    lednPerSerial,
            currentColorsPerSerial:  colorsPerSerial,
            statusStr:               self.getStatusString(),
            allSerials:              self.getAllSerials(),
            serialNumberForDisplay:  self.serialNumberForDisplay(),
            currentBlink1Id:         currentBlink1Id,
            iftttKey:                self.getIftttKey(),
            hostId:                  self.getHostId(),
            defaultPatternStr:       defaultPatternStr,
            isConnected:             self.isConnected(),
        };
    },
};

module.exports = Blink1Service;
