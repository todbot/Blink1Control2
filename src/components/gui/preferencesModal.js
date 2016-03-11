"use strict";

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Well = require('react-bootstrap').Well;
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
                    <Modal.Title>Preferences</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{fontSize:"85%"}}>
                    <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                    <p></p>
                        <Row>
                        <Col md={6}><Well>
                            <form className="form-horizontal" >
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                  type="text" label="Rule Name" placeholder="Name of rule on PREFERENCES"
                                  valueLink={this.linkState('name')} />
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                                  type="select" label="Pattern"
                                  valueLink={this.linkState('patternId')} >
                                </Input>
                            </form>
                        </Well>
                        </Col>
                        <Col md={6}>
                            <form className="form-horizontal" >
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                  type="text" label="somethng Name" placeholder="Name of rule on PREFERENCES"
                                  valueLink={this.linkState('somoename')} />
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                                  type="select" label="soePattern"
                                  valueLink={this.linkState('soepatternId')} >
                                </Input>
                            </form>
                        </Col>
                        </Row>
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

module.exports = PreferencesModal;
