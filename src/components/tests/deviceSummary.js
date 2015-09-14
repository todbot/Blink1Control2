"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var Well = require('react-bootstrap').Well;


var VirtualBlink1 = require('./virtualBlink1');
//var ConnectStatus = require('./connectStatus');
//var PatternStatus = require('./patternStatus');
//var SerialNumber = require('./serialNumber');

var mystyle = {
	width: 320,
	height: 360
};

var DeviceSummary = React.createClass({
	propTypes: {
		blink1Color: React.PropTypes.string.isRequired,
		status: React.PropTypes.string.isRequired,
		serialNumber: React.PropTypes.string.isRequired,
		iftttKey: React.PropTypes.string.isRequired,
		pattern: React.PropTypes.string.isRequired
	},

	render: function() {
		return (
				<Panel header="Device" style={mystyle}>
					<VirtualBlink1 blink1Color={this.props.blink1Color} />
						<Well bsSize="small">
						<div>
							Status: <b>{this.props.status}</b>
						</div>
						<div>
							Serial number: <code>{this.props.serialNumber}</code> <br />
							IFTTT Key: <code>{this.props.iftttKey} </code>
						</div>
						<div>
							Pattern: <b> {this.props.pattern}</b>
						</div>
					</Well>
				</Panel>
			);
	}
});

module.exports = DeviceSummary; 