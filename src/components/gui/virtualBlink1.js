"use strict";

var React = require('react');

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');

// var _ = require('lodash');

// var mystyle = {
// 	width: 150,
// 	height: 120,
// 	display: "block",
// };

var VirtualBlink1 = React.createClass({
	getInitialState: function() {
		return {
			colors: ['#ff00ff', '#00ffff', 0,0,  0,0,0,0, 0,0,0,0 ]
		};
	},
	// callback to blink1service
	fetchBlink1Color: function(currentColor, colors, ledn) { // FIXME: use 'n'
		// console.log("VirtualBlink1.fetchBlink1Color", currentColor, colors, ledn); //, Blink1Service.getCurrentColor() );
		colors = colors.map(function(c) { return c.hex; }); // FIXME: consolidate color parsers
		this.setState( {
			colors: colors, // Blink1Service.getCurrentColor()
			ledn: ledn // unused currently
		});
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "virtualBlink1" );
	},
	render: function() {
		var topgradient = (this.state.colors[0] === '#000000') ? 'url()' :
		"radial-gradient(160px 90px at 150px 50px," + this.state.colors[0] + " 0%, rgba(255,255,255,0.6) 45% )";
		// "radial-gradient(160px 90px at 150px 50px," + 'rgba(0,255,0,1.0)' + " 0%, rgba(255,255,255,0.6) 45% )";
		var botgradient = (this.state.colors[1] === '#000000') ? 'url()' :
		"radial-gradient(160px 90px at 150px 110px," + this.state.colors[1] + " 0%, rgba(255,255,255,0.6) 45% )";
		// "radial-gradient(160px 90px at 150px 110px," + 'rgba(0,255,0,1.0)' + " 0%, rgba(255,255,255,0.6) 45% )";

		// linear-gradient(to bottom, rgba(30,87,153,1) 0%,rgba(66,124,183,0) 38%,rgba(125,185,232,0) 100%);
		var img0style = { width: 240, height: 150, margin: 0, padding: 0,
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
	}
});

module.exports = VirtualBlink1;
