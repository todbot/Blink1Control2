"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
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
    // given a rule, return a text description
    getDescription: function(rule) {
        return rule.username +':'+rule.triggerType+':'+rule.triggerVal;
    },
    getInitialState: function() {
        return {};// empty state, will be set in componentWillReceiveProps()
    },
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type:'mail',
            enabled: rule.enabled,
            name: rule.name,
            patternId: rule.patternId || this.props.patterns[0].id,
            mailtype: rule.mailtype || 'IMAP',  // default it
            host: rule.host || '',
            port: rule.port || 993,
            username: rule.username ,
            password: rule.password,
            useSSL: rule.useSSL || true,
            actionType: 'play-pattern',
            triggerType: rule.triggerType || 'unread',
            triggerVal: rule.triggerVal || '1' ,
            triggerOff: rule.triggerOff || false,
            errormsg: ''
        });
    },

    handleClose: function() {
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
    },
    onMailTypeClick: function(evt) {
        var mailtype = evt.target.value;
        log.msg("mailForm.onMailTypeClick ",mailtype);//,evt);
        if( mailtype === 'GMAIL' ) {
            this.setState({host:'imap.gmail.com', port:993, useSSL:true});
        }
        this.setState({mailtype:mailtype});
    },
    onTriggerTypeClick: function(evt) {
        var type = evt.target.value;
        // log.msg("mailForm.onTriggerTypeClick ",type);//,evt);
        this.setState({triggerType: type});
    },
    onTriggerValClick: function(evt) {
        log.msg("mailForm.onTriggerClick ",evt.target.value, evt.target.name);
        this.setState({triggerVal: evt.target.value, triggerType: evt.target.name});
    },
    render: function() {
        var self = this;
        var patterns = this.props.patterns;
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <Modal show={this.props.show} onHide={this.close} bsSize="large">
                <Modal.Header>
                    <Modal.Title>Mail Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                    <form className="form-horizontal" >
                        <Row>
                        <Col xs={6}>
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                                type="text" label="Name" placeholder="Enter text"
                                valueLink={this.linkState('name')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-4" bsSize="small"
                                type="select" label="Account type" placeholder="IMAP"
                                onChange={this.onMailTypeClick} >
                                <option value="IMAP">IMAP</option>
                                <option value="GMAIL">Gmail</option>
                                <option value="POP">POP</option>
                            </Input>
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                                type="text" label="Mail server" placeholder="mail.example.com"
                                valueLink={this.linkState('host')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                                type="text" label="Username" placeholder="Enter username (e.g. email addr)"
                                valueLink={this.linkState('username')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                                type="password" label="Password" placeholder=""
                                valueLink={this.linkState('password')} />
                            <Row>
                                <Col xs={6}>
                                    <Input labelClassName="col-xs-6" wrapperClassName="col-xs-6" bsSize="small"
                                        type="text" label="Port" placeholder="993"
                                        valueLink={this.linkState('port')} />
                                </Col><Col xs={6}>
                                    <Input bsSize="small"
                                        type="checkbox" label="Use SSL"
                                        checkedLink={this.linkState('useSSL')} />
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={6} >

                            <span><b> Blink when: </b></span>

                            <Input labelClassName="col-xs-5" wrapperClassName="col-xs-5" bsSize="small"
                                style={{}}
                                type="number" label="Unread email count >="
                                value={this.state.triggerType==='unread' ? this.state.triggerVal : ''}
                                onChange={this.onTriggerValClick} name="unread"
                                addonBefore={<input type="radio" value='unread'
                                checked={this.state.triggerType==='unread'} onChange={this.onTriggerTypeClick} />} />

                            <Input labelClassName="col-xs-5" wrapperClassName="col-xs-5" bsSize="small"
                                type="text" label="Subject contains" name="subject"
                                value={this.state.triggerType==='subject' ? this.state.triggerVal : ''}
                                onChange={this.onTriggerValClick}
                                addonBefore={<input type="radio" value='subject'
                                checked={this.state.triggerType==='subject'} onChange={this.onTriggerTypeClick}/>} />

                            <Input labelClassName="col-xs-5" wrapperClassName="col-xs-5" bsSize="small"
                                type="text" label="Sender contains" name="sender"
                                value={this.state.triggerType==='sender' ? this.state.triggerVal : ''}
                                onChange={this.onTriggerValClick}
                                addonBefore={<input type="radio" value='sender'
                                checked={this.state.triggerType==='sender'} onChange={this.onTriggerTypeClick}/>} />

                            <span><b> Play Pattern: </b></span>

                            <Input labelClassName="col-xs-5" wrapperClassName="col-xs-5" bsSize="small"
                                type="select" label="Pattern"
                                valueLink={this.linkState('patternId')} >
                                {patterns.map( createPatternOption, this )}
                            </Input>

                            <Input labelClassName="col-xs-10" wrapperClassName="col-xs-offset-4 col-xs-8" bsSize="small"
                                type="checkbox" label="Turn blink(1) off when done"
                                checkedLink={this.linkState('triggerOff')} />

                        </Col>
                        </Row>
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
        );
    }
});

module.exports = MailForm;
