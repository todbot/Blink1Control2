"use strict";

var React = require('react');
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Button = require('react-bootstrap').Button;
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;

var ColorPicker = require('react-color');
var DeviceSummary = require('./deviceSummary');
var Blink1ControlView = require('./blink1ControlView');

var ipc = window.require('ipc');

ipc.on('tod-async-reply', function(arg) {
  console.log("browser process: ", arg); // prints "pong"
});
ipc.send('tod-async-message', { id: "todbot", val: "yomamma" } );


var TodTests = React.createClass({

	getInitialState: function() {
		return {
			myColor: '#ff00ff'
		};
	},

	handleColor: function(color) {
		console.log("color=", color);
		this.setState({myColor: color.hex});
	},

	render: function() {

		return (
				<Blink1ControlView />
			);
	},
	orender: function() {
		return (
			<TabbedArea defaultActiveKey={2}>
				<TabPane eventKey={1} tab='Tab 1'>
					<ColorPicker type="sketch" />
				</TabPane>
				<TabPane eventKey={2} tab='Tab 2'>
				<Blink1ControlView />
				</TabPane>
				<TabPane eventKey={3} tab='Tab 3' disabled>TabPane 3 content</TabPane>
			</TabbedArea>
			);
	}
});

module.exports = TodTests; 