"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;
// var Button = require('react-bootstrap').Button;

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');
var VirtualBlink1 = require('./virtualBlink1');

var PreferencesModal = require('./PreferencesModal');

var Blink1Status = React.createClass({

	getInitialState: function() {
		return {
			blink1Color: Blink1Service.getCurrentColor(),
			statusStr: Blink1Service.isConnected() ? "connected" : "not connected",
			serialNumber: Blink1Service.serialNumberForDisplay(),
			blink1Serials: Blink1Service.getAllSerials(),
			iftttKey: Blink1Service.iftttKey(),
			currentPattern: '-',
			showForm: false
		};
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.updateColorState, "blink1Status" );
		PatternsService.addChangeListener( this.updatePatternState, "blink1Status" );
	},
	// updateState: function(colors) { // FIXME: this called mostly for color, don't need other parts?
	updateColorState: function(currentColor /*, colors,ledn */) {
		var cnt = Blink1Service.isConnected();
		this.setState({
						blink1ColorLast: currentColor,
						statusStr: (cnt>1) ? cnt + " connected" : (cnt) ? "connected" : "not connected",
						serialNumber: Blink1Service.serialNumberForDisplay(),
						blink1Serials: Blink1Service.getAllSerials(),
						iftttKey: Blink1Service.iftttKey()
					});
	},
	updatePatternState: function() {
		this.setState({currentPattern: PatternsService.getPlayingPatternName()});
	},

	onIftttKeyClick: function() {
		console.log("ifttKey click!");
	},
	onPrefsClick: function() {
		this.setState({showForm: true});
	},
	saveForm: function(data) {
		this.setState({ showForm: false });
	},
	cancelForm: function() {
		this.setState({ showForm: false });
	},

	render: function() {
		// console.log("blink1Status.render: ", this.state.blink1Color);
		var currentPattern = this.state.currentPattern;
		if( !currentPattern ) { currentPattern = '-'; }
		var labelStyle = {width: 80, display: "inline-block"};
		var serialNums = "serials:\n";
		this.state.blink1Serials.forEach(function(s){ serialNums+= "blink1:"+s+"\n"; });

		// <VirtualBlink1 blink1Color={this.state.blink1Color} /> // FIXME
		var header = <h4>Device <button style={{float:'right' }} bsStyle='link' onClick={this.onPrefsClick}><i className="fa fa-gear"></i></button></h4>;

		return (
			<Panel header={header} style={{ width: 280, height: 320, margin:5, padding:0 }}>
				<PreferencesModal show={this.state.showForm}
					onSave={this.saveForm} onCancel={this.cancelForm} blink1Serials={this.state.blink1Serials} />

				<VirtualBlink1 />

				<Well bsSize="small" style={{margin: 0}}>
					<div>
						<span style={labelStyle}>Status:</span>
						<span><b>{this.state.statusStr}</b></span>
					</div>
					<div>
						<span style={labelStyle} title={serialNums}>Serial num:</span>
						<code style={{WebkitUserSelect: "text"}} title={serialNums}>
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
