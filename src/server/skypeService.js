
"use strict";

var Skyweb = require('skyweb');

var conf = require('../configuration');
var log = require('../logger');
var PatternsService = require('./patternsService');

var SkypeService = {
	skyweb: null,
    config: {},
	// init: function() { // FIXME: bad name
	// 	// config.saveSettings("apiServer:port",8934);
	// 	// config.saveSettings("apiServer:enabled", false);
	// 	// config.saveSettings("apiServer:host", 'localhost');
	// },

	start: function() {
        var self = this;
        var config = conf.readSettings('skypeService');
        if( !config ) { config = { enabled: false, rules:[] }; }
        if( !config.enabled ) {
            log.msg("SkypeService: disabled");
            return;
        }
        var rule = config.rules[0];
        // if( !rule.triggerType) { config.triggerType = 'any'; }

        log.msg("SkypeService.start");

        var skyweb = new Skyweb();
        self.skyweb = skyweb;
        self.config = config;

        skyweb.login(rule.username, rule.password).then((skypeAccount) => {
            console.log('Skyweb is initialized now');
            console.log('Here is some info about you:' + JSON.stringify(skypeAccount.selfInfo, null, 2));
            // console.log('Your contacts : ' + JSON.stringify(skyweb.contactsService.contacts, null, 2));
        });
        skyweb.authRequestCallback = (requests) => {
            requests.forEach((request) => {
                skyweb.acceptAuthRequest(request.sender);
                skyweb.sendMessage("8:" + request.sender, "I accepted you!");
            });
        };
        skyweb.messagesCallback = (messages) => {
            messages.forEach((message)=> {
                var convlink = message.resource.conversationLink;
                var cname = convlink.substring(convlink.lastIndexOf('/8:')+3);
                log.msg("SkypeService msg type:",message.resource.messagetype, "cname:",cname,
                "dispname:",message.resource.imdisplayname, "content:",message.resource.content, message);
                if( rule.triggerType === 'text' || rule.triggerType === 'any' ) {
                    if( message.resource.messagetype === 'Text' ) {
                        log.msg("SkypeService: INCOMING TEXT FROM",cname);
                        log.addEvent( 'Skype text: '+cname);
                        PatternsService.playPattern( rule.patternId );
                    }
                }
                if( rule.triggerType === 'call' || rule.triggerType === 'any' ) {
                    if( message.resource.messagetype === 'Event/Call' &&
                        message.resource.content.includes('started') ) {
                        log.msg("SkypeService: INCOMING CALL FROM",cname);
                        log.addEvent( 'Skype call: '+cname);
                        PatternsService.playPattern( rule.patternId );
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
