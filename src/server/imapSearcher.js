//
// Called from mailService
//
//

"use strict";

var _ = require('lodash');

var Imap = require('imap');
var simplecrypt = require('simplecrypt');

var log = require('../logger');
var PatternsService = require('./patternsService');

var PatternsService = require('./patternsService');

var retrySecs = 30;
var searchDelaySecs = 2;

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control'});

// var makeMessage = function(id, type, message ) {
//     return [{id:id, type:type, message: message}] ;
// };

function ImapSearcher(config) { //}, callback) {
    var self = this;
    self.config = config;
}

// IMAP updates can come fast and furious when marking several msgs
// So queue up a bit by setting a timer in the future on the first change
ImapSearcher.prototype.searchMail = function() {
    log.msg("ImapSearcher.searchMail");
    var self = this;
    if( self.searchtimer ) { return; }
    self.searchtimer = setTimeout( function() {
        self.searchtimer = null;
        log.msg("ImapSearcher.searchMail: searchtimer");
        self.searchMailDo();
    }, searchDelaySecs * 1000);
};

/// called from an open imap
ImapSearcher.prototype.searchMailDo = function() {
    log.msg("ImapSearcher.searchMailDo");
    var self = this;
    var searchCriteria = [];
    if( self.triggerType === 'subject' ) {
        searchCriteria = [['HEADER', 'SUBJECT',self.triggerVal]];
    }
    else if( self.triggerType === 'sender' ) {
        searchCriteria = [['HEADER', 'FROM', self.triggerVal]];
    }
    else { // just else to guard against unknown criteria
        //if( self.triggerType === 'unread' ) {
        searchCriteria = ['UNSEEN'];
    }
    if( self.imap === null ) {
        log.msg("ImapSearcher.searchMailDo: null imap object"); return;
    }
    self.imap.search( searchCriteria,  function(err, res) {
        log.msg("ImapSearcher.searchMail: criteria=",searchCriteria, ",pattId:",self.patternId,",results:",res);
        if (err) {
            // log.msg("ImapSearcher.searchMail: search error",err);
            log.addEvent( {type:'error', source:'mail', id:self.id, text:'search error '+err });
            throw err;
        }
        if( res.length > 0 || (res.length >= self.triggerVal) ) {
            if( !self.triggered ) {  //  we've yet been triggered
                self.triggered = true;
                PatternsService.playPattern( self.patternId );
            }
            log.addEvent( {type:'trigger', source:'mail', id:self.id, text:''+res.length+' msgs match'} );
        }
        else {
            if( self.triggerOff && self.triggered ) {
                self.triggered = false;
                log.addEvent( {type:'triggerOff', source:'mail', text:'off', id:self.id} ); // type mail
                // PatternsService.stopPattern( self.patternId );
                PatternsService.playPattern("~off");
            }
            // even if we didn't trigger, log new results of search
            log.addEvent( {type:'info', source:'mail', id:self.id, text:''+res.length+' msgs match'} );
        }
        self.lastResults = res; // _.union(self.lastResults, res).sort();
    });
};

ImapSearcher.prototype.start = function() {
    log.msg("ImapSearcher starting");
    var self = this;
    var pass = '';
    try {
        pass = sc.decrypt( self.config.password );
    } catch(err) {
        log.msg('ImapSearcher: bad password');
    }

    // self.callback = callback;
    self.enabled = self.config.enabled || true;
    self.id = self.config.name;  // FIXME: potential collision here
    self.host = self.config.host;
    self.port = self.config.port;
    self.useSSL = self.config.useSSL;
    self.username = self.config.username;
    self.password = pass;
    // FIXME: this could be an array of rules, maybe:
    // [ { name:'bob', triggerType:'unread', triggerVal:1 },
    //   { name:'george', triggerType:'subject', triggerVal:'fred'}]
    self.triggerType = self.config.triggerType; //
    self.triggerVal = self.config.triggerVal; // FIXME
    self.triggerOff = self.config.triggerOff;
    self.patternId = self.config.patternId;
    self.startdate = Date.now();
    self.lastSeenId = 0; // FIXME: notused
    self.lastResults = [];
    self.triggered = false;

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
            // log.msg("ImapSearcher.debug:",Math.floor(Date.now()/1000),":",msg);
        }
    });

    self.imap.on('error', function(err) {
        var msg = err.message;
        if(      msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'server not found'; }
        else if( msg.indexOf('ETIMEDOUT') !== -1 ) { msg = 'server timeout'; }
        // else if( msg)
        // self.callback( makeMessage(self.id, 'error', msg) );
        log.addEvent( {type:'error', source:'mail', id:self.id, text:msg } );
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
                log.addEvent( {type:'error', source:'mail', id:self.id, text:'inbox '-err.message } );
                throw err;
            }
            self.lastMsgId = box.uidnext;
            self.lastResults = []; //[box.uidnext]; // hmmm
            log.msg('ImapSearcher: lastMsgId:',box.uidnext,' box', box);
            log.addEvent( {type:'info', source:'mail', id:self.id, text:'connected' } );
            self.searchMail();

            self.imap.on('update', function( seqno, info) {
                log.msg("ImapSearcher.onupdate:", seqno, info.flags, info);
                // if( info.flags[0] === "\\Seen" ) {
                //     // _.pull( self.lastResults, seqno );
                //     //log.msg("ImapSearcher.update SEEEN, lastResults:",self.lastResults);
                // }
                self.searchMail();
            });
            self.imap.on('expunge', function( seqno ) {
                log.msg("ImapSearcher.onexpunge:", seqno);
                self.searchMail();
            });
            self.imap.on('mail', function(numnewmsgs ) { // on new mail
                log.msg("ImapSearcher.onmail:", self.triggerType, numnewmsgs);
                self.searchMail(); //numnewmsgs);
                log.msg("ImapSearcher.onmail: done");
            }); // on mail
        }); // openbox
    }); // ready

    // and then finally, connect
    self.imap.connect();
};

ImapSearcher.prototype.stop = function() {
    if( this.imap ) {
        this.imap.destroy();
    }
    // this.imap = null;
    // clearTimeout( this.timer );
};


module.exports = ImapSearcher;


            // var uncnt = res.length - self.lastResults.length;
            // if( uncnt > 0 ) { // we have search results
            //     log.msg("UNSEEN MORE!");
            //     //self.callback( makeMessage( self.id, 'result', self.triggerVal) );
            //     // log.addEvent( {type:'info', source:'mail', id:self.id, text:''+uncnt+' unseen msgs'} );
            // }

    //     // self.imap.search( ['UNSEEN',  ['SUBJECT',[self.triggerVal]]], function(err, results) {
    //     self.imap.search( , function(err, results) {
    //         if (err) {
    //             log.msg("ImapSearcher: search error",err);
    //             throw err;
    //         }
    //         log.msg("ImapSearcher: SUBJECT search results:", results, "last:",self.lastResults);
    //
    //         if( results.length > 0 ) { // we have search results
    //             // count those w/ higher msg id than last time
    //             var lastMax = _.max(self.lastResults);
    //             var newMax  = _.max(results);
    //             if( newMax > lastMax ) {
    //             // if( results.length > self.lastResults.length ) {
    //                 log.addEvent( {type:'trigger', source:'mail', text:self.triggerVal, id:self.id} );
    //                 PatternsService.playPattern( self.patternId );
    //                 //self.callback( makeMessage( self.id, 'trigger', self.triggerVal) );
    //             }
    //         }
    //         else { // zero results
    //             if( self.triggerOff && self.lastResults.length > 0 ) {
    //                 log.addEvent( {type:'triggerOff', source:'mail', text:'off', id:self.id} ); // type mail
    //                 PatternsService.stopPattern( self.patternId );
    //                 // self.callback( makeMessage( self.id, 'triggerOff', self.triggerVal) );
    //             }
    //         }
    //         self.lastResults = _.union(self.lastResults, results).sort();
    //         log.msg("ImapSearcher: search lastResults:", self.lastResults);
    //     }); // search
    // }
    // else if( self.triggerType === 'sender' ) {
    //
    // }
    // else if( self.triggerType === 'unread' ) {
    //     // if( arg > 0 ) {  // arg is numnewmsgs
    //     //     self.callback( makeMessage( self.id, 'result', arg + ' unread msgs'));
    //     // }
    //
    // }



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
