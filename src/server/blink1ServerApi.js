"use strict";

var usbDetect = require('usb-detection');
var Blink1 = require('node-blink1');

var colorparse = require('parse-color');


var blink1serials = []; // no, use hash? Blink1.devices();

var blink1 = null;
var blink1Vid = 0x27B8;
var blink1Pid = 0x01ED;

//var currentColor = colorparse('#ff00ff');
var currentColor = '#ff00ff';

var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Blink1ServerApi = {

  startDeviceListener: function() {
		console.log("blink1serials:", typeof blink1serials);
    // initial population of any already-plugged in devices
    var serials = Blink1.devices();
    serials.map( function(s) {
      Blink1ServerApi._addDevice(s);
    });

    console.log('Blink1ServerApi.startDeviceListener');
    // -- USB detection api
    // https://github.com/MadLittleMods/node-usb-detection
    usbDetect.on('add', function(device) {
      console.log('add', JSON.stringify(device), device);
      var vid = device.vendorId;
      var pid = device.productId;
      var serialnumber = device.serialNumber;
      if( vid === blink1Vid && pid === blink1Pid ) {
        //console.log('Blink1ServerApi.deviceListener, added', vid, pid, serialnumber);
        Blink1ServerApi._addDevice( serialnumber );
      }
    });
    usbDetect.on('remove', function(device) {
      //console.log('remove', device);
      var vid = device.vendorId;
      var pid = device.productId;
      var serialnumber = device.serialNumber;
      if( vid === blink1Vid && pid === blink1Pid ) {
        Blink1ServerApi._removeDevice( serialnumber );
      }
    });
  },

  closeAll: function() {
		console.log("Blink1ServerApi closeAll");
		if( blink1 ) { blink1.off(); }
		blink1serials.map( Blink1ServerApi._removeDevice );
    usbDetect.stopMonitoring();
  },

  _addDevice: function(serialnumber) {
    console.log("Blink1ServerApi._addDevice", JSON.stringify(blink1serials));
    if( blink1serials.indexOf(serialnumber) === -1 ) {
      console.log("new serial, lighting it up");
      setTimeout(function() {
        Blink1ServerApi._testDevice();  // FIXME: remove
      }, 500);
			blink1serials.push(serialnumber);
    }
  },
  _removeDevice: function(serialnumber) {
    console.log("Blink1ServerApi._removeDevice", JSON.stringify(blink1serials));
		var i = blink1serials.indexOf(serialnumber);
		if( i > -1 ) {  // FIXME: this seems hacky
			delete blink1serials[i];
		}
    if( blink1 ) {
      console.log("closing blink1");
      blink1.close();
      blink1 = null;
    }
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
    if( blink1 ) {
      blink1.fadeToRGB( millis, r, g, b );
    }
    else {
      //bconsole.log("Blink1ServerApi._fadeToRGB: no blink1");
    }
  },

  fadeToColor: function( millis, color ) {
    //console.log("Blink1ServerApi.fadeToColor:", typeof color, (color instanceof String), JSON.stringify(color) ); //, " : ", color);
    //if( color instanceof String ) {  // NOOOO, this is not always true, literals vs objects
    if( typeof color === 'string' ) {
      color = colorparse( color ); // FIXME: must be better way
    }
    currentColor = color.hex;
    console.log("Blink1ServerApi.fadeToColor: currentColor:", currentColor, "ms:", millis );

    Blink1ServerApi._fadeToRGB( millis, color.rgb[0], color.rgb[1], color.rgb[2]);
  },

  getCurrentColor: function() {
    return currentColor;
  }


};


module.exports = Blink1ServerApi;
