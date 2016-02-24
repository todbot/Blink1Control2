"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var remote = window.require('remote');
var PatternsService = remote.require('./server/patternsService');


var MailForm = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
        rule: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        var rule = this.props.rule;
        return rule; // anti-pattern? but setting initial values
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState( {
            name: nextProps.rule.name,
            patternId: nextProps.rule.patternId,
            mailtype: nextProps.rule.mailtype || 'IMAP',  // default it
            server: nextProps.rule.server,
            port: nextProps.rule.port || 993,
            username: nextProps.rule.username,
            password: nextProps.rule.password,
            useSSL: nextProps.rule.useSSL || true,
        });
    },

    close: function() {
        console.log("CLOSING: state=",this.state);
        if( !this.state.mailtype ) {
            console.log("mailtype not set!");
            this.setState({errormsg: "mailtype not set!"});
            return;
        }
        // this.setState({ showModal: false });
        this.props.onSave(this.state);
    },
    cancel: function() {
        console.log("CANCEL");
        this.props.onCancel();
    },
    delete: function() {
        this.props.onDelete();
    },
    render: function() {
        var patterns = PatternsService.getAllPatterns();
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

      return (
          <div>
              <Modal show={this.props.show} onHide={this.close} >
                  <Modal.Header>
                      <Modal.Title>Mail Settings</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                      <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                      <form className="form-horizontal" >
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                              type="text" label="Description" placeholder="Enter text"
                              valueLink={this.linkState('name')} />
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                              type="select" label="Account type" placeholder="IMAP"
                              valueLink={this.linkState('mailtype')} >
                              <option value="IMAP">IMAP</option>
                              <option value="Gmail">Gmail</option>
                              <option value="POP">POP</option>
                          </Input>
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                              type="text" label="Mail server" placeholder="mail.example.com"
                              valueLink={this.linkState('server')} />
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-6" bsSize="small"
                              type="text" label="Username" placeholder="Enter username (usually full email addr)"
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

                          <span><b> Trigger when: </b></span>

                              <Input labelClassName="col-xs-4" wrapperClassName="col-xs-3" bsSize="small"
                                  type="number" label="Unread email count"
                                  addonBefore={<input type="radio" valueLink={this.linkState('trig1')} />} />
                              <Input labelClassName="col-xs-4" wrapperClassName="col-xs-5" bsSize="small"
                                  type="text" label="Subject contains"
                                  addonBefore={<input type="radio" valueLink={this.linkState('trig2')} />} />
                              <Input labelClassName="col-xs-4" wrapperClassName="col-xs-5" bsSize="small"
                                  type="text" label="Sender contains"
                                   addonBefore={<input type="radio"/>} />

                            <span><b>Pattern: </b></span>

                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                                type="select" label="Pattern"
                                valueLink={this.linkState('patternId')} >
                                {patterns.map( createPatternOption, this )}
                            </Input>

                      </form>

                  </Modal.Body>
                  <Modal.Footer>
                      <Button bsStyle="danger" bsSize="small" style={{float:'left'}} onClick={this.delete}>Delete</Button>
                      <Button onClick={this.cancel}>Cancel</Button>
                      <Button onClick={this.close}>OK</Button>
                 </Modal.Footer>
              </Modal>
          </div>
      );
    }
});

module.exports = MailForm;
