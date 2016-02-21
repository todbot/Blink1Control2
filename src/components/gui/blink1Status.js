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
		Blink1Service.addChangeListener( this.updateColorState, "blink1Status" );
		PatternsService.addChangeListener( this.updatePatternState, "blink1Status" );
	},
	// updateState: function(colors) { // FIXME: this called mostly for color, don't need other parts?
	updateColorState: function(currentColor, colors,ledn) {
		// FIXME: this called mostly for color, don't need other parts?
		// console.log("updateState");
		this.setState({
						blink1ColorLast: currentColor,
						statusStr: Blink1Service.isConnected() ? "connected" : "not connected",
						serialNumber: Blink1Service.serialNumberForDisplay(),
						iftttKey: Blink1Service.iftttKey()
					});
	},
	updatePatternState: function() {
		this.setState({currentPattern: PatternsService.getPlayingPatternName()});
	},

	onIftttKeyClick: function() {
		console.log("ifttKey click!");
	},
	render: function() {
		// console.log("blink1Status.render: ", this.state.blink1Color);
		var currentPattern = this.state.currentPattern;
		if( !currentPattern ) { currentPattern = '-'; }
		var labelStyle = {width: 80, display: "inline-block"};

		// <VirtualBlink1 blink1Color={this.state.blink1Color} /> // FIXME
		return (
			<Panel header={<h4>Device</h4>} style={{ width: 280, height: 320, margin:5, padding:0 }}>
				<div>
					<VirtualBlink1 />
				</div>
				<Well bsSize="small" style={{margin: 0}}>
					<div>
						<span style={labelStyle}>Status:</span>
						<span><b>{this.state.statusStr}</b></span>
					</div>
					<div>
						<span style={labelStyle}>Serial num:</span>
						<code style={{WebkitUserSelect: "text"}}>
							{this.state.serialNumber}
						</code>
					</div>
					<div>
						<span style={labelStyle}>IFTTT Key:</span>
						<code style={{WebkitUserSelect: "text"}} onContextMenu={this.onIftttKeyClick}>
							{this.state.iftttKey}
						</code>
					</div>
					<div>
						<span style={labelStyle}>Pattern:</span>
						<span><b> {currentPattern}</b></span>
					</div>
				</Well>
			</Panel>
		);
	}


});

module.exports = Blink1Status;
