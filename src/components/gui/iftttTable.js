"use strict";

var React = require('react');

var Table = require('react-bootstrap').Table;


var IftttTable = React.createClass({

	propTypes: { 
		//events: React.PropTypes.array.isRequired,
		//onClear: React.PropTypes.func.isRequired
	},

	getInitialState: function() {
		return {
			events: [ 
				{ date: 1234, text: "this happened"},
				{ date: 1235, text: "this other thing happened"}
			]
		};
	},

	render: function() {
		return (
			<Table striped bordered condensed hover>
				<thead>
					<tr>
					<th>Name</th>
					<th>Pattern</th>
					<th>Last Event</th>
					<th>Source</th>
					</tr>
				</thead>
				<tbody>
					<tr>
					<td> Bob </td>
					<td> Pattern </td>
					<td> last it </td>
					<td> some source </td>
					</tr>
				</tbody>
			</Table>
        );

	}


});

module.exports = IftttTable; 