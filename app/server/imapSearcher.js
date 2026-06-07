//
// Called from mailService
//
//

"use strict";

var { ImapFlow } = require('imapflow');
var utils = require('../utils');
var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');

var retrySecs = 30;
var searchDelaySecs = 2;


function ImapSearcher(config) {
    var self = this;
    self.config = config;
    self._stopping = false;
    self.client = null;
    self.timer = null;
    self.searchtimer = null;
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
ImapSearcher.prototype.searchMailDo = async function() {
    log.msg("ImapSearcher.searchMailDo");
    var self = this;

    if( !self.client ) {
        log.msg("ImapSearcher.searchMailDo: no client"); return;
    }

    // All criteria scoped to UIDs >= startUid — only messages that arrived
    // after we connected. The server does the filtering, not JS.
    var uidRange = self.startUid + ':*';
    var searchCriteria;
    if( self.triggerType === 'subject' ) {
        searchCriteria = { subject: self.triggerVal, uid: uidRange };
    }
    else if( self.triggerType === 'sender' ) {
        searchCriteria = { from: self.triggerVal, uid: uidRange };
    }
    else { // 'unread': new unseen messages since connect
        searchCriteria = { seen: false, uid: uidRange };
    }

    try {
        var results = await self.client.search(searchCriteria, { uid: true });

        // Belt-and-suspenders: the server-side UID range "startUid:*" can wrap when
        // no new messages exist yet (RFC 3501 reverses "320:319" to "319:320"),
        // causing the last existing message to match spuriously. Filter client-side too.
        results = results.filter( function(uid) { return uid >= self.startUid; } );

        log.msg("ImapSearcher.searchMailDo: criteria:", searchCriteria,
                "results:", results, "pattId:", self.patternId);

        var matchstr = (results.length === 1) ? "msg matches" : "msgs match";

        if( results.length > 0 && results.length >= self.triggerCount ) {
            if( !self.triggered ) {
                self.triggered = true;
                PatternsService.playPatternFrom( self.id, self.patternId, self.blink1Id );
            }
            Eventer.addStatus( {type:'trigger', source:'mail', id:self.id,
                                text: ''+results.length+' '+matchstr} );
        }
        else {
            if( self.triggerOff && self.triggered ) {
                Eventer.addStatus( {type:'triggerOff', source:'mail', text:'off', id:self.id} );
                PatternsService.stopPatternFrom( self.id, self.patternId, self.blink1Id, true );
            }
            self.triggered = false;
            Eventer.addStatus( {type:'info', source:'mail', id:self.id,
                                text: ''+results.length+' '+matchstr} );
        }
    } catch(err) {
        log.msg("ImapSearcher.searchMailDo error:", err.message,
                "code:", err.code, "responseText:", err.responseText,
                "serverResponseCode:", err.serverResponseCode);
        Eventer.addStatus( {type:'error', source:'mail', id:self.id,
                            text: 'search error: '+(err.responseText||err.message)} );
    }
};

ImapSearcher.prototype.start = async function() {
    log.msg("ImapSearcher starting");
    var self = this;
    self._stopping = false;

    var pass = '';
    try {
        if( self.config.passwordHash ) {
            pass = utils.decrypt( self.config.passwordHash );
        }
    } catch(err) {
        log.msg('ImapSearcher: bad password');
    }

    self.id           = self.config.name;
    self.host         = self.config.host;
    self.port         = self.config.port;
    self.useSSL       = self.config.useSSL;
    self.username     = self.config.username;
    self.password     = pass;
    self.triggerType  = self.config.triggerType;
    self.triggerVal   = self.config.triggerVal;
    // For 'unread', triggerVal is the count threshold (e.g. 2 means ">=2 unread").
    // For 'subject'/'sender', triggerVal is the search string and threshold is always 1.
    self.triggerCount = (self.triggerType === 'unread') ? (Number(self.triggerVal) || 1) : 1;
    self.triggerOff   = self.config.triggerOff;
    self.patternId    = self.config.patternId;
    self.blink1Id     = self.config.blink1Id;
    self.triggered    = false;

    self.client = new ImapFlow({
        host:          self.host,
        port:          self.port,
        secure:        self.useSSL,
        auth:          { user: self.username, pass: self.password },
        logger:        false,
        socketTimeout: 0,   // disable — default 90s causes timeout during quiet IDLE periods
        tls:           { rejectUnauthorized: false }, // allows connect to dreamhost-like SSL setups
    });

    self.client.on('error', function(err) {
        var msg = err.message;
        if(      msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'server not found'; }
        else if( msg.indexOf('ETIMEDOUT') !== -1 ) { msg = 'server timeout'; }
        Eventer.addStatus( {type:'error', source:'mail', id:self.id, text:msg} );
        log.msg("ImapSearcher error:", err.message);
    });

    try {
        log.msg("ImapSearcher: connecting to", self.host, self.port);
        await self.client.connect();
        Eventer.addStatus( {type:'info', source:'mail', id:self.id, text:'connected'} );

        // Set up mailbox change listeners before entering IDLE.
        // When these fire, acquiring a lock internally sends DONE to break IDLE,
        // runs the search, then the while loop below re-enters IDLE.
        async function onMailboxChange(event) {
            log.msg("ImapSearcher: mailbox change event:", event);
            if( self._stopping ) { return; }
            var lock = await self.client.getMailboxLock('INBOX');
            try {
                await self.searchMailDo();
            } finally {
                lock.release();
            }
        }
        self.client.on('exists',  onMailboxChange);
        self.client.on('expunge', onMailboxChange);
        self.client.on('flags',   onMailboxChange);

        // Initial search
        var lock = await self.client.getMailboxLock('INBOX');
        try {
            self.startUid = self.client.mailbox.uidNext;
            log.msg('ImapSearcher: startUid:', self.startUid);
            await self.searchMailDo();
        } finally {
            lock.release();
        }

        // IDLE loop: keeps connection alive.
        // Broken automatically when event listeners acquire a lock above.
        while( !self._stopping ) {
            log.msg("ImapSearcher: entering idle");
            await self.client.idle();
            log.msg("ImapSearcher: idle returned");
        }
    } catch(err) {
        // Log full error detail to help diagnose "command failed" and similar
        log.msg("ImapSearcher: caught error:", err.message,
                "code:", err.code,
                "responseText:", err.responseText,
                "response:", err.response,
                "serverResponseCode:", err.serverResponseCode);
        if( !self._stopping ) {
            var msg = err.responseText || err.message || String(err);
            if( msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'server not found'; }
            else if( msg.indexOf('ETIMEDOUT') !== -1 ) { msg = 'server timeout'; }
            Eventer.addStatus( {type:'error', source:'mail', id:self.id, text:msg} );
            log.msg("ImapSearcher: retrying in", retrySecs, "s");
            self.timer = setTimeout( function() {
                log.msg("ImapSearcher: timer restart");
                self.start();
            }, retrySecs * 1000);
        }
    }
};

ImapSearcher.prototype.stop = function() {
    log.msg("ImapSearcher.stop");
    var self = this;
    self._stopping = true;
    clearTimeout( self.timer );
    self.timer = null;
    if( self.searchtimer ) {
        clearTimeout( self.searchtimer );
        self.searchtimer = null;
    }
    if( self.client ) {
        self.client.logout().catch(function() { self.client.close(); });
        self.client = null;
    }
};


module.exports = ImapSearcher;
