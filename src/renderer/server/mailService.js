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

var conf = require('common/blink1control2config');
var log = require('../logger');

var ImapSearcher = require('./imapSearcher');
// var PopSearcher = require('./popSearcher');
// var PatternsService = require('./patternsService');

// globals because we are a singleton
// var listeners = {};

var MailService = {
    config: {},
    rules: [],
    searchers: [],

    start: function() {
        log.msg("MailService.start");
        this.setupSearchers();
    },
    stop: function() {
        this.searchers.map( function(searcher) {
            searcher.stop();
        });
    },
    reloadConfig: function() {
        this.stop();
        this.start();
    },
    setupSearchers: function() {
        var self = this;
        self.config = conf.readSettings('eventServices:mailService');
        if( self.config.enable === false ) { return; }
        var allrules = conf.readSettings('eventRules') || [];
        self.rules = allrules.filter( function(r){return r.type==='mail';} );
        log.msg("MailService.checkMail. rules=", self.rules);
        if( !self.rules ) {
            self.rules = [];
        }
        self.searchers = []; // FIXME: hmmm
        self.rules.map( function(rule) {
            if( rule.enabled && (rule.mailtype === 'IMAP' || rule.mailtype === 'GMAIL') ) {
                var searcher = new ImapSearcher( rule ); //, self.handleResults.bind(self) );
                log.msg("MailService.checkMail: starting searcher for ",rule.name, "current searchers:",self.searchers);
                searcher.start();
                self.searchers.push( searcher );
                // FIXME: merge rules for same mail server?43
            }
        });

    }

};

module.exports = MailService;
