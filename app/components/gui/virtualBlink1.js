/**
 * VirtualBlink1 -- on-screen representation of what's going on with blink(1) device
 * - represents current colors (from Blink1Service) on-screen
 * - runs multi-channel fading algorithm, similar to real blink(1)
 * - updates Blink1ColorPicker with fade updates
 *
 */


"use strict";

// var _ = require('lodash');

var React = require('react');

var Blink1Service = require('../../server/blink1Service');

var tinycolor = require('tinycolor2');
var d3 = require('d3-timer');

// var blackc = tinycolor('#000000');

var VirtualBlink1 = React.createClass({
	getInitialState: function() {
		return {
			// colors: ['#ff00ff', '#00ffff', 0,0,  0,0,0,0, 0,0,0,0 ], // FIXME: should be blink1service.getCurrentColors()
			// colors: [ tinycolor('#ff00ff'), tinycolor('#00ffff') ],
			// nextColors: [ tinycolor('#ff00ff'), tinycolor('#00ffff') ],
			// lastColors:[ tinycolor('#ff00ff'), tinycolor('#00ffff')],
			colors: new Array(2).fill(tinycolor('#000033')),
			// millis: []
		};
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "virtualBlink1" );
	},
	// callback to Blink1Service
	// fetchBlink1Color: function(lastColor, newcolors /*, ledn */) { // FIXME: where's millis?
	fetchBlink1Color: function() {
        // console.log("virtualBlink1.fetchBlink1Color");
		this.lastColors = this.state.colors;
        this.blink1Idx = Blink1Service.getCurrentBlink1Id();
		this.nextColors = Blink1Service.getCurrentColors( this.blink1Idx );
		this._colorFaderStart();
	},
	handleBlink1IdxChange: function(idx) {
		Blink1Service.setCurrentBlink1Id(idx);
	},

	blink1Idx: 0,
	ledn: 0,
	nextColors: new Array(2).fill(tinycolor('#ff00ff')), // ledn colors
	lastColors: new Array(2).fill(tinycolor('#ff00ff')), // last ledn colors
	timer: null,
	faderMillis: 0,
	currentMillis: 0,
	stepMillis: 25,

	_colorFaderStart: function() {
		// if( this.timer ) { clearTimeout(this.timer); }
		// if( this.timer ) { this.timer.stop(); }
		// if( !this.timer ) {
        //     this.timer = d3.interval( this._colorFaderInterval, this.stepMillis );
        // }
        this.faderMillis = 0;  // shouldb be 0;  // goes from 0 to currentMillis
		this.currentMillis = Blink1Service.getCurrentMillis() || this.stepMillis; // FIXME: HACK
        this.currentMillis = this.currentMillis / 2; // FIXME: to match what blink1service does

        var now = d3.now();
        var nowDelta = now - this.lastNow;
        if( nowDelta <= 100 || this.currentMillis <= 100 ) {
            this.faderMillis = this.currentMillis; // no fading, go to color immediately
        }
        this.lastNow = now;
        // console.log("--- START:",nowDelta, "currentMillis:", this.currentMillis, "stepMillis:",this.stepMillis );
		this._colorFader();
	},

    _colorFader: function() {
        var self = this;
		var p = (this.faderMillis / this.currentMillis);  // "percentage done", ranges from 0.0 to 1.0 -ish
        if( p > 1.0 ) { p = 1.0; } // guard against going over 100%
        // console.log("--- fader:", "faderMillis:", this.faderMillis, "p:",p);
        self.faderMillis += self.stepMillis;

        var ledn = self.state.ledn;
		var ledst = ledn-1;
		var ledend = ledn;
		var colors = self.state.colors; //_.clone(this.state.colors);
		if( ledn===0 ) { ledst = 0; ledend = colors.length-1; }
		colors.slice(ledst, ledend).map( function(c,i) {
			var oldc = self.lastColors[i].toRgb();
			var newc = self.nextColors[i].toRgb();
			var r = (1-p) * (oldc.r) + (p * newc.r);
			var g = (1-p) * (oldc.g) + (p * newc.g);
			var b = (1-p) * (oldc.b) + (p * newc.b);
			var tmpc =  tinycolor( {r:r,g:g,b:b} );
			colors[i] = tmpc;
		});
		self.setState({colors: colors});

        this.timer = (p<1) ? d3.timeout( self._colorFader, self.stepMillis ) : null;
    },

	render: function() {
        var topLum = this.state.colors[0].toHsl().l; //was .getLuminance();
        var botLum = this.state.colors[1].toHsl().l;
        var topColor = tinycolor(this.state.colors[0]).setAlpha(topLum);
        var botColor = tinycolor(this.state.colors[1]).setAlpha(botLum); // was (Math.pow(botLum,0.5));
        // var topColor = tinycolor(this.state.colors[0]).setAlpha(Math.pow(topLum,0.5));
        // var botColor = tinycolor(this.state.colors[1]).setAlpha(Math.pow(botLum,0.5));
        var colorDesc = "A:"+this.state.colors[0] + "\nB:"+ this.state.colors[1];

        // console.log("VirtualBlink1: color0:",topColor.toRgbString());
        var topgradient =  // (this.state.colors[0].toHexString() === '#000000') ?
		"radial-gradient(160px 90px at 150px 50px," + topColor.toRgbString() + " 20%, rgba(255,255,255,0.2) 55% )";
		var botgradient = //(this.state.colors[1].toHexString() === '#000000') ? 'url()' :
		"radial-gradient(160px 90px at 150px 110px," + botColor.toRgbString() + " 20%, rgba(255,255,255,0.2) 55% )";

        // "radial-gradient(160px 90px at 150px 110px," + this.state.colors[1].toRgbString() + " 0%, rgba(255,255,255,0.2) 55% )";
		// linear-gradient(to bottom, rgba(30,87,153,1) 0%,rgba(66,124,183,0) 38%,rgba(125,185,232,0) 100%);

		var img0style = { width: 240, height: 150, margin: 0, padding: 0, marginTop:-15, // FIXME why do I need marginTop-15?
			border: '0px solid grey',
			//background: this.props.blink1Color
			backgroundImage: [
    			topgradient,
                "url(images/device-light-bg.png)",
				// topgradient,
				"url(images/device-light-mask.png)",
				// "url(images/device-preview.png)",
				"url(images/device-light-bg-bottom.png)",
				"url(images/device-light-bg-top.png)",
				botgradient,
			]
		};
			//	<img style={img2style} src="images/device-light-bg.png" />
			//	<img style={img3style} src="images/device-light-mask.png" />
			// var img1style = { width: 240, height: 192 };
			// var img2style = { width: 240, height: 192, position: "relative", top: 0 };
			// var img3style = { width: 240, height: 192, position: "relative", top: 0 };

		var makeMiniBlink1 = function(serial,idx) {
			var colrs = Blink1Service.getCurrentColors(idx);
			var colrA = colrs[0];
            var colrB = colrs[1];
			if( colrA.getBrightness() === 0 ) { colrA = '#888'; }
			if( colrB.getBrightness() === 0 ) { colrB = '#888'; }
			var titlestr = 'serial:'+serial +' A/B:'+colrs[0].toHexString().toUpperCase()+'/'+colrs[1].toHexString().toUpperCase();
			var borderStyle = (idx===this.blink1Idx) ? '2px solid #aaa' : '2px solid #eee';
			return (<div key={idx} onClick={this.handleBlink1IdxChange.bind(null,idx)} value={idx}
						style={{border:borderStyle, borderRadius:5, padding:0, margin:3 }}>
					<div style={{width:20, height:7, margin:0,padding:0,background:colrA, borderRadius:'3px 3px 0 0'}}
						title={titlestr} ></div>
                    <div style={{width:20, height:7, margin:0,padding:0,background:colrB, borderRadius:'0 0 3px 3px'}}
						title={titlestr} ></div>
					</div>
			);

		};
		var serials = Blink1Service.getAllSerials();
		var miniBlink1s = (serials.length > 1 ) ? serials.map(makeMiniBlink1, this) : null;
		return (
			<div style={{position:'relative', border:'0px solid green'}}>
				<div style={img0style} title={colorDesc}></div>
				<div style={{position:'absolute', top:5, left:0, padding:0, marginLeft:0}}>
					{miniBlink1s}
				</div>
			</div>
		);
	}

});

module.exports = VirtualBlink1;
