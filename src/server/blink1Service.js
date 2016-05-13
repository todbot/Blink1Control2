/**
 *
 */

"use strict";

var _ = require('lodash');

var Blink1 = require('node-blink1');

var tinycolor = require('tinycolor2');

var config = require('../configuration');

var log = require('../logger');
var util = require('../utils');

// globals because we are a singleton
var listeners = {};

// blink1 devices currently opened
// one entry per blink1, with always at least one entry
// entry 0 is 'default' entry when no blink1 is plugged in
// format is
var blink1s = []; // collection of opened blink1s
    // {   serial: '12345678',
    //     device: new Blink1()
    // }
// var blink1IdOpen = 0;

// one entry per blink1, with always at least one entry
// entry 0 is 'default' entry when no blink1 is plugged in
var currentState = new Array(8);  // 8 is max number of blink1s allowed
currentState[0] =
	{
		colors: new Array(18), // replaces "currentColor", 18 element array, one per LEDs
		millis: 100, // replaces "currentMillis"
		ledn:0 // replaces curerntLedN
	};
currentState[0].colors.fill( tinycolor('#000000'));
currentState.fill( currentState[0] ); // hmmmm
var lastState = _.clone( currentState ); // FIXME: what am I using lastState for?


var Blink1Service = {
	toyEnable: false,
	toyTimer:null,
	conf: {},
	start: function() {
		listeners = {}; // erase previous listeners
		this.reloadConfig();
	},
	reloadConfig: function() {
		log.msg("Blink1Service.reloadConfig");
        this.conf = config.readSettings('blink1Service') || {};
		Blink1Service._removeAllDevices();
		Blink1Service.scanForDevices();
	},
	scanForDevices: function() {
		// log.msg("Blink1Service.scanForDevices");
		// initial population of any already-plugged in devices
		var serials = Blink1.devices();
        serials.sort();
		serials.map( function(s) {
			Blink1Service._addDevice(s);
		});

		log.msg("Blink1Service.scanForDevices: done. serials:", serials);
		if( serials.length === 0 ) { // no blink1s, look for insertion events
			if( this.conf.deviceRescan ) {
				setTimeout( this.scanForDevices.bind(this), 5000);  // look again in 5 secs
			}
		}
	},
    _addDevice: function(serialnumber) {
        log.msg("Blink1Service._addDevice:", serialnumber);
        var olddev = _.find( blink1s, {serial:serialnumber} );
        if( !olddev ) {
            log.msg("Blink1Service._addDevice: new serial ", serialnumber);
            blink1s.push( { serial: serialnumber, device: null, toSetup:true } );
        }
        // set up all devices at once
        // we wait 500msec because it was failing without it
        setTimeout( Blink1Service._setupFoundDevices, 500);
    },
    _setupFoundDevices: function() {
        log.msg("Blink1Service._setupFoundDevices", blink1s);
        blink1s.map( function(b1) {
            if( !b1.device ) {
                log.msg("Blink1Service._setupFoundDevice: opening ",b1.serial);
                b1.device = new Blink1(b1.serial);
            }
        });
        Blink1Service.notifyChange();
    },
    _removeDevice: function(serialnumber) {
    	log.msg("Blink1Service._removeDevice: current devices:", blink1s);
        var olds = _.remove( blink1s, {serial:serialnumber} );
        olds.forEach( function(b1) {
            if( b1.device ) {
                b1.device.close();
                b1.device = null;
            }
        });
        setTimeout( this.scanForDevices.bind(this), 5000);
    },
	_removeAllDevices: function() {
		log.msg("Blink1Service._removeAllDevices");
        blink1s.forEach( function(b1) {
            if( b1.device ) {
                b1.device.close();
                b1.device = null;
            }
        });
        blink1s = [ ]; //{serial: '', device: null } ]; // startup state
		log.msg("Blink1Service._removeAllDevices: done");
        // FIXME: notify?
	},

	// private function, accesses hardware
    _fadeToRGB: function( millis, r,g,b, ledn, blink1_id ) {
        var id = (blink1_id) ? blink1_id : 0; // FIXME: maybe is serial

        if( blink1s[id] && blink1s[id].device ) {
            try {
				blink1s[id].device.fadeToRGB( millis, r, g, b, ledn );
			} catch(err) {
				log.msg('Blink1Service._fadeToRGB: error', err);
				this._removeDevice( blink1s[id].serial );
			}
        }
    },


	// begin public functions

	getAllSerials: function() {
		return blink1s.map(function(b1) { return b1.serial; });
	},
    // FIXME: support multiple blink1s
	isConnected: function() {
        // return (blink1serials.length > 0);
        var isConnected = false;
        blink1s.map( function(b1) {
            if( b1.device ) { isConnected = true; }
        });
        return isConnected;
	},
    // FIXME: support multiple blink1s
	serialNumber: function() {
		if( this.isConnected() ) {
			return blink1s[0].serial;
		}
		return '';
	},
    // FIXME: support multiple blink1s
	serialNumberForDisplay: function() {
		return (this.isConnected()) ? this.serialNumber() : '-';
	},
	// FIXME: fix and call this blink1Id or something
	iftttKey: function() {  // FIXME:
		var s = this.serialNumber() || '00000000';
		var k = this.hostId() + s;
		return k;
	},
	hostId: function() {
		var id = config.readSettings('hostId');
		if( !id ) {
			id = util.generateRandomHostId();
			this.setHostId(id);
		}
		return id;
	},
	setHostId: function(id) {
		config.saveSettings( 'hostId', id);
		// this.notifyChange();
	},

    // FIXME: support multiple blink1s
	setCurrentLedN: function(n) {
		currentState[0].ledn = n;
		this.notifyChange();
	},
    // FIXME: support multiple blink1s
	getCurrentLedN: function() {
		return currentState[0].ledn;
	},
    // FIXME: support multiple blink1s
	setCurrentMillis: function(m) {
		currentState[0].millis = m;
		this.notifyChange();
	},
    // FIXME: support multiple blink1s
	getCurrentMillis: function() {
		return currentState[0].millis;
	},
    // FIXME: support multiple blink1s
	getCurrentColor: function() { // FIXME
		// var ledn = (currentLedN>0) ? currentLedN-1 : currentLedN;
		var curledn = currentState[0].ledn;
		curledn = (curledn>0) ? curledn-1 : curledn;
		return currentState[0].colors[ curledn ];
	},
	getCurrentColors: function() {
		// return currentColors;
		return currentState[0].colors;
	},
	// main entry point for this service, sets currentColor & currentLedN
	// 'color' arg is a tinycolor() color or hextring ('#ff00ff')
	// if color is a hexstring, it will get converted to tinycolor
	// ledn is 1-index into color array, and ledn=0 means "all leds"
    // blink1_id is index into blink1s array (but should also be by serialnumber)
    // FIXME: currentState[0] will be currentState[blink1_id]
    //
	fadeToColor: function( millis, color, ledn, blink1_id) {
		var id = blink1_id || 0;
		ledn = ledn || 0;
		if( typeof color === 'string' ) {
			color = tinycolor( color ); // FIXME: must be better way
		}

		var colors = _.clone(currentState[id].colors);
		// handle special meaning: ledn=0 -> all LEDs
		if( ledn === 0 ) { colors.fill( color );
		} else {           colors[ledn-1] = color;	}

		lastState[id] = currentState[id];
		currentState[id] = {ledn: ledn, millis: millis, colors };

		// FIXME: how to make sure 'color' is a tinycolor object? color.isValid?
		log.msg("Blink1Service.fadeToColor:"+id+":", millis,ledn, color.toHexString());
                //, typeof color, (color instanceof String) );
		var crgb = color.toRgb();

		// divide currentMillis by two to make it appear more responsive
		// by having blink1 be at destination color for half the time
		this._fadeToRGB( millis/2, crgb.r, crgb.g, crgb.b, ledn, id);

		this.notifyChange();
	},

	off: function() {
		this.toyEnable = false;
		this.fadeToColor(0, '#000000', 0); // 0 = all leds
	},
	colorCycleStart: function() {
		this.toyEnable = true;
		this.colorCycleDo();
	},
	colorCycleStop: function() {
		this.toyEnable = false;
		clearTimeout( this.toyTimer );
	},
	colorCycleDo: function() {
		log.msg("Blink1Service.colorCycleDo");
		if( !this.toyEnable ) { return; }
		this.fadeToColor( 100, tinycolor.random(), 0 );
		this.toyTimer = setTimeout(this.colorCycleDo.bind(this), 300);
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		// console.log("Blink1Service: addChangelistener", listeners );
	},
	removeChangeListener: function(callername) {
		log.msg("Blink1Service.removeChangelistener: removing", callername);
		delete listeners[callername];
		// log.msg("Blink1Service.removeChangelistener", listeners );
	},
	removeAllListeners: function() {
		_.keys( listeners, function(callername) {
			this.removeChangelistener(callername);
		});
	},
	notifyChange: function() {
		_.forIn( listeners, function(callback) {
			// currentColor and currentColors are tinycolor objects
			// callback( Blink1Service.getCurrentColor(), currentColors, currentLedN, currentMillis);
            callback( Blink1Service.getCurrentColor(), currentState[0].colors, currentState[0].ledn, currentState[0].millis );
		});
	},


};


module.exports = Blink1Service;

// _closeCurrentDevice: function()	{
// 	log.msg('Blink1Service._closeCurrentDevice: closing blink1');
// 	if( blink1 ) {
// 		blink1.close();
// 		blink1 = null;
// 	}
// },
