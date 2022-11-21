"use strict";

var React = require('react');
var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;
var Radio = require('react-bootstrap').Radio;
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
        return {};
    },

    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: 'mqtt',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            actionType: rule.actionType || 'parse-color',
            //patternId: rule.patternId || nextProps.patterns[0].id,
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
    handleActionType: function(e) {
        var actionType = e.target.value;
        this.setState({actionType:actionType});
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
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>MQTT Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal >
                          <FormGroup controlId="formName" title="Name of the rule">
                            <Col sm={3} componentClass={ControlLabel}> Rule Name  </Col>
                            <Col sm={8}>
                                <FormControl type="text" placeholder="Name of rule"
                                    name="name" value={this.state.name} onChange={this.handleInputChange} />
                            </Col>
                          </FormGroup>

                        <FormGroup controlId="formTopic">
                          <Col sm={3} componentClass={ControlLabel}> MQTT Topic </Col>
                          <Col sm={8}>
                              <FormControl type="text" placeholder="topic to subscribe to"
                                  name="topic" value={this.state.topic} onChange={this.handleInputChange} />
                          </Col>
                        </FormGroup>

                        <FormGroup controlId="formUrl">
                          <Col sm={3} componentClass={ControlLabel}> MQTT URL </Col>
                          <Col sm={8}>
                              <FormControl type="text" placeholder="e.g. mqtts://io.adafruit.com/"
                                  name="url" value={this.state.url} onChange={this.handleInputChange} />
                          </Col>
                        </FormGroup>

                        <FormGroup controlId="formUsername">
                          <Col sm={3} componentClass={ControlLabel}> MQTT username </Col>
                          <Col sm={8}>
                              <FormControl type="text" placeholder="e.g. mqtts://io.adafruit.com/"
                                  name="username" value={this.state.username} onChange={this.handleInputChange} />
                          </Col>
                        </FormGroup>

                        <FormGroup controlId="formPassword">
                          <Col sm={3} componentClass={ControlLabel}> MQTT password </Col>
                          <Col sm={8}>
                              <FormControl type="text" placeholder=""
                                  name="password" value={this.state.password} onChange={this.handleInputChange} />
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

                            {!this.props.allowMultiBlink1 ? null :
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelClassName="col-xs-3" wrapperClassName="col-xs-4"
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
