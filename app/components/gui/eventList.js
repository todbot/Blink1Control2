"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Button = require('react-bootstrap').Button;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
// var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;

// var _ = require('lodash');

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
		log.addChangeListener( this.getUpdates, "EventList" );
	},
	getUpdates: function() {
		var events = log.getLastEvents();
		events = events.filter( function(e) {
			return e.type === 'trigger' || e.type === 'triggerOff';
		});
		this.setState({events:events});
	},

	clearEvents: function() {
		log.clearEvents();
		this.setState({events: []});
	},

	render: function() {
		var revevents = this.state.events.concat().reverse();
		var createEventLine = function(event,index) {
			var humantime = moment(event.date).format('LTS');
			var source = event.source;
			var text   = event.text;
			var id     = event.id;
			var msg = <span><b>{source}</b> {text} - {id}</span>;
			return (
				<ListGroupItem key={index} style={{lineHeight:"100%", fontSize: "0.85em", textIndent:-10}}><i style={{fontSize:'90%'}}>{humantime}:</i> {msg} </ListGroupItem>
			);
		};
		var header = <h4>Recent Events <button style={{float:'right',fontSize:'80%' }}
			bsStyle='link' onClick={this.clearEvents}>Clear</button></h4> ;

		return (
			<Panel header={header} style={{ width: 280, height: 305, margin:5, padding:0}}>
				<ListGroup style={{	height: 240, overflowY: 'scroll', overflowX:'hidden', padding:0, margin:0, marginBottom:10}}>
				{revevents.map(createEventLine, this)}
				</ListGroup>
			</Panel>
			);
			// <Button bsSize="xsmall"  onClick={this.showAllEvents}>Show all</Button>
	}
});

module.exports = EventList;
