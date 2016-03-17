"use strict";

var React = require('react');
// var _ = require('lodash');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;
var moment = require('moment');

var conf = require('../../configuration');
var log = require('../../logger');
var util = require('../../utils');

var PatternsService = require('../../server/patternsService');
var IftttService = require('../../server/iftttService');
var MailService = require('../../server/mailService');
var ScriptService = require('../../server/scriptService');


var IftttForm = require('./iftttForm');
var MailForm = require('./mailForm');
var ScriptForm = require('./scriptForm');

var example_rules = [
	{
		"type": "ifttt",
		"name": "red wine",
		"patternId": "redflashes"
	},
	{
		"type": "ifttt",
		"name": "green grass",
		"patternId": "greenflashes"
	}
];

var ToolTable = React.createClass({
	// propTypes: {
	// 	//events: React.PropTypes.array.isRequired,
	// 	//onClear: React.PropTypes.func.isRequired
	// },
	getInitialState: function() {
		var rules = conf.readSettings('eventRules');
        if( !rules || rules.length===0 ) {
			log.msg("ToolTable.getInitialState: no rules, using examples");
			rules = example_rules;
			conf.saveSettings("eventRules", rules);
			this.updateService(rules[0]);
		}
        var events = log.getEvents();
		// MailService.addChangeListener(this.updateSearchStatus, "MailTable");
		return {
			rules: rules,
            events: events, // FIXME: hmmmmm
			workingIndex:-1,
			showForm: false
		};
	},
    componentDidMount: function() {
        this.getUpdates(); // set up polling, ugh FIXME:
		log.addChangeListener( this.getUpdates, "ToolTable" );
    },
    getUpdates: function() {
        var events = log.getEvents();
        log.msg("ToolTable.getUpdates, events:",events);
		if( !this.state.showForm ) {  //i.e. we're in edit mode
        	this.setState({events: events});
		}
    },
    saveRules: function(rules) {
        log.msg("ToolTable.saveRules");
        this.setState({rules: rules});  // FIXME:
		conf.saveSettings("eventRules", rules);
    },
    // based on rulenew, feed appropriate service new rule
    updateService(rule) {
		if( rule.type === 'ifttt' ) {
			IftttService.reloadConfig();
		}
		else if( rule.type === 'mail' ) {
			MailService.reloadConfig();
		}
		else if( rule.type === 'script' ) {
			ScriptService.reloadConfig();
		}
		else if( rule.type === 'url' ) {
			// UrlService.reloadConfig();
		}
    },
    handleSaveForm: function(data) {
        log.msg("ToolTable.handleSaveForm:",data, "workingIndex:", this.state.workingIndex);
        var rules = this.state.rules;
        var rulenew = data; //{type:data.type, name: data.name, patternId: data.patternId, lastTime:0, source:'n/a' }; // FIXME:
        if( this.state.workingIndex === -1 ) { // new rule
            rules.unshift( rulenew );
        }
        else {
            rules[this.state.workingIndex] = rulenew;
        }
        log.msg("handleSaveForm: rules", rules);
        this.setState({ showForm: false });
        this.saveRules(rules);
		this.updateService(rulenew);
    },
    handleCancelForm: function() {
        log.msg("ToolTable.handleCancelForm");
        this.setState({ showForm: false });
    },
    handleEditRule: function(idx) {
        log.msg("ToolTable.handleEditRule",idx, this.state.rules[idx].type );
        this.setState({ workingIndex: idx });
        this.setState({ showForm: this.state.rules[idx].type });
    },
	handleDeleteRule: function() {
		var idx = this.state.workingIndex;
		if( idx !== -1 ) {
			var rules = this.state.rules.filter( function(r,i) { return i!==idx; });
			this.saveRules(rules);
			this.setState( {workingIndex: -1} );
		}
		this.setState({ showForm: false });
	},
    handleAddRule: function(evt,key) {
        log.msg("ToolTable.handleAddRule",key);
        this.setState({showForm:key, workingIndex:-1});
    },
    render: function() {
        var patterns = PatternsService.getAllPatterns();
        var events = this.state.events;
        var workingRule = ( this.state.workingIndex !== -1 ) ? // -1 means new rule
                this.state.rules[this.state.workingIndex] :
                { name: 'new rule '+ util.cheapUid(4),
					type: this.state.showForm,
				}; // FIXME: make createBlankRule(type)

        var makeDesc = function(rule) {
            if( rule.description ) { return rule.description; }
            var desc = '';
            if( rule.type === 'ifttt' ) {
                desc = rule.type + ':' + rule.name;
            }
            else if( rule.type === 'mail' ) {
                desc = rule.mailtype+':'+rule.user +':'+rule.triggerType+':'+rule.triggerVal;
            }
			else if( rule.type === 'script' ) {
                desc = rule.filepath + ' @' +rule.intervalSecs +'s';
            }
            else if( rule.type === 'file' ) {
                desc = rule.filepath + ' @' +rule.intervalSecs +'s';
            }
            else if( rule.type === 'url' ) {
                desc = rule.url + ' @' +rule.intervalSecs +'s';
            }
            return desc;
        };
        var makeLastTime = function(rule) {
            var eventsForMe = events.filter( function(e) {
                return (e.type===rule.type && e.id === rule.name);
            });
            var lastEvent = '-not-seen-yet-';
            if( eventsForMe.length ) {
                var myEvent = eventsForMe[eventsForMe.length-1];
                lastEvent = moment(myEvent.date).format('dd LT') + '-' + myEvent.text;
            }
            return lastEvent;
        };
		var createRow = function(rule, index) {
			var pattid = this.state.rules[index].patternId;
			var patternCell = PatternsService.getNameForId( pattid );  // just text
			if( !patternCell ) { patternCell = pattid; } // for cases like scripts where patternid is special
			var lastTime = makeLastTime(rule);
            var description = makeDesc(rule);
            var type = rule.type;
			return (
				<tr key={index} onDoubleClick={this.handleEditRule.bind(this, index, type)} >
					<td>{rule.name}</td>
                    <td>{type}</td>
                    <td>{description}</td>
					<td>{patternCell}</td>
					<td>{lastTime}</td>
					<td><Button bsSize="xsmall" onClick={this.handleEditRule.bind(this, index, type)} >edit</Button></td>
				</tr>
			);
		};

		return (
			<div style={{position: "relative", height: 200, cursor:'default'}}>

				<ScriptForm show={this.state.showForm==='script' || this.state.showForm==='file' }
					workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns}
					onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
					onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <MailForm show={this.state.showForm==='mail'}
					workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns}
					onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
					onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <IftttForm show={this.state.showForm==='ifttt'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />


				<div style={{display: "block", overflowY: "scroll", height: 165, border:'1px solid #eee'}}>
                    <div style={{padding:10}} hidden={this.state.rules.length}>
                        <h3> Click 'add rule' to begin! //FIXME </h3>
                    </div>
					<Table bordered condensed hover style={{fontSize:"0.9em"}} hidden={this.state.rules.length===0}>
						<thead>
							<tr>
                                <th>Name</th>
                                <th style={{width:30}}>Type</th>
								<th>Description</th>
								<th>Pattern</th>
								<th>Last value</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{this.state.rules.map( createRow, this )}
						</tbody>
					</Table>
					<div style={{position: "absolute", bottom: 0}}>
						<DropdownButton bsSize="small" onSelect={this.handleAddRule} id="addRule" title={<span><i className="fa fa-plus"></i> add event source</span>}>
                            <MenuItem eventKey="ifttt">Add IFTTT</MenuItem>
                            <MenuItem eventKey="mail">Add Mail</MenuItem>
                            <MenuItem eventKey="script">Add Script</MenuItem>
                            <MenuItem eventKey="url">Add URL</MenuItem>
                            <MenuItem eventKey="file">Add File</MenuItem>
                            <MenuItem eventKey="skype">Add Skype</MenuItem>
                        </DropdownButton>
					</div>
				</div>
			</div>
        );
	}

});

module.exports = ToolTable;
