"use strict";

var React = require('react');

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');
//var Blink1Service = remote.require('../../server/blink1ServerApi');

var ColorPicker = require('react-color');

var Blink1ColorPicker = React.createClass({
	getInitialState: function() {
		return {
			color: "#33dd33"
		};
	},
	fetchBlink1Color: function(color) {
		//console.log("ColorPicker: fetchBlink1Color", color); //, Blink1Service.getCurrentColor() );
		this.setState( { color: color });
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "blink1ColorPicker" );
		Blink1Service.fadeToColor(200, this.state.color);
	},
	setColor: function(color) {
		color = '#' + color.hex;
		//this.setState( {color: color} );  // had to remove this because WEIRDNESS
		Blink1Service.fadeToColor( 200, color );
		// and the above will call 'fetchBlink1Color' anyway
		// there must be a better way to do this
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
