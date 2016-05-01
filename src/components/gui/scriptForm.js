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


// var log = require('../../logger');


var ScriptForm = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
		rule: React.PropTypes.object.isRequired,
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
            type: rule.type || 'script',  // FIXME: allow URL & File here too?
            enabled: rule.enabled,
            name: rule.name,
            initialName: rule.name,
            actionType: rule.actionType,
            patternId: rule.patternId,
            filepath: rule.filepath,
            intervalSecs: rule.intervalSecs || 10
         });
	},
    handleClose: function() {
        if( !this.state.filepath ) {
            this.setState({errormsg: 'Must choose a file'});
            return;
        }
        this.props.onSave(this.state);
    },
    openFileDialog: function() {
        var self = this;
        dialog.showOpenDialog(function (filenames) {
            if (filenames === undefined) { return; }
            var filename = filenames[0];
            self.setState({filepath: filename});
        });
    },
    handleActionType: function(e) {
        var actionType = e.target.value;
        this.setState({actionType:actionType});
    },
    render: function() {
        var self = this;

        var title = "Script";
        if( this.state.type === 'file' ) {
            title = "File";
        }
        else if( this.state.type === 'url' ) {
            title = "URL";
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
                              type="text" label="{title} Path" placeholder="Click to choose script / program / batch file"
                              valueLink={this.linkState('filepath')}
                              onClick={this.openFileDialog}/>
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
                              <Row ><Col xs={2}>
                                  <label> Parse output as</label>
                              </Col><Col xs={4} style={{border:'0px solid green'}}>
                                  <Input
                                      type="radio" label="Parse output as color" value="parse-as-color"
                                      checked={this.state.actionType==='parse-as-color'}
                                      onChange={this.handleActionType} />
                                  <Input
                                      type="radio" label="Parse output as pattern name" value="parse-as-pattern"
                                      checked={this.state.actionType==='parse-as-pattern'}
                                      onChange={this.handleActionType} />
                              </Col></Row>
                          </Grid>

                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsStyle="danger" bsSize="small" onClick={this.props.onDelete}  style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small"  onClick={this.props.onCopy}  style={{float:'left'}}>Copy</Button>
                            </Col>
                            <Col xs={3}>
                                    <Switch labelText="Enable" size="small"
                                        state={this.state.enabled} onChange={function(s){self.setState({enabled:s});}} />
                            </Col>
                            <Col xs={4}>
                                <Button onClick={this.props.onCancel}>Cancel</Button>
                                <Button onClick={this.handleClose}>OK</Button>
                            </Col>
                        </Row>
                    </Modal.Footer>
              </Modal>
          </div>
        );
    }
});

module.exports = ScriptForm;
