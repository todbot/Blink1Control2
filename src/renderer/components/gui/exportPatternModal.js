"use strict";

import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';
import { MenuItem } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { FormGroup } from 'react-bootstrap';
import { InputGroup } from 'react-bootstrap';

const { clipboard } = require('electron');
const process = require('process');

var log = require('../../logger');

class ExportPatternModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pattern:this.props.pattern,
      patternstr:this.props.pattern.pattern
    }
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleClose() {
    log.msg("!!! handleClose:", this.state.patternstr);
    this.props.onHide(this.state.patternstr);
  }

  handleChange(e) {
    log.msg("!!! handleChange:",e)
    this.setState({ patternstr: e.target.value });
  }
  getValidationState() {
    const length = this.state.patternstr.length;
    if (length > 10) return 'success';
    if (length > 5) return 'warning';
    if (length > 0) return 'error';
    return null;
  }

  render() {
    var exe = (process.platform=='win32') ? '.exe':'';
    var blink1cmd = "blink1-tool"+exe+" --playpattern '" + this.props.pattern.pattern + "'"
    return (
      <Modal show={this.props.show} onHide={this.props.onHide}>
        <Modal.Header closeButton>
          <Modal.Title >Import/Export Pattern '{this.props.pattern.name}'</Modal.Title>
        </Modal.Header>
        <Modal.Body >
          <div> Import from color pattern string (or hand-edit):
            <FormGroup validationState={this.getValidationState()}>
              <InputGroup title="Paste in new pattern to over-write" onClick={e => { console.log("!!!MPORT PATTERN TEST") }}>
                <FormControl type="text" value={this.state.patternstr} onChange={this.handleChange} disabled={this.props.pattern.locked}/>
              <InputGroup.Addon><button className="fa fa-paste"   disabled={this.props.pattern.locked}></button></InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </div>
          <div> Export to color pattern string:
            <FormGroup>
              <InputGroup title="Click to copy to clipboard" onClick={e => { clipboard.writeText(this.props.pattern.pattern) }}>
              <FormControl type="text" value={this.props.pattern.pattern} readOnly />
              <InputGroup.Addon><button className="fa fa-copy" ></button></InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </div>
          <div> Export to blink1-tool "play" command:
            <FormGroup>
              <InputGroup title="Click to copy to clipboard" onClick={e => { clipboard.writeText(blink1cmd) }}>
                <FormControl type="text" value={blink1cmd} readOnly />
              <InputGroup.Addon><button className="fa fa-copy" ></button></InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </div>
          <div> Export to blink1-tool "save-to-blink1" command:
            <FormGroup>
              <InputGroup title="Click to copy to clipboard" onClick={e => { clipboard.writeText(blink1cmd) }}>
                <FormControl type="text" value={blink1cmd} readOnly />
              <InputGroup.Addon><button className="fa fa-copy" ></button></InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ExportPatternModal.propTypes =  {
  show: PropTypes.bool.isRequired,
  pattern: PropTypes.object.isRequired,
  onHide: PropTypes.func,
};

export default ExportPatternModal;
