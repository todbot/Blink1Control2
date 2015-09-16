"use strict";

var React = require('react');

var Blink1Api = require('../../api/Blink1DeviceApi');

var ColorPicker = require('react-color');


var Blink1ColorPicker = React.createClass({

	getInitialState: function() {
		return {
			color: "#33dd33"
		};
	},

	setColor: function(color) {
		color = '#' + color.hex;
		this.setState( {color: color} );
		Blink1Api.fadeToColor( 200, color );
	},

	render: function() {
		//console.log("blink1ColorPicker.render");

		return (
				<div>
					<ColorPicker type="sketch" color={this.state.color} onChange={this.setColor} />
				</div>
		);
	}	


});

module.exports = Blink1ColorPicker; 
