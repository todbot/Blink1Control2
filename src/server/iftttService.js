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
// var Blink1Service = require('./Blink1Service');

var baseUrl = 'http://api.thingm.com/blink1/eventsall/';


var IftttService = {
	config: {},
	rules: {},
	// FIXME: all these fetched from configuration later
	iftttKey: 'ABCD1234ABCD1234',
	intervalTimer: null,
    lastTime: 0,
	// lastState: "",
	lastEvents: {},

	setIftttKey: function(k) { this.iftttKey = k; },
	getIftttKey: function() { return this.iftttKey; },

	reloadConfig: function() {
		this.config = conf.readSettings('iftttService');
		if( !this.config ) {
			this.config = { intervalSecs: 10, enabled: true };
			conf.saveSettings('iftttService', this.config);
		}
		var allrules = conf.readSettings('eventRules') || [];
		this.rules = allrules.filter( function(r){return r.type==='ifttt';} );
		log.msg("IftttService.reloadConfig. rules=", this.rules);
	},
	getRules: function() {
		log.msg("IftttService.getRules, rules:",this.rules);
		return (this.rules) ? this.rules : [];
	},
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

    fetch: function() {
		var self = this;
		var rules = self.getRules();

		//if( rules.length === 0 ) { return; } // no rules, don't waste effort
		var url = baseUrl + self.iftttKey;
		log.msg("fetch:", url, self.lastTime);
        // request(baseUrl + this.iftttKey, function(error, response, body) {
		needle.get(baseUrl + this.iftttKey, function(error, response) {
			// FIXME: do error handling like: net error, bad response, etc.
			if( error || response.statusCode !== 200 ) { // badness
				log.msg("IftttService.fetch: error fetching");
				return;
			}
			// console.log("BODY:", response.body);
			// otherwise continue as normal
			// var respobj = JSON.parse(body);
			var respobj = response.body; //JSON.parse(response.body);
			// var shouldSave = false;
			if( respobj.events ) {
				respobj.events.map( function(evt) {
					//log.msg("iftttFetcher e:", JSON.stringify(e));
					var eventDate = new Date(parseInt(1000 * evt.date));
					if (eventDate > self.lastTime ) { // only notice newer than our startup
						log.msg('iftttFetcher new event name:"'+ evt.name+'"');
						log.addEvent( {date:eventDate, text:evt.source, type:'ifttt', id:evt.name} );
						rules.map( function(r) {
							log.msg("    ifttFetcher: rule:", JSON.stringify(r));
							if( evt.name.trim() === r.name.trim()) {
								if( !self.lastEvents[r.name] ) { self.lastEvents[r.name] = new Date(0); }
								log.msg("*** RULE MATCH: ", evt.name, '--', eventDate, '--', self.lastEvents[r.name]);
								// this.lastEvents[r.name] = this.lastEvents[r.name] || 0;
								if( eventDate > self.lastEvents[r.name] ) {
									self.lastEvents[r.name] = eventDate;
									log.msg("*** TRIGGERED!!! ***", evt);
									PatternsService.playPattern( r.patternId );
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
				log.msg("IftttFetcher: bad response: ", response);
			}
        });

    }
};

module.exports = IftttService;
