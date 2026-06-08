"use strict";

var React = require('react');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var simplecrypt = require('simplecrypt');

// 'sc' requirement should go away in 2.2.30
var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control', method:"aes-192-ecb"});
var utils = require('../../utils');

var log = require('../../logger');

var IftttForm = require('./iftttForm');
var MailForm = require('./mailForm');
var ScriptForm = require('./scriptForm');
var TimeForm = require('./timeForm');
var MqttForm = require('./mqttForm');

var ToolTableList = require('./toolTableList');


var ToolTable = createReactClass({
  getInitialState: function() {
    // var rules = window.electronAPI.config.readSettings('eventRules');
    var rules = JSON.parse(JSON.stringify( window.electronAPI.config.readSettings('eventRules') ) ); // deep copy
    var allowMultiBlink1 = window.electronAPI.config.readSettings("blink1Service:allowMulti");
      // do rules sanity check
      if( !rules ||
          rules.length===0 ||
          (rules.find( function(r) { return !r.type || !r.name } ) )
      ) {
          log.msg("ToolTable.getInitialState: no rules or bad rules, setting to empty");
          rules = [];
          window.electronAPI.config.saveSettings("eventRules", rules);
      }

      var passwordsUpdated = false;
      // convert & upgrade old style passwords to new style
      rules.map(function(r) {
        if( r.password && !r.passwordHash ) {
            r.passwordHash = utils.encrypt(sc.decrypt( r.password ));
            passwordsUpdated = true;
        }
      });
      if( passwordsUpdated ) {
        window.electronAPI.config.saveSettings("eventRules", rules);
      }

      // var events = Eventer.getStatuses();
      return {
          rules: rules,
          allowMultiBlink1: allowMultiBlink1,
          events: [],
          workingIndex:-1,
          showForm: "",
          showAddMenu: false,
      };
  },
    saveRules: function(rules) {
        log.msg("ToolTable.saveRules");
        this.setState({rules: rules});  // FIXME:
        window.electronAPI.config.saveSettings("eventRules", rules);
    },
    // based on rulenew, feed appropriate service new rule
    // FIXME: these "reloadConfig()" should really restart only new/changed rule
    updateService: function(rule) {
        if( !rule || !rule.type ) {
            log.msg("ToolTable.updateService: bad rule ",rule);
            return;
        }
        window.electronAPI.eventServices.reloadConfig(rule.type);
    },
    handleSaveForm: function(data) {
        log.msg("ToolTable.handleSaveForm:",data, "workingIndex:", this.state.workingIndex);
        var rules = this.state.rules;
        var rulenew = data; //{type:data.type, name: data.name, patternId: data.patternId, lastTime:0, source:'n/a' }; // FIXME:
        if( rulenew.password ) {
            rulenew.passwordHash = utils.encrypt( rulenew.password );
            delete rulenew.password;  // do not save cleartext password
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
    },
    handleCancelForm: function() {
        log.msg("ToolTable.handleCancelForm");
        this.setState({ showForm: "" });
    },
    handleEditRule: function(idx) {
        log.msg("ToolTable.handleEditRule",idx, this.state.rules[idx].type );
        this.setState({ workingIndex: idx });
        this.setState({ showForm: this.state.rules[idx].type });
    },
    handleDeleteRule: function() {
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
    },
    handleCopyRule: function() {
        // console.log("ToolTable.handleCopyRule");
        if( this.state.workingIndex >= 0) {
            var rules = this.state.rules;
            var rule = Object.assign( {}, rules[ this.state.workingIndex ]); // clone
            rule.id = rule.id + utils.cheapUid(4);
            rule.name = rule.name + ' (copy)';
            rules.splice( this.state.workingIndex, 0, rule);
            this.setState({rules: rules});
        }
    },

    handleAddRule: function(key) {
        log.msg("ToolTable.handleAddRule",key);
        this.setState({showForm:key, workingIndex:-1});
    },
    render: function() {
      log.msg("ToolTableList.render");
      // hmm is there a better way to do the following
      // allowMulti if set and number of blink1s > 1
      var allowMultiBlink1 = (window.electronAPI.blink1.isConnected() > 1) && this.state.allowMultiBlink1;

      var patterns = window.electronAPI.patterns.getAllPatterns();
        // var events = this.state.events;
        var workingRule = { name: 'new '+ this.state.showForm + ' rule '+ (this.state.rules.length+1),
                        type: this.state.showForm,
                        enabled: true,
            }; // FIXME: make createBlankRule(type)
        if( this.state.workingIndex !== -1 ) { // -1 means new rule, otherwise real rule
            // clone so form works on a copy. FIXME: needed?
            workingRule = Object.assign({}, this.state.rules[this.state.workingIndex] );
        }
        if( workingRule.passwordHash ) {
            try {
                workingRule.password = utils.decrypt( workingRule.passwordHash );
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

                <MqttForm show={this.state.showForm==='mqtt'}
                    workingIndex={this.state.workingIndex}
                    rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
                    onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
                    onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />

                <TimeForm show={this.state.showForm==='time'}
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
                    {this.state.showAddMenu && <div
                        style={{position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:999}}
                        onClick={() => this.setState({showAddMenu: false})} />}
                    <div style={{position:'relative', display:'inline-block'}}>
                        <button className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); this.setState(function(s) { return {showAddMenu: !s.showAddMenu}; }); }}>
                            <i className="fa fa-plus"></i> add event source <span className="caret"></span>
                        </button>
                        {this.state.showAddMenu &&
                            <ul style={{position:'absolute', bottom:'100%', left:0, zIndex:1000, backgroundColor:'#fff',
                                         border:'1px solid #ccc', borderRadius:3, padding:'4px 0', margin:'0 0 2px',
                                         listStyle:'none', boxShadow:'0 2px 6px rgba(0,0,0,0.2)', minWidth:160}}>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('ifttt'); }}>
                                    <img width={15} height={15} src="images/ifttt.png" /> Add IFTTT</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('mail'); }}>
                                    <i className="fa fa-envelope"></i> Add Mail</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('script'); }}>
                                    <i className="fa fa-code"></i> Add Script</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('url'); }}>
                                    <i className="fa fa-cloud"></i> Add URL</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('file'); }}>
                                    <i className="fa fa-file"></i> Add File</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('mqtt'); }}>
                                    <i className="fa fa-share-alt"></i> Add MQTT</li>
                                <li className="dropdown-item" style={{padding:'4px 12px', cursor:'pointer'}}
                                    onClick={() => { this.setState({showAddMenu:false}); this.handleAddRule('time'); }}>
                                    <i className="fa fa-clock-o"></i> Add Alarm</li>
                            </ul>
                        }
                    </div>
                </div>
            </div>
        );
    }

    //     return (
    //         <div style={{position: "relative", height: 200, cursor:'default'}}>
    //
    //             <ScriptForm show={this.state.showForm==='script' || this.state.showForm==='file' || this.state.showForm === 'url' }
    //                 workingIndex={this.state.workingIndex}
    //                 rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
    //                 onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
    //                 onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />
    //
    //             <MailForm show={this.state.showForm==='mail'}
    //                 workingIndex={this.state.workingIndex}
    //                 rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
    //                 onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
    //                 onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />
    //
    //             <IftttForm show={this.state.showForm==='ifttt'}
    //                 workingIndex={this.state.workingIndex}
    //                 rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
    //                 onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
    //                 onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />
    //
    //             <SkypeForm show={this.state.showForm==='skype'}
    //                 workingIndex={this.state.workingIndex}
    //                 rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
    //                 onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
    //                 onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />
    //
    //             <TimeForm show={this.state.showForm==='time'}
    //                 workingIndex={this.state.workingIndex}
    //                 rule={workingRule} patterns={patterns} allowMultiBlink1={allowMultiBlink1}
    //                 onSave={this.handleSaveForm} onCancel={this.handleCancelForm}
    //                 onDelete={this.handleDeleteRule} onCopy={this.handleCopyRule} />
    //
    //
    //             <ToolTableList
    //                 rules={this.state.rules}
    //                 // events={this.state.events}
    //                 showForm={this.state.showForm}
    //                 onEditRule={this.handleEditRule} />
    //
    //             <div style={{position: "absolute", bottom: 0}}>
    //                 <DropdownButton bsSize="small" bsStyle="primary" onSelect={this.handleAddRule} id="addRule" title={<span><i className="fa fa-plus"></i> add event source</span>}>
    //                     <MenuItem eventKey="ifttt"><img width={15} height={15} src="images/ifttt.png" /> Add IFTTT </MenuItem>
    //                     <MenuItem eventKey="mail"><i className="fa fa-envelope"></i> Add Mail </MenuItem>
    //                     <MenuItem eventKey="script"><i className="fa fa-code"></i> Add Script</MenuItem>
    //                     <MenuItem eventKey="url"><i className="fa fa-cloud"></i> Add URL</MenuItem>
    //                     <MenuItem eventKey="file"><i className="fa fa-file"></i> Add File</MenuItem>
    //                     <MenuItem eventKey="skype"><i className="fa fa-skype"></i> Add Skype</MenuItem>
    //                     <MenuItem eventKey="time"><i className="fa fa-clock-o"></i> Add Alarm</MenuItem>
    //                 </DropdownButton>
    //             </div>
    //         </div>
    //     );
    // }
    // <MenuItem eventKey="mqtt"><i className="fa fa-share-alt"></i> Add MQTT</MenuItem>

});

module.exports = ToolTable;
