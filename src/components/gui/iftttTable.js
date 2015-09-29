/**
 *
 * // [ { name: "Bob", patternId: "redflashes", lastTime: "someevent", source: "a source" },
 * // 	{ name: "Bob2", patternId: "whiteflashes", lastTime: "some2event", source: "a source" } ]
 */

"use strict";

var React = require('react');
var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;

var remote = window.require('remote');
var IftttService = remote.require('./server/iftttService');
var PatternsService = remote.require('./server/patternsService');
var config = remote.require('./configuration');

var PatternDropdown = require('./patternDropdown');


var IftttTable = React.createClass({

	getInitialState: function() {
		var rules = config.readSettings('iftttRules');
		if( !rules ) {
			rules = [];
		}
		return {
			rules: rules,
			patterns: PatternsService.getAllPatterns(),
			row: -1,
			editing: false
		};
	},
	saveRules: function(rules) {
		this.setState({rules: rules});
		config.saveSettings("iftttRules", rules);
	},
	editRule: function(n) {
		console.log("editRule:", n);
		this.setState({editing: true});
	},
	setCurrentRow: function(idx) {
		this.setState({row: idx});
	},
	addRule: function() {
		// console.log("addRule: starting IftttService");
		// IftttService.start();
		var rules = this.state.rules;
		rules.unshift( {name: 'new rule', patternId: 'redflashes'});
		this.saveRules(rules);
	},
	deleteRule: function(idx) {
		console.log("deleteRule:", idx);
		var rules = this.state.rules;
		delete rules[idx];
		this.saveRules(rules);
	},
	onNameChange: function(idx, e) {
		// console.log("onNameChange:", e.target.value, e.target.name, idx);
		var rules = this.state.rules;
		rules[idx].name = e.target.value;
		this.saveRules(rules);
	},
	onPatternChange: function(idx, pattid) {
		console.log("onPatternChange:", idx, pattid);
		var rules = this.state.rules;
		rules[idx].patternId = pattid;
		this.saveRules(rules);
	},
	onNameClick: function(e) {
		console.log("onNameClick:", e);
	},
	render: function() {
		var createRow = function(rule, index) {
			// var isEditing = (this.state.row === index) && this.state.editing;
			// onMouseOver={this.editRule.bind(this, rule.name)}>
			// disabled={!this.state.editing && this.state.row === index}
			var deleteButton = <button onClick={this.deleteRule.bind(this, index)}><i className="fa fa-times"></i></button>;
			var patternCell = <PatternDropdown
								patterns={this.state.patterns}
								patternId={rule.patternId}
								onPatternUpdated={this.onPatternChange.bind(this, index)}/>;
			if( this.state.row !== index ) { // not currently being hovered
				patternCell = PatternsService.getNameForId( this.state.rules[index].patternId );  // just text
				deleteButton = " ";
			}
			return (
					<tr key={index}
						onDoubleClick={this.editRule.bind(this, index, rule.name)}
						onMouseOver={this.setCurrentRow.bind(this, index)} >
					<td width={225}><input type='text' name='name' value={rule.name}
						onDoubleClick={this.onNameClick}
						onChange={this.onNameChange.bind(this, index)}/></td>
					<td width={250}> {patternCell}</td>
					<td>{rule.lastTime}</td>
					<td>{rule.source}</td>
					<td>{deleteButton}</td>
					</tr>
			);

		};
		return (
			<div style={{position: "relative", height: 200}}>
				<div style={{display: "block", overflowY: "scroll", height: 130}}>
					<Table bordered condensed hover >
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
				</div>
				<div style={{position: "absolute", bottom: 20}}>
					<Button bsSize="xsmall" onClick={this.addRule} ><i className="fa fa-plus"></i> add rule</Button>
				</div>
			</div>
        );

	}


});

module.exports = IftttTable;
