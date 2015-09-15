"use strict";

var _ = require('lodash');

var remote = window.require('remote');

//var HID = remote.require('node-hid');
var usbDetect = remote.require('usb-detection');

var Blink1 = remote.require('node-blink1');
var colorparse = require('parse-color');

var blink1serials = {}; // no, use hash? Blink1.devices();

var blink1 = null;
var blink1Vid = 0x27B8;
var blink1Pid = 0x01ED;

//if( blink1serials.length ) {
//	blink1 = new Blink1();
//}

var currentColor = colorparse('#ff00ff');

var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Blink1DeviceApi = {

	startDeviceListener: function() {
		console.log('startDeviceListener');
		// -- USB detection api
		// https://github.com/MadLittleMods/node-usb-detection
		usbDetect.on('add', function(device) {
			console.log('add', JSON.stringify(device), device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				console.log('added', vid, pid, serialnumber);
				Blink1DeviceApi._addDevice( serialnumber );
			}
		});
		usbDetect.on('remove', function(device) { 
			//console.log('remove', device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				console.log("BLINK1 REMOVED");
				delete blink1serials[serialnumber];
			}
			console.log('removed', vid, pid, serialnumber);
			if( blink1 ) {
				console.log("closing blink1");
				blink1.close();
				blink1 = null;
			}
		});
	},

	_addDevice: function(serialnumber) {
		console.log("BLINK1 ADDED");
		if( !blink1serials[serialnumber] ) { 
			console.log("new serial, lighting it up");
			setTimeout(function() {
				Blink1DeviceApi._testDevice();
			}, 500);
		}
		blink1serials[serialnumber] = 1;
	},
	_testDevice: function() {
		console.log("opening blink1 to test...");
		blink1 = new Blink1();
		blink1.fadeToRGB(100, 72, 72, 22 );
	},

	getAllSerials: function() {
		//blink1serials = Blink1.devices();
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

	_fadeToRGB: function( millis, r, g, b ) {
		//if( blink1serials.length ) {
		//	blink1 = new Blink1();
		//	blink1.fadeToRGB( millis, r, g, b);
		//	blink1.close();
		//}
	},

	fadeToColor: function( millis, color ) {
		//console.log("fadeToColor: color:", JSON.stringify(color) ); //, " : ", color);
		if( color instanceof String ) {
			color = colorparse( color ); // FIXME: must be better way
		}
		//if( color.rgb instanceof Array ) { 
		//	carr = color.rgb; 
		//}
		currentColor = color;
		Blink1DeviceApi._fadeToRGB( millis, color.rgb[0], color.rgb[1], color.rgb[2]);
	},

	getCurrentColor: function() {
		return currentColor.hex;
	}
};
//console.log("blink1 devices!!!!!: ", JSON.stringify(blink1devices));




module.exports = Blink1DeviceApi;