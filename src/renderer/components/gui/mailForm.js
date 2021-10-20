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
import { InputGroup } from 'react-bootstrap';

import Switch from 'react-bootstrap-switch';

var log = require('../../logger');

var Blink1SerialOption = require('./blink1SerialOption');

class MailForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        useSSL: true
      };

      this.handleBlink1SerialChange = this.handleBlink1SerialChange.bind(this);
      this.handleClose = this.handleClose.bind(this);
      this.onMailTypeClick = this.onMailTypeClick.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    // given a rule, return a text description
    getDescription(rule) {
        return rule.username +':'+rule.triggerType+':'+rule.triggerVal;
    }

    componentWillReceiveProps(nextProps) {
        var rule = nextProps.rule;
        var useSSL = rule.useSSL == undefined ? true : rule.useSSL;
        // log.msg("mailForm: rule:",rule);
        this.setState({
            type: 'mail',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            patternId: rule.patternId || this.props.patterns[0].id || '',
            mailtype: rule.mailtype || 'IMAP',  // default it
            host: rule.host || '',
            port: rule.port || 993,
            username: rule.username || '',
            password: rule.password || '' ,
            useSSL: useSSL,
            actionType: 'play-pattern',
            triggerType: rule.triggerType || 'unread',
            triggerVal: rule.triggerVal || '1' ,
            triggerOff: rule.triggerOff || false,
            errormsg: ''
        });
    }

    handleBlink1SerialChange(blink1Id) {
        this.setState({blink1Id: blink1Id});
    }

    handleClose() {
        // console.log("CLOSING: state=",this.state);
        if( !this.state.mailtype ) {
            this.setState({errormsg: "mailtype not set!"});
            return;
        }
        else if( !this.state.host ) {
            this.setState({errormsg: "host not set!"});
            return;
        }
        else if( !this.state.username || !this.state.password ) {
            this.setState({errormsg: "username or password not set!"});
            return;
        }
        this.props.onSave(this.state);
    }

    onMailTypeClick(evt) {
        var mailtype = evt.target.value;
        log.msg("mailForm.onMailTypeClick ",mailtype);//,evt);
        if( mailtype === 'GMAIL' ) {
            this.setState({host:'imap.gmail.com', port:993, useSSL:true});
        }
        this.setState({mailtype:mailtype});
    }

    handleInputChange(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    }

    render() {
        var self = this;
        var patterns = this.props.patterns;
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };
        var triggerValNum = this.state.triggerVal;
        var triggerValStr = this.state.triggerVal;
        var triggerType = this.state.triggerType; // shortcut

        return (
            <Modal show={this.props.show} onHide={this.close} bsSize="large">
                <Modal.Header>
                    <Modal.Title> Mail Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{color: "#f00"}}>{this.state.errormsg}</p>

                    <Grid><Row><Col xs={5}>
                        <Form horizontal>
                            <FormGroup controlId="formName" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Rule Name </Col>
                                <Col sm={6}>
                                    <FormControl type="text" placeholder="Name of rule on IFTTT"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formMailType" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Account type </Col>
                                <Col sm={4}>
                                    <FormControl componentClass="select" placeholder="IMAP"
                                        name="mailtype" value={this.state.mailtype} onChange={this.onMailTypeClick}>
                                        <option value="IMAP">IMAP</option>
                                        <option value="GMAIL">Gmail IMAP</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formHost" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Mail server </Col>
                                <Col sm={6}>
                                    <FormControl type="text" placeholder="mail.example.com"
                                        name="host" value={this.state.host} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formUsername" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Username </Col>
                                <Col sm={6}>
                                    <FormControl type="text" placeholder="Enter username (e.g. email addr)"
                                        name="username" value={this.state.username} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formPassword" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Password </Col>
                                <Col sm={6}>
                                    <FormControl type="password" placeholder=""
                                        name="password" value={this.state.password} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formPort" bsSize="small">
                                <Col sm={3} componentClass={ControlLabel}> Port </Col>
                                <Col sm={3}>
                                    <FormControl type="text" placeholder="993"
                                        name="port" value={this.state.port} onChange={this.handleInputChange} />
                                </Col>
                                <Col sm={3}>
                                    <Checkbox inline name="useSSL" checked={this.state.useSSL} onChange={this.handleInputChange}>
                                        useSSL
                                    </Checkbox>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Col>
                    <Col xs={6}>
                        <Form horizontal>
                            <span><b> Play pattern when </b></span>

                            <FormGroup controlId="formUnread" bsSize="small">
                                <Col sm={5} componentClass={ControlLabel}> Unread email count &gt;= </Col>
                                <Col sm={3}>
                                    <InputGroup>
                                        <InputGroup.Addon>
                                            <input type="radio" name="triggerType" value="unread"
                                                checked={triggerType==='unread'} onChange={this.handleInputChange} />
                                        </InputGroup.Addon>
                                        <FormControl type="number" disabled={!(triggerType==='unread')}
                                            name="triggerVal" value={triggerType==='unread'? triggerValNum:''}
                                            onChange={this.handleInputChange}/>
                                    </InputGroup>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formSubject" bsSize="small">
                                <Col sm={5} componentClass={ControlLabel}> Subject contains </Col>
                                <Col sm={6}>
                                    <InputGroup>
                                        <InputGroup.Addon>
                                            <input type="radio" name="triggerType" value="subject"
                                                checked={triggerType==='subject'} onChange={this.handleInputChange} />
                                        </InputGroup.Addon>
                                        <FormControl type="text" disabled={!(triggerType==='subject')}
                                            name="triggerVal" value={triggerType==='subject' ? triggerValStr:''}
                                            onChange={this.handleInputChange}/>
                                    </InputGroup>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formSender" bsSize="small">
                                <Col sm={5} componentClass={ControlLabel}> Sender contains </Col>
                                <Col sm={6}>
                                    <InputGroup>
                                        <InputGroup.Addon>
                                            <input type="radio" name="triggerType" value="sender"
                                                checked={triggerType==='sender'} onChange={this.handleInputChange} />
                                        </InputGroup.Addon>
                                        <FormControl type="text" disabled={!(triggerType==='sender')}
                                            name="triggerVal" value={triggerType==='sender' ? triggerValStr:''}
                                            onChange={this.handleInputChange} />
                                    </InputGroup>
                                </Col>
                            </FormGroup>

                            <span><b> Pattern </b></span>

                            <FormGroup controlId="formPatternId" bsSize="small">
                                <Col sm={5} componentClass={ControlLabel}>  Pattern  </Col>
                                <Col sm={6}>
                                    <FormControl componentClass="select"
                                        name="patternId" value={this.state.patternId} onChange={this.handleInputChange} >
                                        {this.props.patterns.map( createPatternOption )}
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formTurnOff" bsSize="small">
                                <Col sm={5} componentClass={ControlLabel}> </Col>
                                <Col sm={7}>
                                    <Checkbox
                                        name="triggerOff" checked={this.state.triggerOff} onChange={this.handleInputChange} >
                                        Turn blink(1) off when no match
                                    </Checkbox>
                                </Col>
                            </FormGroup>

                            {!this.props.allowMultiBlink1 ? <div/>:
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelColWidth={5} controlColWidth={4} bsSize="small"
                                    serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}

                        </Form>

                    </Col></Row></Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Row>
                        <Col xs={5}>
                            <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete}
                                style={{float:'left'}}>Delete</Button>
                            <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                        </Col>
                        <Col xs={3}>
                            <Switch bsSize="small" labelText='enabled'
                                state={this.state.enabled} onChange={(el,enabled)=> this.setState({enabled})} />
                        </Col>
                        <Col xs={4}>
                            <Button bsSize="small" onClick={this.props.onCancel}>Cancel</Button>
                            <Button bsSize="small" onClick={this.handleClose}>OK</Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Modal>

        );
    }
}

MailForm.propTypes = {
  rule: PropTypes.object.isRequired,
  allowMultiBlink1: PropTypes.bool,
  patterns: PropTypes.array,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func
};

export default MailForm;
