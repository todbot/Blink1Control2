
"use strict";

var Skyweb = require('skyweb');

var utils = require('../utils');
var conf = require('../configuration');
var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');


var SkypeService = {
    skyweb: null,
    config: {},

    reloadConfig: function() {
        this.stop();
        this.start();
    },

    stop: function() {
        this.skyweb = null;
    },
    start: function() {
        var self = this;
        var config = conf.readSettings('eventServices:skypeService');
        if( !config ) { config = { enabled: false, rules:[] }; }
        self.config = config;
        if( !config.enabled ) {
            log.msg("SkypeService: disabled");
            return;
        }

        var allrules = conf.readSettings('eventRules') || [];
        self.rules = allrules.filter( function(r){return r.type==='skype';} );
        log.msg("SkypeService.start. rules=", self.rules);

        var rule = self.rules[0]; // FIXME:
        if( !rule ) {
            return;
        }
        if( !rule.enabled ) {
            return;
        }
        var pass = '';
        try {
            pass = utils.decrypt( self.config.passwordHash );
        } catch(err) {
            log.msg('SkypeService: bad password for rule',rule.name);
            return;
        }

        // var skyweb = new Skyweb();
        var skyweb = new Skyweb.default();
        self.skyweb = skyweb;

        self.success= false;
        Eventer.addStatus( {type:'info', source:'skype', id:rule.name, text:'connecting...'});

        var errorCount=0;
        const errorListener = (eventName, error) => {
            log.msg(`SkypeService: ${errorCount} : Error occured : ${error}`);
            errorCount++;
            if (errorCount === 10) {
                log.msg(`SkypeService: removing error listener`);
                skyweb.un('error', errorListener); // Removing error listener
            }
        };
        skyweb.on('error', errorListener); //Adding error listener

        skyweb.login(rule.username, pass).then((skypeAccount) => {
            self.success = true;
            log.msg('SkypeService is initialized now!');
            // log.msg('Here is some info about you:' + JSON.stringify(skypeAccount.selfInfo, null, 2));
            Eventer.addStatus( {type:'info', source:'skype', id:rule.name, text:'connected'});
            // console.log('Your contacts : ' + JSON.stringify(skyweb.contactsService.contacts, null, 2));
        });

        // super hacky way to see if Skyweb succeeeded because it sucks at error handling
        setTimeout( function() {
            // check to see if we're okay or not
            if( !self.success ) {
                Eventer.addStatus( {type:'error', source:'skype', id:rule.name, text:'login error (timeout)'});
            }
        }, 15000 );

        // FIXME: is this callback required?
        // No, it automatically accepts contact add requests
        // skyweb.authRequestCallback = (requests) => {
        //     requests.forEach((request) => {
        //         skyweb.acceptAuthRequest(request.sender);
        //         skyweb.sendMessage("8:" + request.sender, "I accepted you!");
        //     });
        // };
        skyweb.messagesCallback = (messages) => {
            messages.forEach((message)=> {
                var convlink = message.resource.conversationLink;
                var cname = convlink.substring(convlink.lastIndexOf('/8:')+3);
                log.msg("SkypeService msg type:",message.resource.messagetype, "trigger:",rule.triggerType, "cname:",cname,
                        "dispname:",message.resource.imdisplayname, "content:",message.resource.content, message);
                if( rule.triggerType === 'text' || rule.triggerType === 'any' ) {
                    if( message.resource.messagetype === 'Text' ||
                        message.resource.messagetype === 'RichText' ) {
                            log.msg("SkypeService: INCOMING TEXT FROM",cname);
                        Eventer.addStatus( {type:'trigger', source:'skype', id:rule.name, text:'text: '+cname});
                        PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                    }
                }
                if( rule.triggerType === 'call' || rule.triggerType === 'any' ) {
                    if( message.resource.messagetype === 'Event/Call' &&
                        message.resource.content.includes('started') ) {
                        log.msg("SkypeService: INCOMING CALL FROM",cname);
                        Eventer.addStatus( {type:'trigger', source:'skype', id:rule.name, text:'call: '+cname});
                        // Eventer.addStatus( 'Skype call: '+cname);
                        PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                    }
                }
                // also: message.resource.messagetype == 'Text'
                // also: message.resource.messagetype == 'Event/Call'
                // if (message.resource.from.indexOf(username) === -1 &&
                //     message.resource.messagetype !== 'Control/Typing' &&
                //     message.resource.messagetype !== 'Control/ClearTyping') {
                //     var conversationLink = message.resource.conversationLink;
                //     var conversationId = conversationLink.substring(conversationLink.lastIndexOf('/') + 1);
                //     skyweb.sendMessage(conversationId, message.resource.content + '. Cats will rule the World');
                // }
            });
        };

    }
};

module.exports = SkypeService;
