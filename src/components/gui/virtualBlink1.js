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

// var blackc = tinycolor('#000000');

var VirtualBlink1 = React.createClass({
	getInitialState: function() {
		return {
			// colors: ['#ff00ff', '#00ffff', 0,0,  0,0,0,0, 0,0,0,0 ], // FIXME: should be blink1service.getCurrentColors()
			// colors: [ tinycolor('#ff00ff'), tinycolor('#00ffff') ],
			// nextColors: [ tinycolor('#ff00ff'), tinycolor('#00ffff') ],
			// lastColors:[ tinycolor('#ff00ff'), tinycolor('#00ffff')],
			colors: new Array(18).fill(tinycolor('#000033')),
			// millis: []
		};
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "virtualBlink1" );
	},
	// callback to Blink1Service
	fetchBlink1Color: function(lastColor, newcolors /*, ledn */) { // FIXME: where's millis?
		this.lastColors = this.state.colors;
		this.nextColors = newcolors;
		// this.setState( {
		// 	// colors: colors,
		// 	ledn: ledn // unused currently
		// });
		this._colorFaderStart();
	},

	ledn: 0,
	nextColors: new Array(18).fill(tinycolor('#ff00ff')),
	lastColors: new Array(18).fill(tinycolor('#ff00ff')),
	timer: null,
	faderMillis: 0,
	currentMillis: 0,
	stepMillis: 20,
	_colorFaderStart: function() {
		clearTimeout(this.timer);
		this.faderMillis = 0;  // goes from 0 to currentMillis
		this.currentMillis = Blink1Service.getCurrentMillis() || this.stepMillis; // FIXME: HACK
		this._colorFader();
		// console.log("---start:",new Date().getTime() );
	},
	_colorFader: function() {
		var self = this;
		var p = (this.faderMillis/this.currentMillis);  // ranges from 0.0 to 1.0 -ish
		var ledn = this.state.ledn;
		var ledst = ledn-1;
		var ledend = ledn;
		var colors = this.state.colors;
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
		this.setState({colors: colors});

		self.faderMillis += self.stepMillis;
		// this.notifyChange();
		if( p < 1 ) {
			this.timer = setTimeout(function() {
				// console.log("    _colorFader: r:",r);
				self._colorFader();
			}, this.stepMillis);
		}
		// else {
		//   console.log("---  end:",new Date().getTime() );
		// }
	},

	render: function() {
		var topgradient = (this.state.colors[0] === '#000000') ? 'url()' :
		"radial-gradient(160px 90px at 150px 50px," + this.state.colors[0].toHexString() + " 0%, rgba(255,255,255,0.6) 45% )";
		// "radial-gradient(160px 90px at 150px 50px," + 'rgba(0,255,0,1.0)' + " 0%, rgba(255,255,255,0.6) 45% )";
		var botgradient = (this.state.colors[1] === '#000000') ? 'url()' :
		"radial-gradient(160px 90px at 150px 110px," + this.state.colors[1].toHexString() + " 0%, rgba(255,255,255,0.6) 45% )";
		// "radial-gradient(160px 90px at 150px 110px," + 'rgba(0,255,0,1.0)' + " 0%, rgba(255,255,255,0.6) 45% )";

		// linear-gradient(to bottom, rgba(30,87,153,1) 0%,rgba(66,124,183,0) 38%,rgba(125,185,232,0) 100%);
		var img0style = { width: 240, height: 150, margin: 0, padding: 0, marginTop:-15, // FIXME why do I need marginTop-15?
			border: '0px solid grey',
			//background: this.props.blink1Color
			backgroundImage: [
				topgradient,
				// topgradient,
				//'radial-gradient( rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.5} 0%, rgba(255,255,255,0.1) 65%)',
				"url(images/device-light-mask.png)",
				// "url(images/device-preview.png)",
				// "radial-gradient(120px at 160px 50px," + this.state.color + " 0%, rgba(255,255,255,0.1) 55%" + ")",
				// "radial-gradient(this.state.color + " 0%, rgba(255,255,255,0.1) 55%" + ")",
				//"url(images/device-light-bg.png)",
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
		return (
			<div style={img0style}></div>
			);

			// <div>
			// <svg>
         //  		<circle cx={50} cy={50} r={10} fill="red" ref='todbot' onClick={this.boop} onMouseOver={this.boop} />
        	// </svg>
			// </div>
	}
});

module.exports = VirtualBlink1;
