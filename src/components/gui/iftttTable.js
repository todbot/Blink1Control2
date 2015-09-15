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
			rules: [ 
				{ name: "Bob", pattern: "this happened", lastEvent: "someevent", source: "a source" },
				{ name: "Bob2", pattern: "that happened", lastEvent: "some2event", source: "a source" },
				{ name: "Bob3", pattern: "other happened", lastEvent: "some3event", source: "a source" }
			]
		};
	},

	editRule: function() {
		console.log("editRule:");
	},

	render: function() {
		var createRow = function(rule, index) {
			return (
					<tr key={index} onDoubleClick={this.editRule.bind(this, rule.name)}>
					<td>{rule.name}</td>
					<td>{rule.pattern}</td>
					<td>{rule.lastEvent}</td>
					<td>{rule.source}</td>
					</tr>
			);

		};
		return (
			<div>
			<Table bordered condensed hover>
				<thead>
					<tr>
					<th>Name</th>
					<th>Pattern</th>
					<th>Last Event</th>
					<th>Source</th>
					</tr>
				</thead>
				<tbody>
					{this.state.rules.map( createRow, this )}
				</tbody>
			</Table>
			<button onClick={this.addRule} className="btn" ><i className="fa fa-plus"></i> add rule</button>
			</div>
        );

	}


});

module.exports = IftttTable; 