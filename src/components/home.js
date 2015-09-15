"use strict";

var React = require('react');

var Blink1ControlView = require('./gui/blink1ControlView');

var Blink1Api = require('../api/Blink1DeviceApi');

Blink1Api.startDeviceListener();

var Home = React.createClass({
	render: function() {
		return (
				<Blink1ControlView />
			);
	}
});

module.exports = Home;