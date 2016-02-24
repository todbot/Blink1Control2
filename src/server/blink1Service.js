/**
 *
 */

"use strict";

var _ = require('lodash');
var doUsbDetect = false;

var Blink1 = require('node-blink1');
var usbDetect = (doUsbDetect) ? require('usb-detection') : null;

var tinycolor = require('tinycolor2');

// globals because we are a singleton
var listeners = {};
var blink1serials = []; // no, use hash? Blink1.devices();

var blink1 = null;
var blink1Vid = 0x27B8;
var blink1Pid = 0x01ED;

//var currentColor = colorparse('#ff00ff');
// array of colors, one per LED of blink1.
var currentColors = new Array( 16 ); // FIXME: 16 LEDs in current blink1 firmware
var currentMillis = 100;
var currentLedN = 0;
var lastColors = new Array(16);

// var timer;
// var stepMillis = 20;
// var faderMillis = 0;
// var faderColor;

lastColors.fill( tinycolor('#000000') ); // FIXME: hack
currentColors.fill( tinycolor('#000000') );

var Blink1Service = {

	startDeviceListener: function() {
		listeners = []; // erase previous listeners
		console.log("blink1serials:", typeof blink1serials);
		// initial population of any already-plugged in devices
		var serials = Blink1.devices();
		serials.map( function(s) {
			Blink1Service._addDevice(s);
		});

		console.log('Blink1ServerApi.startDeviceListener');
		if( !usbDetect ) { return; }

		// -- USB detection api
		// https://github.com/MadLittleMods/node-usb-detection
		usbDetect.on('add', function(device) {
			console.log('add', JSON.stringify(device), device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				//console.log('Blink1ServerApi.deviceListener, added', vid, pid, serialnumber);
				Blink1Service._addDevice( serialnumber );
			}
		});
		usbDetect.on('remove', function(device) {
			//console.log('remove', device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				Blink1Service._removeDevice( serialnumber );
			}
		});
	},

	closeAll: function() {
		console.log("Blink1ServerApi closeAll");
		if( usbDetect ) { usbDetect.stopMonitoring(); }
		// if( blink1 ) {
		// 	blink1.off();
		// 	// blink1.close();
		// }
		// blink1serials.map( Blink1Service._removeDevice );
		//this.removeAllListeners();
	},

	_addDevice: function(serialnumber) {
		console.log("Blink1ServerApi._addDevice: current serials:", JSON.stringify(blink1serials));
		if( blink1serials.indexOf(serialnumber) === -1 ) {
			console.log("new serial " + serialnumber + ", adding it");
			setTimeout(function() {
				Blink1Service._setupDevice();  // FIXME: remove
			}, 500);
			blink1serials.push(serialnumber);
		}
	},
	_removeDevice: function(serialnumber) {
		console.log("Blink1Service._removeDevice: current serials:", JSON.stringify(blink1serials));
		var i = blink1serials.indexOf(serialnumber);
		if( i > -1 ) {  // FIXME: this seems hacky
			blink1serials.splice(i, 1);
		}
		if( blink1 ) {
			console.log("closing blink1");
			blink1.close();
			blink1 = null;
			this.notifyChange();
		}
		console.log("Blink1Service._removeDevice: new current serials:", JSON.stringify(blink1serials));
	},
	_setupDevice: function() {
		console.log("opening blink1");
		if( !blink1 ) {
			blink1 = new Blink1();
			this.notifyChange();
		}
	},

	// private function, accesses hardware
	_fadeToRGB: function( millis, r, g, b, n ) {
		if( blink1 ) {
			blink1.fadeToRGB( millis, r, g, b, n );
		}
		// else { console.log("Blink1Service._fadeToRGB: no blink1"); }
	},

	// begin public functions

	getAllSerials: function() {
		//blink1serials = Blink1.devices();
		return _.clone(blink1serials);
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
	// FIXME: fix and call this blink1Id or something
	iftttKey: function() {  // FIXME:
		var s = this.serialNumber();
		if( s ) {
			return s + s;
		} else {
			return "ABCD1234CAFE0000";
		}
	},

	getCurrentLedN: function() {
		return currentLedN;
	},
	getCurrentMillis: function() {
		return currentMillis;
	},
	getCurrentColor: function() { // FIXME
		// console.log("Blink1Service.getCurrentColor: ", currentLedN);
		var ledn = (currentLedN>0) ? currentLedN-1 : currentLedN;
		return currentColors[ ledn ];
	},
	getCurrentColors: function() {
		return currentColors;
	},

	// main entry point for this service, sets currentColor & currentLedN
	// 'color' arg is a tinycolor() color or hextring ('#ff00ff')
	// if color is a hexstring, it will get converted to tinycolor
	fadeToColor: function( millis, color, ledn) {
		ledn = ledn || 0;
		currentLedN = ledn;
		currentMillis = millis;
		lastColors = _.clone(currentColors);

		if( typeof color === 'string' ) {
			color = tinycolor( color ); // FIXME: must be better way
		}

		console.log("Blink1Service.fadeToColor:", millis,ledn, color.toHexString());//, typeof color, (color instanceof String) );

		// handle special meaning: ledn=0 -> all LEDs
		if( ledn === 0 ) {
			currentColors.fill( color );
		} else {
		 	currentColors[ledn-1] = color;
		}
		var crgb = color.toRgb();
		this._fadeToRGB( millis, crgb.r, crgb.g, crgb.b, ledn);

		this.notifyChange();
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		// console.log("Blink1Service: addChangelistener", listeners );
	},
	removeChangeListener: function(callername) {
		console.log("removeChangelistener: removing", callername);
		delete listeners[callername];
		console.log("Blink1Service: removeChangelistener", listeners );
	},
	removeAllListeners: function() {
		_.keys( listeners, function(callername) {
			this.removeChangelistener(callername);
		});
	},
	notifyChange: function() {
		_.forIn( listeners, function(callback) {
			// currentColor and currentColors are tinycolor objects
			callback( Blink1Service.getCurrentColor(), currentColors, currentLedN, currentMillis);
		});
	},


};


module.exports = Blink1Service;
