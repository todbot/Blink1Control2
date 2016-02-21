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
// var IftttService = remote.require('./server/iftttService');
var PatternsService = remote.require('./server/patternsService');
var config = remote.require('./configuration');

var IftttForm = require('./iftttForm');

var IftttTable = React.createClass({

	getInitialState: function() {
		var rules = config.readSettings('iftttRules');
		if( !rules ) {
			rules = [];
		}
		return {
			rules: rules,
			patterns: PatternsService.getAllPatterns(),
			// row: -1,
			// workingrule: {},
			workingIndex:-1,
			showForm: false
		};
	},
	saveRules: function(rules) {
		this.setState({rules: rules});
		config.saveSettings("iftttRules", rules);
	},
	editRule: function(n) {
		console.log("editRule:", n);
		this.openForm(n);
	},
	// addRule: function() {
	// 	// console.log("addRule: starting IftttService");
	// 	// IftttService.start();
	// 	var rules = this.state.rules;
	// 	rules.unshift( {name: 'new rule', patternId: 'redflashes'});
	// 	this.saveRules(rules);
	// },
	addRuleByForm: function() {
		//this.setState({workingrule: {name: 'poopy butt', patternId: 'whiteflashes'}});
		// this.setState({workingIndex: -1}); // -1 means new rule
		this.openForm(-1);
	},
	deleteRule: function(idx) {
		console.log("deleteRule:", idx);
		var rules = this.state.rules;
		delete rules[idx];
		this.saveRules(rules);
	},
	deleteRuleEdit: function() {
		console.log("deleteRuleEdit:", this.state.workingIndex);
		if( this.state.workingIndex !== -1 ) {
			this.deleteRule( this.state.workingIndex );
			this.setState( {workingIndex: -1} );
		}
		this.cancelForm();
	},
	openForm: function(idx) {
        console.log("open form",idx, this.state);
		this.setState( { workingIndex: idx } );
        this.setState({ showForm: true });
    },
    saveForm: function(data) {
        console.log("save form:",data, "workingIndex:", this.state.workingIndex);
		var rules = this.state.rules;
		var rulenew = {name: data.name, patternId: data.patternId};
		if( this.state.workingIndex === -1 ) { // new rule
			rules.unshift( rulenew );
		}
		else {
			rules[this.state.workingIndex] = rulenew;
		}
		this.saveRules(rules);
        this.setState({ showForm: false });
    },
    cancelForm: function() {
        console.log("close mail form");
        this.setState({ showForm: false });
    },

	render: function() {
		// console.log("iftttTable render",this.state);
		// var self = this;
		//	workingrule: { row: idx, name: this.state.rules[idx].name, patternId: this.state.rules[idx].pattternId }
		var formrule = { name: 'some new thing', patternId: 'whiteflashes'}; // FIXME:
		if (this.state.workingIndex !== -1) { // not new
			formrule.name = this.state.rules[this.state.workingIndex].name;
			formrule.patternId = this.state.rules[this.state.workingIndex].patternId;
		}
		var createRow = function(rule, index) {
			//var deleteButton = <button onClick={this.deleteRule.bind(this, index)}><i className="fa fa-times"></i></button>;
			var	patternCell = PatternsService.getNameForId( this.state.rules[index].patternId );  // just text
			var lastTime = rule.lastTime || '-not seen yet-';
			var source = rule.source || 'n/a';
			return (
					<tr key={index} onDoubleClick={this.editRule.bind(this, index, rule.name)} >
						<td width={225}>{rule.name}</td>
						<td width={250}>{patternCell}</td>
						<td>{lastTime}</td>
						<td width={100}>{source}</td>
						<td><Button bsSize="xsmall" onClick={this.editRule.bind(this, index, rule.name)} >edit</Button></td>
					</tr>
			);
		};
		return (
			<div style={{position: "relative", height: 200}}>

				<IftttForm show={this.state.showForm} rule={formrule}
					onSave={this.saveForm} onCancel={this.cancelForm} onDelete={this.deleteRuleEdit} />

				<div style={{display: "block", overflowY: "scroll", height: 150}}>
					<Table bordered condensed hover style={{fontSize:"0.9em"}}>
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
					<Button bsSize="xsmall" onClick={this.addRuleByForm} ><i className="fa fa-plus"></i> add rule</Button>
				</div>
			</div>
        );

	}


});

module.exports = IftttTable;
