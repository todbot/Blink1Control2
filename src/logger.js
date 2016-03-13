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

var eventsMax = 100;  // FIXME: put in configuration?

// TO DO: add log to file
// TO DO: add log levels

var events = [
];
// [
// 	{ date: Date.now()-800000000, text: "this other thing happened"},
// 	{ date: Date.now()-800000000, text: "this other thing happened"},
// 	{ date: Date.now()-700000000, text: "this other thing happened"},
// 	{ date: Date.now()-600000000, text: "this 3.1 happened", type:'ifttt'},
// 	{ date: Date.now()-500000000, text: "this 3  happened", type:'script'},
// 	{ date: Date.now()-300000000, text: "this 2 happened"},
// 	{ date: Date.now()-200000000, text: "this happened"}
// ];

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
			events.unshift();
		}
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
	}
	// this.msg("Log.getLastEvents",lastEvents);
	// lastEvents = lastEvents.map( function(e) {
	// 	var newe = {text: e.text, date:e.date, type: e.type, id:e.id};
	// 	// newe.text = (e.type) ? e.type + ' - ' + e.text : e.text;
	// 	return newe;
	// });
};

module.exports = Logger;
