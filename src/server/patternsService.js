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

"use strict";

var _ = require('lodash');

var config = require('../configuration');

var Blink1Service = require('./blink1Service');

// returns an array of (partially-filled out) pattern objects
var systemPatterns = require('./systemPatterns-mini').patterns;
// FIXME: two var for same thing
var patternsSystem;  // The system patterns this service knows about
var patternsUser; // The user generated patterns

var playingPatternId = '';
var lastPatternId = ''; // last pattern that was recently played, or none

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

var _parsePatternStr = function(patternstr) {
	var pattparts = patternstr.split(/\s*,\s*/g);
	//var len = pattparts[0];
	var colorlist = [];
	for( var i = 1; i < pattparts.length; i += 3 ) { //[0] is len
		var color = { rgb: pattparts[i + 0],
					time: Number(pattparts[i + 1]),
					ledn: Number(pattparts[i + 2]) };
		// FIXME: validate rgb
		if( isNaN(color.time) ) { color.time = 0.1; }
		if( isNaN(color.ledn) ) { color.ledn = 0; }
		colorlist.push( color );
	}
    return colorlist;
};

var _generatePatternStr = function(pattern) {
	var pattstr = pattern.repeats;
	pattern.colors.map( function(c) {
		pattstr += ',' + c.color + ',' + c.time + ',' + c.ledn;
	});
	return pattstr;
};

var _systemFixup = function(pattern) {
	pattern = _fixId(pattern);
	pattern.system = true;
	pattern.locked = true;
	if( pattern.patternstr ) {
		pattern.colors = _parsePatternStr(pattern.patternstr);
	}
	pattern.repeats = Math.floor((Math.random() * 8) + 0);  // FIXME: TESTING HACK
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
		if( !patternsUser ) {
			patternsUser = [];
		}
		// console.log('patternsUser', patternsUser);
	},
	listenColorChange: function(color) {
		console.log("PatternsService.listenColorChange!", color);
	},

	getAllPatterns: function() {
		// console.log("***** getAllPatterns", patternsUser.concat(patternsSystem));
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
	/** Save all patterns to config and notifyChange listeners */
	savePatterns: function() {
		console.log("PatternsService.savePatterns");
		var patternsSave = _.map( patternsUser, function(p) {
			return _.pick(p, 'name', 'id', 'colors', 'repeats');
		});
		config.saveSettings("patterns", patternsSave);
		this.notifyChange();  /// FIXME: hmmm, not sure about the philosophy of this
	},
	/** Saves new pattern or updates existing pattern */
	savePattern: function(pattern) {
		console.log("PatternsService.savePattern:", JSON.stringify(pattern));
		if (pattern.id) {
			var existingPatternIndex = _.indexOf(patternsUser, _.find(patternsUser, {id: pattern.id}));
			patternsUser.splice(existingPatternIndex, 1, pattern);
		} else {
			pattern.id = _generateId(pattern);
			patternsUser.unshift(pattern); // add new to top of list
		}
		this.savePatterns();
	},
	/** Create a minimal pattern and return it. Does not insert into patterns array */
	newPattern: function(name, color) {
		if( !name ) {
			name = 'new pattern ' + patternsUser.length;
			color = '#55ff00';
		}
		var color2 = '#000000';
		var pattern = {
			name: name,
			repeats: 3,
			colors: [{rgb: color, time: 0.2, ledn: 0}, {rgb: color2, time: 0.2, ledn: 0}] };  // FIXME
		pattern.id = _generateId(pattern);
		//patternsUser.unshift(pattern);
		return pattern;
	},
	/** Deletes pattern and notifyChange listeners */
	deletePattern: function(id) {
		_.remove(patternsUser, {id: id});
		this.savePatterns();
	},

	/** Stop a playing pattern.  Notifies change listeners */
	stopPattern: function(id) {
		console.log('PatternsService.stopPattern',id);
		var pattern = _.find(this.getAllPatterns(), {id: id});
		pattern.playing = false;
		if( playingPatternId === pattern.id ) { playingPatternId = ''; }
		clearTimeout( pattern.timer );
		this.notifyChange();
	},

	/** Play a pattern. Callback when done playing. Also notifys change listeners */
	playPattern: function(id, donecallback) {
		var pattern = _.find(this.getAllPatterns(), {id: id});
		if( !pattern ) {
			console.log("no pattern:", id);
			return;
		}
		if( pattern.playing ) {
			clearTimeout(pattern.timer);
		}
		pattern.playpos = 0;
		pattern.playcount = 0;
		pattern.playing = true;
		playingPatternId = id;
		lastPatternId = id;
		this._playPatternInternal(id, donecallback);
	},

	_playPatternInternal: function(id, callback) {
		var pattern = _.find(this.getAllPatterns(), {id: id});
		var color = pattern.colors[pattern.playpos];
		var rgb = color.rgb;
		var millis = color.time * 1000;
		var ledn = color.ledn;
		console.log("_playPatternInternal: " + pattern.id, pattern.playpos, pattern.playcount, pattern.colors[pattern.playpos].rgb );
		//Blink1Service.fadeToColor( millis , rgb, ledn );
		Blink1Service.fadeToColor( millis, rgb, ledn );
		this.notifyChange();

		//var pattern = _.find(patterns, {id: id});
		pattern.playpos++;
		if( pattern.playpos === pattern.colors.length ) {
			pattern.playpos = 0;
			pattern.playcount++;
			if( pattern.playcount === pattern.repeats ) {
				this.stopPattern(playingPatternId);
				// pattern.playing = false;
				// playingPatternId = '';
				// if( callback ) { callback(); }  // FIXME: why do this and not notify change?
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
		var pat = this.getPatternById( playingPatternId );
		return (pat) ? pat.name : '';
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
		_.forIn( listeners, function(callback) {
			// console.log
			if( callback ) { callback(); }
			else { console.log("no listener: ",listeners);}
		});
	}

};

module.exports = PatternsService;
