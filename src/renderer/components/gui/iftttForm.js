"use strict";

import React from 'react';
import PropTypes from 'prop-types';

import { Col } from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { FormGroup } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import Switch from 'react-bootstrap-switch';

import Blink1SerialOption from './blink1SerialOption';

class IftttForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = { };
      this.handleClose = this.handleClose.bind(this);
      this.handleBlink1SerialChange = this.handleBlink1SerialChange.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    // FIXME: why do this instead of getInitialState?  because need props to load state
    componentWillReceiveProps(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: 'ifttt',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id || '',
            blink1Id: rule.blink1Id || "0"
         }); // FIXME: why
    }

    handleClose() {
        this.props.onSave(this.state);
    }

    handleBlink1SerialChange(blink1Id) {
        console.log("blink1Id:",blink1Id);
        this.setState({blink1Id: blink1Id});
    }

    handleInputChange(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    }

    render() {

        var createPatternOption = function(item, idx) {
          return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.close} >
                    <Modal.Header>
                        <Modal.Title>IFTTT Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal>
                            <FormGroup controlId="formName" title="">
                                <Col sm={3} componentClass={ControlLabel}>  Rule Name  </Col>
                                <Col sm={8}>
                                    <FormControl type="text" placeholder="Name of rule on IFTTT"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
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
                                <Button bsSize="small"  onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                          </Col>
                          <Col xs={3}>
                              <Switch bsSize="small" labelText='enabled'
                                  value={this.state.enabled} onChange={(el,enabled)=> this.setState({enabled})} />
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
};

IftttForm.propTypes = {
    rule: PropTypes.object.isRequired,
    allowMultiBlink1: PropTypes.bool,
    patterns: PropTypes.array,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    onDelete: PropTypes.func,
    onCopy: PropTypes.func
};

export default IftttForm;
// module.exports = IftttForm;
