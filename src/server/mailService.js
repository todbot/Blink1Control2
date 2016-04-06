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

var conf = require('../configuration');
var log = require('../logger');

var ImapSearcher = require('./imapSearcher');
// var PopSearcher = require('./popSearcher');
var PatternsService = require('./patternsService');

// globals because we are a singleton
// var listeners = {};

var MailService = {
	config: {},
	rules: [],
	searchers: [],

	start: function() {
		log.msg("MailService.start");
		this.lastTime = new Date(0); // FIXME:
		this.checkMail();
	},
	stop: function() {
		clearInterval( this.intervalTimer );
		this.searchers.map( function(searcher) {
			searcher.stop();
		});
	},
	reloadConfig: function() {
		this.stop();
		this.start();
	},
    checkMail: function() {
		var self = this;
		self.config = conf.readSettings('mailService');
		if( self.config.enable === false ) { return; }
		var allrules = conf.readSettings('eventRules') || [];
		self.rules = allrules.filter( function(r){return r.type==='mail';} );
		log.msg("MailService.checkMail. rules=", self.rules);
		if( !self.rules ) {
			self.rules = [];
		}
		self.rules.map( function(rule) {
			if( rule.enabled && rule.mailtype === 'IMAP' ) {
				// var searcher = new ImapSearcher( rule, MailService.notifyChange );
				var searcher = new ImapSearcher( rule, self.handleResults.bind(self) );
				log.msg("MailService.checkMail: starting searcher for ",rule.name);
				searcher.start();
				self.searchers.push( searcher );
				// FIXME: merge rules for same mail server?43
			}
		});

    },

	// callback for imapSearcher
	// results is array of {id,type,message} objs
	handleResults: function(results) {
		var self = this;
		log.msg("MailService.handleResults:",results, "rules:",self.rules);
		results.map( function(result) {
			self.rules.map( function(rule) {
				if( rule.name === result.id ) {
					log.msg("MailService.handleResults: TRIGGERED:",rule);
					log.addEvent( {date:Date.now(), text:result.message, type:'mail', id:rule.name} );
					if( result.type === 'result' ) { // FIXME
						PatternsService.playPattern( rule.patternId );
					}
				}
			});
		});
	},

	// addChangeListener: function(callback, callername) {
	// 	listeners[callername] = callback;
	// 	// console.log("Blink1Service: addChangelistener", listeners );
	// },
	// removeChangeListener: function(callername) {
	// 	delete listeners[callername];
	// 	console.log("MailService.removeChangelistener", listeners );
	// },
	// removeAllListeners: function() {
	// 	_.keys( listeners, function(callername) {
	// 		this.removeChangelistener(callername);
	// 	});
	// },
	// notifyChange: function(messages) {
	// 	_.forIn( listeners, function(callback) {
	// 		callback( messages );
	// 	});
	// },
	//
};

module.exports = MailService;
