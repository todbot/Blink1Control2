
"use strict";

import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { Form } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { FormGroup } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { Radio } from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';

import Switch from 'react-bootstrap-switch';

import Blink1SerialOption from './blink1SerialOption';

var dialog = require('electron').remote.dialog;

var log = require('../../logger');

class ScriptForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = { };
      this.handleClose = this.handleClose.bind(this);
      this.openFileDialog = this.openFileDialog.bind(this);
      this.handleActionType = this.handleActionType.bind(this);
      this.handleBlink1SerialChange = this.handleBlink1SerialChange.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: rule.type || '',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            actionType: rule.actionType || 'parse-color',
            actOnNew: rule.actOnNew || false,
            // patternId: rule.patternId,
            blink1Id: rule.blink1Id || "0",
            path: rule.path || '',
            intervalSecs: rule.intervalSecs || 10,
            errormsg: ''
         });
    }

    handleClose() {
        if( !this.state.path ) {
            this.setState({errormsg: 'Must choose a '+this.state.type});
            return;
        }
        this.props.onSave(this.state);
    }

    openFileDialog() {
        var self = this;
        log.msg("openFileDialog: opening...")
        dialog.showOpenDialog({properties: ['openFile'] }).then(function (response) {
          if (!response.canceled) {
            var filename = response.filePaths[0];  // fully qualified filename
            self.setState({path: filename});
          }
        })
    }

    handleActionType(e) {
        var actionType = e.target.value;
        this.setState({actionType:actionType});
    }

    handleBlink1SerialChange(blink1Id) {
        this.setState({blink1Id: blink1Id});
    }

    handleInputChange(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    }

    render() {
        var self = this;
        var type = this.state.type;
        var title,pathlabel, pathplaceholder;
        if( type === 'script' ) {
            title = "Script";
            pathlabel = "Script Path";
            pathplaceholder = "Click to choose script";
        }
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
                        <Form horizontal >
                            <FormGroup controlId="formName" title="rule name in config">
                                <Col sm={3} componentClass={ControlLabel}>  Rule Name  </Col>
                                <Col sm={8}>
                                    <FormControl type="text" placeholder="Name of rule you pick"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formPath" >
                                <Col sm={3} componentClass={ControlLabel}> {pathlabel}  </Col>
                                <Col sm={8}>
                                    {type==='url'  ?
                                        <FormControl type="text" placeholder={pathplaceholder}
                                            name="path" value={this.state.path} onChange={this.handleInputChange} />
                                    :
                                        <FormControl type="text" placeholder={pathplaceholder} readOnly
                                            name="path" value={this.state.path} onClick={this.openFileDialog}/>
                                    }
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formInterval" >
                                <Col sm={3} componentClass={ControlLabel}> Check interval </Col>
                                <Col sm={6}>
                                    <FormControl componentClass="select" placeholder="15 seconds"
                                        name="intervalSecs" value={this.state.intervalSecs} onChange={this.handleInputChange} >
                                        <option value="2">2 seconds</option>
                                        <option value="5">5 seconds</option>
                                        <option value="10">10 seconds</option>
                                        <option value="15">15 seconds</option>
                                        <option value="30">30 seconds</option>
                                        <option value="60">1 minute</option>
                                        <option value="360">5 minutes</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <Grid >
                                <Row><Col xs={2}>
                                    <label> Parse output as </label>
                                </Col><Col xs={4} >
                                    <FormGroup controlId="formActionType" >
                                        <Radio title=""
                                            value="parse-json"
                                            checked={this.state.actionType==='parse-json'}
                                            onChange={this.handleActionType}>
                                            Parse output as JSON (color or pattern)
                                        </Radio>
                                        <Radio title=""
                                            value="parse-pattern"
                                            checked={this.state.actionType==='parse-pattern'}
                                            onChange={this.handleActionType}>
                                            Parse output as pattern name
                                        </Radio>
                                        <Radio title=""
                                            value="parse-color"
                                            checked={this.state.actionType==='parse-color'}
                                            onChange={this.handleActionType}>
                                            Parse output as color
                                        </Radio>
                                    </FormGroup>
                                </Col></Row>
                            </Grid>

                            <FormGroup controlId="formTrigger" >
                                <Col sm={3} componentClass={ControlLabel}> Trigger </Col>
                                <Col sm={8}>
                                    <Checkbox
                                        name="actOnNew" checked={this.state.actOnNew} onChange={this.handleInputChange}>
                                        Trigger on new values only
                                    </Checkbox>
                                </Col>
                            </FormGroup>

                            {!this.props.allowMultiBlink1 ? <div/> :
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelColWidth={3} controlColWidth={3}
                                    serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                            </Col>
                            <Col xs={3}>
                                <Switch bsSize="mini" labelText='enabled'
                                    state={this.state.enabled} onChange={(el,enabled)=> this.setState({enabled})} />
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
}

ScriptForm.propTypes = {
  rule: PropTypes.object.isRequired,
  allowMultiBlink1: PropTypes.bool,
  patterns: PropTypes.array,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func
};

export default ScriptForm;
