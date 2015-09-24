"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;

var VirtualBlink1 = require('./virtualBlink1');

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');
var PatternsService = remote.require('./server/patternsService');

var Blink1Status = React.createClass({

	getInitialState: function() {
		return {
			blink1Color: Blink1Service.getCurrentColor(),
			statusStr: Blink1Service.isConnected() ? "connected" : "not connected",
			serialNumber: Blink1Service.serialNumberForDisplay(),
			iftttKey: Blink1Service.iftttKey(),
			currentPattern: '-'
		};
	},
	componentDidMount: function() {
		PatternsService.addChangeListener( this.updatePatternState, "blink1Status" );
	},
	updatePatternState: function() {
		this.setState({currentPattern: PatternsService.getPlayingPatternName()});
	},
	render: function() {
		console.log("blink1Status.render: ", this.state.blink1Color);
		var currentPattern = this.state.currentPattern;
		if( !currentPattern ) { currentPattern = '-'; }

		return (
			<Panel header="Device" style={{ width: 280, height: 360}}>
				<div style={{ width: 256, height: 192, margin: "auto" }}>
					<VirtualBlink1 blink1Color={this.state.blink1Color} />
				</div>
				<Well bsSize="small">
					<div> Status: <b>{this.state.statusStr}</b> </div>
					<div> Serial number: <code>{this.state.serialNumber}</code> <br />
							IFTTT Key: <code>{this.state.iftttKey} </code></div>
					<div> Pattern: <b> {currentPattern}</b></div>
				</Well>
			</Panel>
		);
	}


});

module.exports = Blink1Status;
