"use strict";

var React = require('react');

var Blink1Api = require('../../api/Blink1DeviceApi');

//var colorparse = require('parse-color');

var mystyle = {
	width: 150,
	height: 120,
    display: "block",
	marginLeft: "auto",
	marginRight: "auto"
};

var VirtualBlink1 = React.createClass({
	getInitialState: function() {
		return {
			blink1Color: '#ff00ff'
		};
	},
	// FIXME: this is kind of a big hack, use Flux!
	fetchBlink1Color: function() {
		this.setState( { 
			blink1Color: Blink1Api.getCurrentColor()
		});
		//console.log("fetchBlink1Color", Blink1Api.getCurrentColor() );
		setTimeout( this.fetchBlink1Color, 50 );
	},

	componentDidMount: function() {
		this.fetchBlink1Color();
	},

	render: function() {
		//console.log("virtualBlink1.render:", this.props.blink1Color);
		mystyle.background = this.state.blink1Color;
		//var colr = colorparse( this.props.blink1Color );
		//var c = colr.rgba;
		var img0style = { width: 240, height: 192, 
			//background: this.props.blink1Color
			backgroundImage: [	
								//'radial-gradient( rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.5} 0%, rgba(255,255,255,0.1) 65%)',
								"url(images/device-light-mask.png)",
								"radial-gradient(" + this.state.blink1Color + " 0%, rgba(255,255,255,0.1) 55%" + ")",
								"url(images/device-light-bg-top.png)", 
								"url(images/device-light-bg.png)"
								]
								
		};
		//	<img style={img2style} src="images/device-light-bg.png" />
		//	<img style={img3style} src="images/device-light-mask.png" />

		var img1style = { width: 240, height: 192 };
		var img2style = { width: 240, height: 192, position: "relative", top: 0 };
		var img3style = { width: 240, height: 192, position: "relative", top: 0 };
		return (
			<div style={img0style}> 
			</div>
			);
	}
});

module.exports = VirtualBlink1; 