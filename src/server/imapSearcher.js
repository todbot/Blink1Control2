"use strict";

var Imap = require('imap');


function ImapSearcher(config) {
    var self = this;
    self.host = config.host;
    self.port = config.port;
    self.useSSL = config.useSSL;
    self.username = config.username;
    self.password = config.username;
    self.searchstr = config.searchstr;
    self.startdate = Date.now();
    self.lastSeenId = 0;

    self.imap = new Imap({
        user: self.username, //'todtest@afklab.com',
        password: self.password, //'6VgJnSMU',
        host: self.host, //'mail.afklab.com',
        port: self.port, //993,
        tls: self.useSSL, //true,
        tlsOptions: { rejectUnauthorized:false },
        keepalive: { interval: 5000 },
        debug: function(msg) {
            console.log("ImapSearcher debug:",Math.floor(Date.now()/1000),":",msg);
        }
    });

    self.imap.on('error', function(err) {
        console.log("ImapSearcher error",err);
        self.stop();
        self.timer = setTimeout(function() {
            console.log("ImapSearcher: timer restart");
            self.start(); // restart
        }, 5 * 1000);
    });

    self.imap.on('end', function() {
        console.log('ImapSearcher: connection ended');
        self.imap.end();
    });

    self.imap.on('ready', function() {
    // self.imap.once('ready', function() {
        self.imap.openBox('INBOX', true, function(err,box) {
            if (err) {
                console.log("ImapSearcher: openBox error",err);
                throw err;
            }
            console.log('box', box);
            self.imap.on('mail', function( ) { // on new mail
                self.imap.search( ['UNSEEN',  ['SUBJECT',[self.searchstr]]], function(err, results) {
                    if (err) {
                        console.log("ImapSearcher: search error",err);
                        throw err;
                    }
                    console.log("search results:", results);
                    // var newmsgcount = _.reduce( results,
                    //     function(msgcount,id) {
                    //         if( id > self.lastSeenId ) { msgcount++; } return msgcount;
                    //     }, 0);
                    // console.log("old lastId:",self.lastSeenId, "newmsgs:",newmsgcount," results:",results);
                    // self.lastSeenId = _.last(results);
                    // return callback(results);
                }); // search
            }); // on mail
        }); // openbox
    }); // ready

}

ImapSearcher.prototype.start = function() {
    console.log("ImapSearcher starting");
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
//     console.log("imapsearcher.search: ", type, searchstr, sincedate.dateString);
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
//             console.log("old lastId:",self.lastSeenId, "newmsgs:",newmsgcount," results:",results);
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
