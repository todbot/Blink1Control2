"use strict";

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;

var Switch = require('react-bootstrap-switch');

var log = require('../../logger');


var MailForm = React.createClass({
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
            type:'skype',
            enabled: rule.enabled,
            name: rule.name,
            username: rule.username,
            password: rule.password,
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id,
            triggerType: rule.triggerType || 'any',
            triggerVal: rule.triggerVal || '1' ,
        });
    },

    handleClose: function() {
        console.log("CLOSING: state=",this.state);
        if( !this.state.username || !this.state.password ) {
            this.setState({errormsg: "username or password not set!"});
            return;
        }
        this.props.onSave(this.state);
    },
    handleTriggerType: function(evt) {
        log.msg("mailForm.handleTriggerType ",evt.target.value,evt);
        this.setState({triggerType: evt.target.value});
    },
    handleInputChange: function(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    },

    render: function() {
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
                        <form className="form-horizontal" >
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                type="text" label="Name" placeholder="Enter text"
                                name="name" value={this.state.name} onChange={this.handleInputChange} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                type="text" label="Skype username" placeholder="Enter username (usually full email address)"
                                name="username" value={this.state.username} onChange={this.handleInputChange} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                                type="password" label="Password" placeholder=""
                                name="password" value={this.state.password} onChange={this.handleInputChange} />

                            <Grid >
                                <Row><Col xs={2}>
                                    <label> Play pattern on</label>
                                </Col><Col xs={4} style={{border:'0px solid green'}}>
                                    <Input
                                        type="radio" label="Any Skype event" value="any"
                                        checked={this.state.triggerType==='any'}
                                        onChange={this.handleTriggerType} />
                                    <Input
                                        type="radio" label="Incoming call" value="incoming-call"
                                        checked={this.state.triggerType==='incoming-call'}
                                        onChange={this.handleTriggerType} />
                                    <Input
                                        type="radio" label="Incoming text message" value="incoming-text"
                                        checked={this.state.triggerType==='incoming-text'}
                                        onChange={this.handleTriggerType} />
                                </Col></Row>
                            </Grid>

                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                                type="select" label="Pattern"
                                name="patternId" value={this.state.patternId} onChange={this.handleInputChange} >
                                {this.props.patterns.map( createPatternOption )}
                            </Input>

                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
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

module.exports = MailForm;
