'use strict';

// TO DO: add log to file
// TO DO: add log levels

var _ = require('lodash');

var conf = require('./configuration');

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

// var ignoredSources = [
//    // /IftttService/i,
//    // /PatternView/i,
//    // /PatternList/i,
//    // /Blink1ColorPicker/i
//     // /ScriptService/
// ];

var events = [];
var listeners = [];

var logconfig = conf.readSettings('logger');
if( !logconfig.maxEvents ) {logconfig.maxEvents = 100; }
if( !logconfig.ignoredSources ) { logconfig.ignoredSources = []; }


var Logger = {
	/**
	 * Log a message
	 *
	 * @method function
	 * @return {[type]} [description]
	 */
	msg: function(/* msg,msg,msg */) {
		var iargs = arguments;
        if( logconfig.showDebug ) {
			var ignore = logconfig.ignoredSources.some( function(is) {
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

	// event is format:
	// event = {
	//  date: Date, // time of event as JS Date, if omitted == now
	//  type: 'trigger', 'triggerOff', 'error', 'info'
	//  source: 'ifttt, 'mail', etc. ==  event source 'type'
	//  id: 'red demo'  // event source 'name'
	//  text: 'blah blah'  // text of event
	// }
	// maybe: event.arg == argument for type
	addEvent: function(event) { // string or {date,text,type,id} object
		var log = this;
		// log.msg("Log:"+events.length+":",event, "\nevents:",JSON.stringify(events));
		log.msg("logevent:"+JSON.stringify(event));
		if( typeof event === 'string' ) {
			event = {text: event};
		}
		if( !event.date ) { event.date = Date.now(); }
		if( !event.type ) { event.type = ''; }
		if( !event.id ) { event.id = ''; }

		if( events.length > logconfig.maxEvents ) {
			// "remove first (oldest) element matching kind of event we're just adding"
			// FIXME: surely there's a more concise way of doing this?
			var removeCount = 0;
			var removed = _.remove( events, function(e) {
				if( removeCount===0 ) {
					var isSimilar = ( e.type === event.type && e.type===event.type && e.id===event.id );
					if( isSimilar ) { removeCount++; }
					return isSimilar;
				}
				return false;
			});
			log.msg("Log.addEvent: at maxEvents, new length",events.length, "removed:", removed);
		}

		events.push(event);
		events.sort( function(a,b) {
			if( a.date > b.date ) { return 1; }
			if( a.date , b.date ) { return -1; }
			return 0;
		});

		this.notifyChange();
	},
	// FIXME:
	getEvents: function(spec) {
		var typedEvents = events.filter( function(e) {
			if( !spec ) { return true; }
			return e.type === spec.type;
		});
		return typedEvents;
	},
	getLastEvents: function(n) {
		n = n ? logconfig.maxEvents : n;
		n = n > events.length ? events.length : n;
		var lastEvents = events.slice( 0, n);
		return lastEvents;
	},

	clearEvents: function() {
		events = [];
		this.notifyChange();
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		this.msg("Log.addChangelistener", callername );
	},
	removeChangeListener: function(callername) {
		this.msg("Log.removeChangelistener", callername);
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
