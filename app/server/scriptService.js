
"use strict";

var fs = require('fs');
var needle = require('needle');
var tinycolor = require('tinycolor2');

var conf = require('../configuration');
var log = require('../logger');
var Eventer = require('../eventer');

var PatternsService = require('./patternsService');


var ScriptService = {
    config: {},
    rules: [],
    ruleTimers: [],
    runningScripts: [],
    lastEvents:{},
    lastPatterns: {},

    start: function() {
        log.msg("ScriptService.start");
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
        this.ruleTimers.map( function(timer) { clearInterval(timer); } );
        this.ruleTimers = [];
        this.runningScripts.map( function(child) { try { child.kill(); } catch(e) {} } );
        this.runningScripts = [];
        this.lastEvents = {};
    },
    reloadConfig: function() {
        this.stop();
        this.start();
    },
    startScripts: function() {
        var self = this;
        var rules = self.rules;
        // log.msg("ScriptService.startScripts: rules",rules); //, "caller:",arguments.caller.toString());
        rules.map( function(rule) {
            log.msg("ScriptService.startScripts: starting ",rule);
            if( !rule.path || !rule.intervalSecs ) {
                log.error("ScriptService.startScripts: bad conf ",rule);
                return;
            }
            self.runRule(rule); //initial run
            var timer = setInterval( self.runRule.bind(self,rule), rule.intervalSecs * 1000);
            self.ruleTimers.push( timer );
        });
    },
    // FIXME: put limits in to "str" length
    // script/url/file rule:
    // {
    //   name: 'name of script'
    //   type: 'script'
    //   path: filepath to run
    //   actOnNew: true/false
    // }
    // Core fetch: runs script/reads file/fetches URL, calls callback(error, output) once.
    // For scripts, stderr data is forwarded to onStderr(data) if provided.
    // Returns the child process for 'script' type so the caller can track it; null otherwise.
    fetchRule: function(rule, callback, onStderr) {
        var MAX_BYTES = 32 * 1024;
        if( rule.type === 'script' ) {
            var spawn = require('child_process').spawn;
            var stdoutBuf = '';
            var done = false;
            var child = spawn(rule.path, [], { shell: true });
            child.on('error', function(err) {
                if( !done ) { done = true; callback(err.message, null); }
            });
            child.stdout.on('data', function(data) {
                if( stdoutBuf.length < MAX_BYTES ) {
                    stdoutBuf += data.toString();
                }
            });
            child.stderr.on('data', function(data) {
                if( onStderr ) { onStderr(data.toString()); }
            });
            child.on('close', function() {
                if( !done ) { done = true; callback(null, stdoutBuf.slice(0, MAX_BYTES).replace(/\r/g, '')); }
            });
            return child;
        }
        else if( rule.type === 'file' ) {
            var stream = fs.createReadStream(rule.path, {encoding: 'utf8', start: 0, end: MAX_BYTES - 1});
            var fileBuf = '';
            stream.on('data', function(chunk) { fileBuf += chunk; });
            stream.on('error', function(err) { callback(err.message, null); });
            stream.on('end', function() { callback(null, fileBuf); });
        }
        else if( rule.type === 'url' ) {
            needle.get(rule.path, {decode: false, parse: false, follow_max: 5}, function(err, response) {
                if( err ) { callback(err.message, null); }
                else if( response.statusCode !== 200 ) { callback('HTTP ' + response.statusCode, null); }
                else { callback(null, response.body.slice(0, MAX_BYTES).toString()); }
            });
        }
        else {
            callback('unknown rule type: ' + rule.type, null);
        }
        return null;
    },

    runRule: function(rule) {
        var self = this;
        log.msg("ScriptService.runRule:",rule.name, rule.type, rule,"timer Ids:",self.ruleTimers);
        try {
            var child = self.fetchRule(rule, function(err, output) {
                if( err ) {
                    Eventer.addStatus({type:'error', source:rule.type, id:rule.name, text:err});
                    return;
                }
                log.msg("ScriptService.runRule: output:",output,"last:",self.lastEvents[rule.name]);
                self.parse(rule, output);
            }, function(stderrData) {
                log.msg("ScriptService.runRule stderr:",stderrData);
                Eventer.addStatus({type:'error', source:rule.type, id:rule.name, text:'stderr:'+stderrData});
            });
            if( child ) {
                self.runningScripts.push(child);
                child.on('close', function() {
                    self.runningScripts = self.runningScripts.filter(function(s) { return s !== child; });
                });
            }
        } catch(error) {
            Eventer.addStatus({type:'error', source:rule.type, id:rule.name, text:error.message});
        }
    },

    // Run a rule once and return the raw output via callback(error, output), without parsing.
    testRule: function(rule, callback) {
        this.fetchRule(rule, callback);
    },

    playPattern: function(pattid,ruleid,blink1id) {
        if( PatternsService.playPatternFrom( ruleid, pattid, blink1id ) ) {
            this.lastPatterns[ruleid] = pattid;
            return pattid;
        }
        return false;
    },

    /**
     * Parse the output string of a script, file, or URL.
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
    parse: function(rule, str) {
//        log.msg("ScriptService.parse: str=", str, "rule:",rule);
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

        if( self.lastEvents[rule.name] === str && rule.actOnNew ) {
            Eventer.addStatus( {type:'info', source:rule.type, id:rule.name, text:'not modified'});
            return;
        }
        self.lastEvents[rule.name] = str;
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
            } catch(error) {
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
            if( matches && matches) {
                var colormatch = matches[2];
                if( !colormatch ) { colormatch = matches[1]; }

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

module.exports = ScriptService;
