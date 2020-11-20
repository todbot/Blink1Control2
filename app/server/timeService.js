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
var Eventer = require('../eventer');

var moment = require('moment');

var PatternsService = require('./patternsService');

var intervalSecs = 1;

var TimeService = {
	config: {},
	rules: {},
    timer: null,
    reloadConfig: function() {
        log.msg("TimeService.reloadConfig");
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

		// this.rules.map( function(rule) {
		// 	if( rule.alarmType === 'countdown' ) {
	    //         var newTime = moment();
	    //         // newTime = newTime.add(state.alarmHours,'hours');
	    //         newTime = newTime.add(rule.alarmMinutes,'minutes');
	    //         rule.alarmHours = newTime.hours();
	    //         rule.alarmMinutes = newTime.minutes();
	    //     }
		// });
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
            if( !rule.enabled ) { return; }
            // log.msg("TimeService.checkTime: rule=",rule);
            var rHour = parseInt(rule.alarmHours);
            var rMin = parseInt( rule.alarmMinutes ) || 0;
            var rSec = parseInt( rule.alarmSeconds ) || 0;
            var rMode = rule.alarmTimeMode || '24';

            // convert am/pm to 0-24, am: 1-11,12 -> 1-11,0, pm: 1-11,12 -> 13-23,12
            if( rMode === 'am' ) {
              rHour = (rHour !== 12) ? rHour : 0;
            } else if( rMode === 'pm' ) {
              rHour = (rHour !== 12) ? rHour + 12 : 12;
            } // else 24 hour mode

            if( rule.alarmType === 'hourly' ) {
                log.msg("TimeService.checkTime: hourly:", rHour,rMin,rSec, " - ", now.getHours(),now.getMinutes(),now.getSeconds());
                if( now.getMinutes() === rMin &&
                    now.getSeconds() === rSec ) {
                    Eventer.addStatus( {type:'trigger', source:'time', id:rule.name, text:'hourly alarm' });
                    PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                }
            }
            else if( rule.alarmType === 'daily' ) {
                // log.msg("TimeService.checkTime: daily:", rHour,rMin,rSec, " - ", now.getHours(),now.getMinutes(),now.getSeconds());
                if( now.getHours() === rHour &&
                    now.getMinutes() === rMin &&
                    now.getSeconds() === rSec ) {
                    Eventer.addStatus( {type:'trigger', source:'time', id:rule.name, text:'daily alarm' });
                    PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                }
            }
            else if( rule.alarmType === 'countdown' ) {
                log.msg("TimeService.checkTime: countdown:", rHour,rMin,rSec, " - ", now.getHours(),now.getMinutes(),now.getSeconds());
                if( now.getHours() === rHour &&
                    now.getMinutes() === rMin &&
                    now.getSeconds() === rSec ) {
					// how to turn off?
                    Eventer.addStatus( {type:'trigger', source:'time', id:rule.name, text:'countdown alarm' });
                    PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                }
            }
        });
    }
};



module.exports = TimeService;
