/**
 *
 */
"use strict";

var React = require('react');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var Col = require('react-bootstrap').Col;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;

var Blink1SerialOption = createReactClass({
    propTypes: {
        label: PropTypes.string,
        labelColWidth: PropTypes.number,
        controlColWidth: PropTypes.number,
        bsSize: PropTypes.string,
        defaultText: PropTypes.string,
        serial: PropTypes.string,
        onChange: PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {
            serial: this.props.serial,
        };
    },
    handleChange: function(e) {
        var blink1Id = e.target.value;
        if( blink1Id === this.props.defaultText ) {
            blink1Id = "0";
        }
        this.setState( {serial:blink1Id});
        this.props.onChange(blink1Id);
    },
    render: function() {
        var createBlink1SerialOption = function(item,idx) {
            return ( <option key={idx} value={item}>{item}</option> );
        };
        var serials = window.electronAPI.blink1.getAllSerials();
        serials = serials.slice(); //copy so we can add defaultText
        serials.unshift( this.props.defaultText );

        return (
            <FormGroup controlId="formBlink1Serial" bsSize={this.props.bsSize} >
                <Col sm={this.props.labelColWidth} componentClass={ControlLabel}> {this.props.label} </Col>
                <Col sm={this.props.controlColWidth}>
                    <FormControl componentClass="select" width={7}
                        value={this.state.serial} onChange={this.handleChange} >
                        {serials.map( createBlink1SerialOption )}
                    </FormControl>
                </Col>
            </FormGroup>
        );
    }
});

module.exports = Blink1SerialOption;
