
"use strict";

var React = require('react');

var Input = require('react-bootstrap').Input;

// var Blink1Service   = require('../../server/blink1Service');

var Blink1SerialOption = React.createClass({
    propTypes: {
        serials: React.PropTypes.array.isRequired,
        serial: React.PropTypes.string,
        label: React.PropTypes.string,
        labelClassName: React.PropTypes.string,
        wrapperClassName: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
	},
    getInitialState: function() {
        return {
            serial: this.props.serial,
        };
    },
    handleChange: function(e) {
        this.setState( {serial:e.target.value});
        this.props.onChange(e);
    },
    render: function() {
        var createBlink1SerialOption = function(item,idx) {
            return ( <option key={idx} value={item}>{item}</option> );
        };

        return (
            <Input labelClassName={this.props.labelClassName} wrapperClassName={this.props.wrapperClassName}
                    bsSize="small" type="select" label={this.props.label} width={7}
                    value={this.state.serial} onChange={this.handleChange} >
                    {this.props.serials.map( createBlink1SerialOption, this )}
            </Input>
        );
    }
});

module.exports = Blink1SerialOption;
