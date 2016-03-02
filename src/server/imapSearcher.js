"use strict";

// var _ = require('lodash');

var Imap = require('imap');
var log = require('../logger');

var PatternsService = require('./patternsService');

var makeMessage = function(id, type, message ) {
    return [{id:id, type:type, message: message}] ;
};


function ImapSearcher(config,callback) {
    var self = this;
    self.callback = callback;
    self.id = config.id;
    self.host = config.host;
    self.port = config.port;
    self.useSSL = config.useSSL;
    self.username = config.username;
    self.password = config.password;
    // FIXME: this should be an array of rules, maybe:
    // [ { name:'bob', triggerType:'unread', triggerVal:1 },
    //   { name:'george', triggerType:'subject', triggerVal:'fred'}]
    self.triggerType = config.triggerType; //
    self.triggerVal = config.triggerVal; // FIXME
    self.patternId = config.patternId;
    self.patternOffId = config.patternOffId;
    self.startdate = Date.now();
    self.lastSeenId = 0; // FIXME: notused
    self.lastResults = [];

    self.imap = new Imap({
        user: self.username,
        password: self.password,
        host: self.host,
        port: self.port,
        tls: self.useSSL,
        tlsOptions: { rejectUnauthorized:false }, // allows connect to dreamhost-like SSL setups
        keepalive: { interval: 5000 },
        debug: function(msg) {
            self.callback( makeMessage(self.id, 'info', Math.floor(Date.now()/1000)+'') );
            log.msg("ImapSearcher debug:",Math.floor(Date.now()/1000),":",msg);
        }
    });

    self.imap.on('error', function(err) {
        self.callback( makeMessage(self.id, 'info', err.message) );
        log.msg("ImapSearcher error", err.message, err);
        self.stop();
        self.timer = setTimeout(function() {
            log.msg("ImapSearcher: timer restart");
            self.start(); // restart
        }, 5 * 1000); // FIXME: adjustable?
    });

    self.imap.on('end', function() {
        log.msg('ImapSearcher: connection ended');
        clearTimeout( self.timer );
        self.imap.end();
    });

    self.imap.on('ready', function() {
    // self.imap.once('ready', function() {
        self.imap.openBox('INBOX', true, function(err,box) {
            if (err) {
                log.msg("ImapSearcher: openBox error",err);
                self.callback({id:self.id, type:'info', message:err.message}); // FIXME
                throw err;
            }
            log.msg('ImapSearcher: box', box);
            self.imap.on('update', function( seqno, info) {
                log.msg("ImapSearcher. update:", seqno, info);

            });
            self.imap.on('expunge', function( seqno ) {
                log.msg("ImapSearcher. expunge:", seqno);
                self.searchMail();
            });
            self.imap.on('mail', function( ) { // on new mail
                log.msg("ImapSearcher: onmail:", self.triggerType);
                self.searchMail();
            }); // on mail
        }); // openbox
    }); // ready

}

/// called from an open imap
ImapSearcher.prototype.searchMail = function() {
    var self = this;
    if( self.triggerType === 'subject' ) {
        self.imap.search( ['UNSEEN',  ['SUBJECT',[self.triggerVal]]], function(err, results) {
            if (err) {
                log.msg("ImapSearcher: search error",err);
                throw err;
            }
            log.msg("ImapSearcher: search results:", results, "last:",self.lastResults);
            // we have search results and bigger than last time
            if( results.length > 0 ) {
                if( results.length > self.lastResults.length ) {
                    PatternsService.playPattern( self.patternId );
                } // else do nothing
            }
            else { // zero results
                if( self.patternOffId  && self.lastResults.length > 0 ) {
                    PatternsService.playPattern( self.patternOffId );
                }
            }
            self.lastResults = results;
        }); // search
    }
    else if( self.triggerType === 'sender' ) {

    }
    else if( self.triggerType === 'unread' ) {

    }

};

ImapSearcher.prototype.start = function() {
    log.msg("ImapSearcher starting");
    this.imap.connect();
};

ImapSearcher.prototype.stop = function() {
    this.imap.end();
};


module.exports = ImapSearcher;



// ImapSearcher.prototype.search = function( type, searchstr, callback ) {
//     // function openInbox(cb) {
//     //     this.imap.openBox('INBOX', true, cb);
//     // }
//     var sincedate = self.startdate;
//     log.msg("imapsearcher.search: ", type, searchstr, sincedate.dateString);
//
//     // FIXME: don't keep adding this event listener
//
//     self.imap.connect();
//
// };
//
// ImapSearcher.prototype.doSearch = function( ) {
//     var self = this;
//     //   self.imap.search([ 'UNSEEN', ['SINCE', 'Sep 1, 2015'] ], function(err, results) {
//     //   self.imap.search([ 'UNSEEN', ['SINCE', 'Sep 1, 2015'], ['SUBJECT',[searchstr] ]], function(err, results) {
//         self.imap.search( ['UNSEEN',  ['SUBJECT',[searchstr]]], function(err, results) {
//             if (err) { throw err; }
//             var newmsgcount = _.reduce( results,
//                 function(msgcount,id) {
//                     if( id > self.lastSeenId ) { msgcount++; } return msgcount;
//                 }, 0);
//             log.msg("old lastId:",self.lastSeenId, "newmsgs:",newmsgcount," results:",results);
//
//             self.lastSeenId = _.last(results);
//             return callback(results);
//
// });
//
// ImapSearcher.prototype.searchWatch = function( type, searchstr, callback ) {
//     var self = this;
//     self.search( type, searchstr, callback );
//     if( self.timer ) { clearInterval(self.timer); }
//     self.timer = setInterval(function() {
//         self.search( type, searchstr, callback );
//     }, 5 * 1000);
// };
