"use strict";

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var Well = require('react-bootstrap').Well;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
var ButtonGroup = require('react-bootstrap').ButtonGroup;

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');
//var Blink1Service = remote.require('../../server/blink1ServerApi');

var ColorPicker = require('react-color');

var Blink1ColorPicker = React.createClass({
	getInitialState: function() {
		return {
			color: "#33dd33",
			ledn: 0
		};
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.fetchBlink1Color, "blink1ColorPicker" );
		Blink1Service.fadeToColor(200, this.state.color);
	},
	// callback for Blink1Service
	fetchBlink1Color: function(currentColor, colors, ledn) {
		console.log("colorpicker.fetchBlink1Color, currentColor",currentColor, "ledn:",ledn);
		this.setState( { color: currentColor, ledn: ledn });
	},
	// called by colorpicker
	setColor: function(color) {
		console.log("colorpicker.setColor",color.hex, this.state.ledn);
		color = '#' + color.hex;
		Blink1Service.fadeToColor( 200, color, this.state.ledn ); // FIXME
		// and the above will call 'fetchBlink1Color' anyway
		// there must be a better way to do this
	},
	// called by ledn buttons
	setLedN: function(n) {
		this.setState({ledn: n});
	},
	render: function() {
		return (
				<div style={{border: '0px solid red'}}>
					<div style={{ display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"}}>
						<ColorPicker.default type="sketch" color={this.state.color} onChange={this.setColor} />
					</div>
					<div style={{ display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"}}>
						<ButtonGroup vertical>
					      <Button onClick={this.setLedN.bind(this, 0)} active={this.state.ledn===0}>LED AB</Button>
					      <Button onClick={this.setLedN.bind(this, 1)} active={this.state.ledn===1}>LED A</Button>
					      <Button onClick={this.setLedN.bind(this, 2)} active={this.state.ledn===2}>LED B</Button>
					    </ButtonGroup>
					</div>
				</div>
		);
	}
});

module.exports = Blink1ColorPicker;
