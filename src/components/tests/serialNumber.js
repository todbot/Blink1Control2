"use strict";

var React = require('react');

var SerialNumber = React.createClass({

	getInitialState: function() {
		return {
			serialNumber: null
		};
	},

	serialNumberAsString: function() {
		var str = "-not-connected-";
		return str;
	},

	iftttKeyAsString: function() {
		var str = "abadcafe" + "00000000";
		return str;
	},

	render: function() {
		return (
			<div>
			Serial number: <code>{this.serialNumberAsString()}</code> <br />
			IFTTT Key: <code>{this.iftttKeyAsString()} </code>
			</div>
			);
	}
});

module.exports = SerialNumber; 