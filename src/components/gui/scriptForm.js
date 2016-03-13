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

var dialog = require('electron').remote.dialog;


var log = require('../../logger');


var ScriptForm = React.createClass({
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
        return {};
    },
    // FIXME: why am I doing this instead of getInitialState?
    componentWillReceiveProps: function(nextProps) {
		this.setState({
            type:'script',
            name: nextProps.rule.name,
            filepath: nextProps.rule.filepath,
            patternId: nextProps.rule.patternId
         });
	},
    handleClose: function() {
        this.props.onSave(this.state);
    },
    openFileDialog: function() {
        var self = this;
        dialog.showOpenDialog(function (filenames) {
            if (filenames === undefined) { return; }
            var filename = filenames[0];
            self.setState({filepath: filename});
        });
    },
    render: function() {

        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Script Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <p></p>
                        <form className="form-horizontal" >
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                              type="text" label="Rule Name" placeholder="Descriptive name"
                              valueLink={this.linkState('name')} />
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                              type="text" label="File Path" placeholder="filepath of script"
                              valueLink={this.linkState('filepath')}
                              onClick={this.openFileDialog}/>
                          <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5" bsSize="small"
                              type="select" label="Pattern"
                              valueLink={this.linkState('patternId')} >
                              {this.props.patterns.map( createPatternOption, this )}
                          </Input>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button bsStyle="danger" bsSize="small" style={{float:'left'}} onClick={this.props.onDelete}>Delete</Button>
                        <Button bsSize="small" style={{float:'left'}} onClick={this.props.onCopy}>Copy</Button>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.handleClose}>OK</Button>
                    </Modal.Footer>
              </Modal>
          </div>
        );
    }
});

module.exports = ScriptForm;
