

'use strict';

var mqtt = require('mqtt');
var tinycolor = require('tinycolor2');

var conf = require('../configuration');
var utils = require('../utils');
var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');

var MqttService = {
	config: {},
	rules: [],
    clients: {},
    timer: null,
    reloadConfig: function() {
        log.msg("MqttService.reloadConfig");
        var self = this;
        self.stop(function() { self.start(); });
    },
    start: function() {
        var self = this;

        self.config = conf.readSettings('eventServices:mqttService');
        if( !self.config ) {
            log.msg("MqttService.start: NO CONFIG");
            self.config = {
                type: 'mqtt',
                service: 'mqttService',
                enabled: true,
                reconnectPeriod: 10000,
            };
            conf.saveSettings('eventServices:mqttService', self.config);
        }
        self.config.maxStringLength = self.config.maxStringLength || 200;

        var allrules = conf.readSettings('eventRules') || [];
        self.rules = allrules.filter( function(r){ return r.type === 'mqtt' && r.enabled; } );

        self.rules.map( function(rule) {
            log.msg("MqttService.start: rule:", rule);

            if( !rule.url ) {
                log.msg('MqttService: rule "' + rule.name + '" has no broker URL, skipping');
                Eventer.addStatus( {type:'error', source:'mqtt', id:rule.name, text:'no broker URL configured'} );
                return;
            }
            if( !rule.topic ) {
                log.msg('MqttService: rule "' + rule.name + '" has no topic, skipping');
                Eventer.addStatus( {type:'error', source:'mqtt', id:rule.name, text:'no topic configured'} );
                return;
            }
            if( self.clients[rule.name] ) {
                log.msg('MqttService: duplicate rule name "' + rule.name + '", skipping');
                Eventer.addStatus( {type:'error', source:'mqtt', id:rule.name, text:'duplicate rule name'} );
                return;
            }

            var pass = '';
            try {
                if( rule.passwordHash !== '' ) {  // allow password-less login
                  pass = utils.decrypt( rule.passwordHash );
                }
            } catch(err) {
                log.msg('MqttService: ERROR bad password for username', rule.username);
            }

            var mqtt_config = {
              reconnectPeriod: self.config.reconnectPeriod
            };
            mqtt_config.username = rule.username;
            mqtt_config.password = pass;
            log.msg("MqttService.start: mqtt_config:", mqtt_config);

            var errorLogged = false;
            var client = mqtt.connect( rule.url, mqtt_config );
            client.on('connect', function () {
                log.msg("MqttService.connected");
                Eventer.addStatus( {type:'info', source:rule.type, id:rule.name, text:"connected"} );
                client.subscribe( rule.topic );
            });
            client.on('disconnect', function() {
              log.msg("MqttService.disconnect");
            });
            client.on('close', function() {
              log.msg("MqttService.close");
              if( !errorLogged ) {
                Eventer.addStatus( {type:'info', source:rule.type, id:rule.name, text:"connection closed, bad auth?"} );
              }
            });
            client.on('end', function() {
              log.msg("MqttService.end");
            });
            client.on('error', function(error) {
              log.msg('MqttService.error:', error.toString());
              Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:error.toString() } );
              errorLogged = true;
            });
            client.on('message', function (topic, message) {
              log.msg("MqttService: message: topic:", topic, "message:",message.toString());
              self.parse(rule, message.toString());  // message is Buffer, thus .toString()
            });
            self.clients[rule.name] = client;
        });

    },
    stop: function(callback) {
      log.msg("MqttService.stop");
      var self = this;
      var clients = Object.keys(self.clients).map(function(k) { return self.clients[k]; });
      self.clients = {};
      if( clients.length === 0 ) {
          if( callback ) { callback(); }
          return;
      }
      var remaining = clients.length;
      clients.forEach(function(client) {
          client.removeAllListeners('message');  // stop processing messages immediately
          client.end(false, {}, function() {
              remaining--;
              if( remaining === 0 && callback ) { callback(); }
          });
      });
    },

    playPattern: function(pattid,ruleid,blink1id) {
        if( PatternsService.playPatternFrom( ruleid, pattid, blink1id ) ) {
            // this.lastPatterns[ruleid] = pattid;
            return pattid;
        }
        return false;
    },

    /**
     * (FIXME: Copied from scriptService.parse(), pull these out into single common one)
     * Parse the output from a MQTT response.
     * Plays patterns if match.
     * Sends log messages with source & id of rule.
     * Checks for the following content:
     * if 'actionType == 'parse-json', treat content as JSON,
     *   and look for 'pattern' or 'color' keys
     *   'pattern' can be meta-pattern like: '~off' and '~blink'
     * if 'actionType == 'parse-pattern', attempt to find a pattern
     *   with the "pattern:<patternname>" format, and play it.
     *   Can also use meta-patterns here.
     * if 'actionType == 'parse-color', look in text for RGB hex color string
     *
     * @param  {Rule} rule eventRules rule for this content
     * @param  {String} str  the content to be parsed, potentially multiple lines
     * @return {[type]}      [description]
     */
    testConnection: function(config, callback) {
        var done = false;
        var timer = setTimeout(function() {
            if( done ) { return; }
            done = true;
            try { client.end(true); } catch(e) {}
            callback('connection timed out', null);
        }, 10000);

        var mqttConfig = { username: config.username, password: config.password, connectTimeout: 8000 };
        var client = mqtt.connect(config.url, mqttConfig);
        client.on('connect', function() {
            if( done ) { return; }
            done = true;
            clearTimeout(timer);
            client.end(true, {}, function() {
                callback(null, 'Connected to ' + config.url);
            });
        });
        client.on('error', function(err) {
            if( done ) { return; }
            done = true;
            clearTimeout(timer);
            try { client.end(true); } catch(e) {}
            var msg = err.message || String(err);
            if( msg.indexOf('ENOTFOUND')    !== -1 ) { msg = 'broker not found: ' + config.url; }
            else if( msg.indexOf('ETIMEDOUT')    !== -1 ) { msg = 'connection timed out'; }
            else if( msg.indexOf('ECONNREFUSED') !== -1 ) { msg = 'connection refused'; }
            callback(msg, null);
        });
        client.on('close', function() {
            if( done ) { return; }
            done = true;
            clearTimeout(timer);
            callback('connection closed (bad auth?)', null);
        });
    },

    parse: function(rule, str) {
        if( typeof str != "string" ) {
            str = (str) ? str.toString() : ''; // convert to string
        }
        str = str.substring(0,this.config.maxStringLength);
        var self = this;
        //var patternre = /pattern:\s*(#*\w+)/; // orig
        //var patternre = /pattern:\s*(\"([^"])*\"|#?\w+)/; // suggested by @slakichi in issue #101
        var patternre = /pattern:\s*("*)(.+)\1/; // match everything either quoted or not
        var colorre = /(#[0-9a-f]{6}|#[0-9a-f]{3}|color:\s*(.+?)\s)/i; // regex to match hex color codes or 'color:' names
        var matches;

        // if( self.lastEvents[rule.name] === str && rule.actOnNew ) {
        //     Eventer.addStatus( {type:'info', source:rule.type, id:rule.name, text:'not modified'});
        //     return;
        // }
        // self.lastEvents[rule.name] = str;
        // Eventer.addStatus( { type:'trigger', text:data.substring(0,40), source:rule.type, id:rule.name} );

        var actionType = rule.actionType;
        if( actionType === 'parse-json' ) {
            var json = null;
            try {
                json = JSON.parse(str);
                if( json.pattern ) {
                    // returns true on found pattern // FIXME: go back to using 'findPattern'
                    if( this.playPattern( json.pattern, rule.name, rule.blink1Id ) ) {
                        Eventer.addStatus( {type:'trigger', source:rule.type, id:rule.name, text:json.pattern});
                    }
                    else {
                        Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+json.pattern});
                    }
                }
                else if( json.color ) {
                    var c = tinycolor(json.color);
                    if( c.isValid() ) {
                        Eventer.addStatus( {type:'trigger', source:rule.type, id:rule.name, text:json.color});
                        this.playPattern( c.toHexString(), rule.name, rule.blink1Id );
                    } else {
                        Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'invalid color '+json.color});
                    }
                }
                else {
                    Eventer.addStatus( {type:'info', source:rule.type, id:rule.name, text:'no pattern or color in JSON'} );
                }
            } catch(error) {
                log.msg("error:", error)
                Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:error.message});
            }
        }
        else if( actionType === 'parse-pattern' ) {
            matches = patternre.exec( str );
            if( matches ) {
                var patt_name = matches[2]; // it's always the 2nd match, either quoted or not

                if( this.playPattern( patt_name, rule.name, rule.blink1Id ) ) {
                    Eventer.addStatus( {type:'trigger', source:rule.type, id:rule.name, text:patt_name});
                }
                else {
                    Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+str});
                }
            }
            else {
                Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+str});
            }
        }
        else { // parse-color
            matches = colorre.exec(str);
            var colormatch = null;
            if( matches ) {
                colormatch = matches[2] || matches[1];
            } else {
                // try the whole message as a named color (e.g. "red", "forestgreen")
                var trimmed = tinycolor( str.trim() );
                if( trimmed.isValid() ) { colormatch = str.trim(); }
            }
            if( colormatch ) {
                var color = tinycolor( colormatch );
                if( color.isValid() ) {
                    Eventer.addStatus( {type:'trigger', source:rule.type, id:rule.name, text:colormatch});
                    this.playPattern( color.toHexString(), rule.name, rule.blink1Id );
                }
                else {
                    Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'invalid color '+colormatch});
                }
            }
            else {
                Eventer.addStatus( {type:'error', source:rule.type, id:rule.name, text:'no color found in:'+str});
            }
        }
    }

};

module.exports = MqttService;
