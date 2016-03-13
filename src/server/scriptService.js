
"use strict";

var conf = require('../configuration');
var log = require('../logger');
var PatternsService = require('./patternsService');

var ScriptService = {
    config: {},
    ruleTimers: [],
    reloadConfig: function() {
        log.msg("ScriptService.reloadConfig");
        var self = this;
        self.stop();
        var config = conf.readSettings('scriptService');
        if( !config ) { config = { enabled: false, rules:[] }; }
        self.config = config;
    },
    start: function() {
        this.reloadConfig();
        if( !this.config.enabled ) {
            log.msg("ScriptService: disabled");
            return;
        }
        log.msg("ScriptService.start");
        this.startScripts();
    },
    stop: function() {
        // stop previous timers
        this.ruleTimers.map( function(t) { clearInterval(t); } );
    },
    startScripts: function() {
        var self = this;
        var rules = self.config.rules;
        rules.map( function(rule) {
            self.runScript(rule); //initial run
            var timer = setInterval( self.runScript.bind(self,rule), rule.intervalSecs * 1000);
            self.ruleTimers.push( timer );
        });
    },
    runScript: function(rule) {
        console.log("runScript:",rule);
        var spawn = require('child_process').spawn;
        var script = spawn( rule.path );
        script.stdout.on('data', function(data) {
            var str = data.toString();
            console.log("runScript stdout data",str);
            PatternsService.playPattern( str );
        });
        script.stderr.on('data', function(data) {
            console.log("runScript stderr data",data);
        });
        script.on('close', function(code) {
            console.log("runScript close",code);
        });

    }

};

module.exports = ScriptService;
