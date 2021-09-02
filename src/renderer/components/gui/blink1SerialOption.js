/**
 *
 */
"use strict";

import React from 'react';
import PropTypes from 'prop-types';

import { Col } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { FormGroup } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';

var Blink1Service = require('../../server/blink1Service');

class Blink1SerialOption extends React.Component {
  constructor(props)  {
    super(props);
    this.state = {
        serial: props.serial
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    var blink1Id = e.target.value;
    if( blink1Id === this.props.defaultText ) {
        blink1Id = "0";
    }
    this.setState( {serial:blink1Id});
    this.props.onChange(blink1Id);
  }

  render() {
    var createBlink1SerialOption = function(item,idx) {
      return ( <option key={idx} value={item}>{item}</option> );
    };
    var serials = Blink1Service.getAllSerials();
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
}

Blink1SerialOption.propTypes = {
  label: PropTypes.string,
  labelColWidth: PropTypes.number,
  controlColWidth: PropTypes.number,
  bsSize: PropTypes.string,
  defaultText: PropTypes.string,
  serial: PropTypes.string,
  onChange: PropTypes.func.isRequired
}

export default Blink1SerialOption;
