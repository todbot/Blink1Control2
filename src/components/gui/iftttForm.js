"use strict";

var React = require('react');

// var Col = require('react-bootstrap').Col;
// var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var ButtonGroup = require('react-bootstrap').ButtonGroup;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var remote = window.require('remote');
var PatternsService = remote.require('./server/patternsService');


var IftttForm = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
		rule: React.PropTypes.object.isRequired
        // patternId: React.PropTypes.string.isRequired,
        // onPatternUpdated: React.PropTypes.func.isRequired
	},
    getInitialState: function() {
        var rule = this.props.rule;
        // console.log("iftttForm rule:",rule);
        return {
            name: rule.name,
            patternId: rule.patternId
        };
    },
    // FIXME: why am I doing this?
    componentWillReceiveProps: function(nextProps) {
		this.setState({ name: nextProps.rule.name, patternId: nextProps.rule.patternId }); // FIXME: why
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

        var patterns = PatternsService.getAllPatterns();

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
                      <p></p>
                      <form className="form-horizontal" >
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                              type="text" label="Rule Name" placeholder="Name of rule on IFTTT"
                              valueLink={this.linkState('name')} />
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

module.exports = IftttForm;
