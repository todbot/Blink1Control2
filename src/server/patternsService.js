/*
 * Pattern Service singleton
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
// var tinycolor = require('tinycolor2');

var config = require('../configuration');
var log = require('../logger');
var utils = require('../utils');

var Blink1Service = require('./blink1Service');

// returns an array of (partially-filled out) pattern objects
var systemPatterns = require('./systemPatterns-mini').patterns;
// FIXME: two var for same thing
var patternsSystem;  // The system patterns this service knows about
var patternsUser; // The user generated patterns
var patternsTemp = [];

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
	initialize: function() {
		listeners = [];
		patternsSystem = systemPatterns.map( _systemFixup );
		patternsUser = [];
		patternsUser = config.readSettings('patterns');
		log.msg('PatternsService.initialize, config patterns', patternsUser);
		patternsUser = patternsUser.map( function(patt) {
			if( patt.pattern ) {
				var ppatt = _parsePatternStr(patt.pattern);
				patt.colors = ppatt.colors;
				patt.repeats = ppatt.repeats;
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
		return patternsUser.concat(patternsSystem); //_clone(patterns);
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
		config.saveSettings("patterns", patternsSave);
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
			name = 'new pattern ' + patternsUser.length;
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

	stopAllPatterns: function() {
		log.msg('PatternsService.stopAllPatterns');
		// var self = this;
		_.forEach( this.getAllPatterns(), function(pattern) {
			if( pattern.playing ) {
				console.log("    stopping ",pattern.name);
				//self.stopPattern(patt.id);
				pattern.playing = false;
				clearTimeout( pattern.timer );
				if( playingPatternId === pattern.id ) { playingPatternId = ''; }  // FIXME
			}
		});
		this.notifyChange();
	},
	/** Stop a playing pattern.  Notifies change listeners */
	stopPattern: function(id) {
		log.msg('PatternsService.stopPattern',id, playingPatternId);
		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( pattern ) {
			pattern.playing = false;
			clearTimeout( pattern.timer );
			if( playingPatternId === pattern.id ) { playingPatternId = ''; }  // FIXME
			this.notifyChange();
			return true;
		}
		return false;
	},

	/** Play a pattern. Returns false if pattern doesn't exist. Notifys change listeners */
	playPattern: function(id) {
		if( id.startsWith('#') ) { // color
			Blink1Service.fadeToColor(100, id, 0 );
			return true;
		}
		if( id.startsWith('~') ) { // special meta-pattern
			if( id === '~off') {
				log.msg("PatternsService: playing special '~off' pattern");
				PatternsService.stopAllPatterns();
				Blink1Service.fadeToColor( 300, '#000000', 0 );
				return true;
			}
			else if( id.startsWith('~pattern:') ) {
				var patternstr = id.substring(id.lastIndexOf(':')+1);
				var pattname = id.substring(id.indexOf(':')+1,id.lastIndexOf(':'));
				if( pattname===':' ) { pattname = 'temp-'+utils.cheapUid(4);} // if parsing failed, use temp name
				var patt = _parsePatternStr(patternstr);
				patt.name = pattname;
				log.msg("PatternsService: would play temp pattern:",patt);
			}
			// } else if( id === '!stop' ) {
			// }
			// var tc = tinycolor(id);
			// if( tinycolor(id) ) { // if 'id' is a hex color
			// }
			return false;
		}

		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( !pattern ) {  // check for special built-in patterns
			log.msg("PatternsService: no normal pattern:", id);
			return false;  // FIXME: return error?
		}
		if( pattern.playing ) {
			clearTimeout(pattern.timer);
		}
		pattern.playpos = 0;
		pattern.playcount = 0;
		pattern.playing = true;
		playingPatternId = id;
		// this._playPatternInternal(id, donecallback);
		this._playPatternInternal(id, null);
		return true;
	},

	_playPatternInternal: function(id, callback) {
		var pattern = _.find(this.getAllPatterns(), {id: id});
		var color = pattern.colors[pattern.playpos];
		var rgb = color.rgb;
		var millis = color.time * 1000;
		var ledn = color.ledn;
		// console.log("_playPatternInternal:" + pattern.id, pattern.playpos, pattern.playcount, pattern.colors[pattern.playpos].rgb );

		Blink1Service.fadeToColor( millis, rgb, ledn );
		this.notifyChange();

		pattern.playpos++;
		if( pattern.playpos === pattern.colors.length ) {
			pattern.playpos = 0;
			pattern.playcount++;
			if( pattern.playcount === pattern.repeats ) {
				this.stopPattern(playingPatternId); // notifies change listeners
				if( callback ) { callback(); }  // FIXME: why do this and not notify change?
				return;
			}
		}
		pattern.timer = setTimeout(function() {
			PatternsService._playPatternInternal(id, callback);
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
		delete listeners[callername];
		console.log("PatternsService: removeChangelistener", listeners );
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
