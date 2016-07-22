/**
 *
 */
"use strict";

var React = require('react');

var Input = require('react-bootstrap').Input;

var Blink1Service = require('../../server/blink1Service');
// var log = require('../../logger');

var Blink1SerialOption = React.createClass({
    propTypes: {
        label: React.PropTypes.string,
        labelClassName: React.PropTypes.string,
        defaultText: React.PropTypes.string,
        wrapperClassName: React.PropTypes.string,
        serial: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
	},
    getInitialState: function() {
        return {
            serial: this.props.serial,
        };
    },
    handleChange: function(e) {
        var blink1Id = e.target.value;
        if( blink1Id === this.props.defaultText ) {
            blink1Id = 0;
        }
        this.setState( {serial:blink1Id});
        this.props.onChange(blink1Id);
    },
    render: function() {
        var createBlink1SerialOption = function(item,idx) {
            return ( <option key={idx} value={item}>{item}</option> );
        };
        var serials = Blink1Service.getAllSerials();
        serials = serials.slice(); //copy
        serials.unshift( this.props.defaultText );

        return (
            <Input labelClassName={this.props.labelClassName} wrapperClassName={this.props.wrapperClassName}
                    bsSize="small" type="select" label={this.props.label} width={7}
                    value={this.state.serial} onChange={this.handleChange} >
                    {serials.map( createBlink1SerialOption, this )}
            </Input>
        );
    }
});

module.exports = Blink1SerialOption;
