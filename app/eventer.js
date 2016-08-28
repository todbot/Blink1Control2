"use strict";

// a singleton to act as common area for event emission & consumption
// should probably be redux / flux thing at some point

var events = require('events');

var EventEmitter = events.EventEmitter;

var eventEmitter = new EventEmitter();

module.exports = eventEmitter;
