/*
 * Pattern Service singleton
 *
 *
 *	special meta-pattern
 * - #hexcolor
 * - ~off
 * - ~blink-white-3
 * - ~blink-#ff00ff-5
 * - ~pattern:3,#ff00ff,0.5,0,#00ff00,1.3,0
 * - ~pattern-stop:pattname
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

var _ = require('lodash');
var tinycolor = require('tinycolor2');

var conf = require('../configuration');
var log = require('../logger');
// var utils = require('../utils');

var Blink1Service = require('./blink1Service');

// returns an array of (partially-filled out) pattern objects
// var systemPatterns = require('./systemPatterns-mini').patterns;
var systemPatterns = require('./systemPatterns').patterns;
// FIXME: two var for same thing
var patternsSystem;  // The system patterns this service knows about
var patternsUser; // The user generated patterns
var patternsTemp = [];
var playingQueue = [];

/**
 * Determines whether or not patterns play concurrently or one-after-the-other
 * FIXME: should be in a config
 * @type {Boolean}
 */
// var playingSerialize = false;

var playingPatternId = '';
// var lastPatternId = ''; // last pattern that was recently played, or none

var listeners = {};

var _generateId = function(pattern) {
	var simplename = pattern.name.toLowerCase().replace(/\W+/g, '');
	//return simplename.replace(/\s+/g, '-'); // nope agove nukes whitespace too
	return simplename;
};

var _fixId = function(pattern) {
	if( !pattern.id ) {
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
	for( var i = 1; i < pattparts.length; i += 3 ) {
		var color = {
			rgb: pattparts[i + 0],
			time: Number(pattparts[i + 1]),
			ledn: Number(pattparts[i + 2]) };
		// FIXME: validate rgb
		if( isNaN(color.time) ) { color.time = 0.1; }
		if( isNaN(color.ledn) ) { color.ledn = 0; }
		colorlist.push( color );
	}
    return {colors: colorlist, repeats: repeats};
};

var _makePattern = function( template ) {
	var patt = _parsePatternStr(template.patternstr);
	// patt.name = pattid.substring(1); //'temp-'+utils.cheapUid(4); // if parsing failed, use temp name
	patt.name = template.name;
	patt.id   = template.id;
	patt.temp = template.temp; // FIXME: hmmm
	return patt;
};

var _generatePatternStr = function(pattern) {
	if( !pattern || !pattern.repeats || !pattern.colors ) { return ''; }
	var pattstr = pattern.repeats;
	pattern.colors.map( function(c) {
		pattstr += ',' + c.rgb + ',' + c.time + ',' + c.ledn;
	});
	return pattstr;
};

var _systemFixup = function(pattern) {
	pattern = _fixId(pattern);
	pattern.system = true;
	pattern.locked = true;
	pattern.playing = false;
	if( pattern.patternstr ) {
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
        playingSerialize: false
    },
    reloadConfig: function() {
        this.config = conf.readSettings('patternsService') || {};
    },
	initialize: function() {
        this.reloadConfig();
		listeners = [];
		patternsSystem = systemPatterns.map( _systemFixup );
		//patternsUser = [];
		var patternsUserCfg = conf.readSettings('patterns') || [];
		log.msg('PatternsService.initialize, config patterns', patternsUserCfg);
		patternsUser = patternsUserCfg.map( function(patt) {
			if( patt.pattern && patt.pattern !== '') {
				var ppatt = _parsePatternStr(patt.pattern);
				if( ppatt.colors ) {
					patt.colors = ppatt.colors;
				} else {
					patt.colors = [{rgb:'#000000', time:0.1, ledn:0}];
				}
				patt.repeats = ppatt.repeats;
			}
			else {  // bad parse
				patt.colors = [{rgb:'#000000', time:0.1, ledn:0}];
				patt.repeats = 1;
			}
			patt.playing = false;
			return patt;
		});
		if( !patternsUser ) {
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
		if( name.startsWith('~') ) { return name; } // assume special names map to ids
		var pattern = _.find(this.getAllPatterns(), {name: name});
		if(!pattern) { return ""; }
		return pattern.id;
	},
	getNameForId: function(id) {
		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( !pattern ) { return ""; }
		return pattern.name;
	},
	getPatternByName: function(name) {
		var pattern = _.find(this.getAllPatterns(), {name: name});
		return _.clone(pattern);
	},
	getPatternById: function(id) {
		var pattern = _.find(this.getAllPatterns(), {id: id});
		// console.log("getPatternById:", pattern);
		return _.clone(pattern);
	},
	formatPatternForOutput: function(patt) {
		if( !patt ) { return null; }
		patt.pattern = _generatePatternStr( patt );
		return _.pick(patt, 'name', 'id', 'pattern');
	},
	formatPatternsForOutput: function(patts) {
		var self = this;
		var patternsOut = patts.map( function(patt) {
			return self.formatPatternForOutput(patt);
		});
		return patternsOut;
	},
	getAllPatternsForOutput: function() {
		return this.formatPatternsForOutput(this.getAllPatterns());
	},
	/** Save all patterns to config and notifyChange listeners */
	savePatterns: function() {
		log.msg("PatternsService.savePatterns");
		var patternsSave = this.formatPatternsForOutput(patternsUser);
		conf.saveSettings("patterns", patternsSave);
		this.notifyChange();  /// FIXME: hmmm, not sure about the philosophy of this
	},
	/** Saves new pattern or updates existing pattern */
	savePattern: function(pattern) {
		log.msg("PatternsService.savePattern:", JSON.stringify(pattern));
		if (pattern.id) {
			var existingPatternIndex = _.indexOf(patternsUser, _.find(patternsUser, {id: pattern.id}));
			if( existingPatternIndex === -1 ) { // new
				patternsUser.unshift(pattern);
			}
			else {	// edit
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
		if( !name ) {
			name = 'pattern ' + patternsUser.length;
			color = '#55ff00';
		}
		var color2 = '#000000';
		var pattern = {
			name: name,
			repeats: 3,
			colors: [{rgb: color, time: 0.2, ledn: 0}, {rgb: color2, time: 0.2, ledn: 0}],  // FIXME
			playing: false
		};
		pattern.id = _generateId(pattern);
		return pattern;
	},
	/** Create a pattern object from a pattern str.  Does not insert into pattern list */
	newPatternFromString: function(name, patternstr) {
		if( !patternstr ) { return null; }
		var pattern = _parsePatternStr(patternstr);
		pattern.name = name;
		pattern.id = _generateId(pattern);
		pattern.playing = false;
		return pattern;
	},
	/** Deletes pattern and notifyChange listeners */
	deletePattern: function(id) {
		_.remove(patternsUser, {id: id});
		this.savePatterns();
	},
	/** Stops all patterns playing. Notifies change listeners */
	stopAllPatterns: function() {
		// log.msg('PatternsService.stopAllPatterns',JSON.stringify(this.getAllPatterns()));
		// var self = this;
		_.forEach( this.getAllPatterns(), function(pattern) {
			if( pattern.playing ) {
				// console.log("    stopping ",pattern.name);
				// self.stopPattern(pattern.id);
				pattern.playing = false;
				clearTimeout( pattern.timer );
				if( playingPatternId === pattern.id ) { playingPatternId = ''; }  // FIXME
			}
		});
		patternsTemp = [];
		this.notifyChange();
	},
	/** Stop a playing pattern.  Notifies change listeners */
	stopPattern: function(id) {
		log.msg('PatternsService.stopPattern',id, playingPatternId);
		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( pattern ) {
			pattern.playing = false;
			clearTimeout( pattern.timer );
			if( playingPatternId === pattern.id ) {
                playingPatternId = '';
                if( playingQueue.length > 0 ) {
                    var nextPattern = playingQueue.shift();
                    log.msg("PatternsService.stopPattern: next off playingQueue:",nextPattern);
                    this.playPattern( nextPattern.patternId, nextPattern.blink1id );
                } else {
                    this.notifyChange();  // FIXME: reduce notifys
                }
            } else {
                this.notifyChange();
            }
			return pattern.id;
		}
		return false;
	},
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

    /**
     * Play a pattern. Returns false if pattern doesn't exist. Notifies change listeners.
     *
     *
     * @param  {String} pattid   Id of pattern to play, or
     * @param  {[type]} blink1id blink(1) serial number to use, or undef
     * @return {pattid} id of pattern playing, or false if pattern doesn't exist
     */
	playPattern: function(pattid, blink1id) {
		log.msg("PatternsService.playPattern: id:",pattid, ", blink1id:",blink1id, "patternsTemp:",patternsTemp);

        if( this.config.playingSerialize ) {
            if( playingPatternId !== '' ) { // pattern playing
                log.msg("PatternsService.playPattern: queue up:",pattid, "was:", playingPatternId);
                // queue up
                playingQueue.push( {patternId:pattid, blink1Id:blink1id});
                return;
            }
        }

		var patternstr;
		var patt;
		var blinkre = /~blink-(#*\w+)-(\d+)(-(.+))?/;  // blink-color-cnt-time
		// first, is the pattern actually a hex color?
		if( pattid.startsWith('#') ) { // color
			// count + ',' + c.toHexString() + ','+secs+
			Blink1Service.fadeToColor(100, pattid, 0, blink1id ); // 0 == all LEDs
			return pattid;
		}
		// then, look for special meta-pattern
		if( pattid.startsWith('~') ) {
			if( pattid === '~off') {
				log.msg("PatternsService: playing special '~off' pattern");
				PatternsService.stopAllPatterns();
				Blink1Service.fadeToColor( 300, '#000000', 0, blink1id ); // 0 = all LEDs
				return pattid;
			}
			// FIXME: make this clause its own function?
			// FIXME: allow specing of time, e.g. "~blink-#ff0ff-5-0.2"
			else if( blinkre.test( pattid ) ) { // "~blink-#ff00ff-5"
				var match = blinkre.exec( pattid );
				var colorstr = match[1];
				var count    = match[2];
				var secstr   = match[4]; // why is this 4? because of how the regex is structured
				var secs = (secstr===undefined && secstr>0) ? 0.3 : Number.parseFloat(secstr);
				var c = tinycolor(colorstr);  // FIXME: how does tinycolor fail?

				patternstr = count + ',' + c.toHexString() + ','+secs+',0,#000000,'+secs+',0';
				// patt = _parsePatternStr(patternstr);
				// // patt.name = pattid.substring(1); //'temp-'+utils.cheapUid(4); // if parsing failed, use temp name
				// patt.name = pattid;
				// patt.id = patt.name;
				// patt.temp = true; // FIXME: hmmm
				patt = _makePattern( {name:pattid, id:pattid, patternstr:patternstr, temp:true });
				patternsTemp.push( patt ); // save temp pattern
				pattid = patt.id;
			}
			else if( pattid.startsWith('~pattern-stop:') ) { // FIXME: use regex yo
				patternstr = pattid.substring(pattid.lastIndexOf(':')+1);
				return PatternsService.stopPattern( patternstr );
			}
			else if( pattid.startsWith('~pattern:') ) { // FIXME: use regex yo
				patternstr = pattid.substring(pattid.lastIndexOf(':')+1);
				// pattname = id.substring(id.indexOf(':')+1,id.lastIndexOf(':'));
				// if( pattname===':' ) { pattname = 'temp-'+utils.cheapUid(4);} // if parsing failed, use temp name
				patt = _parsePatternStr(patternstr);
				patt.name = pattid.substring(9); // 'temp-'+utils.cheapUid(4);  // FIXME:
				patt.id = patt.name;
				patt.temp = true; // FIXME: hmmm
				patternsTemp.push( patt ); // save temp pattern
				pattid = patt.id;
				// log.msg("PatternsService: playing temp pattern:",patt);
			}
			else {
				return false; // no matching meta ("~") pattern
			}
			// } else if( id === '!stop' ) {
			// }
			// var tc = tinycolor(id);
			// if( tinycolor(id) ) { // if 'id' is a hex color
			// }
		}

		// FIXME: this function is doing too many things

		var pattern = _.find(this.getAllPatterns(), {name: pattid});
		if( !pattern ) {
			// finally, look for the pattern as an id
			pattern = _.find(this.getAllPatterns(), {id: pattid});
		}
		if( !pattern ) {  // check for special built-in patterns
			pattern = _.find( patternsTemp, {id: pattid} );
			if( !pattern ) {
				log.msg("PatternsService: no pattern with id:", pattid);
				return false;  // FIXME: return error?
			}
		}
		log.msg("PatternsService.playPattern: okay got pattern",pattern);
		// otherwise, treat 'id' as a pattern object

		if( pattern.playing ) {
			clearTimeout(pattern.timer);
		}
		pattern.playpos = 0;
		pattern.playcount = 0;
		pattern.playing = true;
		playingPatternId = pattid;
		// playingStack.push( id ); // FIXME: idea for pattern stack
		this._playPatternInternal(pattern.id, blink1id, null);
		return pattid;
	},

	/**
	 * Internal function for playing a pattern by id
	 * @method function
	 * @param  {String}   id       id of pattern
	 * @param  {String}   blink1id serial of blink1 to play on, or 0 or undef
	 * @param  {Function} callback unused now?
	 * @return no return value
	 */
	_playPatternInternal: function(id, blink1id, callback) {
		// log.msg("_playPatternInternal:",id);
		playingPatternId = id;
		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( !pattern ) { // look for id in temp pattern list
			pattern = _.find( patternsTemp, {id:id});
		}
		var color = pattern.colors[pattern.playpos];
		var rgb = color.rgb;
		var millis = color.time * 1000;
		var ledn = color.ledn;
		// console.log("_playPatternInternal:" + pattern.id, pattern.playpos, pattern.playcount, pattern.colors[pattern.playpos].rgb );

		Blink1Service.fadeToColor( millis, rgb, ledn, blink1id );

		// go to next step in pattern, potentially looping or stopping
		pattern.playpos++;
		if( pattern.playpos === pattern.colors.length ) {
			pattern.playpos = 0;
			pattern.playcount++;
			if( pattern.playcount === pattern.repeats ) {
				this.stopPattern(pattern.id); // notifies change listeners
				if( pattern.temp ) {   // remove temp pattern after its done
					_.remove( patternsTemp, {id:pattern.id} );
					this.notifyChange();
				}
				return;
			}
		}

		this.notifyChange();
		pattern.timer = setTimeout(function() {
			PatternsService._playPatternInternal(id, blink1id, callback);
		}, millis);
	},

	getPlayingPatternId: function() {
		return playingPatternId;
	},
	getPlayingPatternName: function() {
		var patt = this.getPatternById( playingPatternId );
		return (patt) ? patt.name : '';
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		// console.log("PatternsService: addChangelistener", listeners );
	},
	removeChangeListener: function(callername) {
		delete listeners[callername]; /// FIXME: leaves 'undefined' in array
		log.msg("PatternsService: removeChangelistener", listeners );
	},
	notifyChange: function() {
		var self = this;
		// log.msg("PatternsService.notifyChange",listeners);
		_.forIn( listeners, function(callback) {
			if( callback ) { callback( self.getAllPatterns() ); }
		});
	}

};

module.exports = PatternsService;
