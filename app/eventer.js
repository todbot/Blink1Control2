"use strict";

// a singleton to act as common area for event emission & consumption
// should probably be redux / flux thing at some point

// Questions:
//
// - how to control the event types
// - how to have this replace the 'Logger.addEvent()'
//
//
// How this is used
//
// Events emitted & consumed
// - 'bigButtonSet.js'
//   - receive 'playBigButtonSys' & 'playBigButtonUser'
//   - send 'bigButtonsUpdated'
// - 'menuMaker.js'
//   - send 'playBigButtonSys' & 'playBigButtonUser'
//   - receive 'bigButtonsUpdated' & 'deviceUpdated'
// - in 'maingui.js'
//    - send 'playBigButtonUser' & 'playBigButtonSys'
// - blink1Service.js
//    - send 'deviceUpdated'
//
// Proposed new functionality
//
// //Eventer.emit('logEvent', {params});
// Eventer.statusUpdate( {params} );
//   - replace log.addEvent()
//   - in 'iftttService.js' et al
//   - sent when useful information occurs for user to see
//   - params: {type:'info',...},
//             {type:'error',...},
//             {type:'trigger',...},
//             {type:'triggerOff',...}
//   - emits 'newStatus' event
// Eventer.on('logEvent', func);
//   - in 'eventList.js' & 'toolTable.js'
//   - receives new events
//

var EventEmitter = require('events').EventEmitter;
var util = require("util");

var conf = require('./configuration');
var logconfig = conf.readSettings('logger');
if( !logconfig.maxEvents || logconfig.maxEvents > 200 ) {logconfig.maxEvents = 200; }

function Eventer() {
    //Inherit from EventEmitter
    EventEmitter.call(this);
    this._savedStatuses = [];
    this._maxStatuses = logconfig.maxEvents;
}
//Inherit prototype methods
util.inherits(Eventer, EventEmitter);

// was log.addEvent()
// status format:
// status = {
//  date: Date, // time of event as JS Date, if omitted == now
//  type: 'trigger', 'triggerOff', 'error', 'info'
//  source: 'ifttt, 'mail', etc. ==  event source 'type'
//  id: 'red demo'  // event source 'name'
//  text: 'blah blah'  // text of event
// }
Eventer.prototype.addStatus = function(status) {
    var self = this;
    self._savedStatuses.push(status); // add status line
    if( self._savedStatuses.length > self._maxStatuses ) {
        self._savedStatuses.shift(); // remove oldest (first)
    }
    console.log('eventer size:',self._savedStatuses.length, "max:",self._maxStatuses);
    self.emit('newStatus', self._savedStatuses);
}

// unneeded now?
// replaces log.getLastEvents()
Eventer.prototype.getStatuses = function(n) {
    var self = this;
    return self._savedStatuses;
}

module.exports = new Eventer;

// var eventEmitter = new EventEmitter();
// module.exports = eventEmitter;
