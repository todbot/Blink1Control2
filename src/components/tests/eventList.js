"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var Button = require('react-bootstrap').Button;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

var mystyle = {
	width: 320,
	height: 260
};

var EventList = React.createClass({
	propTypes: { 
		events: React.PropTypes.array.isRequired,
		onClear: React.PropTypes.func.isRequired
	},

	handleDismissAll: function() {
		console.log("handleDismissAll");
	},

	render: function() {
		var createEventLine = function(event) {
			//return (<li key={event.date}> {event.date} - {event.text} </li>);
			return (<ListGroupItem key={event.date}> {event.date} - {event.text} </ListGroupItem>);
		};
		var butStyle = { 

			float: "left"
		};
		var listStyle = { 
			height:	mystyle.height - 100  // FIXME: HACK!
		};

		return (
			<Panel header="Recent Events" style={mystyle}>
				<ListGroup>
				{this.props.events.map(createEventLine, this)}
				</ListGroup>
				<Button block bsSize="small" style={butStyle} onClick={this.props.onClear}>Dismiss all</Button>
			</Panel>
			);
	}
});

module.exports = EventList; 