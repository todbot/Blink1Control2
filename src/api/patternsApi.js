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
/*	for( var i = 0; i < pattparts[0]; i++ ) { //[0] is len
		var color = { rgb: pattparts[ (i * 3) + 1 ],
					time: Number(pattparts[ (i * 3) + 2]),
					ledn: Number(pattparts[ (i * 3) + 3]) };
		colorlist.push( color );
    }*/
    return colorlist;
};
var _fixup = function(pattern) {
	pattern = _fixId(pattern);
	if( pattern.patternstr ) {
		pattern.colors = _parsePatternStr(pattern.patternstr);
	}
	pattern.repeats = Math.floor((Math.random() * 8) + 0);  // FIXME: TESTING HACK
	return pattern;
};
var _toString = function(pattern) {
	return "_toStr not implemented yet";
};

var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var patterns = systemPatterns.map( _fixup );
//console.log("patterns:", JSON.stringify(patterns, null, ' '));

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
		console.log('Pretend this just saved the pattern to the DB via AJAX call...');
		
		if (pattern.id) {
			var existingPatternIndex = _.indexOf(patterns, _.find(patterns, {id: pattern.id})); 
			patterns.splice(existingPatternIndex, 1, pattern);
		} else {
			//Just simulating creation here.
			//The server would generate ids for new authors in a real app.
			//Cloning so copy returned is passed by value rather than by reference.
			pattern.id = _generateId(pattern);
			pattern.push(pattern);
		}

		return _clone(pattern);
	},

	deletePattern: function(id) {
		console.log('Pretend this just deleted the author from the DB via an AJAX call...');
		_.remove(patterns, { id: id});
	}
};

module.exports = PatternsApi;