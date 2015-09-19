"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;

var VirtualBlink1 = require('./virtualBlink1');

var remote = window.require('remote');
//var Blink1Api = remote.require('../server/blink1ServerApi');
//var Blink1Api = require('../../blink1DeviceApi');
var PatternsApi = require('../../api/patternsApi');

var Blink1Status = React.createClass({

	getInitialState: function() {
		return {
		// 	blink1Color: Blink1Api.getCurrentColor(),
		// 	statusStr: Blink1Api.isConnected() ? "connected" : "not connected",
		// 	serialNumber: Blink1Api.serialNumberForDisplay(),
		// 	iftttKey: Blink1Api.iftttKey()
		};
	},

	render: function() {
		console.log("blink1Status.render: ", this.state.blink1Color);

		var currentPattern = PatternsApi.getPlayingPattern();
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
