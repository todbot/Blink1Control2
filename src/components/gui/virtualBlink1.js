"use strict";

var React = require('react');

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');

var mystyle = {
	width: 150,
	height: 120,
	display: "block",
};

var VirtualBlink1 = React.createClass({
	getInitialState: function() {
		return {
			color: '#ff00ff'
		};
	},
	fetchBlink1Color: function(color) {
		//console.log("fetchBlink1Color", color); //, Blink1Service.getCurrentColor() );
		this.setState( {
			color: color // Blink1Service.getCurrentColor()
		});
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "virtualBlink1" );
	},
	render: function() {
		//console.log("virtualBlink1.render:", this.props.blink1Color);
		mystyle.background = this.state.color;
		var img0style = { width: 240, height: 192, margin: 0, padding: 0,
			//background: this.props.blink1Color
			backgroundImage: [
				//'radial-gradient( rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.5} 0%, rgba(255,255,255,0.1) 65%)',
				"url(images/device-light-mask.png)",
				"radial-gradient(" + this.state.color + " 0%, rgba(255,255,255,0.1) 55%" + ")",
				"url(images/device-light-bg-top.png)",
				"url(images/device-light-bg.png)"
			]
		};
		//	<img style={img2style} src="images/device-light-bg.png" />
		//	<img style={img3style} src="images/device-light-mask.png" />
		// var img1style = { width: 240, height: 192 };
		// var img2style = { width: 240, height: 192, position: "relative", top: 0 };
		// var img3style = { width: 240, height: 192, position: "relative", top: 0 };
		return (
			<div style={img0style}>
			</div>
			);
	}
});

module.exports = VirtualBlink1;
