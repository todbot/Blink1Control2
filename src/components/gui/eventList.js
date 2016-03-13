"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Button = require('react-bootstrap').Button;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

var _ = require('lodash');

var log = require('../../logger');

var moment = require('moment');

var EventList = React.createClass({
	propTypes: {
		//events: React.PropTypes.array.isRequired,
		//onClear: React.PropTypes.func.isRequired
	},
	getInitialState: function() {
		return {
			events: log.getLastEvents()
		};
	},
	componentDidMount: function() {
		this.getUpdates(); // set up polling, ugh FIXME:
	},
	getUpdates: function() {
		var events = log.getLastEvents();
		// log.msg('EventList.getUpdates',events);
		this.setState({events:events});
		setTimeout( this.getUpdates, 3000 ); // sigh.
	},

	clearEvents: function() {
		this.setState({events: []});
	},


	render: function() {
		var revevents = this.state.events.concat().reverse();

		var createEventLine = function(event,index) {
			//return (<li key={event.date}> {event.date} - {event.text} </li>);
			var humantime = moment(event.date).format('dd LT');
			var type = event.type;
			var text = event.text;
			var id = event.id;
			var msg = <span><b>{type}</b> {text} - {id}</span>;
			return (
				<ListGroupItem key={index} style={{lineHeight:"100%", fontSize: "0.85em", textIndent:-10}}>{humantime}: {msg} </ListGroupItem>);
		};

		return (
			<Panel header={<h4>Recent Events</h4>} style={{ width: 280, height: 300, margin:5, padding:0}}>
				<ListGroup style={{	height: 200, overflowY: 'scroll', overflowX:'hidden', padding:0, margin:0, marginBottom:10}}>
				{revevents.map(createEventLine, this)}
				</ListGroup>
				<Button block bsSize="xsmall"  onClick={this.clearEvents}>Clear events</Button>
			</Panel>
			);
	}
});

module.exports = EventList;
