"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var Switch = require('react-bootstrap-switch');

var log = require('../../logger');


var MailForm = React.createClass({
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
            triggerType: rule.triggerType || 'any',
            triggerVal: rule.triggerVal || '1' ,
            patternId: rule.patternId
        });
    },

    handleClose: function() {
        console.log("CLOSING: state=",this.state);
        if( !this.state.mailtype ) {
            console.log("mailtype not set!");
            this.setState({errormsg: "mailtype not set!"});
            return;
        }
        this.props.onSave(this.state);
    },
    onTriggerTypeClick: function(evt) {
        log.msg("mailForm.onTriggerClick ",evt.target.value,evt);
        this.setState({triggerType: evt.target.value});
    },
    onTriggerValClick: function(evt) {
        log.msg("mailForm.onTriggerClick ",evt.target.value,evt);
        this.setState({triggerVal: evt.target.value});
    },
    render: function() {
        var self = this;
        var patterns = this.props.patterns;
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.close} >
                    <Modal.Header>
                        <Modal.Title>Skype Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <form className="form-horizontal" >
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                              type="text" label="Name" placeholder="Enter text"
                              valueLink={this.linkState('name')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6"
                              type="text" label="Skype username" placeholder="Enter username (usually full email addr)"
                              valueLink={this.linkState('username')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6"
                              type="password" label="Password" placeholder=""
                              valueLink={this.linkState('password')} />

                            <span><b> Trigger when: FIXME THIS IS WRONG</b></span>

                            <Input labelClassName="col-xs-4" wrapperClassName="col-xs-3" bsSize="small"
                                type="number" label="Unread email count >="
                                value={this.state.triggerType==='unread' ? this.state.triggerVal : ''}
                                onChange={this.onTriggerValClick}
                                addonBefore={<input type="radio" value='unread'
                                checked={this.state.triggerType==='unread'} onChange={this.onTriggerTypeClick} />} />

                              <Input labelClassName="col-xs-4" wrapperClassName="col-xs-5" bsSize="small"
                                  type="text" label="Subject contains"
                                  value={this.state.triggerType==='subject' ? this.state.triggerVal : ''}
                                  onChange={this.onTriggerValClick}
                                  addonBefore={<input type="radio" value='subject'
                                       checked={this.state.triggerType==='subject'} onChange={this.onTriggerTypeClick}/>} />

                              <Input labelClassName="col-xs-4" wrapperClassName="col-xs-5" bsSize="small"
                                  type="text" label="Sender contains"
                                  value={this.state.triggerType==='sender' ? this.state.triggerVal : ''}
                                  onChange={this.onTriggerValClick}
                                  addonBefore={<input type="radio" value='sender'
                                      checked={this.state.triggerType==='sender'} onChange={this.onTriggerTypeClick}/>} />

                            <span><b>Play Pattern: </b></span>

                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                                type="select" label="Pattern"
                                valueLink={this.linkState('patternId')} >
                                {patterns.map( createPatternOption, this )}
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

module.exports = MailForm;
