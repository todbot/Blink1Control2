"use strict";


var _ = require('lodash');

var remote = window.require('remote');
var HID = remote.require('node-hid');
var Blink1 = remote.require('node-blink1');

var blink1serials = Blink1.devices();

var blink1 = null;

if( blink1serials.length ) {
//	blink1 = new Blink1();
}

var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Blink1DeviceApi = {

	getAllSerials: function() {
		blink1serials = Blink1.devices();
		return _clone(blink1serials); 
	},

	isConnected: function() { 
		return (blink1serials.length > 0);
	},

	serialNumber: function() {
		if( this.isConnected() ) {
			return blink1serials[0];
		}
		return '';
	},
	serialNumberForDisplay: function() {
		if( this.isConnected() ) {
			return blink1serials[0];
		}
		return '-';
	},

	iftttKey: function() {  // FIXME:
		return "ABCD1234CAFE0000";
	},

	fadeToRGB: function( millis, r, g, b ) {
		if( blink1serials.length ) {
			blink1 = new Blink1();
			blink1.fadeToRGB( millis, r, g, b);
			blink1.close();
		}
	}
};
//console.log("blink1 devices!!!!!: ", JSON.stringify(blink1devices));


module.exports = Blink1DeviceApi;