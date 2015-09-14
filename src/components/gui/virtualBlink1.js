"use strict";

var React = require('react');

var colorparse = require('parse-color');

var mystyle = {
	width: 150,
	height: 120,
    display: "block",
	marginLeft: "auto",
	marginRight: "auto"
};

var VirtualBlink1 = React.createClass({
	propTypes: {
		blink1Color: React.PropTypes.string
	},

	render: function() {
		mystyle.background = this.props.blink1Color;
		//var colr = colorparse( this.props.blink1Color );
		//var c = colr.rgba;
		var img0style = { width: 240, height: 192, 
			//background: this.props.blink1Color
			
			backgroundImage: [	
								//'radial-gradient( rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.5} 0%, rgba(255,255,255,0.1) 65%)',
								"url(images/device-light-mask.png)",
								"radial-gradient(" + this.props.blink1Color + " 0%, rgba(255,255,255,0.1) 55%" + ")",
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