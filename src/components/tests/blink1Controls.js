"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;


var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var BigButton = require('./bigButton');

var Blink1Controls = React.createClass({
	propTypes: { 
		buttons: React.PropTypes.array.isRequired,
		onBigButton: React.PropTypes.func.isRequired
	},

	getInitialState: function() {
		return {
		};
	},


	render: function() {
		var createBigButton = function(button, index) {
			return (
				<BigButton key={index} name={button.name} type={button.type} color={button.color} 
				onClick={this.props.onBigButton.bind(this, index)} />
			);
		};
		return (
			<ButtonToolbar>
				{this.props.buttons.map(createBigButton, this)} 
			</ButtonToolbar>
			);
	}
});

module.exports = Blink1Controls; 