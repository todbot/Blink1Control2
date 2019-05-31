//
// Called from mailService
//
//

"use strict";

var Imap = require('imap');
var simplecrypt = require('simplecrypt');
// var moment = require('moment');

var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');

var retrySecs = 30;
var searchDelaySecs = 2;

// FIXME: use non-deprected (and better) crypto system
var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control', method:"aes-192-ecb"});


function ImapSearcher(config) {
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

/**
 * Actually perform the search. Called from a timer in searchMail()
 * @method
 */
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
    else { // 'unread' and anything else to guard against unknown criteria
        searchCriteria = ['UNSEEN'];
        // searchCriteria = ['UNSEEN', ['SINCE', moment(self.startTime).format('MMMM DD, YYYY')]];
    }
    if( self.imap === null ) {
        log.msg("ImapSearcher.searchMailDo: null imap object"); return;
    }
    // actually do the search
    self.imap.search( searchCriteria,  function(err, res) {
        log.msg("ImapSearcher.searchMailDo: SEARCH criteria:",searchCriteria, "pattId:",self.patternId,"results:",res);
        if (err) {
            Eventer.addStatus( {type:'error', source:'mail', id:self.id, text:'search error '+err });
            throw err;
        }

        // filter out all msgs before lastMsgId
        res = res.filter( (id) => id >= self.lastMsgId );

        var matchstr = (res.length == 1) ? "msg matches" : "msgs match";
        if( res.length > 0 || (res.length >= self.triggerVal) ) {
            if( !self.triggered ) {  //  we've yet been triggered
                self.triggered = true;
                PatternsService.playPatternFrom( self.id, self.patternId, self.blink1Id );
            }
            Eventer.addStatus( {type:'trigger', source:'mail', id:self.id, text:''+res.length+' '+matchstr} );
        }
        else {
            if( self.triggerOff && self.triggered ) {
                Eventer.addStatus( {type:'triggerOff', source:'mail', text:'off', id:self.id} ); // type mail
                PatternsService.stopPatternFrom( self.id, self.patternId, self.blink1Id, true ); // stop pattern *we* started and fade to black
            }
            self.triggered = false;
            // even if we didn't trigger, log new results of search
            Eventer.addStatus( {type:'info', source:'mail', id:self.id, text:''+res.length+' '+matchstr} );
        }
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
    self.blink1Id = self.config.blink1Id;
    // FIXME: the above is brittle. Just use self.config.patternId, etc.

    self.startdate = Date.now();
    // self.lastSeenId = 0; // FIXME: notused
    // self.lastResults = []; // FIXME: notused also, but its being assigned
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

    self.imap.once('error', function(err) {
        var msg = err.message;
        if(      msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'server not found'; }
        else if( msg.indexOf('ETIMEDOUT') !== -1 ) { msg = 'server timeout'; }

        Eventer.addStatus( {type:'error', source:'mail', id:self.id, text:msg } );
        log.msg("ImapSearcher error:'"+ err.message+"'", err);

        self.timer = setTimeout(function() {
            log.msg("ImapSearcher: timer restart");
            self.start(); // restart
        }, retrySecs * 1000); // FIXME: adjustable?
    });

    self.imap.once('close', function() {
        // Eventer.addStatus({type:'error', source:'mail', id:self.id, text:'closed'});
        log.msg('ImapSeracher: connection closed. reopening');
        self.timer = setTimeout(function() {
            log.msg("ImapSearcher: timer restart");
            self.start(); // restart
        }, retrySecs * 1000); // FIXME: adjustable?
    });

    self.imap.once('end', function() {
        log.msg('ImapSearcher: connection ended');
        clearTimeout( self.timer );
        self.imap.end();
    });

    // self.imap.on('ready', function() {
    self.imap.once('ready', function() {
        self.imap.openBox('INBOX', true, function(err,box) {
            if (err) {
                log.msg("ImapSearcher.openBox error",err);
                Eventer.addStatus( {type:'error', source:'mail', id:self.id, text:'inbox '-err.message } );
                throw err;
            }
            self.lastMsgId = box.uidnext;

            log.msg('ImapSearcher: lastMsgId:',box.uidnext,' box', box);
            Eventer.addStatus( {type:'info', source:'mail', id:self.id, text:'connected' } );

            self.searchMail(); // do an initial search

            self.imap.on('mail', function(numnewmsgs ) { // on new mail
                log.msg("ImapSearcher.on-mail:", self.triggerType, numnewmsgs);
                self.searchMail(); //numnewmsgs);
            }); // on mail
            self.imap.on('update', function( seqno, info) {
                log.msg("ImapSearcher.on-update:", seqno, info.flags, info);
                self.searchMail(); // and do a search on any updates
            });
            self.imap.on('expunge', function( seqno ) {
                log.msg("ImapSearcher.on-expunge:", seqno);
                self.searchMail();
            });
        }); // openbox
    }); // ready
    log.msg("ImapSearcher.ready");

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



// RANDOM NOTES FROM THE PAST THAT MAY BE HELPFUL

            // var uncnt = res.length - self.lastResults.length;
            // if( uncnt > 0 ) { // we have search results
            //     log.msg("UNSEEN MORE!");
            //     //self.callback( makeMessage( self.id, 'result', self.triggerVal) );
            //     //Eventer.addStatus( {type:'info', source:'mail', id:self.id, text:''+uncnt+' unseen msgs'} );
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
    //             var lastMax = lodash.max(self.lastResults);
    //             var newMax  = lodash.max(results);
    //             if( newMax > lastMax ) {
    //             // if( results.length > self.lastResults.length ) {
    //                 Eventer.addStatus( {type:'trigger', source:'mail', text:self.triggerVal, id:self.id} );
    //                 PatternsService.playPattern( self.patternId );
    //                 //self.callback( makeMessage( self.id, 'trigger', self.triggerVal) );
    //             }
    //         }
    //         else { // zero results
    //             if( self.triggerOff && self.lastResults.length > 0 ) {
    //                 Eventer.addStatus( {type:'triggerOff', source:'mail', text:'off', id:self.id} ); // type mail
    //                 PatternsService.stopPattern( self.patternId );
    //                 // self.callback( makeMessage( self.id, 'triggerOff', self.triggerVal) );
    //             }
    //         }
    //         self.lastResults = lodash.union(self.lastResults, results).sort();
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
//             var newmsgcount = lodash.reduce( results,
//                 function(msgcount,id) {
//                     if( id > self.lastSeenId ) { msgcount++; } return msgcount;
//                 }, 0);
//             log.msg("old lastId:",self.lastSeenId, "newmsgs:",newmsgcount," results:",results);
//
//             self.lastSeenId = lodash.last(results);
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
