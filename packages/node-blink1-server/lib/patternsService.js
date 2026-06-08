// patternsService.js — Manages named color-sequence patterns and their playback.
// Maintains three pattern lists: system (built-in, locked), user (saved), and
// temp (created inline during playback). Plays patterns step-by-step via
// setTimeout, cycling through {rgb, time, ledn} color entries for the specified
// number of repeats.  Supports meta-pattern strings: #rrggbb (instant color),
// ~off, ~blink:<color>-<count>-<secs>, and ~pattern:<name>:<patternstr>.
// An optional serialize mode queues interrupting patterns rather than dropping them.
// Persists user patterns by emitting 'patternsChanged' through the injected emitter.
// Dependencies (log, emitter) are injected via init().

'use strict';

var tinycolor      = require('tinycolor2');
var Blink1Service  = require('./blink1Service');
var systemPatterns = require('./systemPatterns').patterns;

var patternsSystem = [];
var patternsUser   = [];
var patternsTemp   = [];
var playingQueue   = [];

var playingPattern       = {};
var playingPatternSource = '';
var playingBlink1Id      = '';

var listeners  = [];
var _sendState = null;

var _log     = { msg: function() {}, warn: console.warn, error: console.error };
var _emitter = null;

var _generateId = function(pattern) {
    return pattern.name.toLowerCase().replace(/\W+/g, '');
};

var _fixId = function(pattern) {
    if (!pattern.id) { pattern.id = _generateId(pattern); }
    return pattern;
};

var _parsePatternStr = function(patternstr) {
    var pattparts = patternstr.split(/\s*,\s*/g);
    var repeats   = parseInt(pattparts[0]);
    var colorlist = [];
    var isLedNStyle = Number.isInteger((pattparts.length - 1) / 3);
    var stride = isLedNStyle ? 3 : 2;
    for (var i = 1; i < pattparts.length; i += stride) {
        var color = {
            rgb:  pattparts[i + 0],
            time: Number(pattparts[i + 1]),
            ledn: isLedNStyle ? Number(pattparts[i + 2]) : 0,
        };
        if (isNaN(color.time)) { color.time = 0.1; }
        if (isNaN(color.ledn)) { color.ledn = 0; }
        colorlist.push(color);
    }
    return { colors: colorlist, repeats: repeats };
};

var _makePattern = function(template) {
    var patt  = _parsePatternStr(template.patternstr);
    patt.name = template.name;
    patt.id   = template.id;
    patt.temp = template.temp;
    return patt;
};

var _generatePatternStr = function(pattern) {
    if (!pattern || pattern.repeats < 0 || pattern.repeats > 9 || !pattern.colors) { return ''; }
    var pattstr = pattern.repeats;
    pattern.colors.map(function(c) { pattstr += ',' + c.rgb + ',' + c.time + ',' + c.ledn; });
    return pattstr;
};

var _systemFixup = function(pattern) {
    pattern = _fixId(pattern);
    pattern.system  = true;
    pattern.locked  = true;
    pattern.playing = false;
    if (pattern.patternstr) {
        var ppatt       = _parsePatternStr(pattern.patternstr);
        pattern.colors  = ppatt.colors;
        pattern.repeats = ppatt.repeats;
    }
    return pattern;
};

var PatternsService = {
    config: { playingSerialize: false },
    inEditing: false,

    // Inject dependencies. Call before initialize().
    init: function(services) {
        if (services.log)     { _log     = services.log; }
        if (services.emitter) { _emitter = services.emitter; }
    },

    reloadConfig: function(conf) {
        this.config = conf || this.config || {};
    },

    // conf: patternsService config object; patterns: array of saved user patterns
    initialize: function(conf, patterns) {
        if (conf !== undefined) { this.config = conf; }
        listeners      = [];
        patternsSystem = systemPatterns.map(_systemFixup);
        var patternsUserCfg = patterns || [];
        _log.msg('PatternsService.initialize, config patterns', patternsUserCfg);
        patternsUser = patternsUserCfg.map(function(patt) {
            patt = Object.assign({}, patt); // copy so we don't mutate the nconf-owned object
            if (patt.pattern && patt.pattern !== '') {
                var ppatt = _parsePatternStr(patt.pattern);
                if (ppatt.colors) { patt.colors  = ppatt.colors; }
                else              { patt.colors  = [{ rgb: '#000000', time: 0.1, ledn: 0 }]; }
                patt.repeats = ppatt.repeats;
            } else {
                patt.colors  = [{ rgb: '#000000', time: 0.1, ledn: 0 }];
                patt.repeats = 1;
            }
            patt.playing = false;
            return patt;
        });
        if (!patternsUser) { patternsUser = []; }
        _log.msg('PatternsService.initialize, fixup patterns', patternsUser);
    },

    getAllPatterns: function() {
        return patternsUser.concat(patternsSystem).concat(patternsTemp);
    },

    getIdForName: function(name) {
        if (name.startsWith('~')) { return name; }
        var pattern = this.getAllPatterns().find(function(p) { return p.name === name; });
        return pattern ? pattern.id : '';
    },

    getNameForId: function(id) {
        var pattern = this.getAllPatterns().find(function(p) { return p.id === id; });
        return pattern ? pattern.name : '';
    },

    getPatternById: function(id) {
        var pattern = this.getAllPatterns().find(function(p) { return p.id === id; });
        return Object.assign({}, pattern);
    },

    formatPatternForOutput: function(patt) {
        if (!patt) { return null; }
        patt.pattern = _generatePatternStr(patt);
        var name = patt.name, id = patt.id, pattern = patt.pattern,
            repeats = patt.repeats, playing = patt.playing, locked = patt.locked;
        return { name: name, id: id, pattern: pattern, repeats: repeats, playing: playing, locked: locked };
    },

    formatPatternsForOutput: function(patts) {
        var self = this;
        return patts.map(function(patt) { return self.formatPatternForOutput(patt); });
    },

    getAllPatternsForOutput: function() {
        return this.formatPatternsForOutput(this.getAllPatterns());
    },

    getPlayingQueueForOutput: function() {
        return playingQueue.map(function(qInfo) {
            return { source: qInfo.source, blink1Id: qInfo.blink1Id, pname: qInfo.pattern.id };
        });
    },

    savePatterns: function() {
        _log.msg("PatternsService.savePatterns");
        var patternsSave = this.formatPatternsForOutput(patternsUser);
        if (_emitter) { _emitter.emit('patternsChanged', patternsSave); }
        this.notifyChange();
    },

    savePattern: function(pattern) {
        _log.msg("PatternsService.savePattern:", JSON.stringify(pattern));
        if (pattern.id) {
            var idx = patternsUser.findIndex(function(p) { return p.id === pattern.id; });
            if (idx === -1) { patternsUser.unshift(pattern); }
            else            { patternsUser.splice(idx, 1, pattern); }
        } else {
            pattern.id = _generateId(pattern);
            patternsUser.unshift(pattern);
        }
        this.savePatterns();
    },

    generateId: function(pattern) {
        _log.msg("PatternsService.generateId", JSON.stringify(pattern));
        return _generateId(pattern);
    },

    newPattern: function(name, color) {
        if (!name) { name = 'pattern ' + patternsUser.length; color = '#55ff00'; }
        var pattern = {
            name: name, repeats: 3, playing: false,
            colors: [{ rgb: color, time: 0.2, ledn: 0 }, { rgb: '#000000', time: 0.2, ledn: 0 }],
        };
        pattern.id = _generateId(pattern);
        return pattern;
    },

    newPatternFromString: function(name, patternstr) {
        if (!patternstr) { return null; }
        var pattern = _parsePatternStr(patternstr);
        pattern.name    = name;
        pattern.id      = _generateId(pattern);
        pattern.playing = false;
        return pattern;
    },

    deletePattern: function(id) {
        patternsUser = patternsUser.filter(function(p) { return p.id !== id; });
        this.savePatterns();
    },

    stopAllPatterns: function() {
        this.getAllPatterns().forEach(function(pattern) {
            if (pattern.playing) {
                pattern.playing = false;
                if (pattern.timer) { clearTimeout(pattern.timer); }
                if (playingPattern.id === pattern.id) { playingPattern = {}; }
            }
        });
        patternsTemp = [];
        playingQueue = [];
        this.notifyChange();
    },

    stopPattern: function(pattId) {
        return this.stopPatternFrom(null, pattId, null, false);
    },

    stopPatternFrom: function(sourceId, pattid, blink1Id, doOff) {
        var self = this;
        _log.msg('PatternsService.stopPattern:', pattid, '/', playingPattern.id, "source:", sourceId, "blink1Id:", blink1Id);
        playingQueue = playingQueue.filter(function(qInfo) {
            return qInfo.pattern.id !== pattid || qInfo.source !== sourceId;
        });
        var rc = false;
        self.getAllPatterns().forEach(function(pattern) {
            if (pattern.id !== pattid) { return; }
            pattern.playing = false;
            var color = pattern.colors[pattern.colors.length - 1];
            Blink1Service.fadeToColor(color.time * 1000, color.rgb, color.ledn, blink1Id);
            if (pattern.timer) { clearTimeout(pattern.timer); }
            if (pattern.temp) { patternsTemp = patternsTemp.filter(function(p) { return p.id !== pattern.id; }); }
            if (playingPattern.id === pattern.id) {
                playingPattern = {};
                if (playingQueue.length > 0) {
                    var qInfo = playingQueue.pop();
                    _log.msg("PatternsService.stopPattern: playing next in playingQueue:", qInfo.source, qInfo.pattern.id);
                    self._playPatternInternalFrom(qInfo.source, qInfo.pattern, qInfo.blink1Id);
                }
            }
            rc = pattern.id;
        });
        if (rc) {
            self.notifyChange();
            if (doOff) { Blink1Service.fadeToColor(300, '#000000', 0, blink1Id); }
        }
        return rc;
    },

    playPatternFrom: function(source, pattid, blink1Id) {
        _log.msg("PatternsService.playPatternFrom: src:", source, "id:", pattid, ", blink1Id:", blink1Id);
        if (this.inEditing && source !== 'patternView') { return; }
        blink1Id = (blink1Id === undefined) ? '' : blink1Id;

        if (this.config.playingSerialize) {
            if (playingPattern.id) {
                _log.msg("PatternsService.playPattern: interrupting", playingPattern.id, "playingQueue:", playingQueue);
                playingQueue.push({ source: playingPatternSource, pattern: playingPattern, blink1Id: playingBlink1Id });
                if (playingPattern.timer) { clearTimeout(playingPattern.timer); }
            }
        }

        var patternstr, patt;
        var blinkre = /~blink:(#*\w+)-(\d+)(-(.+))?/;

        if (pattid.startsWith('#')) {
            patternstr = '1,' + pattid + ',0,0';
            patt = _makePattern({ name: pattid, id: pattid, patternstr: patternstr, temp: true });
            patternsTemp.push(patt);
            pattid = patt.id;
        } else if (pattid.startsWith('~')) {
            _log.msg('PatternsService.playPatternFrom: meta pattern string: ' + pattid);
            if (pattid === '~off') {
                PatternsService.stopAllPatterns();
                Blink1Service.fadeToColor(300, '#000000', 0, blink1Id);
                return pattid;
            } else if (blinkre.test(pattid)) {
                var match    = blinkre.exec(pattid);
                var colorstr = match[1];
                var count    = match[2];
                var secstr   = match[4];
                var secs     = (secstr === undefined && secstr > 0) ? 0.3 : Number.parseFloat(secstr);
                var c        = tinycolor(colorstr);
                patternstr   = count + ',' + c.toHexString() + ',' + secs + ',0,#000000,' + secs + ',0';
                patt = _makePattern({ name: pattid, id: pattid, patternstr: patternstr, temp: true });
                patternsTemp.push(patt);
                pattid = patt.id;
            } else if (pattid.startsWith('~pattern-stop:')) {
                patternstr = pattid.substring(pattid.lastIndexOf(':') + 1);
                return PatternsService.stopPatternFrom(source, patternstr, blink1Id);
            } else if (pattid.startsWith('~pattern-play:')) {
                pattid = pattid.substring(pattid.lastIndexOf(':') + 1);
            } else if (pattid.startsWith('~pattern:')) {
                var pattparts = pattid.split(':');
                if (pattparts.length !== 3) { return false; }
                var pattname = pattparts[1];
                patternstr = pattparts[2];
                patt = _parsePatternStr(patternstr);
                patt.name = pattname;
                patt.id   = patt.name;
                patt.temp = true;
                patternsTemp.push(patt);
                pattid = patt.id;
            } else {
                return false;
            }
        }

        var allpatts = this.getAllPatterns();
        var pattern  = allpatts.find(function(p) { return p.name === pattid; });
        if (!pattern) { pattern = allpatts.find(function(p) { return p.id === pattid; }); }
        if (!pattern) {
            pattern = patternsTemp.find(function(p) { return p.id === pattid; });
            if (!pattern) { _log.msg("PatternsService: no pattern with id:", pattid); return false; }
        }
        _log.msg("PatternsService.playPatternFrom: okay, got pattern", pattern);

        if (pattern.playing && pattern.timer) { clearTimeout(pattern.timer); }
        pattern.playpos   = 0;
        pattern.playcount = 0;
        pattern.playing   = true;
        playingPattern       = pattern;
        playingBlink1Id      = blink1Id;
        playingPatternSource = source;

        this._playPatternInternalFrom(source, pattern, blink1Id);
        return pattid;
    },

    _playPatternInternalFrom: function(source, pattern, blink1Id) {
        if (!pattern) { return; }
        playingPattern       = pattern;
        playingBlink1Id      = blink1Id;
        playingPatternSource = source;

        var color  = pattern.colors[pattern.playpos];
        var rgb    = color.rgb;
        var millis = color.time * 1000;
        var ledn   = color.ledn;

        Blink1Service.fadeToColor(millis, rgb, ledn, blink1Id);

        pattern.playpos++;
        if (pattern.playpos === pattern.colors.length) {
            pattern.playpos = 0;
            pattern.playcount++;
            if (pattern.playcount === pattern.repeats) {
                this.stopPatternFrom(source, pattern.id, blink1Id);
                return;
            }
        }
        this.notifyChange();
        pattern.timer = setTimeout(function() {
            PatternsService._playPatternInternalFrom(source, pattern, blink1Id);
        }, millis);
    },

    getPlayingPatternId:     function() { return playingPattern.id; },
    getPlayingPatternName:   function() { var p = playingPattern; return (p && p.name) ? p.name : ''; },
    getPlayingPatternSource: function() { var p = playingPattern; return (p && p.name) ? playingPatternSource : ''; },

    addChangeListener:    function(cb, name) { listeners.push({ name: name, callback: cb }); },
    removeChangeListener: function(name)     { listeners = listeners.filter(function(l) { return l.name !== name; }); },

    notifyChange: function() {
        var self     = this;
        var allpatts = self.getAllPatterns();
        listeners.forEach(function(l) { if (l.callback) l.callback(allpatts); });
        if (_sendState) { _sendState(PatternsService._getState()); }
    },

    setSendState: function(fn) {
        _sendState = fn;
        if (fn) { fn(PatternsService._getState()); }
    },

    setInEditing: function(val) { this.inEditing = val; },

    _getState: function() {
        var allPatterns = this.getAllPatterns().map(function(p) {
            var out = {};
            Object.keys(p).forEach(function(k) { if (k !== 'timer') out[k] = p[k]; });
            return out;
        });
        return {
            allPatterns:          allPatterns,
            playingPatternName:   this.getPlayingPatternName(),
            playingPatternSource: this.getPlayingPatternSource(),
        };
    },
};

module.exports = PatternsService;
