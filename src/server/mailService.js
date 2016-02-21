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

var config = require('../configuration');

var PatternsService = require('./patternsService');
var ImapSearcher = require('./imapSearcher');

var MailService = {

	start: function() {
		this.lastTime = new Date(0); // FIXME:
		//this.fetchIfttt();
		//this.intervalTimer = setInterval(this.fetchIfttt.bind(this), this.intervalsecs * 1000);
		// so much this
	},
	stop: function() {
		clearInterval( this.intervalTimer );
	},

    checkMail: function() {
		var rules = config.readSettings('mailRules');
		if( !rules ) {
			rules = [];
		}
		var mailconfig = rules[0];

		var imapSearcher = new ImapSearcher( mailconfig );
	    imapSearcher.start();

    }

};

module.exports = MailService;
