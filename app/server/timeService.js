/**
 * Alarm and Periodic / Hourly chime Service
 *
 * Supported alarm types:
 * - Periodic (i.e. hourly chime)
 * - At specific time (e.g. "11:30am")
 *
 */

'use strict';

// var example_rules = [
//     {
//         "type": "time",
//         "enabled": true,
//         "name": "hourly chime",
//         "alarmType": "perodic",
//         "alarmHour": "1",
//         "alarmMinute": "",
//         "actionType": "play-pattern",
//         "patternId": "groovy"
//     },
//     {
//         "type": "time",
//         "enabled": true,
//         "name": "alarm at 4:45pm",
//         "alarmType": "exact",
//         "alarmHour": "17",
//         "alarmMinute": "04",
//         "actionType": "play-pattern",
//         "patternId": "red flash"
//     }
//
// ];

var conf = require('../configuration');
var log = require('../logger');

var PatternsService = require('./patternsService');

var intervalSecs = 1;

var TimeService = {
	config: {},
	rules: {},
    timer: null,
    reloadConfig: function() {
		this.config = conf.readSettings('eventServices:timeService');
		if( !this.config ) {
			log.msg("TimeService.reloadConfig: NO CONFIG");
			this.config = {
				type: 'time',
				service: 'timeService',
				enabled: true,
			};
			conf.saveSettings('eventServices:timeService', this.config);
		}
		// var allrules = conf.readSettings('eventRules') || [];
        var allrules = conf.readSettings('eventRules') || [];
		this.rules = allrules.filter( function(r){return r.type === 'time';} );
    },
    start: function() {
        this.reloadConfig();
        this.timer = setInterval(this.checkTime.bind(this), 1000 * intervalSecs);
    },
    stop: function() {
        clearInterval(this.timer);
    },
    // called every interval
    checkTime: function() {
        var now = new Date();
        this.rules.map( function(rule) {
            // log.msg("TimeService.checkTime: rule=",rule);
            if( rule.alarmType === 'periodic' ) {
                var rHour = parseInt(rule.alarmHours);
                var rMin = parseInt( rule.alarmMinutes ) || 0;
                var rSec = parseInt( rule.alarmSeconds ) || 0;
                // log.msg("TimeService.checkTime: periodic:", rHour,rMin,rSec,
                //     " - ", now.getHours(),now.getMinutes(),now.getSeconds());
                if( now.getHours() === rHour &&
                    now.getMinutes() === rMin &&
                    now.getSeconds() === rSec ) {
                    log.addEvent( {type:'trigger', source:'time', id:rule.name, text:'' });
                    PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                }
            }
            else if( rule.alarmType === 'exact' ) {
                // log.msg("TimeService.checkTime: exact: no logic yet for this case");
            }
        });
    }
};



module.exports = TimeService;
