"use strict";

import React from 'react';

import { Col } from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import { Form } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { FormGroup } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { Radio } from 'react-bootstrap';

import Switch from 'react-bootstrap-switch';

import Blink1SerialOption from './blink1SerialOption';

const timefmt = new Intl.DateTimeFormat("en" , {timeStyle: "medium"});  // instead of moment

class TimeForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = { };
      this.handleClose = this.handleClose.bind(this);
      this.handleBlink1SerialChange = this.handleBlink1SerialChange.bind(this);
      this.handleChangeHours = this.handleChangeHours.bind(this);
      this.handleChangeMinutes = this.handleChangeMinutes.bind(this);
      this.setHourly = this.setHourly.bind(this);
      this.setDaily = this.setDaily.bind(this);
      this.setCountdown = this.setCountdown.bind(this);
      this.setAlarmTimeMode = this.setAlarmTimeMode.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    // Why am I doing this here?
    // because model is first created (with bad/old data), hangs out invisible,
    // then is shown (and gets new props)
    componentWillReceiveProps(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: 'time',
            enabled: rule.enabled || false,
            name: rule.name || '',
            alarmType: rule.alarmType || 'hourly',
            alarmHours: rule.alarmHours || 8,
            alarmMinutes: rule.alarmMinutes || 15,
            alarmTimeMode: rule.alarmTimeMode || 'am', // 'pm' or '24'
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id || '',
            blink1Id: rule.blink1Id || "0"
         });
    }

    handleClose() {
        var state = this.state;  // adjust countdown time to be proper time in the future
        if( this.state.alarmType === 'countdown' ) {
          var newTime = new Date();
          newTime.setMinutes( newTime.getMinutes() + state.alarmMinutes );
          state.alarmHours = newTime.hours();
          state.alarmMinutes = newTime.minutes();
        }
        console.log("STATE:",state);
        this.props.onSave(state);
    }

    handleBlink1SerialChange(blink1Id) {
        this.setState({blink1Id: blink1Id});
    }

    handleChangeHours(event) {
        var number = parseInt(event.target.value) || 0;
        // number = ( number < 0 ) ? 23 : (number>23) ? 0 : number;
        this.setState({alarmHours: number});
    }

    handleChangeMinutes(event) {
        var nstr = event.target.value;
        var number = parseInt(nstr.substring(nstr.length-2, nstr.length)) || 0; // last two digits
        this.setState({alarmMinutes: number});
    }

    setHourly() {
        this.setState({alarmType:'hourly'});
    }

    setDaily() {
        this.setState({alarmType:'daily'});
    }

    setCountdown() {
        this.setState({alarmType:'countdown'});
    }

    setAlarmTimeMode(d) {
        // console.log('setAlarmTimeMode:',d);
        // console.log("setAlarmTimeMode:",d.target.value);
        var val = d.target.value;
        this.setState({alarmTimeMode: val});
    }

    handleInputChange(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    }

    render() {

        var createPatternOption = function(item, idx) {
          return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        // convert number to string with leading zero if necessary
        // sure wish we had printf("%02d")
        var hrs = parseInt(this.state.alarmHours);
        // hrs = (hrs < 10) ? '0'+hrs : hrs;
        var mins = parseInt(this.state.alarmMinutes);
        mins = (mins < 10) ? '0'+mins : mins;

        var altype = this.state.alarmType;
        var almode = this.state.alarmTimeMode;
        var numStyle = {marginLeft:5, marginRight:5, textAlign:'right'};
        // var leftStyle = {marginRight:5, marginLeft:5};

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Alarm / Timer Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal>
                            <FormGroup controlId="formName" title="">
                                <Col sm={3} componentClass={ControlLabel}>  Rule Name  </Col>
                                <Col sm={8}>
                                    <FormControl type="text" placeholder="Name of rule"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formTriggerH" title="" onClick={this.setHourly}>
                                <Col sm={3} componentClass={ControlLabel}> Trigger when </Col>
                                <Col sm={8}>
                                    <input type="radio" name="hourly" value="hourly"
                                        checked={altype==='hourly'} onChange={this.setHourly} />
                                    <span style={numStyle}> every hour at the: </span>
                                    <input type="number" min={0} max={59} step={1} size={2} style={numStyle}
                                        value={altype==='hourly'?mins:''} onChange={this.handleChangeMinutes} />
                                    minute mark
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formTriggerD" onClick={this.setDaily}>
                                <Col sm={3} componentClass={ControlLabel}>  </Col>
                                <Col sm={8}>
                                    <input type="radio" name="daily" value="daily"
                                        checked={altype==='daily'} onChange={this.setDaily} />
                                    <span style={numStyle}> every day at:</span>
                                    <input type="number" min={1} max={12} step={1} size={2} style={numStyle}
                                        value={altype==='daily'?hrs:''} onChange={this.handleChangeHours} /> :
                                    <input type="number" min={3} max={59} step={1} size={2} pattern="[0-9]*" style={numStyle}
                                        value={altype==='daily'?mins:''} onChange={this.handleChangeMinutes} />
                                    <input type="radio" name="am" value="am"
                                        checked={almode==='am'} onChange={this.setAlarmTimeMode}/>
                                    <span style={numStyle}> am </span>
                                    <input type="radio" name="pm" value="pm"
                                        checked={almode==='pm'} onChange={this.setAlarmTimeMode}/>
                                    <span style={numStyle}>pm</span>
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formTriggerC" onClick={this.setCoundtdown}>
                                <Col sm={3} componentClass={ControlLabel}>  </Col>
                                <Col sm={8}>
                                    <input type="radio" name="countdown" value="countdown"
                                        checked={altype==='countdown'} onChange={this.setCountdown} />
                                    <span style={numStyle}> elapsed time: </span>
                                    <input type="number" min={0} max={59} step={1} size={2}
                                        value={altype==='countdown'?mins:''} onChange={this.handleChangeMinutes} />
                                    <span style={numStyle}> minutes (one-time/no repeat) </span>
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formPatternId">
                                <Col sm={3} componentClass={ControlLabel}>  Pattern  </Col>
                                <Col sm={8}>
                                    <FormControl componentClass="select"
                                        name="patternId" value={this.state.patternId} onChange={this.handleInputChange} >
                                        {this.props.patterns.map( createPatternOption )}
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            {!this.props.allowMultiBlink1 ? <div/>:
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelColWidth={3} controlColWidth={4}
                                    serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small"  onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                          </Col>
                          <Col xs={3}>
                              <Switch bsSize="mini" labelText='enabled'
                                  state={this.state.enabled} onChange={(el,enabled)=> this.setState({enabled})} />
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
}

TimeForm.propTypes = {
    rule: React.PropTypes.object.isRequired,
    allowMultiBlink1: React.PropTypes.bool,
    patterns: React.PropTypes.array,
    onSave: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    onDelete: React.PropTypes.func,
    onCopy: React.PropTypes.func
};

export default TimeForm;
// module.exports = TimeForm;
