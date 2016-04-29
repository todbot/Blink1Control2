
"use strict";

var fs = require('fs');
var needle = require('needle');

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
        if( !this.config ) { this.config = { enabled: false }; }
        if( !this.config.enabled ) {
            log.msg("ScriptService: disabled");
            return;
        }
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
            if( !rule.filepath || !rule.intervalSecs ) {
                log.error("ScriptService.startScripts: bad conf ",rule);
                return;
            }
            // self.runScript(rule); //initial run
            var timer = setInterval( self.runScript.bind(self,rule), rule.intervalSecs * 1000);
            self.ruleTimers.push( timer );
        });
    },
    // need to indicate:
    // - missing file
    // - bad URL
    // - bad parse
    // -
    //
    // FIXME: need to heed patternId
    handleEvent: function(rule,str) {
        var self = this;
        // log.msg("ScriptService.parse stdout data",str);
        if( self.lastEvents[rule.name] !== str ) {
            // if( !rule.logEvents || (null !== rule.logEvents && rule.logEvents) ) {
            log.addEvent( {type:'trigger', source:rule.type, id:rule.name, text:str.substring(0,40) } );
            // }
            self.lastEvents[rule.name] = str;
            PatternsService.playPattern( str );
        }
    },
    runScript: function(rule) {
        var self = this;
        log.msg("ScriptService.runScript:",rule,"timers:",self.ruleTimers);
        if( rule.type === 'script' ) {
            var spawn = require('child_process').spawn;
            var script = spawn( rule.filepath );
            script.stdout.on('data', function(data) {
                var str = data.toString();
                log.msg("ScriptService.runScript: str:",str,"last:",self.lastEvents[rule.name]);
                self.handleEvent(rule,str);
            });
            script.stderr.on('data', function(data) {
                log.msg("ScriptService.runScript stderr data",data);
                // log.addEvent( {date:Date.now(), text:'error'+data, type:rule.type, id:rule.name} );
            });
            script.on('close', function(code) {
                log.msg("ScriptService.runScript close",code);
            });
        }
        else if( rule.type === 'file' ) {
            fs.readFile( rule.filepath, 'utf8', function(err,data) {
                // FIXME: put limit on size
                // FIXME: check for no file
                if (err) {
                    return log.error(err);
                }
                if( self.lastEvents[rule.name] !== data ) {
                    log.addEvent( {date:Date.now(), text:data.substring(0,40), type:rule.type, id:rule.name} );
                    self.parse(rule,data);
                    self.lastEvents[rule.name] = data;
                }
            });
        }
        else if( rule.type === 'url' ) {
            var url = rule.filepath;
            needle.get(url, function(error, response) {
    			// FIXME: do error handling like: net error, bad response, etc.
    			if( error || response.statusCode !== 200 ) { // badness
    				// log.msg(": error fetching");
                    log.addEvent( {date:Date.now(), text:'error fetching', type:'url', id:rule.name} );
    				return;
    			}
    			// console.log("BODY:", response.body);
    			// otherwise continue as normal
    			// var respobj = JSON.parse(body);

    			// var respobj = response.body; //JSON.parse(response.body);
            });
        }

    }

};

module.exports = ScriptService;
