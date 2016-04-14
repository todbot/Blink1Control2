"use strict";

var _ = require('lodash');

var Imap = require('imap');
var simplecrypt = require('simplecrypt');

var log = require('../logger');

var retrySecs = 30;

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control'});

var makeMessage = function(id, type, message ) {
    return [{id:id, type:type, message: message}] ;
};

function ImapSearcher(config, callback) {
    var self = this;
    var pass = '';
    try {
        pass = sc.decrypt( config.password );
    } catch(err) {
        log.msg('ImapSearcher: bad password');
    }

    self.callback = callback;
    self.enabled = config.enabled || true;
    self.id = config.name;  // FIXME: potential collision here
    self.host = config.host;
    self.port = config.port;
    self.useSSL = config.useSSL;
    self.username = config.username;
    self.password = pass;
    // FIXME: this could be an array of rules, maybe:
    // [ { name:'bob', triggerType:'unread', triggerVal:1 },
    //   { name:'george', triggerType:'subject', triggerVal:'fred'}]
    self.triggerType = config.triggerType; //
    self.triggerVal = config.triggerVal; // FIXME
    self.triggerOff = config.triggerOff;
    self.patternId = config.patternId;
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
            // self.callback( makeMessage(self.id, 'info', Math.floor(Date.now()/1000)+'') );
            log.msg("ImapSearcher.debug:",Math.floor(Date.now()/1000),":",msg);
        }
    });

    self.imap.on('error', function(err) {
        var msg = err.message;
        if(      msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'server not found'; }
        else if( msg.indexOf('ETIMEDOUT') !== -1 ) { msg = 'server timeout'; }
        // else if( msg)
        self.callback( makeMessage(self.id, 'error', msg) );
        log.msg("ImapSearcher error:'"+ err.message+"'", err);
        // self.stop();
        self.timer = setTimeout(function() {
            log.msg("ImapSearcher: timer restart");
            self.start(); // restart
        }, retrySecs * 1000); // FIXME: adjustable?
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
                log.msg("ImapSearcher.openBox error",err);
                self.callback({id:self.id, type:'error', message:err.message}); // FIXME
                throw err;
            }
            self.lastMsgId = box.uidnext;
            self.lastResults = [box.uidnext]; // hmmm
            log.msg('ImapSearcher: lastMsgId:',box.uidnext,' box', box);
            // self.callback( makeMessage( self.id, 'info', 'connected') ); // FIXME
            self.searchMail();

            self.imap.on('update', function( seqno, info) {
                log.msg("ImapSearcher.onupdate:", seqno, info.flags, info);
                if( info.flags[0] === "\\Seen" ) {
                    _.remove( self.lastResults, seqno );
                    log.msg("ImapSearcher.update SEEEN, lastResults:",self.lastResults);
                }
            });
            self.imap.on('expunge', function( seqno ) {
                log.msg("ImapSearcher.onexpunge:", seqno);
                self.searchMail();
            });
            self.imap.on('mail', function(numnewmsgs ) { // on new mail
                log.msg("ImapSearcher.onmail:", self.triggerType, numnewmsgs);
                self.searchMail(numnewmsgs);
            }); // on mail
        }); // openbox
    }); // ready

}

/// called from an open imap
ImapSearcher.prototype.searchMail = function(arg) {
    var self = this;
    if( self.triggerType === 'subject' ) {
        self.imap.search( ['UNSEEN',  ['SUBJECT',[self.triggerVal]]], function(err, results) {
            if (err) {
                log.msg("ImapSearcher: search error",err);
                throw err;
            }
            log.msg("ImapSearcher: search results:", results, "last:",self.lastResults);

            if( results.length > 0 ) { // we have search results
                // count those w/ higher msg id than last time
                var lastMax = _.max(self.lastResults);
                var newMax  = _.max(results);
                if( newMax > lastMax ) {
                // if( results.length > self.lastResults.length ) {
                    // PatternsService.playPattern( self.patternId );
                    self.callback( makeMessage( self.id, 'result', self.triggerVal) );
                }
            }
            else { // zero results
                if( self.triggerOff && self.lastResults.length > 0 ) {
                    // PatternsService.stopPattern( self.patternId );
                    self.callback( makeMessage( self.id, 'off', self.triggerVal) );
                }
            }
            self.lastResults = _.union(self.lastResults, results).sort();
            log.msg("ImapSearcher: search lastResults:", self.lastResults);
        }); // search
    }
    else if( self.triggerType === 'sender' ) {

    }
    else if( self.triggerType === 'unread' ) {
        if( arg > 0 ) {  // arg is numnewmsgs
            self.callback( makeMessage( self.id, 'result', arg + ' unread msgs'));
        }

    }

};

ImapSearcher.prototype.start = function() {
    log.msg("ImapSearcher starting");
    this.imap.connect();
};

ImapSearcher.prototype.stop = function() {
    this.imap.end();
    // clearTimeout( this.timer );
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
