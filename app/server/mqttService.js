

'use strict';

var simplecrypt = require('simplecrypt');

var conf = require('../configuration');
var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');

var mqtt = require('mqtt');

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control',method:"aes-192-ecb"});

var MqttService = {
	config: {},
	rules: [],
    timer: null,
    // FIXME: "reloadConfig()" should really be "restartService" or something
    reloadConfig: function() {
        log.msg("MqttService.reloadConfig");
        this.stop();
        this.start();
    },
    start: function() {
        var self = this;

        this.config = conf.readSettings('eventServices:mqttService');
        if( !this.config ) {
            log.msg("MqttService.reloadConfig: NO CONFIG");
            this.config = {
                type: 'mqtt',
                service: 'mqttService',
                enabled: true,
            };
            conf.saveSettings('eventServices:mqttService', this.config);
        }
        // var allrules = conf.readSettings('eventRules') || [];
        var allrules = conf.readSettings('eventRules') || [];
        this.rules = allrules.filter( function(r){return r.type === 'mqtt';} );

        self.rules.forEach( function(rule) {
            log.msg("MqttService.start: rule:", rule);
            // FIXME: impelement sanity checks
            // if( !rule.url ) { }
            // if !rule.topic ) { }
            var config = {
                // there will be more here?
            };
            if( rule.username || rule.password ) {
                config.username = rule.username;
                config.password = rule.password;
            }
            var pass = '';
            try {
              // console.log(JSON.stringify(config,null,2), JSON.stringify(rule,null,2));
                config.password = sc.decrypt( rule.password );
            } catch(err) {
                log.msg('MqttService: bad password for rule',rule.name);
                return;
            }
            // config.password = 'try';

            var client = client  = mqtt.connect( rule.url, config );
            client.on('connect', function () {
                client.subscribe( rule.topic );
            });
            client.on('error', (error) => {
                console.log('MqttService Errored', error);
            });
            client.on('message', function (topic, message) {
                // message is Buffer
                Eventer.addStatus( {type:'trigger', source:'mqtt', id:rule.name, text:message.toString()});
                if( rule.enabled ) {
                    PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                }
                // Eventer.addStatus( {type:'info', source:'mqtt', id:rule.name, text:message.toString()} );
                console.log("rule:"+rule.name+ "topic:", topic, "message:",message.toString())
            });
            rule.client = client;
        });

    },
    stop: function() {
        this.rules.forEach( function(rule) {
            if( rule.client ) {
                rule.client.end();
                rule.client = null;
            }
        });
    }
};

module.exports = MqttService;
