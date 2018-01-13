"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;

var Switch = require('react-bootstrap-switch');

var Blink1SerialOption = require('./blink1SerialOption');

var IftttForm = React.createClass({
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
        return {
            // name: rule.name,
            // patternId: rule.patternId
        };
    },
    // FIXME: why am I doing this instead of getInitialState?
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: 'ifttt',
            enabled: rule.enabled,
            name: rule.name,
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id,
            blink1Id: rule.blink1Id || "0"
         }); // FIXME: why
    },
    handleClose: function() {
        this.props.onSave(this.state);
    },
    handleBlink1SerialChange: function(blink1Id) {
        this.setState({blink1Id: blink1Id});
    },
    handleNameChange: function(event) {
        this.setState({name: event.target.value});
    },
    handlePatternIdChange: function(event) {
        this.setState({patternId: event.target.value});
    },
    render: function() {
        var self = this;

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
                        <form className="form-horizontal" >
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                type="text" label="Rule Name" placeholder="Name of rule on IFTTT"
                                value={this.state.name} onChange={this.handleNameChange} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                                type="select" label="Pattern"
                                value={this.state.patternId} onChange={this.handlePatternIdChange} >
                                {this.props.patterns.map( createPatternOption )}
                            </Input>
                            {!this.props.allowMultiBlink1 ? null :
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelClassName="col-xs-3" wrapperClassName="col-xs-4"
                                    serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}
                        </form>
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

module.exports = IftttForm;
