/**
 * Fetch results from various types of mail services
 *
 * It needs to do:
 * - Load mail configuration from global config
 * - Run a MailSearcher for each unique user/server pair (could map to multiple rules)
 *
 * - When a new event happens
 * -- log the event
 * -- trigger the pattern (hmm, this means this needs access to PatternsApi)
 * --
 *
 *
 *
 *
 *
 *
 */

"use strict";

var _ = require('lodash');

var config = require('../configuration');

var ImapSearcher = require('./imapSearcher');
// var PopSearcher = require('./popSearcher');

// globals because we are a singleton
var listeners = {};
// var messages = [];

var MailService = {
	searchers: [
	],

	start: function() {
		this.lastTime = new Date(0); // FIXME:
		this.checkMail();
		//this.fetchIfttt();
		//this.intervalTimer = setInterval(this.fetchIfttt.bind(this), this.intervalsecs * 1000);
		// so much this
	},
	stop: function() {
		clearInterval( this.intervalTimer );
		this.searchers.map( function(searcher) {
			searcher.stop();
		});
	},
	//
	// updateRules: function(callback) {
	//
	// },
    checkMail: function() {
		var rules = config.readSettings('mailService:rules');
		var self = this;
		if( !rules ) {
			rules = [];
		}
		rules.map( function(rule) {
			if( rule.enabled && rule.mailtype === 'IMAP' ) {
				var searcher = new ImapSearcher( rule, MailService.notifyChange );
				console.log("MailService.checkMail: starting searcher for ",rule.name);
				searcher.start();
				self.searchers.push( searcher );
				// FIXME: merge rules
			}
		});

    },

	// handleMessage: function(messages) {
	//
	// },
	handleResults: function(results) {

	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		// console.log("Blink1Service: addChangelistener", listeners );
	},
	removeChangeListener: function(callername) {
		delete listeners[callername];
		console.log("MailService.removeChangelistener", listeners );
	},
	removeAllListeners: function() {
		_.keys( listeners, function(callername) {
			this.removeChangelistener(callername);
		});
	},
	notifyChange: function(messages) {
		_.forIn( listeners, function(callback) {
			callback( messages );
		});
	},

};

module.exports = MailService;
