"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Button = require('react-bootstrap').Button;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

var moment = require('moment');

var EventList = React.createClass({
	propTypes: {
		//events: React.PropTypes.array.isRequired,
		//onClear: React.PropTypes.func.isRequired
	},
	getInitialState: function() {
		return {
			events: [
				{ date: Date.now(), text: "this happened"},
				{ date: Date.now()-1, text: "this 2 happened"},
				{ date: Date.now()-200000, text: "this 3  happened"},
				{ date: Date.now()-400000, text: "this 3.1 happened"},
				{ date: Date.now()-4000000, text: "this other thing happened"},
				{ date: Date.now()-40000000, text: "this other thing happened"},
				{ date: Date.now()-400000000, text: "this other thing happened"}
			]
		};
	},

	clearEvents: function() {
		this.setState({events: []});
	},


	render: function() {
		var createEventLine = function(event,index) {
			//return (<li key={event.date}> {event.date} - {event.text} </li>);
			var humantime = moment(event.date).format('LT');
			return (
				<ListGroupItem key={index} style={{lineHeight:"85%", fontSize: "0.75em",}}> {humantime} - {event.text} </ListGroupItem>);
		};

		return (
			<Panel header={<h4>Recent Events</h4>} style={{ width: 280, height: 300 }}>
				<ListGroup style={{	height: 200, overflowY: 'scroll', overflowX:'hidden', padding:0, margin:0, marginBottom:10}}>
				{this.state.events.map(createEventLine, this)}
				</ListGroup>
				<Button block bsSize="xsmall"  onClick={this.clearEvents}>Dismiss all</Button>
			</Panel>
			);
	}
});

module.exports = EventList;
