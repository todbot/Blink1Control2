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


*/

"use strict";

var request = require('request');

var baseUrl = 'http://api.thingm.com/blink1/eventsall/';

var IftttService = {
	// all these fetched from configuration later
	iftttKey: 'ABCD1234ABCD1234',
	intervalsecs: 15,
	intervalTimer: null,
    lastTime: 0,
	lastState: "",

	setIftttKey: function(k) { this.iftttKey = k; },
	getIftttKey: function() { return this.iftttKey; },

	start: function() {
		this.lastTime = new Date(0); // FIXME:
		this.fetchIfttt();
		this.intervalTimer = setInterval(this.fetchIfttt.bind(this), this.intervalsecs * 1000);
		// so much this
	},
	stop: function() {
		clearInterval( this.intervalTimer );
	},

    fetchIfttt: function() {
		var url = baseUrl + this.iftttKey;
		console.log("fetchIfttt:", url);
		var self = this;
        request(baseUrl + this.iftttKey, function(error, response, body) {
			// FIXME: do error handling like: net error, bad response, etc.
			if( error || response.statusCode !== 200 ) { // badness
				console.log("error fetching IFTTT");
				return;
			}
			// otherwise continue as normal
			var respobj = JSON.parse(body);
			if( respobj.events ) {
				respobj.events.map( function(e) {
					// console.log("e:", e);
					var eventDate = new Date(parseInt(1000 * e.date));
					if (eventDate > self.lastTime) {
						console.log('trigger: ', e.name);
					}
				});
				self.lastTime = new Date(); // == now
			}
			else {
				console.log("IftttFetcher: bad response: ", body);
			}
        });

    }

};

module.exports = IftttService;
