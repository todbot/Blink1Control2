"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;

var Switch = require('react-bootstrap-switch');

var Blink1SerialOption = require('./blink1SerialOption');

var MqttForm = React.createClass({
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
        return {
            // name: rule.name,
            // patternId: rule.patternId
        };
    },
    // FIXME: why am I doing this?
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: 'mqtt',
            enabled: rule.enabled,
            name: rule.name,
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id,
            blink1Id: rule.blink1Id || "0",
            topic: rule.topic || "",
            url: rule.url || "",
            username: rule.username || "",
            password: rule.password || "",
         }); // FIXME: why
    },
    handleClose: function() {
        this.props.onSave(this.state);
    },
    handleBlink1SerialChange: function(blink1Id) {
        this.setState({blink1Id: blink1Id});
    },
    handleInputChange: function(event) {
      var target = event.target;
      var value = target.type === 'checkbox' ? target.checked : target.value;
      var name = target.name;
      this.setState({ [name]: value });
    },

    render: function() {
        var self = this;

        var createPatternOption = function(item, idx) {
          return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.close} >
                    <Modal.Header>
                        <Modal.Title>MQTT Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal>
                          <FormGroup controlId="formName" title="">
                              <Col sm={3} componentClass={ControlLabel}> Rule name </Col>
                              <Col sm={8}>
                                  <FormControl type="text" placeholder="Name of rule"
                                      name="name" value={this.state.name} onChange={this.handleInputChange} />
                              </Col>
                          </FormGroup>

                          <FormGroup controlId="formHost" bsSize="small">
                              <Col sm={3} componentClass={ControlLabel}> MQTT Topic </Col>
                              <Col sm={6}>
                                  <FormControl type="text" placeholder="topic to subscribe to"
                                      name="topic" value={this.state.topic} onChange={this.handleInputChange} />
                              </Col>
                          </FormGroup>
                          <FormGroup controlId="formHost" bsSize="small">
                              <Col sm={3} componentClass={ControlLabel}> MQTT URL </Col>
                              <Col sm={6}>
                                  <FormControl type="text" placeholder="e.g. mqtts://io.adafruit.com/"
                                      name="url" value={this.state.url} onChange={this.handleInputChange} />
                              </Col>
                          </FormGroup>
                          <FormGroup controlId="formUsername" bsSize="small">
                              <Col sm={3} componentClass={ControlLabel}> MQTT Username </Col>
                              <Col sm={6}>
                                  <FormControl type="text" placeholder="Enter username (e.g. email addr)"
                                      name="username" value={this.state.username} onChange={this.handleInputChange} />
                              </Col>
                          </FormGroup>
                          <FormGroup controlId="formPassword" bsSize="small">
                              <Col sm={3} componentClass={ControlLabel}> MQTT Password </Col>
                              <Col sm={6}>
                                  <FormControl type="password" placeholder=""
                                      name="password" value={this.state.password} onChange={this.handleInputChange} />
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
                                <Switch bsSize="small" labelText="Enable"
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

module.exports = MqttForm;
