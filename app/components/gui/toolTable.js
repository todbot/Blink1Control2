"use strict";

var React = require('react');
var _ = require('lodash');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;
var moment = require('moment');
var simplecrypt = require('simplecrypt');

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control'});

var conf = require('../../configuration');
var log = require('../../logger');
var util = require('../../utils');

var PatternsService = require('../../server/patternsService');
var IftttService = require('../../server/iftttService');
var MailService = require('../../server/mailService');
var ScriptService = require('../../server/scriptService');
var SkypeService = require('../../server/skypeService');

var IftttForm = require('./iftttForm');
var MailForm = require('./mailForm');
var ScriptForm = require('./scriptForm');
var SkypeForm = require('./skypeForm');


var example_rules = [
];

// var eventSources = [];
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
			this.updateService(rules[0]);  // FIXME: why is this here?
		}
        var events = log.getEvents();
		// MailService.addChangeListener(this.updateSearchStatus, "MailTable");
		return {
			rules: rules,
            events: events, // FIXME: hmmmmm
			workingIndex:-1,
			showForm: false,
		};
	},
    componentDidMount: function() {
        this.getUpdates(); // set up polling, ugh FIXME:
		log.addChangeListener( this.getUpdates, "ToolTable" );
    },
	// callback called by event service
    getUpdates: function() {
        var events = log.getEvents();
        log.msg("ToolTable.getUpdates, events:",events);

		if( !this.state.showForm ) {  //i.e. don't change when we're in edit mode
        	this.setState({events: events});
			this.setState({'allowMultiBlink1': conf.readSettings("blink1Service:allowMulti") });
		}
    },
    saveRules: function(rules) {
        log.msg("ToolTable.saveRules");
        this.setState({rules: rules});  // FIXME:
		conf.saveSettings("eventRules", rules);
    },
    // based on rulenew, feed appropriate service new rule
	// FIXME: these "reloadConfig()" should really restart only new/changed rule
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
			ScriptService.reloadConfig();
		}
		else if( rule.type === 'file' ) {
			ScriptService.reloadConfig();
		}
		else if( rule.type === 'skype' ) {
			SkypeService.reloadConfig();
		}
    },
    handleSaveForm: function(data) {
        log.msg("ToolTable.handleSaveForm:",data, "workingIndex:", this.state.workingIndex);
        var rules = this.state.rules;
        var rulenew = data; //{type:data.type, name: data.name, patternId: data.patternId, lastTime:0, source:'n/a' }; // FIXME:
		if( rulenew.password ) {
			rulenew.password = sc.encrypt( rulenew.password );
		}
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
	handleCopyRule: function() {
		console.log("ToolTable.handleCopyRule");
		if( this.state.workingIndex >= 0) {
			var rules = this.state.rules;
			var rule = _.clone(rules[ this.state.workingIndex ]);
			rule.id = rule.id + util.cheapUid(4);
			rule.name = rule.name + ' (copy)';
			rules.splice( this.state.workingIndex, 0, rule);
			this.setState({rules: rules});
		}
	},

    handleAddRule: function(evt,key) {
        log.msg("ToolTable.handleAddRule",key);
        this.setState({showForm:key, workingIndex:-1});
    },
    render: function() {
        var patterns = PatternsService.getAllPatterns();
        var events = this.state.events;
        var workingRule = { name: 'new '+ this.state.showForm + ' rule '+ (this.state.rules.length+1),
						type: this.state.showForm,
						enabled: true,
			}; // FIXME: make createBlankRule(type)
		if( this.state.workingIndex !== -1 ) { // -1 means new rule, otherwise real rule
			// clone so form works on a copy. FIXME: needed?
			workingRule = _.clone( this.state.rules[this.state.workingIndex] );
		}
		if( workingRule.password ) {
			try {
				workingRule.password = sc.decrypt( workingRule.password );
			} catch(err) {
				log.msg("toolTable: error decrypting passwd: ",err);
			}
		}
        var makeDesc = function(rule) {
            if( rule.description ) { return rule.description; }
            var desc = '';
            if( rule.type === 'ifttt' ) {
                desc = rule.type + ':' + rule.name;
            }
            else if( rule.type === 'mail' ) {
                // desc = MailForm.getDescription(rule); // FIXME: this doesnt work
				desc = rule.username +':'+rule.triggerType+':'+rule.triggerVal;
            }
			else if( rule.type === 'script' ) {
                desc = rule.intervalSecs +'s:' + rule.path;
            }
            else if( rule.type === 'file' ) {
				desc = rule.intervalSecs +'s:' + rule.path;
            }
            else if( rule.type === 'url' ) {
				desc = rule.intervalSecs +'s:' + rule.path;
                // desc = rule.path + ' @' +rule.intervalSecs +'s';
            }
			else if( rule.type === 'skype' ) {
				desc = rule.username + ':' + rule.triggerType;
			}
            return desc;
        };
		var makePattern = function(rule) {
			// log.msg("toolTable.render: makePattern:",rule);
			var pattstr = 'unknown';
			if( rule.actionType === 'play-pattern' ) {
				pattstr = PatternsService.getNameForId( rule.patternId );  // just text
				if( !pattstr ) { // if pattern not found
					pattstr = 'bad pattern';
			   	}
			}
			else {
				pattstr = rule.actionType;
			}
			// else if( rule.actionType === 'use-output' ) {
			// }
		   	return pattstr;
		};
		var makeBlink1IdStr = function(rule) {
			if( rule.blink1Id ) {
				return "\nblink1:"+rule.blink1Id ;
			}
			return '';
		};
        var makeLastValue = function(rule) {
            var eventsForMe = events.filter( function(e) {
                return ( (e.source===rule.type && e.id === rule.name) ||
					(e.source==='ifttt' && rule.type==='ifttt' && e.id === '-default-') );
            });
            var lastEvent = '-not-seen-recently-';
            if( eventsForMe.length ) {
                var myEvent = eventsForMe[eventsForMe.length-1];
				// lastEvent = moment(myEvent.date).fromNow() + ': ' + myEvent.text;
                // lastEvent = <span><i> {moment(myEvent.date).format('LTS') } </i>: {myEvent.text} </span>;
				lastEvent = <span>{myEvent.text} <i style={{fontSize:'90%'}}> @ {moment(myEvent.date).format('LTS') } </i></span>;
            }
            return lastEvent;
        };
		var createRow = function(rule, index) {
			// var pattid = this.state.rules[index].patternId;
			var patternStr = makePattern(rule);
			var blink1IdStr = makeBlink1IdStr(rule);
			var lastVal = makeLastValue(rule);
            var description = makeDesc(rule);
            var type = rule.type;  type = (type==='ifttt')? 'IFTTT' : type;  // FIXME
			var rowstyle = (rule.enabled) ? {} : { color:"#999" };
			return (
				<tr key={index} style={rowstyle} onDoubleClick={this.handleEditRule.bind(this, index, type)} >
					<td>{rule.name}</td>
                    <td>{description}</td>
					<td>{type}</td>
					<td>{patternStr}{blink1IdStr}</td>
					<td>{lastVal}</td>
					<td><Button bsSize="xsmall" style={{border:'none'}} onClick={this.handleEditRule.bind(this, index, type)} >
						<i className="fa fa-pencil"></i></Button></td>
				</tr>
			);
//			style={{textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}
		};

		return (
			<div style={{position: "relative", height: 200, cursor:'default'}}>

				<ScriptForm show={this.state.showForm==='script' || this.state.showForm==='file' || this.state.showForm === 'url' }
					workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={this.state.allowMultiBlink1}
					onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
					onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <MailForm show={this.state.showForm==='mail'}
					workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={this.state.allowMultiBlink1}
					onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
					onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <IftttForm show={this.state.showForm==='ifttt'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={this.state.allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

				<SkypeForm show={this.state.showForm==='skype'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={this.state.allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

				<div style={{display: "block", overflowY: "scroll", height: 165, border:'1px solid #eee'}}>
                    <div style={{padding:10}} hidden={this.state.rules.length}>
                        <h3> Click 'add rule' to begin! //FIXME </h3>
                    </div>
					<Table bordered condensed hover style={{fontSize:"0.9em"}} hidden={this.state.rules.length===0}>
						<thead>
							<tr stye={{lineHeight:"100%"}}>
                                <th style={{width:140}}>Name</th>
								<th style={{width:225}}>Description</th>
								<th style={{width: 30}}>Type</th>
								<th style={{width:130}}>Pattern</th>
								<th style={{width:150}}>Last event</th>
								<th style={{width: 30}}> </th>
							</tr>
						</thead>
						<tbody>
							{this.state.rules.map( createRow, this )}
						</tbody>
					</Table>
				</div>
				<div style={{position: "absolute", bottom: 0}}>
					<DropdownButton bsSize="small" bsStyle="primary" onSelect={this.handleAddRule} id="addRule" title={<span><i className="fa fa-plus"></i> add event source</span>}>
						<MenuItem eventKey="ifttt"><img width={15} height={15} src="images/ifttt.png" /> Add IFTTT </MenuItem>
						<MenuItem eventKey="mail"><i className="fa fa-envelope"></i> Add Mail </MenuItem>
						<MenuItem eventKey="script"><i className="fa fa-code"></i> Add Script</MenuItem>
						<MenuItem eventKey="url"><i className="fa fa-cloud"></i> Add URL</MenuItem>
						<MenuItem eventKey="file"><i className="fa fa-file"></i> Add File</MenuItem>
						<MenuItem eventKey="skype"><i className="fa fa-skype"></i> Add Skype</MenuItem>
					</DropdownButton>
				</div>
			</div>
        );
	}

});

module.exports = ToolTable;
