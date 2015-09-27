"use strict";

var React = require('react');
var Table = require('react-bootstrap').Table;

var remote = window.require('remote');
var IftttService = remote.require('./server/iftttService');
var PatternsService = remote.require('./server/patternsService');

var PatternDropdown = require('./patternDropdown');

var IftttTable = React.createClass({

	propTypes: {
		//events: React.PropTypes.array.isRequired,
		//onClear: React.PropTypes.func.isRequired
	},

	getInitialState: function() {
		return {
			rules: [
				{ name: "Bob", patternId: "redflashes", lastEvent: "someevent", source: "a source" },
				{ name: "Bob2", patternId: "whiteflashes", lastEvent: "some2event", source: "a source" },
				{ name: "Bob3", patternId: "redflashes", lastEvent: "some3event", source: "a source" }
			],
			patterns: PatternsService.getAllPatterns(),
			row: -1,
			editing: false
		};
	},

	editRule: function(n) {
		console.log("editRule:", n);
		this.setState({editing: true});
	},
	setCurrentRow: function(idx) {
		this.setState({row: idx});
	},
	addRule: function() {
		console.log("addRule: starting IftttService");
		IftttService.start();
	},
	deleteRule: function(idx) {
		console.log("deleteRule:", idx);
		var rules = this.state.rules;
		delete rules[idx];
		this.setState( {rules: rules});
	},
	onNameChange: function(idx, e) {
		// console.log("onNameChange:", e.target.value, e.target.name, idx);
		var rules = this.state.rules;
		rules[idx].name = e.target.value;
		this.setState( {rules: rules});
	},
	onPatternChange: function(idx, pattid) {
		console.log("onPatternChange:", idx, pattid);
		var rules = this.state.rules;
		rules[idx].patternId = pattid;
		this.setState( {rules: rules});
	},
	onNameClick: function(e) {
		console.log("onNameClick:", e);
	},
	render: function() {
		var createRow = function(rule, index) {
			// onMouseOver={this.editRule.bind(this, rule.name)}>
			// disabled={!this.state.editing && this.state.row === index}
			var delButton = (this.state.row === index) ? <button onClick={this.deleteRule.bind(this, index)}><i className="fa fa-times"></i></button> : " ";
			return (
					<tr key={index}
						onDoubleClick={this.editRule.bind(this, index, rule.name)}
						onMouseOver={this.setCurrentRow.bind(this, index)} >
					<td width={225}><input type='text' name='name' value={rule.name}
						onDoubleClick={this.onNameClick}
						onChange={this.onNameChange.bind(this, index)}/></td>
					<td width={250}><PatternDropdown patterns={this.state.patterns} patternId={rule.patternId}
						onPatternUpdated={this.onPatternChange.bind(this, index)} /></td>
					<td>{rule.lastEvent}</td>
					<td>{rule.source}</td>
					<td>{delButton}</td>
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
					<th></th>
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
