"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;

var Switch = require('react-bootstrap-switch');

var log = require('../../logger');

var Blink1SerialOption = require('./blink1SerialOption');


var SlackForm = React.createClass({
    propTypes: {
        rule: React.PropTypes.object.isRequired,
        patterns: React.PropTypes.array,
        onSave: React.PropTypes.func,
        onCancel: React.PropTypes.func,
        onDelete: React.PropTypes.func,
        onCopy: React.PropTypes.func
    },
    getInitialState: function() {
        return {};// empty state, will be set in componentWillReceiveProps()
    },
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type:'slack',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            keywords: rule.keywords || [''],
            password: rule.password || '',
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id || '',
        });
    },

    handleClose: function() {
        console.log("CLOSING: state=",this.state);
        if( !this.state.password ) {
            this.setState({errormsg: "password not set!"});
            return;
        }
        this.props.onSave(this.state);
    },
    handleTriggerType: function(evt) {
        log.msg("slackForm.handleTriggerType ",evt.target.value);
        this.setState({triggerType: evt.target.value});
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
        // var patterns = this.props.patterns;
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Slack Settings</Modal.Title>
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
                            <FormGroup controlId="formKeywords" >
                                <Col sm={3} componentClass={ControlLabel}> Comma separated list of keywords </Col>
                                <Col sm={8}>
                                    <FormControl type="text" label="Keywords" placeholder="Enter keywords"
                                        name="keywords" value={this.state.keywords} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formBotToken">
                                <Col sm={3} componentClass={ControlLabel}> Slack Bot Token </Col>
                                <Col sm={8}>
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
});

module.exports = SlackForm;