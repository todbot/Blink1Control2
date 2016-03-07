/**
 *
 * // [ { name: "Bob", patternId: "redflashes", lastTime: "someevent", source: "a source" },
 * // 	{ name: "Bob2", patternId: "whiteflashes", lastTime: "some2event", source: "a source" } ]
 */

"use strict";

var React = require('react');
var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var moment = require('moment');

var PatternsService = require('../../server/patternsService');
var IftttService = require('../../server/iftttService');

var config = require('../../configuration');
var log = require('../../logger');
var util = require('../../utils');

var IftttForm = require('./iftttForm');

var IftttTable = React.createClass({

	getInitialState: function() {
		// var rules2 = config.readSettings('iftttService:rules');
		// why do I have to do the cheesyClone? Why does React complain
		// with a "Uncaught Invariant Violation: Objects are not valid as a React child"?
		var rules = util.cheesyClone(IftttService.getRules());
		return {
			workingIndex: -1,
			showForm: false,
			rules: rules
		};
	},
	componentDidMount: function() {
		this.getUpdates(); // set up polling, ugh FIXME:
	},
	getUpdates: function() {
		var rules = util.cheesyClone(IftttService.getRules());
		this.setState({rules:rules});
		setTimeout( this.getUpdates, 3000 ); // sigh.
	},
	saveRules: function(rules) {
		this.setState({rules: rules});  // FIXME:
		config.saveSettings("iftttService:rules", rules);
	},
	editRule: function(n) {
		log.msg("editRule:", n);
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
        console.log("IftttTable.saveForm:",data, "workingIndex:", this.state.workingIndex);
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
        console.log("iftttTable.cancelForm");
        this.setState({ showForm: false });
    },

	render: function() {
		var rules = this.state.rules;
		// var rules = JSON.parse(JSON.stringify(this.state.rules));
		// console.log("iftttTable render, state:",JSON.stringify(this.state));
		console.log("iftttTable render, rules:", rules);

		var formrule = { name: 'some new thing', patternId: 'whiteflashes'}; // FIXME:
		if (this.state.workingIndex !== -1) { // i.e. not a new rule
			formrule.name = rules[this.state.workingIndex].name;
			formrule.patternId = rules[this.state.workingIndex].patternId;
		}
		var createRow = function(rule, index) {
			//var deleteButton = <button onClick={this.deleteRule.bind(this, index)}><i className="fa fa-times"></i></button>;
			var	patternCell = PatternsService.getNameForId( rule.patternId );  // just text
			var humanTime = moment(rule.lastTime).format('LTS');
			// var lastTime = rule.lastTime || '-not seen yet-';
			var source = rule.source || 'n/a';
			return (
					<tr key={index} onDoubleClick={this.editRule.bind(this, index, rule.name)} >
						<td>{rule.name}</td>
						<td>{patternCell}</td>
						<td>{humanTime}</td>
						<td>{source}</td>
						<td><Button bsSize="xsmall" onClick={this.editRule.bind(this, index, rule.name)} >edit</Button></td>
					</tr>
			);
		};
		// console.log("rules compare:",this.state.rules,"vs",this.state.rules2);
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
							{rules.map( createRow, this )}
						</tbody>
					</Table>
					<div style={{position: "absolute", bottom: 20}}>
						<Button bsSize="xsmall" onClick={this.addRuleByForm} ><i className="fa fa-plus"></i> add rule</Button>
					</div>
				</div>
			</div>
        );

	}

});

module.exports = IftttTable;
