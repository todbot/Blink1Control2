"use strict";

var React = require('react');

var Blink1ControlView = require('./gui/blink1ControlView');


var Home = React.createClass({
	render: function() {
		return (
				<Blink1ControlView />
			);
	}
});

module.exports = Home;