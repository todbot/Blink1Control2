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

var { ImapFlow } = require('imapflow');

var conf = require('../configuration');
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
        this.searchers.forEach( function(searcher) {
            searcher.stop();
        });
        this.searchers = [];
    },
    reloadConfig: function() {
        this.stop();
        this.start();
    },
    // One-shot connection test. config must have host, port, useSSL, username, password (plaintext).
    // Calls callback(errorString, outputString).
    testConnection: function(config, callback) {
        var client = new ImapFlow({
            host:              config.host,
            port:              config.port,
            secure:            config.useSSL,
            auth:              { user: config.username, pass: config.password },
            logger:            false,
            connectionTimeout: 15000,
            tls:               { rejectUnauthorized: false },
        });
        client.connect().then(function() {
            return client.getMailboxLock('INBOX').then(function(lock) {
                var exists = client.mailbox ? client.mailbox.exists : '?';
                lock.release();
                return client.logout().catch(function() { client.close(); }).then(function() {
                    callback(null, 'Connected! INBOX has ' + exists + ' messages.');
                });
            });
        }).catch(function(err) {
            var msg = err.responseText || err.message || String(err);
            if(      msg.indexOf('ENOTFOUND')    !== -1 ) { msg = 'server not found: ' + config.host; }
            else if( msg.indexOf('ETIMEDOUT')    !== -1 ) { msg = 'connection timed out'; }
            else if( msg.indexOf('ECONNREFUSED') !== -1 ) { msg = 'connection refused'; }
            try { client.close(); } catch(e) {}
            callback(msg, null);
        });
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
