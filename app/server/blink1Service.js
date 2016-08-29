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

var Eventer = require('../eventer');

// some globals because we are a singleton

/**
 * Maximum support blink(1) devices for this service. GUI supports up to 8 I think
 */
var maxBlink1s = 4;
/**
 * Number of individual LEDs allowed in a blink(1) device.  Max is 18, 2 for dev
 */
var maxLEDsPerBlink1 = 2; // 18

var listeners = {};  // callback listeners

/**
 * blink1 devices currently opened.
 * One entry per blink1, with always at least one entry.
 * Entry 0 is 'default' entry when no blink1 is plugged in.
 * Format:
 *  {  serial: '12345678',
 *     device: new Blink1()
 *  }
 * @type {Array}
 */
var blink1s = []; // collection of opened blink1s
var currentBlink1Id = 0; // current blink1 (as set by colorpicker)

/**
 * Current color state of all blink1s and their last used millis & ledns,
 *  with at least one entry.
 *  Entry 0 is 'default' entry when no blink1 is present.
 *  Supports 8 blink1s currently.
 * @type Array
 */
var currentState = [];
for( var i=0; i< maxBlink1s; i++ ) {
    var cs = new Array( maxLEDsPerBlink1);
    cs.fill( tinycolor('#10100'+i));
    currentState.push( {
            colors: cs,
            millis: 100,
            ledn:0
        }
    );
}

var Blink1Service = {
	// toyEnable: false,
	// toyTimer:null,
	// toyMode:'off',
	// toyValue:0,

	// settings for toy button commands
	toy: {
		enable: false,
		timer: null,
		interval: 0,
		mode: 'off',
		value: 0,
	},
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
        serials.reverse(); // newest blink1s first
		serials.map( function(s) {
			Blink1Service._addDevice(s);
		});

		// log.msg("Blink1Service.scanForDevices: done. serials:", serials);
		if( serials.length === 0 ) { // no blink1s, look for insertion events
			if( this.conf.deviceRescan ) {
				setTimeout( this.scanForDevices.bind(this), 5000);  // look again in 5 secs
			}
		}
	},
	/**
 	 * Add a blink1 to the device list.
 	 * @constructor
 	 * @param {string} serialnumber - serialnumber of blink1 to add
 	 */
    _addDevice: function(serialnumber) {
        log.msg("Blink1Service._addDevice:", serialnumber);
        var olddev = _.find( blink1s, {serial:serialnumber} );
        if( !olddev ) {
            log.msg("Blink1Service._addDevice: new serial ", serialnumber);
            blink1s.push( { serial: serialnumber, device: null, toSetup:true } );
        }
        // set up all devices at once
        // we wait 500msec because it was failing without it
        setTimeout( Blink1Service._setupFoundDevices, 500);  // FIXME: an issue?
    },
    _setupFoundDevices: function() {
        log.msg("Blink1Service._setupFoundDevices", blink1s);
        blink1s.map( function(b1) {
            if( !b1.device ) {
                log.msg("Blink1Service._setupFoundDevice: opening ",b1.serial);
                b1.device = new Blink1(b1.serial);
            }
        });

        // TrayMaker.updateTrayMenu();
        Eventer.emit('deviceUpdated');

        Blink1Service.notifyChange();
    },
	/**
	 * Remove a blink1 from the device list.  Triggers a scanForDevices()
	 * @method function
	 * @param  {string} serialnumber serial number of blink1 to remove
	 */
    _removeDevice: function(serialnumber) {
    	log.msg("Blink1Service._removeDevice: current devices:", blink1s);
        var olds = _.remove( blink1s, {serial:serialnumber} );
        olds.forEach( function(b1) {
            if( b1.device ) {
                b1.device.close();
                b1.device = null;
            }
        });
        // if( currentBlink1Id === serialnumber ) {
        //     log.msg("FORGETTING OLD BLINK1!!!!");
        //     currentBlink1Id = 0;
        // }
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

	/**
	 * Fade to an RGB color over time, on particular LED and blink1 device.
	 *  Private function, accesses hardware.
	 *  assumes good & defined blink1idx, ledn, r,g,b, millis
 	 *  blink1idx is index into blink1s array
	 * @param  {number} millis    milliseconds to fade
	 * @param  {Color}  color     tinycolor object
	 * @param  {number} ledn      which led, 0=all, 1-18
	 * @param  {number} blink1idx index into blink1s array
	 */
    _fadeToRGB: function( millis, color, ledn, blink1idx ) {
		// if the device exists
        if( blink1s[blink1idx] && blink1s[blink1idx].device ) {
			var crgb = color.toRgb();
            try {
				blink1s[blink1idx].device.fadeToRGB( millis, crgb.r, crgb.g, crgb.b, ledn );
			} catch(err) {
				log.error('Blink1Service._fadeToRGB: error', err);
				this._removeDevice( blink1s[blink1idx].serial );
                currentBlink1Id = 0;  // FIXME: is this the correct response to this error?
			}
        }
    },

	// begin public functions

	/**
	 * Return array of all blink1 serialnumbers
	 * @return {Array} array of blink1 serialnumbers
	 */
	getAllSerials: function() {
		return blink1s.map(function(b1) { return b1.serial; });
	},
    // FIXME: support multiple blink1s
    /**
     * Returns true if connected, really returns number of devices connected
     * @return {Number} return number of devices connected
     */
	isConnected: function() {
        // return (blink1serials.length > 0);
        var cnt = 0;
        blink1s.map( function(b1) {
            if( b1.device ) { cnt++; }
        });
        return cnt;
	},
    getStatusString: function() {
        //return Blink1Service.isConnected() ? "connected" : "not connected",
        var cnt = this.isConnected();
        return (cnt>1) ? cnt + " devices connected" : (cnt) ? "device connected" : "no device connected";
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
		// console.log("IFTTT KEY:",this.serialNumber());
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

	setCurrentBlink1Id(id) {
        log.msg("setCurrentBlink1Id: ",id);
		currentBlink1Id = id;
		this.notifyChange();
	},
	getCurrentBlink1Id() {
		return currentBlink1Id;
	},
    // FIXME: support multiple blink1s
	setCurrentLedN: function(n) {
		currentState[0].ledn = n;
		this.notifyChange();
	},
    // FIXME: support multiple blink1s
	getCurrentLedN: function(blink1id) {
        var blink1idx = this.idToBlink1Index(blink1id);
		// blink1idx = blink1idx || 0;
		return currentState[blink1idx].ledn;
	},
    // FIXME: support multiple blink1s
	setCurrentMillis: function(m) {
		currentState[0].millis = m;
		this.notifyChange();
	},
	getCurrentMillis: function(blink1id) {
		var blink1idx = this.idToBlink1Index(blink1id);
		return currentState[blink1idx].millis;
	},
	getCurrentColor: function(blink1id) { // FIXME
        var blink1idx = this.idToBlink1Index(blink1id);
		// blink1idx = blink1idx || this.idToBlink1Index(currentBlink1Id);
		var curledn = currentState[blink1idx].ledn;
		curledn = (curledn>0) ? curledn-1 : curledn; // 0 = all LEDs in a blink1, so shift or use 0th element as rep
		return currentState[blink1idx].colors[ curledn ];
	},
    // FIXME: this is confusing
	getCurrentColors: function(blink1id) {
        var blink1idx = this.idToBlink1Index(blink1id);
		// blink1idx = blink1idx || 0;
		return currentState[blink1idx].colors;
	},
	/**
	 * Lookup blink1id and map to an index in blink1s array
	 *  If 'blink1ToUse' is set, and blink1id is undefined or 0, use blink1ToUse
	 *  FIXME: Should use conf.blink1Service.blink1ToUse
	 *  FIXME: should convert serial to index
	 * @param  {number|String} blink1id array id (0-maxblink1s) or 8-digit blink1serial
	 * @return {number}        known-good index into blink1s array or 0
	 */
	idToBlink1Index: function(blink1id) {
		if( blink1id === undefined ) {
			if( this.conf.blink1ToUse ) {
				blink1id = this.conf.blink1ToUse;
			}
			else {
				blink1id = currentBlink1Id;
			}
		}
 		// it's an array index
 		if( blink1id >= 0 && blink1id < blink1s.length ) {
			return blink1id;
		}
		// otherwise it's a blink1 serialnumber, so search for it
		var blink1idx = 0; // default to first blink1
		blink1id = blink1id.toString().toUpperCase();
		blink1s.map( function(b,idx) {
			if( blink1id === b.serial ) {
				blink1idx = idx;
			}
		});
		return blink1idx;
	},
    // debug only
    dumpCurrentState: function() {
        var str = '';
        currentState.map( function(s, i) {
            var colorsstr = s.colors.reduce( function(prev,curr) { return prev +','+ curr.toHexString(); });
            str += i+ ': ledn:'+s.ledn+ ',millis:'+s.millis+ ',colors:'+colorsstr + '; ';
        });
        return str;
    },
    /**
	 * Main entry point for this service, sets currentColor & currentLedN
	 * 'color' arg is a tinycolor() color or hextring ('#ff00ff')
	 * if color is a hexstring, it will get converted to tinycolor
	 * ledn is 1-index into color array, and ledn=0 means "all leds"
     * blink1_id is index into blink1s array (but should also be by serialnumber)
     * FIXME: currentState[0] will be currentState[blink1idx]
     *
     * @param  {[type]} millis    [description]
     * @param  {[type]} color     [description]
     * @param  {[type]} ledn      [description]
     * @param  {[type]} blink1_id [description]
     * @return {[type]}           [description]
     */
	fadeToColor: function( millis, color, ledn, blink1_id) {
		ledn = ledn || 0;  // 0 == all LEDs
		if( typeof color === 'string' ) {
			color = tinycolor( color ); // FIXME: must be better way
		}
		// convert blink1_id to array index
		var blink1Idx = this.idToBlink1Index(blink1_id);

		// FIXME: how to make sure 'color' is a tinycolor object? color.isValid?
		// log.msg('Blink1Service.fadeToColor: blink1_idx:',blink1Idx,' msec:',millis,' ledn:',ledn,
		// 	' c:',color.toHexString(), " -- currentState:", this.dumpCurrentState()); // JSON.stringify(currentState,null,2));

		// var colors = _.clone(currentState[blink1Idx].colors);
		var colors = currentState[blink1Idx].colors;
		// handle special meaning: ledn=0 -> all LEDs
		if( ledn === 0 ) { colors.fill( color );
		} else {       colors[ledn-1] = color; }

		// FIXME: do we need these states and the blink1s struct?
		// lastState[blink1idx] = currentState[blink1idx];
		currentState[blink1Idx] = { ledn: ledn, millis: millis, colors: colors };

        this.notifyChange();

		// divide currentMillis by two to make it appear more responsive
		// by having blink1 be at destination color for half the time
		millis = millis/2;
		// color, ledn, & blink1idx is known-good at this point
		this._fadeToRGB( millis, color, ledn, blink1Idx);

	},

    /**
     * turn off everything, or for just a specific blink1
     * @method function
     * @param  {String} blink1id blink1 serial number or id or nothing
     * @return {[type]}          [description]
     */
	off: function(blink1id) {
		var self = this;
		self.toyStop();
		if( blink1id === undefined && blink1s.length > 0 ) {
			blink1s.map( function(serial,idx) {
				// console.log("POOP");
				self.fadeToColor(100, '#000000', 0, idx);
			});
		} else {
			self.fadeToColor(100, '#000000', 0, blink1id); // 0 = all leds
		}
	},

	/**
	 * Stop the toy engine
	 * @param  {String} mode Toy mode: 'moodlight', 'colorcycle', 'strobe'
	 */
	toyStop: function() {
 		this.toy.mode = '';
 		this.toy.enable = false;
 		if( this.toy.timer ) { clearTimeout( this.toy.timer ); }
 	},
	/**
	 * Start up the toy engine
	 * @param  {String} mode Toy mode: 'moodlight', 'colorcycle', 'strobe'
	 */
	toyStart: function(mode) {
		if( mode === 'moodlight' ) {
			this.toy.interval = 5000;
		}
		else if( mode === 'colorcycle' ) {
			this.toy.interval = 30;
			this.toy.value = Math.floor( Math.random() * 360 );
		}
		else if( mode === 'strobe' ) {
			this.toy.interval = 100;
			this.toy.value = '#FFFFFF';
		}
		else {
			log.msg("Blink1Service: unknown toy mode: ",mode);
			return;
		}
		this.toy.mode = mode;
		this.toy.enable = true;
		this.toyDo();
	},
	/**
	 * Actually do the toy in question
	 */
	toyDo: function() {
		if( !this.toy.enable ) { return; }
		if( this.toy.mode === 'moodlight' ) {
			this.fadeToColor( this.toy.interval, tinycolor.random(), 0 ); // FIXME: alternate LEDs?
		}
		else if( this.toy.mode === 'colorcycle' ) {
			this.toy.value += 2;
			this.toy.value = (this.toy.value>360) ? 0 : this.toy.value;
			var color = tinycolor({h:this.toy.value, s:1, v:1});
			this.fadeToColor( 100, color, 0 );
		}
		else if( this.toy.mode === 'strobe' ) {
			this.toy.value = (this.toy.value==='#000000') ? '#FFFFFF' : '#000000' ;
			this.fadeToColor( this.toy.interval, this.toy.value, 0 );
		}
		this.toy.timer = setTimeout(this.toyDo.bind(this), this.toy.interval);
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
		// log.msg("blink1service: listeners:",listeners);
		_.forIn( listeners, function(callback) {
			// currentColor and currentColors are tinycolor objects
			// callback( Blink1Service.getCurrentColor(), currentColors, currentLedN, currentMillis);
            // callback( Blink1Service.getCurrentColor(), currentState[0].colors, currentState[0].ledn, currentState[0].millis );
			callback();
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
