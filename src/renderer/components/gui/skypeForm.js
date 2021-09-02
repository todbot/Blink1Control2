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

import Switch from 'react-bootstrap-switch';

import Blink1SerialOption from './blink1SerialOption';

var log = require('../../logger');


class SkypeForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
      }
      this.handleClose = this.handleClose.bind(this);
      this.handleTriggerType = this.handleTriggerType.bind(this);
      this.handleBlink1SerialChange = this.handleBlink1SerialChange.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type:'skype',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            username: rule.username || '',
            password: rule.password || '',
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id || '',
            triggerType: rule.triggerType || 'any',
            triggerVal: rule.triggerVal || '1' ,
        });
    }

    handleClose() {
        if( !this.state.username || !this.state.password ) {
            this.setState({errormsg: "username or password not set!"});
            return;
        }
        this.props.onSave(this.state);
    }

    handleTriggerType(evt) {
        log.msg("skypeform.handleTriggerType ",evt.target.value);
        this.setState({triggerType: evt.target.value});
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
        // var patterns = this.props.patterns;
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Skype Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal>
                            <FormGroup controlId="formName" >
                                <Col sm={3} componentClass={ControlLabel}> Rule Name </Col>
                                <Col sm={8}>
                                    <FormControl type="text" label="Name" placeholder="Enter rule name"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formUsername" >
                                <Col sm={3} componentClass={ControlLabel}> Skype Username </Col>
                                <Col sm={8}>
                                    <FormControl type="text" placeholder="Enter username (usually full email address)"
                                        name="username" value={this.state.username} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formPassword">
                                <Col sm={3} componentClass={ControlLabel}> Password </Col>
                                <Col sm={8}>
                                    <FormControl type="password" placeholder=""
                                        name="password" value={this.state.password} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formPattern" >
                                <Col xs={3} componentClass={ControlLabel}> Play pattern on </Col>
                                <Col xs={4} >
                                    <Radio value="any"
                                        checked={this.state.triggerType==='any'}
                                        onChange={this.handleTriggerType} > Any Skype event </Radio>
                                    <Radio value="incoming-call"
                                        checked={this.state.triggerType==='incoming-call'}
                                        onChange={this.handleTriggerType} > Incoming call </Radio>
                                    <Radio value="incoming-text"
                                        checked={this.state.triggerType==='incoming-text'}
                                        onChange={this.handleTriggerType} > Incoming text message </Radio>
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formPatternId">
                                <Col sm={3} componentClass={ControlLabel}>  Pattern  </Col>
                                <Col sm={8}>
                                    <FormControl componentClass="select"
                                        name="patternId" value={this.state.patternId} onChange={this.handleInputChange} >
                                        {this.props.patterns.map( createPatternOption )}
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            {!this.props.allowMultiBlink1 ? <div/>:
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelColWidth={3} controlColWidth={4}
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

SkypeForm.propTypes = {
  rule: PropTypes.object.isRequired,
  patterns: PropTypes.array,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func
};

export default SkypeForm;
