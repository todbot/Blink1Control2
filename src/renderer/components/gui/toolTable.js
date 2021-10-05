"use strict";

// var React = require('react');
// var DropdownButton = require('react-bootstrap').DropdownButton;
// var MenuItem = require('react-bootstrap').MenuItem;

import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { MenuItem } from 'react-bootstrap';


var simplecrypt = require('simplecrypt');

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control', method:"aes-192-ecb"});

var conf = require('common/blink1control2config');
var log = require('../../logger');

var utils = require('../../utils');

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');
var IftttService = require('../../server/iftttService');
var MailService = require('../../server/mailService');
var ScriptService = require('../../server/scriptService');
var TimeService = require('../../server/timeService');
var MqttService = require('../../server/mqttService');

import IftttForm from './iftttForm';
import TimeForm from './timeForm';
import ScriptForm from './scriptForm';
import MailForm from './mailForm';
import MqttForm  from './mqttForm';

import ToolTableList from './toolTableList';

import requireStatic from '@/requireStatic'  // for CSS url()s below


class ToolTable extends React.Component {
    constructor(props)  {
      super(props);
      var rules = JSON.parse(JSON.stringify( conf.readSettings('eventRules') ) ); // deep copy to avoid ipcRenderer.sendSync
      var allowMultiBlink1 = conf.readSettings("blink1Service:allowMulti");

      // do rules sanity check
      if( !rules ||
          rules.length===0 ||
          (rules.find( function(r) { return !r.type || !r.name } ) )
      ) {
          log.msg("ToolTable.getInitialState: no rules or bad rules, setting to empty");
          rules = [];
          conf.saveSettings("eventRules", rules);
      }

      this.state = {
        rules: rules,
        allowMultiBlink1: allowMultiBlink1,
        events: [],
        workingIndex:-1,
        showForm: "",
      };

      this.saveRules = this.saveRules.bind(this);
      this.updateService = this.updateService.bind(this);
      this.handleSaveForm = this.handleSaveForm.bind(this);
      this.handleCancelForm = this.handleCancelForm.bind(this);
      this.handleEditRule = this.handleEditRule.bind(this);
      this.handleDeleteRule = this.handleDeleteRule.bind(this);
      this.handleCopyRule = this.handleCopyRule.bind(this);
      this.handleAddRule = this.handleAddRule.bind(this);
    }

    saveRules(rules) {
        log.msg("ToolTable.saveRules");
        this.setState({rules: rules});  // FIXME:
        conf.saveSettings("eventRules", rules);
    }

    // based on rulenew, feed appropriate service new rule
    // FIXME: these "reloadConfig()" should really restart only new/changed rule
    updateService(rule) {
        if( !rule || !rule.type ) {
            log.msg("ToolTable.updateService: bad rule ",rule);
            return;
        }
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
        else if( rule.type === 'time' ) {
            TimeService.reloadConfig();
        }
        else if( rule.type === 'mqtt' ) {
            MqttService.reloadConfig();
        }
    }

    handleSaveForm(data) {
        log.msg("ToolTable.handleSaveForm:",data, "workingIndex:", this.state.workingIndex);
        var rules = this.state.rules;
        var rulenew = data; //{type:data.type, name: data.name, patternId: data.patternId, lastTime:0, source:'n/a' }; // FIXME:
        if( rulenew.password ) {
            rulenew.password = sc.encrypt( rulenew.password );
        }
        if( rulenew.name ) {
            rulenew.name = rulenew.name.trim();
        }
        if( this.state.workingIndex === -1 ) { // new rule
            rules.unshift( rulenew );
        }
        else {
            rules[this.state.workingIndex] = rulenew;
        }
        log.msg("handleSaveForm: rules", rules);
        this.setState({ showForm: "" });
        this.saveRules(rules);
        this.updateService(rulenew);
    }

    handleCancelForm() {
        log.msg("ToolTable.handleCancelForm");
        this.setState({ showForm: "" });
    }

    handleEditRule(idx) {
        log.msg("ToolTable.handleEditRule",idx, this.state.rules[idx].type );
        this.setState({ workingIndex: idx });
        this.setState({ showForm: this.state.rules[idx].type });
    }

    handleDeleteRule() {
        var idx = this.state.workingIndex;
        if( idx !== -1 ) {
            var ruleold = this.state.rules[idx];
            var rules = this.state.rules.filter( function(r,i) { return i!==idx; });
            log.msg("ToolTable.handleDeleteRule", ruleold.type, ruleold.name, idx,rules.length);
            this.saveRules(rules);
            this.setState( {workingIndex: -1} );
            this.updateService(ruleold);
        }
        this.setState({ showForm: "" });
    }

    handleCopyRule() {
        // console.log("ToolTable.handleCopyRule");
        if( this.state.workingIndex >= 0) {
            var rules = this.state.rules;
            var rule = Object.assign( {}, rules[ this.state.workingIndex ]); // clone
            rule.id = rule.id + utils.cheapUid(4);
            rule.name = rule.name + ' (copy)';
            rules.splice( this.state.workingIndex, 0, rule);
            this.setState({rules: rules});
        }
    }

    handleAddRule(key) {
        log.msg("ToolTable.handleAddRule",key);
        this.setState({showForm:key, workingIndex:-1});
    }

    render() {
      log.msg("ToolTableList.render");
      // hmm is there a better way to do the following
      // allowMulti if set and number of blink1s > 1
      // var allowMultiBlink1 = conf.readSettings("blink1Service:allowMulti") && (Blink1Service.isConnected() > 1);
      // var allowMultiBlink1 = (Blink1Service.isConnected() > 1) && conf.readSettings("blink1Service:allowMulti");
      var allowMultiBlink1 = (Blink1Service.isConnected() > 1) && this.state.allowMultiBlink1;

      var patterns = PatternsService.getAllPatterns();
        // var events = this.state.events;
        var workingRule = { name: 'new '+ this.state.showForm + ' rule '+ (this.state.rules.length+1),
                        type: this.state.showForm,
                        enabled: true,
            }; // FIXME: make createBlankRule(type)
        if( this.state.workingIndex !== -1 ) { // -1 means new rule, otherwise real rule
            // clone so form works on a copy. FIXME: needed?
            workingRule = Object.assign({}, this.state.rules[this.state.workingIndex] );
        }
        if( workingRule.password ) {
            try {
                workingRule.password = sc.decrypt( workingRule.password );
            } catch(err) {
                log.msg("toolTable: error decrypting passwd: ",err);
            }
        }

        return (
            <div style={{position: "relative", height: 200, cursor:'default'}}>

                <ScriptForm show={this.state.showForm==='script' || this.state.showForm==='file' || this.state.showForm === 'url' }
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <MailForm show={this.state.showForm==='mail'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <IftttForm show={this.state.showForm==='ifttt'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <TimeForm show={this.state.showForm==='time'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <MqttForm show={this.state.showForm==='mqtt'}
                        workingIndex={this.state.workingIndex}
                        rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                        onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                        onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <ToolTableList
                    rules={this.state.rules}
                    // events={this.state.events}
                    showForm={this.state.showForm}
                    onEditRule={this.handleEditRule} />

                <div style={{position: "absolute", bottom: 0}}>
                    <DropdownButton bsSize="small" bsStyle="primary" onSelect={this.handleAddRule} id="addRule" title={<span><i className="fa fa-plus"></i> add event source</span>}>
                        <MenuItem eventKey="ifttt"><img width={15} height={15} src={requireStatic('images/ifttt.png')} /> Add IFTTT </MenuItem>
                        <MenuItem eventKey="mail"><i className="fa fa-envelope"></i> Add Mail </MenuItem>
                        <MenuItem eventKey="script"><i className="fa fa-code"></i> Add Script</MenuItem>
                        <MenuItem eventKey="url"><i className="fa fa-cloud"></i> Add URL</MenuItem>
                        <MenuItem eventKey="file"><i className="fa fa-file"></i> Add File</MenuItem>
                        <MenuItem eventKey="time"><i className="fa fa-clock-o"></i> Add Alarm</MenuItem>
                        <MenuItem eventKey="mqtt"><i className="fa fa-clock-o"></i> Add MQTT</MenuItem>
                    </DropdownButton>
                </div>
            </div>
        );
    }

}

export default ToolTable;
// module.exports = ToolTable;
