/*
 * Pattern Service singleton
 *
 *
 *	special meta-pattern
 * - #hexcolor
 * - ~off
 * - ~blink:white-3
 * - ~blink:#ff00ff-5
 * - ~pattern:pattname:3,#ff00ff,0.5,0,#00ff00,1.3,0
 * - ~pattern-stop:pattname
 * - ~play:pattname
 * - ~stop:pattname
 *
 * a fully populated in-memory pattern looks like:
 *  var pattern = {
 *		id: "policecar",
 * 		name: "PoliceCar",
 *		patternstr: "6, #ff0000,0.3,1, #0000ff,0.3,2, #000000,0.1,0, #ff0000,0.3,2, #0000ff,0.3,1, #000000,0.1,0",
 *		colors: [
 *			{ rgb: "#ff0000", time: 0.3, led: 1 },
 *			{ rgb: "#0000ff", time: 0.3, led: 2 },
 *			{ rgb: "#000000", time: 0.1, led: 0 },
 *			{ rgb: "#ff0000", time: 0.3, led: 2 },
 *			{ rgb: "#0000ff", time: 0.3, led: 1 },
 *			{ rgb: "#000000", time: 0.1, led: 0 }
 *		],
 *      repeats: 3,
 *      playing: false,
 *      playcount: 0,
 *      playpos: 0,
 *      system: true
 * 	};
 *  "patternstr" is optional and can be generated with _toPatternStr
 * 	The "toString()" implementation can be considered to be: id:name:patternstr ?
 */

'use strict';

var tinycolor = require('tinycolor2');
// var d3 = require('d3-timer');

var conf = require('../configuration');
var log = require('../logger');

var Blink1Service = require('./blink1Service');

// returns an array of (partially-filled out) pattern objects
// var systemPatterns = require('./systemPatterns-mini').patterns;
var systemPatterns = require('./systemPatterns').patterns;
// FIXME: two var for same thing
var patternsSystem; // The system patterns this service knows about
var patternsUser; // The user generated patterns
var patternsTemp = [];
var playingQueue = [];  // [{pattern:<obj>, source:'ifttt', blink1Id:'2121ABAB'}]

// FIXME: playingQueue needs to be indexed by blink1id
// var playingQueue = {
//     // looks like:
//     // 'blink1id1': [],
//     // 'blink1id2': []
// };

var playingPattern = {};
var playingPatternSource = '';
var playingBlink1Id = '';

var listeners = [];

var _generateId = function(pattern) {
    var simplename = pattern.name.toLowerCase().replace(/\W+/g, '');
    //return simplename.replace(/\s+/g, '-'); // nope above nukes whitespace too
    return simplename;
};

var _fixId = function(pattern) {
    if (!pattern.id) {
        pattern.id = _generateId(pattern);
    }
    return pattern;
};

// turn patternstring into fledgling {colors,repeats} partial pattern
// only parses pattern string in format: repeats,color1,time,ledn1,time2,ledn2,...
// FIXME: need to support non-ledn variant
// FIXME: need to declare when parsing fails?
var _parsePatternStr = function(patternstr) {
    var pattparts = patternstr.split(/\s*,\s*/g);
    //var len = pattparts[0];
    var repeats = parseInt(pattparts[0]);
    var colorlist = [];
    for (var i = 1; i < pattparts.length; i += 3) {
        var color = {
            rgb: pattparts[i + 0],
            time: Number(pattparts[i + 1]),
            ledn: Number(pattparts[i + 2])
        };
        // FIXME: validate rgb
        if (isNaN(color.time)) { color.time = 0.1; }
        if (isNaN(color.ledn)) { color.ledn = 0; }
        colorlist.push(color);
    }
    return {
        colors: colorlist,
        repeats: repeats
    };
};

var _makePattern = function(template) {
    var patt = _parsePatternStr(template.patternstr);
    // patt.name = pattid.substring(1); //'temp-'+utils.cheapUid(4); // if parsing failed, use temp name
    patt.name = template.name;
    patt.id = template.id;
    patt.temp = template.temp; // FIXME: hmmm
    return patt;
};

var _generatePatternStr = function(pattern) {
    if (!pattern || pattern.repeats < 0 || pattern.repeats > 9 || !pattern.colors) {  // thx @aw9
        return '';
    }
    var pattstr = pattern.repeats;
    pattern.colors.map(function(c) {
        pattstr += ',' + c.rgb + ',' + c.time + ',' + c.ledn;
    });
    return pattstr;
};

var _systemFixup = function(pattern) {
    pattern = _fixId(pattern);
    pattern.system = true;
    pattern.locked = true;
    pattern.playing = false;
    if (pattern.patternstr) {
        var ppatt = _parsePatternStr(pattern.patternstr);
        pattern.colors = ppatt.colors;
        pattern.repeats = ppatt.repeats;
    }
    return pattern;
};

/**
 *
 *
 */
var PatternsService = {
    config: {
        /**
         * Determines whether or not patterns play concurrently or one-after-the-other
         * FIXME: need concept of 'priority' so patterns can jump the queue
         * @type {Boolean}
         */
        playingSerialize: false
    },
    inEditing: false,  // can be set to true during pattern editing?
    reloadConfig: function() {
        this.config = conf.readSettings('patternsService') || {};
    },
    initialize: function() {
        this.reloadConfig();
        listeners = [];
        patternsSystem = systemPatterns.map(_systemFixup);
        //patternsUser = [];
        var patternsUserCfg = conf.readSettings('patterns') || [];
        log.msg('PatternsService.initialize, config patterns', patternsUserCfg);
        patternsUser = patternsUserCfg.map(function(patt) {
            if (patt.pattern && patt.pattern !== '') {
                var ppatt = _parsePatternStr(patt.pattern);
                if (ppatt.colors) {
                    patt.colors = ppatt.colors; // wat
                } else {
                    patt.colors = [{
                        rgb: '#000000',
                        time: 0.1,
                        ledn: 0
                    }];
                }
                patt.repeats = ppatt.repeats;
            } else { // bad parse
                patt.colors = [{
                    rgb: '#000000',
                    time: 0.1,
                    ledn: 0
                }];
                patt.repeats = 1;
            }
            patt.playing = false;
            return patt;
        });
        if (!patternsUser) {
            patternsUser = [];
        }
        log.msg('PatternsService.initialize, fixup patterns', patternsUser);
    },
    listenColorChange: function(color) {
        log.msg("PatternsService.listenColorChange!", color);
    },

    getAllPatterns: function() {
        // return patternsUser.concat(patternsSystem); //_clone(patterns);
        return patternsUser.concat(patternsSystem).concat(patternsTemp);
    },
    getIdForName: function(name) {
        if (name.startsWith('~')) {
            return name;
        } // assume special names map to ids
        var pattern = this.getAllPatterns().find( (patt) => patt.name === name );
        if (!pattern) {
            return "";
        }
        return pattern.id;
    },
    getNameForId: function(id) {
        var pattern = this.getAllPatterns().find( (patt) => patt.id===id );
        if (!pattern) { return ""; }
        return pattern.name;
    },
    getPatternByName: function(name) {
        var pattern = this.getAllPatterns().find( (patt) => pattt.name===name );
        return Object.assign({}, pattern); // why are we giving a copy?
        // return lodash.clone(pattern);
    },
    getPatternById: function(id) {
        var pattern = this.getAllPatterns().find( (patt) => patt.id===id );
        return Object.assign({}, pattern); // why are we giving a copy?
        // return lodash.cloneDeep(pattern);  // FIXME: DANGER WHY WAS THIS A DEEP CLONE?
    },
    // for apiServer
    formatPatternForOutput: function(patt) {
        if (!patt) { return null; }
        patt.pattern = _generatePatternStr(patt);
        var {name,id,pattern,locked} = patt; // FIXME: is there a one-line equiv?
        return { name,id,pattern,locked };
    },
    // for apiServer
    formatPatternsForOutput: function(patts) {
        var self = this;
        var patternsOut = patts.map(function(patt) {
            return self.formatPatternForOutput(patt);
        });
        return patternsOut;
    },
    // for apiServer
    getAllPatternsForOutput: function() {
        return this.formatPatternsForOutput(this.getAllPatterns());
    },
    getPlayingQueueForOutput: function() {
        return playingQueue.map( function(qInfo) {
            return {source:qInfo.source, blink1Id:qInfo.blink1Id, pname:qInfo.pattern.id};
        });
    },
    /** Save all patterns to config and notifyChange listeners */
    savePatterns: function() {
        log.msg("PatternsService.savePatterns");
        var patternsSave = this.formatPatternsForOutput(patternsUser);
        conf.saveSettings("patterns", patternsSave);
        this.notifyChange(); /// FIXME: hmmm, not sure about the philosophy of this
    },
    /** Saves new pattern or updates existing pattern */
    savePattern: function(pattern) {
        log.msg("PatternsService.savePattern:", JSON.stringify(pattern));
        if (pattern.id) {
            var existingPatternIndex = patternsUser.findIndex( (patt) => patt.id===pattern.id );
            if (existingPatternIndex === -1) { // new
                patternsUser.unshift(pattern);
            } else { // edit
                patternsUser.splice(existingPatternIndex, 1, pattern);
            }
        } else {
            pattern.id = _generateId(pattern);
            patternsUser.unshift(pattern); // add new to top of list
        }
        this.savePatterns();
    },
    /** Create a minimal pattern and return it. Does NOT insert into patterns array */
    newPattern: function(name, color) {
        if (!name) {
            name = 'pattern ' + patternsUser.length;
            color = '#55ff00';
        }
        var color2 = '#000000';
        var pattern = {
            name: name,
            repeats: 3,
            colors: [{ rgb: color, time: 0.2, ledn: 0 },
                    { rgb: color2, time: 0.2, ledn: 0 }], // FIXME
            playing: false
        };
        pattern.id = _generateId(pattern);
        return pattern;
    },
    /** Create a pattern object from a pattern str.  Does not insert into pattern list */
    newPatternFromString: function(name, patternstr) {
        if (!patternstr) { return null; }
        var pattern = _parsePatternStr(patternstr);
        pattern.name = name;
        pattern.id = _generateId(pattern);
        pattern.playing = false;
        return pattern;
    },
    /** Deletes pattern and notifyChange listeners */
    deletePattern: function(id) {
        patternsUser = patternsUser.filter( (patt) => patt.id !== id );
        this.savePatterns();
    },
    /** Stops all patterns playing. Notifies change listeners */
    stopAllPatterns: function() {
        this.getAllPatterns().forEach( function(pattern) {
            if (pattern.playing) {
                // console.log("    stopping ",pattern.name);
                pattern.playing = false;
                if(pattern.timer) {
                    //pattern.timer.stop();
                    clearTimeout(pattern.timer);
                }
                if (playingPattern.id === pattern.id) {
                    playingPattern = {};
                }
            }
        });
        patternsTemp = []; // clear any temp patterns
        playingQueue = []; // clear any queued patterns
        this.notifyChange();
    },
    stopPattern: function(pattId) {
        return this.stopPatternFrom(null, pattId, null, false); // FIXME: defaults?
    },
    /**
     * Stop a pattern playing. Notfies change listeners
     * @method
     * @param  {String} sourceId name/id of source who wants to stop the pattern
     * @param  {String} pattid   name/id of pattern
     * @param  {String/Int} blink1Id serial or id of blink1 device to use, or empty
     * @param  {boolean} doOff   true to fade blink1 off (otherwise leave it)
     * @return {boolean}         true if pattern was stopped
     */
    stopPatternFrom: function(sourceId, pattid, blink1Id, doOff) {
        var self = this;
        log.msg('PatternsService.stopPattern:', pattid, '/', playingPattern.id, "source:", sourceId, "blink1Id:", blink1Id);
        // remove any from the playingQueue
        playingQueue = playingQueue.filter( (qInfo) =>
            qInfo.pattern.id === pattid && qInfo.source === sourceId
        );
        // var pattern = lodash.find(this.getAllPatterns(), { id: id });
        // if (pattern) {
        var rc = false;
        self.getAllPatterns().forEach( function(pattern) {
            if( pattern.id !== pattid ) { return; }
            pattern.playing = false;

            if( pattern.timer ) {
                clearTimeout(pattern.timer);  // pattern.timer.stop()
            }
            if( pattern.temp ) {
              patternsTemp = patternsTemp.filter( (patt) => patt.id !== pattern.id );
            }
            if (playingPattern.id === pattern.id) {
                playingPattern = {};
                if (playingQueue.length > 0) { // if queue, get next in queue
                    var qInfo = playingQueue.pop();
                    log.msg("PatternsService.stopPattern: playing next in playingQueue:", qInfo.source, qInfo.pattern.id);
                    self._playPatternInternalFrom(qInfo.source, qInfo.pattern, qInfo.blink1Id);
                }
            }
            rc = pattern.id;

        });
        if( rc ) {
            self.notifyChange();
            if(doOff) {
                Blink1Service.fadeToColor(300, '#000000', 0, blink1Id); // 0 = all LEDs
            }
        }
        return rc;
    },

    /**
     * Play a pattern. Returns false if pattern doesn't exist. Notifies change listeners.
     *
     *
     * @param  {String} source   source of who wants to play a pattern
     * @param  {String} pattid   Id of pattern to play, or
     * @param  {[type]} blink1Id blink(1) serial number to use, or undef
     * @return {pattid} id of pattern playing, or false if pattern doesn't exist
     */
    playPatternFrom: function(source, pattid, blink1Id) {
        log.msg("PatternsService.playPatternFrom: src:",source,"id:", pattid, ", blink1Id:", blink1Id, "patternsTemp:", patternsTemp);

        // if a pattern is being edited, do not allow playing
        if( this.inEditing && source != 'patternView' ) { return; }  // FIXME: wat

        blink1Id = ( blink1Id === undefined ) ? '' : blink1Id; // set default for blink1Id

        if (this.config.playingSerialize) {
            if (playingPattern.id ) { // pattern playing, so interrupt it and save it
                log.msg("PatternsService.playPattern: interrupting", playingPattern.id, "playingQueue: ", playingQueue);
                playingQueue.push({
                    source: playingPatternSource,
                    pattern: playingPattern,
                    blink1Id: playingBlink1Id
                });
                if( playingPattern.timer ) {
                    // playingPattern.timer.stop();
                    clearTimeout( playingPattern.timer );
                }
            }
        }

        var patternstr;
        var patt;
        var blinkre = /~blink:(#*\w+)-(\d+)(-(.+))?/; // blink:color-cnt-time
        // first, is the pattern actually a hex color?
        if (pattid.startsWith('#')) { // color
            // Blink1Service.fadeToColor(100, pattid, 0, blink1Id); // 0 == all LEDs
            patternstr = '1,' + pattid + ',0,0';
            patt = _makePattern({
                name: pattid,
                id: pattid,
                patternstr: patternstr,
                temp: true
            });
            patternsTemp.push(patt); // save temp pattern
            pattid = patt.id;            //return pattid;
        }
        // then, look for special meta-pattern
        else if (pattid.startsWith('~')) {
          log.msg('TESTING pattern string:'+pattid);
            if (pattid === '~off') {
                log.msg("PatternsService: playing special '~off' pattern");
                PatternsService.stopAllPatterns();
                Blink1Service.fadeToColor(300, '#000000', 0, blink1Id); // 0 = all LEDs
                return pattid;
            }
            // FIXME: make this clause its own function?
            else if (blinkre.test(pattid)) { // "~blink:#ff00ff-5"
                var match = blinkre.exec(pattid);
                var colorstr = match[1];
                var count = match[2];
                var secstr = match[4]; // why is this 4? because of how the regex is structured
                var secs = (secstr === undefined && secstr > 0) ? 0.3 : Number.parseFloat(secstr);
                var c = tinycolor(colorstr); // FIXME: how does tinycolor fail?

                patternstr = count + ',' + c.toHexString() + ',' + secs + ',0,#000000,' + secs + ',0';
                // patt = _parsePatternStr(patternstr);
                // // patt.name = pattid.substring(1); //'temp-'+utils.cheapUid(4); // if parsing failed, use temp name
                // patt.name = pattid;
                // patt.id = patt.name;
                // patt.temp = true; // FIXME: hmmm
                patt = _makePattern({
                    name: pattid,
                    id: pattid,
                    patternstr: patternstr,
                    temp: true
                });
                patternsTemp.push(patt); // save temp pattern
                pattid = patt.id;
            }
            else if (pattid.startsWith('~pattern-stop:') ) { // FIXME: use regex yo
                patternstr = pattid.substring(pattid.lastIndexOf(':') + 1);
                return PatternsService.stopPattern(patternstr);
            }
            else if( pattid.startsWith('~pattern-play:') ) {
                pattid = pattid.substring(pattid.lastIndexOf(':') + 1); // play happens later
            }
            else if (pattid.startsWith('~pattern:')) { // FIXME: use regex yo
                var pattparts = pattid.split(':');
                if( pattparts.length !== 3 ) { // not a proper pattern, must have '~pattern', 'pattname', and 'pattstring'
                    return false;
                }
                var pattname = pattparts[1];
                patternstr = pattparts[2];
                // patternstr = pattid.substring(pattid.lastIndexOf(':') + 1);
                // pattname = id.substring(id.indexOf(':')+1,id.lastIndexOf(':'));
                // if( pattname===':' ) { pattname = 'temp-'+utils.cheapUid(4);} // if parsing failed, use temp name
                patt = _parsePatternStr(patternstr);
                // patt.name = pattid.substring(9); // 'temp-'+utils.cheapUid(4);  // FIXME:
                patt.name = pattname;
                patt.id = patt.name;
                patt.temp = true; // FIXME: hmmm
                patternsTemp.push(patt); // save temp pattern
                pattid = patt.id;
                // log.msg("PatternsService: playing temp pattern:",patt);
            } else {
                return false; // no matching meta ("~") pattern
            }
            // } else if( id === '!stop' ) {
            // }
            // var tc = tinycolor(id);
            // if( tinycolor(id) ) { // if 'id' is a hex color
            // }
        }

        // FIXME: this function is doing too many things
        var allpatts = this.getAllPatterns();
        var pattern = allpatts.find( (patt) => patt.name===pattid );
        if (!pattern) { // finally, look for the pattern as an id
            pattern = allpatts.find( (patt) => patt.id === pattid );
        }
        if (!pattern) { // check for special built-in patterns
            pattern = patternsTemp.find( (patt) => patt.id===pattid );
            if (!pattern) {
                log.msg("PatternsService: no pattern with id:", pattid);
                return false; // FIXME: return error?
            }
        }
        log.msg("PatternsService.playPatternFrom: okay, got pattern", pattern);
        // NOT IMPLEMENTED: otherwise, treat 'id' as a pattern object

        if (pattern.playing) {
            if( pattern.timer ) {
                // pattern.timer.stop();
                clearTimeout(pattern.timer);
            }
        }
        pattern.playpos = 0;
        pattern.playcount = 0;
        pattern.playing = true;

        playingPattern = pattern;
        playingBlink1Id = blink1Id;
        playingPatternSource = source;

        this._playPatternInternalFrom(source, pattern, blink1Id);
        return pattid;
    },

    /**
     * Internal function for playing a pattern by id
     * @method function
     * @param  {String}   pattern       pattern object to play
     * @param  {String}   blink1Id serial of blink1 to play on, or 0 or undef
     * @return no return value
     */
    _playPatternInternalFrom: function(source, pattern, blink1Id) {
        // log.msg("_playPatternInternal:",pattern.id);
        if( !pattern ) { return; } // should never happen

        playingPattern = pattern;
        playingBlink1Id = blink1Id;
        playingPatternSource = source;
        var color = pattern.colors[pattern.playpos];
        var rgb = color.rgb;
        var millis = color.time * 1000;
        var ledn = color.ledn;
        // log.msg("_playPatternInternalFrom:" + pattern.id, pattern.playpos, pattern.playcount, pattern.colors[pattern.playpos].rgb, millis, ledn );

        Blink1Service.fadeToColor(millis, rgb, ledn, blink1Id);

        // go to next step in pattern, potentially looping or stopping
        pattern.playpos++;
        if (pattern.playpos === pattern.colors.length) {
            pattern.playpos = 0;
            pattern.playcount++;
            if (pattern.playcount === pattern.repeats) {
                this.stopPatternFrom(source, pattern.id, blink1Id); // notifies change listeners
                return;
            }
        }

        this.notifyChange();
        pattern.timer = setTimeout(function() {
            PatternsService._playPatternInternalFrom( source, pattern, blink1Id);
        }, millis);
        // pattern.timer = d3.timeout( function() {
        //     PatternsService._playPatternInternalFrom(source, pattern, blink1Id);
        // }, millis);
    },

    getPlayingPatternId: function() {
        return playingPattern.id;
    },
    getPlayingPatternName: function() {
        // var patt = this.getPatternById(playingPattern.id);
        var patt = playingPattern;
        return (patt && patt.name) ? patt.name : '';
    },
    getPlayingPatternSource: function() {
        var patt = playingPattern;
        return (patt && patt.name) ? playingPatternSource : '';
    },

    addChangeListener: function(callback, name) {
        listeners.push( { name, callback } );
        log.msg("PatternsService: addChangelistener", listeners );
    },
    removeChangeListener: function(name) {
        listeners = listeners.filter( (listener) => listener.name !== name );
        log.msg("PatternsService: removeChangelistener", listeners);
    },
    notifyChange: function() {
        // log.msg("PatternsService.notifyChange",listeners);
        var self = this;
        var allpatts = self.getAllPatterns();
        listeners.forEach( (listener) => { if(listener.callback) listener.callback(allpatts) } );
    }

};

/**
 * Play pattern from an event source rule
 * @param  {Rule} rule Event rule: {patternId:"", blink1Id:""}
 * @return {pattid} id of pattern, or false if pattern doesn't exist
 */

// FIXME: This is only used by iftttService.  Don't think we need it.
// playPatternByRule: function(rule) {
// 	var allowMultiBlink1 = conf.readSettings('blink1Service:allowMulti') || false;
// 	log.msg("PatternsService.playPatternByRule: ",rule, ", multi:",allowMultiBlink1);
// 	if( rule.enabled ) {
// 		if( allowMultiBlink1 && rule.blink1Id ) {
// 			return this.playPattern(rule.patternId, rule.blink1Id);
// 		} else {
// 			return this.playPattern(rule.patternId);
// 		}
// 	}
// 	return false;
// },

module.exports = PatternsService;
