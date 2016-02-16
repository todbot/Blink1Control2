"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Button = require('react-bootstrap').Button;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

var mystyle = {
	width: 280,
	height: 260,
};

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
				{ date: Date.now()-2, text: "this 3  happened"},
				{ date: Date.now()-2, text: "this 3.1 happened"},
				{ date: Date.now()-4, text: "this other thing happened"}
			]
		};
	},

	clearEvents: function() {
		this.setState({events: []});
	},


	render: function() {
		var createEventLine = function(event,index) {
			//return (<li key={event.date}> {event.date} - {event.text} </li>);
			return (<ListGroupItem key={index}> {event.date} - {event.text} </ListGroupItem>);
		};
		var butStyle = {

			float: "left"
		};
		var listStyle = {
			height:	mystyle.height - 100  // FIXME: HACK!
		};

		return (
			<Panel header="Recent Events" style={mystyle}>
				<ListGroup style={{	height: mystyle.height-100, overflow: 'scroll'}}>
				{this.state.events.map(createEventLine, this)}
				</ListGroup>
				<Button block bsSize="small" style={butStyle} onClick={this.clearEvents}>Dismiss all</Button>
			</Panel>
			);
	}
});

module.exports = EventList;
