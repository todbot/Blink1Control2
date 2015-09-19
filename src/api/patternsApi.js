/*
 * Pattern API mockup
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

var remote = window.require('remote');
//var Blink1Api = remote.require('./src/server/blink1ServerApi');

//This file is mocking a web API by hitting hard coded data.
var systemPatterns = require('./systemPatterns').patterns;

//This would be performed on the server in a real app. Just stubbing in.
var _generateId = function(pattern) {
	return pattern.name.toLowerCase().replace(/\s+/g, '-'); // + '-' + pattern.lastName.toLowerCase();
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
		colorlist.push( color );
	}
    return colorlist;
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

var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var patterns = systemPatterns.map( _systemFixup );
//console.log("patterns:", JSON.stringify(patterns, null, ' '));
var playingPattern = '';

var PatternsApi = {
	getAllPatterns: function() {
		return _clone(patterns);
	},

	getPatternByName: function(name) {
		var pattern = _.find(patterns, {name: name});
		return _clone(pattern);
	},

	getPatternById: function(id) {
		var pattern = _.find(patterns, {id: id});
		return _clone(pattern);
	},

	savePattern: function(pattern) {
		//pretend an ajax call to web api is made here
		//console.log('Pretend this just saved the pattern to the DB via AJAX call...');

		if (pattern.id) {
			var existingPatternIndex = _.indexOf(patterns, _.find(patterns, {id: pattern.id}));
			patterns.splice(existingPatternIndex, 1, pattern);
		} else {
			//Just simulating creation here.
			//The server would generate ids for new authors in a real app.
			//Cloning so copy returned is passed by value rather than by reference.
			pattern.id = _generateId(pattern);
			patterns.unshift(pattern);
		}

		return _clone(pattern);
	},

	newPattern: function(name, color) {
		var pattern = { name: name, colors: [{rgb: color, time: 0.2, ledn: 0}] };  // FIXME
		pattern.id = _generateId(pattern);
		patterns.unshift(pattern);
	},

	deletePattern: function(id) {
		//console.log('Pretend this just deleted the pattern from the DB via an AJAX call...');
		_.remove(patterns, { id: id});
	},

	playPattern: function(id, callback) {
		var pattern = _.find(patterns, {id: id});
		if( pattern.playing ) {
			clearTimeout(pattern.timer);
		}
		pattern.playpos = 0;
		pattern.playcount = 0;
		pattern.playing = true;
		playingPattern = id;
		this.playPatternInternal(id, callback);
	},

	playPatternInternal: function(id, callback) {
		var pattern = _.find(patterns, {id: id});
		var millis = pattern.colors[pattern.playpos].time * 1000;
		var rgb = pattern.colors[pattern.playpos].rgb;
		console.log("playPatternInternal: " + pattern.id, pattern.playpos, pattern.playcount, pattern.colors[pattern.playpos].rgb );
		//Blink1Api.fadeToColor( millis, rgb ); // FIXME: add ledn

		//var pattern = _.find(patterns, {id: id});
		pattern.playpos++;
		if( pattern.playpos === pattern.colors.length ) {
			pattern.playpos = 0;
			pattern.playcount++;
			if( pattern.playcount === pattern.repeats ) {
				pattern.playing = false;
				playingPattern = '';
				callback();
				return;
			}
		}
		pattern.timer = setTimeout(function() {
			PatternsApi.playPatternInternal(id, callback);
		}, pattern.colors[ pattern.playpos ].time * 1000 );

	},

	stopPattern: function(id) {
		var pattern = _.find(patterns, {id: id});
		clearTimeout( pattern.timer );
	},

	getPlayingPattern: function() {
		return playingPattern;
	}
};

module.exports = PatternsApi;
