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
		var events = log.getEvents({type: 'ifttt'});
		return {
			workingIndex: -1,
			showForm: false,
			rules: rules,
			events: events
		};
	},
	componentDidMount: function() {
		this.getUpdates(); // set up polling, ugh FIXME:
	},
	getUpdates: function() {
		// var rules = util.cheesyClone(IftttService.getRules());
		var events = log.getEvents({type: 'ifttt'});
		this.setState({events: events});
		setTimeout( this.getUpdates, 3000 ); // FIXME: sigh.
	},
	saveRules: function(rules) {
		this.setState({rules: rules});  // FIXME:
		config.saveSettings("iftttService:rules", rules);
		IftttService.reloadConfig();
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
		log.msg("IftttTable.deleteRule:", idx);
		var rules = this.state.rules.splice(idx,1);
		this.saveRules(rules);
	},
	deleteRuleEdit: function() {
		log.msg("IftttTable.deleteRuleEdit:", this.state.workingIndex);
		if( this.state.workingIndex !== -1 ) {
			this.deleteRule( this.state.workingIndex );
			this.setState( {workingIndex: -1} );
		}
		this.cancelForm();
	},
	openForm: function(idx) {
        log.msg("IfttTable.openForm",idx, this.state);
		this.setState( { workingIndex: idx } );
        this.setState({ showForm: true });
    },
    saveForm: function(data) {
        log.msg("IftttTable.saveForm:",data, "workingIndex:", this.state.workingIndex);
		var rules = this.state.rules;
		var rulenew = {name: data.name, patternId: data.patternId, lastTime:0, source:'n/a' };
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
        log.msg("IftttTable.cancelForm");
        this.setState({ showForm: false });
    },

	render: function() {
		var rules = this.state.rules;

		// FIXME: see tooltable
		var formrule = { name: 'some new thing', patternId: 'whiteflashes'}; // FIXME:
		if (this.state.workingIndex !== -1) { // i.e. not a new rule
			formrule.name = rules[this.state.workingIndex].name;
			formrule.patternId = rules[this.state.workingIndex].patternId;
		}
		var createRow = function(rule, index) {
			//var deleteButton = <button onClick={this.deleteRule.bind(this, index)}><i className="fa fa-times"></i></button>;
			var	patternCell = PatternsService.getNameForId( rule.patternId );  // just text
			// var humanTime = (rule.lastTime && rule.lastTime!==0) ? moment(rule.lastTime).format('LTS') : 'never';
			// var lastTime = rule.lastTime || '-not seen yet-';
			// var source = rule.source || 'n/a';
			var eventsForMe = this.state.events.filter( function(e) {
				return (e.id === rule.name);
			});
			var lastEvent = '-not-seen-yet-';
			if( eventsForMe.length ) {
				var myEvent = eventsForMe[eventsForMe.length-1];
				lastEvent = moment(myEvent.date).format('dd LT') + '-' + myEvent.text;
			}
			// <td dangerouslySetInnerHTML={{__html:source}}></td>
			return (
					<tr key={index} onDoubleClick={this.editRule.bind(this, index, rule.name)} >
						<td>{rule.name}</td>
						<td>{patternCell}</td>
						<td>{lastEvent}</td>
						<td>.</td>
						<td><Button bsSize="xsmall" onClick={this.editRule.bind(this, index, rule.name)} >edit</Button></td>
					</tr>
			);
		};
		// console.log("rules compare:",this.state.rules,"vs",this.state.rules2);
		return (
			<div style={{position: "relative", height: 200, cursor:'default'}}>

				<IftttForm show={this.state.showForm} rule={formrule} patterns={PatternsService.getAllPatterns()}
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
