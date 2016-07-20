
"use strict";

var fs = require('fs');
var needle = require('needle');
var tinycolor = require('tinycolor2');

var conf = require('../configuration');
var log = require('../logger');
var PatternsService = require('./patternsService');


var ScriptService = {
    config: {},
    rules: [],
    ruleTimers: [],
    lastEvents:{},
    start: function() {
        log.msg("ScriptService.start");
        // this.reloadConfig();
        // this.stop();
        this.config = conf.readSettings('eventServices:scriptService');
        if( !this.config ) {
            this.config = {
                type: 'script',
                enabled: false,
                maxStringLength: 200
            };
        }
        if( !this.config.enabled ) {
            log.msg("ScriptService: disabled");
            return;
        }
        this.config.maxStringLength = this.config.maxStringLength || 200;

        var allrules = conf.readSettings('eventRules') || [];
		this.rules = allrules.filter( function(r) {
            return (r.type==='script' || r.type==='file'|| r.type==='url') && r.enabled;
        });
		log.msg("ScriptService.start: rules:", this.rules);
        this.startScripts();
    },
    stop: function() {
        log.msg("ScriptService.stop");
        // stop previous timers
        this.ruleTimers.map( function(t) { clearInterval(t); } );
        this.ruleTimers = [];
        this.lastEvents = {};
    },
    reloadConfig: function() {
        this.stop();
        this.start();
    },
    startScripts: function() {
        var self = this;
        var rules = self.rules;
        log.msg("ScriptService.startScripts: rules",rules); //, "caller:",arguments.caller.toString());
        rules.map( function(rule) {
            log.msg("ScriptService.startScripts: starting ",rule);
            if( !rule.path || !rule.intervalSecs ) {
                log.error("ScriptService.startScripts: bad conf ",rule);
                return;
            }
            self.runScript(rule); //initial run
            var timer = setInterval( self.runScript.bind(self,rule), rule.intervalSecs * 1000);
            self.ruleTimers.push( timer );
        });
    },
    // FIXME: put limits in to "str" length
    // script rule:
    // {
    //   name: 'name of script'
    //   type: 'script'
    //   path: filepath to run
    //   actOnNew: true/false
    // }
    runScript: function(rule) {
        var self = this;
        log.msg("ScriptService.runScript:",rule,"timers:",self.ruleTimers);
        if( rule.type === 'script' ) {
            var spawn = require('child_process').spawn;
            var script = spawn( rule.path );
            script.stdout.on('data', function(data) {
                var str = data.toString();
                log.msg("ScriptService.runScript: str:",str,"last:",self.lastEvents[rule.name]);
                // self.handleEvent(rule,str);
                self.parse(rule,str);
            });
            script.stderr.on('data', function(data) {
                log.msg("ScriptService.runScript stderr data",data);
                log.addEvent( {type:'error', source:'script', id:rule.name, text:'stderr:'+data });
            });
            script.on('close', function(code) {
                log.msg("ScriptService.runScript close",code);
            });
        }
        else if( rule.type === 'file' ) {
            fs.readFile( rule.path, 'utf8', function(err,data) {
                // FIXME: put limit on size
                // FIXME: check for no file
                if(err) {
                    log.addEvent( {type:'error', source:'file', id:rule.name, text:err.message});
                    return;
                    // return log.error(err);
                }
                // if( self.lastEvents[rule.name] !== data ) {
                self.parse(rule,data); // NOPE
                    // self.lastEvents[rule.name] = data;
                // }
            });
        }
        else if( rule.type === 'url' ) {
            var url = rule.path;
            needle.get(url, {decode: false, parse: false}, function(err, response) {
    			// FIXME: do error handling like: net error, bad response, etc.
    			if( err ) {
                    log.msg("ScriptService.runScript: error fetching url",err, response);
                    log.addEvent( {type:'error', source:'url', id:rule.name, text:err.message });
                    return;
                }
                if( response.statusCode !== 200 ) { // badness
                    log.addEvent( {type:'error', source:'url', id:rule.name, text:response.statusMessage });
    				return;
    			}
                // otherwise continue as normal
                self.parse( rule, response.body);
            });
        }

    },

    parse: function(rule, str) {
        str = str.substring(0,this.config.maxStringLength);
        log.msg("ScriptService.parse:", str, "rule:",rule);
        var self = this;
        var patternre = /pattern:\s*(#*\w+)/;
        var colorre = /(#[0-9a-f]{6}|#[0-9a-f]{3}|color:\s*(.+?)\s)/i;
        var matches;

        if( self.lastEvents[rule.name] === str && rule.actOnNew ) {
            log.addEvent( {type:'info', source:rule.type, id:rule.name, text:'not modified'});
            return;
        }
        self.lastEvents[rule.name] = str;
        // log.addEvent( { type:'trigger', text:data.substring(0,40), source:rule.type, id:rule.name} );

        var actionType = rule.actionType;
        if( actionType === 'parse-json' ) {
            var json = null;
            // var err = null;
            try {
                json = JSON.parse(str);
                if( json.pattern ) {
                    // returns true on found pattern // FIXME: go back to using 'findPattern'
                    if( PatternsService.playPattern( json.pattern ) ) {
                        log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:json.pattern});
                    }
                    else {
                        log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+json.pattern});
                    }
                }
                if( json.color ) {
                    var c = tinycolor(json.color);
                    if( c.isValid() ) {
                        log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:json.color});
                        PatternsService.playPattern( "~pattern:1,"+c.toHexString()+",0.1,0" );
                    } else {
                        log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'invalid color '+json.color});
                    }
                }
            } catch(error) {
                log.addEvent( {type:'error', source:rule.type, id:rule.name, text:error.message});
            }
        }
        else if( actionType === 'parse-pattern' ) {
            matches = patternre.exec( str );
            if( matches ) {
                if( PatternsService.playPattern( matches[1] ) ) {
                    log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:str});
                }
                log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+str});
            }
            else {
                log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'no pattern '+str});
            }
        }
        else { // parse-color
            matches = colorre.exec(str);
            if( matches ) {
                var colormatch = matches[2];
                var color = tinycolor( colormatch );
                if( color.isValid() ) {
                    log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:colormatch});
                    PatternsService.playPattern( "~pattern:1,"+color.toHexString()+",0.1,0" );
                }
                else {
                    log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'invalid color '+colormatch});
                }
            }
            else {
                log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'invalid color '+str});
            }
        }
    }

};

module.exports = ScriptService;


// need to indicate:
// - missing file
// - bad URL
// - bad parse
// -
//
// FIXME: need to heed patternId
// FIXME: handleEvent & parse() are same thing
// handleEvent: function(rule,str) {
//     var self = this;
//     // log.msg("ScriptService.parse stdout data",str);
//     if( self.lastEvents[rule.name] !== str ) {
//         // if( !rule.logEvents || (null !== rule.logEvents && rule.logEvents) ) {
//         log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:str.substring(0,40) } );
//         // }
//         self.lastEvents[rule.name] = str;
//         PatternsService.playPattern( str );
//     }
// },
