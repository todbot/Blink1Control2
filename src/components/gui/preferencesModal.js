"use strict";

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Well = require('react-bootstrap').Well;
var Panel = require('react-bootstrap').Panel;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var ButtonGroup = require('react-bootstrap').ButtonGroup;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

// var PatternsService = require('../../server/patternsService');


var PreferencesModal = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
		// rule: React.PropTypes.object.isRequired
        // patternId: React.PropTypes.string.isRequired,
        // onPatternUpdated: React.PropTypes.func.isRequired
	},
    getInitialState: function() {
        var rule = this.props.rule;
        // console.log("iftttForm rule:",rule);
        return {
            name: 'bob',
            patternId: 'whiteflashes'
        };
    },
    // FIXME: why am I doing this?
    componentWillReceiveProps: function(nextProps) {
		// this.setState({ name: nextProps.rule.name, patternId: nextProps.rule.patternId }); // FIXME: why
	},
    close: function() {
        console.log("CLOSING: state=",this.state);
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
        // console.log("iftttForm render:",this.state, this.props);
      return (
        <div>
            <Modal show={this.props.show} onHide={this.close} >
                <Modal.Header>
                    <Modal.Title style={{fontSize:"95%"}}>Preferences</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{fontSize:"100%", paddingTop:0}}>
                    <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                    <p></p>
                        <Row>
                        <Col md={6}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> General </u></h5>
                                <form className="form-horizontal">
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Start minimized" checked />
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Start at login" checked />
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Enable gamma correction" checked />
                                </form>
                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> API server configuration </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                        type="checkbox" label="Start API server" checked />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                      type="number" label="port" placeholder="8934"
                                      valueLink={this.linkState('apiPort')} />
                                </form>
                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> Proxy configuration </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="host" placeholder="localhost"
                                        valueLink={this.linkState('proxyHost')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="number" label="port" placeholder="8080"
                                        valueLink={this.linkState('proxyPort')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="username" placeholder=""
                                        valueLink={this.linkState('proxyUser')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="password" placeholder=""
                                        valueLink={this.linkState('proxyPass')} />
                                </form>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> blink(1) device to use </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12"
                                        type="radio" label="First available" checked />
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12"
                                        type="radio" label="Use device id:" checked />
                                </form>
                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> blink(1) device non-computer settings </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12"
                                        type="radio" label="First available" checked />
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12"
                                        type="radio" label="Use device id:" checked />
                                </form>
                            </div>

                        </Col>
                        </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={this.cancel}>Cancel</Button>
                  <Button onClick={this.close}>OK</Button>
                </Modal.Footer>
            </Modal>
        </div>
      );
    }
});

module.exports = PreferencesModal;
