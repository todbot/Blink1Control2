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

var request = require('request');
var config = require('../configuration');
var log = require('../logger');

var PatternsService = require('./patternsService');

var baseUrl = 'http://api.thingm.com/blink1/eventsall/';

// var svcConfig = config.readSettings('iftttService')

var IftttService = {
	config: {},
	// FIXME: all these fetched from configuration later
	iftttKey: 'ABCD1234ABCD1234',
	intervalTimer: null,
    lastTime: 0,
	lastState: "",

	setIftttKey: function(k) { this.iftttKey = k; },
	getIftttKey: function() { return this.iftttKey; },
	// getConfig: function() {
	// 	return this.config;
	// },
	getRules: function() {
		log.msg("IftttService.getRules, config:",this.config.rules);
		return (this.config.rules) ? this.config.rules : [];
		// return this.config.rules;
	},
	start: function() {
		this.config = config.readSettings('iftttService');
		log.msg("IftttService.start: rules",this.config.rules);
		if( ! this.config.intervalSecs ) { this.config.intervalSecs = 15; }
		this.lastTime = new Date(0); // FIXME:
		this.fetchIfttt();
		this.intervalTimer = setInterval(this.fetchIfttt.bind(this), this.config.intervalSecs * 1000);
		// so much this
	},
	stop: function() {
		clearInterval( this.intervalTimer );
	},

    fetchIfttt: function() {
		var self = this;
		var rules = self.getRules();
		var url = baseUrl + self.iftttKey;
		log.msg("fetchIfttt:", url, self.lastTime);
        request(baseUrl + this.iftttKey, function(error, response, body) {
			// FIXME: do error handling like: net error, bad response, etc.
			if( error || response.statusCode !== 200 ) { // badness
				log.msg("error fetching IFTTT");
				return;
			}
			// otherwise continue as normal
			var respobj = JSON.parse(body);
			var shouldSave = false;
			if( respobj.events ) {
				respobj.events.map( function(e) {
					//log.msg("iftttFetcher e:", JSON.stringify(e));
					var eventDate = new Date(parseInt(1000 * e.date));
					if (eventDate > self.lastTime ) {
						log.msg('iftttFetcher new event name:', e.name);
						rules = rules.map( function(r) {
							log.msg("    ifttFetcher: rule:", JSON.stringify(r));
							r.lastTime = ( r.lastTime ) ? new Date( r.lastTime ) : 0;
							if( e.name.trim() === r.name.trim()) {
								log.msg("*** RULE MATCH: ", e.name, eventDate, r.lastTime);
								if( eventDate > r.lastTime ) {
									log.msg("*** TRIGGERED!!! ***");
									log.addEvent( 'IFTTT:'+r.name+'-'+r.source);
									r.lastTime = eventDate;
									r.source = e.source;
									PatternsService.playPattern( r.patternId );
									shouldSave = true;
								}
							}
							return r;
						});
					}
				});
				self.lastTime = new Date(); // == now
				if( shouldSave ) {
					log.msg("iftttFetcher: saving rules");
					self.config.rules = rules;
					config.saveSettings("iftttService", self.config);
				}
			}
			else {
				log.msg("IftttFetcher: bad response: ", body);
			}
        });

    }

};

module.exports = IftttService;
