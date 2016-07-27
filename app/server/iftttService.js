/**
 * Fetch results from ThingM IFTTT service
 *
 * It needs to do:
 * - Load iftt configuration from global config
 * - Fetch IFTTT results periodically from ThingM IFTTT service
 * - When a new event happens
 * -- log the event
 * -- trigger the pattern (hmm, this means this needs access to PatternsApi)
 * --
 *
 *
 *
 *
 *
 * api.thingm.com response looks like:
	{
		"events":[
			{
			"blink1_id":"ABCD1234ABCD1234",
			"date":"1443034643",
			"name":"bobby",
			"source":"bob"
			},
			{
			"blink1_id":"ABCD1234ABCD1234",
			"date":"1394064858",
			"name":"testtest2",
			"source":"testme2"
			}
		],
		"event_count":2,
		"status":"events saved"
	}

*
* Config
*/

'use strict';

// var request = require('request');
var needle = require('needle'); // a better 'request' (or at least, works w/ webpack)

var conf = require('../configuration');
var log = require('../logger');

var PatternsService = require('./patternsService');
var Blink1Service = require('./blink1Service');


var IftttService = {
	config: {},
	rules: {},
	iftttKey: '',
	intervalTimer: null,
    lastTime: 0,
	lastEvents: {},

	setIftttKey: function(k) { this.iftttKey = k; },
	getIftttKey: function() { return this.iftttKey; },

	reloadConfig: function() {
		this.config = conf.readSettings('eventServices:iftttService');
		if( !this.config ) {
			log.msg("IftttService.reloadConfig: NO CONFIG");
			this.config = {
				type: 'ifttt',
				service: 'iftttService',
				intervalSecs: 10,
				enabled: true,
				baseUrl: 'http://api.thingm.com/blink1/eventsall/'
			};
			conf.saveSettings('eventServices:iftttService', this.config);
		}
		var allrules = conf.readSettings('eventRules') || [];
		this.rules = allrules.filter( function(r){return r.type === 'ifttt';} );
		this.iftttKey = Blink1Service.iftttKey();
		log.msg("IftttService.reloadConfig. rules=", this.rules);
	},
	// getRules: function() {
	// 	log.msg("IftttService.getRules, rules:",this.rules);
	// 	return (this.rules) ? this.rules : [];
	// },
	start: function() {
		this.reloadConfig();
		log.msg("IftttService.start: rules", this.rules);
		if( ! this.config.intervalSecs ) { this.config.intervalSecs = 15; }
		this.lastTime = Date.now();
		if( !this.config.enabled ) { return; }
		this.fetch();
		this.intervalTimer = setInterval(this.fetch.bind(this), this.config.intervalSecs * 1000);
	},
	stop: function() {
		clearInterval( this.intervalTimer );
	},

	handleResults: function(rule,event) {
		var self = this;
		log.msg("IftttService.handleResults: *** TRIGGERED!!! ***", event,rule);
		self.lastEvents[rule.name] = event.eventDate;
		PatternsService.playPatternByRule( rule );
		// if( rule.enabled ) {
		// 	// if( Blink1Service.rule.blink1Id ) {
		// }
	},
	makeProxyUrl: function() {
		var proxy = conf.readSettings('proxy');
		var proxyurl  = '';
		if( proxy && proxy.enable ) {
			if( proxy.username ) {
				proxyurl += proxy.username +':'+ proxy.password + '@';
			}
			if( proxy.host ) {
				proxyurl = 'http://' + proxyurl + proxy.host + ':' + proxy.port;
			}
		}
		return proxyurl;
	},

    fetch: function() {
		var self = this;
		var rules = self.rules; //self.getRules();
		var defaultId = '-default-'; // FIXME: see ToolTable.render.makeLastValue

		//if( rules.length === 0 ) { return; } // no rules, don't waste effort
		var url = this.config.baseUrl + self.iftttKey;

		var opts = {};
		// var proxyurl = self.makeProxyUrl();
		// if( proxyurl ) {
		// 	opts.proxy = proxyurl;
		// }
		// log.msg("iftttService.fetch: opts:",opts);

		// log.msg("IftttService.fetch:", url, self.lastTime, "defaultId:",defaultId);
        // request(baseUrl + this.iftttKey, function(error, response, body) {
		needle.get( url, opts, function(error, response) {
			var msg = '';
			// FIXME: do error handling like: net error, bad response, etc.
			if( error ) {
				msg = error.message;
				if( msg.indexOf('ENOTFOUND') !== -1 ) { msg = 'cannot reach IFTTT gateway'; }
				else {
					msg = 'IFTTT connection offline';
				}
				// log.addEvent( {type:'error', source:'ifttt', id:defaultId, text:errmsg} );
				// log.msg( msg +' for '+self.iftttKey); // FIXME:
				log.addEvent( {type:'error', source:'ifttt', id:defaultId, text:msg} );
				return;
			}
			if( response.statusCode !== 200 ) {
				msg = response.statusMessage;
				if( response.statusCode === 404 ) {
					msg = 'no IFTTT events';
				}
				log.addEvent( {type:'info', source:'ifttt', id:defaultId, text:msg} );
				return;
			}
			// otherwise continue as normal
			var respobj = response.body; //JSON.parse(response.body);
			// var shouldSave = false;
			if( respobj.events ) {
				respobj.events.map( function(evt) {

					// FIXME
					// log.addEvent( {type:'info', source:'ifttt', id:defaultId, text:'no new events' } );

					evt.eventDate = new Date(parseInt(1000 * evt.date));
					if (evt.eventDate > self.lastTime ) { // only notice newer than our startup
						// log.msg('IftttService.fetch: new event name:"'+ evt.name+'"');
						log.addEvent( {date:evt.eventDate, type:'trigger', source:'ifttt', id:evt.name, text:evt.source  } );
						rules.map( function(r) {
							log.msg('IftttService.fetch: rule:', JSON.stringify(r));
							if( evt.name.trim() === r.name.trim()) {
								if( !self.lastEvents[r.name] ) { self.lastEvents[r.name] = new Date(0); }
								log.msg("IftttService.fetch: *** RULE MATCH:", evt.name, '--', evt.eventDate, '--', self.lastEvents[r.name]);
								// this.lastEvents[r.name] = this.lastEvents[r.name] || 0;
								if( evt.eventDate > self.lastEvents[r.name] ) {
									self.handleResults( r, evt );
								}
							}
						});
					}
				});
				self.lastTime = new Date(); // == now
				// if( shouldSave ) {
				// 	log.msg("iftttFetcher: saving rules");
				// 	self.config.rules = rules;
				// 	conf.saveSettings("iftttService", self.config);
				// }
			}
			else {
				log.addEvent( {type:'error', source:'ifttt', id:defaultId, text:'bad response'} );
				log.msg("IftttFetcher: bad response: ", response);
			}
        });

    }
};

module.exports = IftttService;
