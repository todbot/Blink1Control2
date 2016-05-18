
"use strict";

var React = require('react');
var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
//var FormControls = require('react-bootstrap').FormControls;
// var ButtonGroup = require('react-bootstrap').ButtonGroup;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var Switch = require('react-bootstrap-switch');

var dialog = require('electron').remote.dialog;

var Blink1SerialOption = require('./blink1SerialOption');
var Blink1Service = require('../../server/blink1Service'); // FIXME: shouldn't need this dep


var ScriptForm = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
		rule: React.PropTypes.object.isRequired,
        allowMultiBlink1: React.PropTypes.bool,
        patterns: React.PropTypes.array,
        onSave: React.PropTypes.func,
        onCancel: React.PropTypes.func,
        onDelete: React.PropTypes.func,
        onCopy: React.PropTypes.func
	},
    getInitialState: function() {
        return {};
    },
    // FIXME: why am I doing this instead of getInitialState?
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
		this.setState({
            type: rule.type || 'script',
            enabled: rule.enabled,
            name: rule.name,
            initialName: rule.name,
            actionType: rule.actionType || 'parse-color',
            actOnNew: rule.actOnNew,
            // patternId: rule.patternId,
            blink1Id: rule.blink1Id,
            path: rule.path,
            intervalSecs: rule.intervalSecs || 10
         });
	},
    handleClose: function() {
        if( !this.state.path ) {
            this.setState({errormsg: 'Must choose a path'});
            return;
        }
        this.props.onSave(this.state);
    },
    openFileDialog: function() {
        var self = this;
        dialog.showOpenDialog(function (filenames) {
            if (filenames === undefined) { return; }
            var filename = filenames[0];
            self.setState({path: filename});
        });
    },
    handleActionType: function(e) {
        var actionType = e.target.value;
        this.setState({actionType:actionType});
    },
    handleBlink1SerialChange: function(blink1Id) {
        // console.log("handleBlink1SerialChange: ",e);//,blink1Id);
        this.setState({blink1Id: blink1Id});
    },
    render: function() {
        var self = this;
        var type = this.state.type;

        var title = "Script";
        var pathlabel = "Script Path";
        var pathplaceholder = "Click to choose script";
        if( type === 'file' ) {
            title = "File";
            pathlabel = "File Path";
            pathplaceholder = "Click to choose file path";
        }
        else if( type === 'url' ) {
            title = "URL";
            pathlabel = "URL";
            pathplaceholder = "Enter URL";
        }

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>{title} Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <p></p>
                        <form className="form-horizontal" >
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                              type="text" label="Rule Name" placeholder="Descriptive name"
                              valueLink={this.linkState('name')} />
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                              type="text" label={pathlabel} placeholder={pathplaceholder}
                              valueLink={this.linkState('path')}
                              onClick={type!=='url' ? this.openFileDialog : null}/>
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                              type="select" label="Check interval" placeholder="15 seconds"
                              valueLink={this.linkState('intervalSecs')} >
                              <option value="2">2 seconds</option>
                              <option value="5">5 seconds</option>
                              <option value="10">10 seconds</option>
                              <option value="15">15 seconds</option>
                              <option value="30">30 seconds</option>
                              <option value="60">1 minute</option>
                              <option value="360">5 minutes</option>
                          </Input>
                          <Grid >
                              <Row><Col xs={2}>
                                  <label> Parse output as </label>
                              </Col><Col xs={4} style={{border:'0px solid green'}}>
                                  <Input
                                      type="radio" label="Parse output as color" value="parse-color"
                                      checked={this.state.actionType==='parse-color'}
                                      onChange={this.handleActionType} />
                                  <Input
                                      type="radio" label="Parse output as pattern name" value="parse-pattern"
                                      checked={this.state.actionType==='parse-pattern'}
                                      onChange={this.handleActionType} />
                                  <Input
                                      type="radio" label="Parse output as JSON" value="parse-json"
                                      checked={this.state.actionType==='parse-json'}
                                      onChange={this.handleActionType} />
                              </Col></Row>
                          <Row><Col xs={4} xsOffset={2}><Input bsSize="small" type="checkbox" label="Trigger on new values only"
                                        checkedLink={this.linkState('actOnNew')} />
                            </Col></Row>
                          </Grid>

                          {this.props.allowMultiBlink1 ?

                              <Blink1SerialOption label="blink(1) to use" labelClassName="col-xs-3" wrapperClassName="col-xs-3"
                                  serial={this.state.blink1Id} serials={Blink1Service.getAllSerials()} onChange={this.handleBlink1SerialChange}/> : null}


                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                            </Col>
                            <Col xs={3}>
                                    <Switch size="small" labelText="Enable"
                                        state={this.state.enabled} onChange={function(s){self.setState({enabled:s});}} />
                            </Col>
                            <Col xs={4}>
                                <Button bsSize="small" onClick={this.props.onCancel}>Cancel</Button>
                                <Button bsSize="small" onClick={this.handleClose}>OK</Button>
                            </Col>
                        </Row>
                    </Modal.Footer>
              </Modal>
          </div>
        );
    }
});

module.exports = ScriptForm;
