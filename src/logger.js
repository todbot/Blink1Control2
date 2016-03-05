'use strict';

// var _  = require('lodash');

var isDevel = false;

if( process.browser === true ) { // is in renderer process
	var remote = window.require('remote');
	var processserver = remote.require('process');
	isDevel = (processserver.env.NODE_ENV === 'development');
	console.log("process.env.NODE_ENV",processserver.env.NODE_ENV);
}
else {
	isDevel = (process.env.NODE_ENV === 'development');
}

// TO DO: add log to file
// TO DO: add log levels

// console.log("logger: isDevel",isDevel);
// var events = [];
var events = [
	{ date: Date.now()-400000000, text: "this other thing happened"},
	{ date: Date.now()-40000000, text: "this other thing happened"},
	{ date: Date.now()-4000000, text: "this other thing happened"},
	{ date: Date.now()-400000, text: "this 3.1 happened"},
	{ date: Date.now()-200000, text: "this 3  happened"},
	{ date: Date.now()-1, text: "this 2 happened"},
	{ date: Date.now(), text: "this happened"}
];

var Logger = {

	msg: function(/* msg,msg,msg */) {
        if( isDevel ) {
			var args = Array.prototype.slice.call(arguments);
			args.unshift( Math.floor(new Date().getTime()/1000) + ':');
            console.log.apply(console, args );
        }
        else {
            // do nothing, but later, log to file?
        }
		// FIXME: log to file?
	},
	warn: function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift( Math.floor(new Date().getTime()/1000) + ':');
		console.warn.apply(console, args);
		// FIXME: log to file?
	},
	error: function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift( Math.floor(new Date().getTime()/1000) + ':');
		console.error.apply(console, args);
		// FIXME: log to file?
	},
	addEvent: function(event) { // string or {date,text} object
		if( typeof event === 'string' ) {
			event = {date: Date.now(), text: event};
		}
		if( !event.date ) { event.date = Date.now(); }
		events.unshift(event);
	},
	getLastEvents: function(n) {
		n = n ? 10 : n;
		n = n > events.length ? events.length : n;
		var lastEvents = events.slice( 0, n);
		// this.msg("Log.getLastEvents",lastEvents);
		return lastEvents;
	}
};

module.exports = Logger;
