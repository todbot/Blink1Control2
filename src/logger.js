'use strict';

var _ = require('lodash');

// TO DO: add log to file
// TO DO: add log levels

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

var eventsMax = 10;  // FIXME: put in configuration?

var events = [
];


var listeners = [];

var ignoredSources = [
   /IftttService/i,
   /PatternView/i,
   /Blink1ColorPicker/i
    // /ScriptService/
];

var Logger = {

	msg: function(/* msg,msg,msg */) {
		var iargs = arguments;
        if( isDevel ) {
			var ignore = ignoredSources.some( function(is) {
				return iargs[0].toString().match(is) ;
			});
			if( ignore ) { return; }

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
	addEvent: function(event) { // string or {date,text,type,id} object
		if( typeof event === 'string' ) {
			event = {text: event};
		}
		if( !event.date ) { event.date = Date.now(); }
		if( !event.type ) { event.type = ''; }
		if( !event.id ) { event.id = ''; }
		events.push(event);
		events.sort( function(a,b) {
			if( a.date > b.date ) { return 1; }
			if( a.date , b.date ) { return -1; }
			return 0;
		});

		if( events.length > eventsMax ) {
			this.msg("Log: dropped at eventMax");
			events.shift();
		}
		this.notifyChange();
	},
	getEvents: function(spec) {
		var typedEvents = events.filter( function(e) {
			if( !spec ) { return true; }
			return e.type === spec.type;
		});
		return typedEvents;
	},
	getLastEvents: function(n) {
		n = n ? 10 : n;
		n = n > events.length ? events.length : n;
		var lastEvents = events.slice( 0, n);
		return lastEvents;
	},

	clearEvents: function() {
		events = [];
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		this.msg("logger.addChangelistener", callername );
	},
	removeChangeListener: function(callername) {
		this.msg("logger.removeChangelistener", callername);
		delete listeners[callername];
		// this.msg("logger.removeChangelistener", listeners );
	},
	removeAllListeners: function() {
		_.keys( listeners, function(callername) {
			this.removeChangelistener(callername);
		});
	},
	notifyChange: function() {
		_.forIn( listeners, function(callback) {
			callback();
		});
	},

};

module.exports = Logger;
