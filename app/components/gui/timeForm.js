"use strict";

var _ = require('lodash');

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;

var LinkedStateMixin = require('react-addons-linked-state-mixin');

var Switch = require('react-bootstrap-switch');

var Blink1SerialOption = require('./blink1SerialOption');

var TimeForm = React.createClass({
    mixins: [LinkedStateMixin],
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
        };
    },
    // Why am I doing this here?
    // because model is first created (with bad/old data), hangs out invisible,
    // then is shown (and gets new props)
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
		this.setState({
            type: 'time',
            enabled: rule.enabled,
            name: rule.name,
            alarmType: rule.alarmType || 'hourly',
            alarmHours: rule.alarmHours || 0,
            alarmMinutes: rule.alarmMinutes || 0,
            actionType: 'play-pattern',
            patternId: rule.patternId || nextProps.patterns[0].id,
            blink1Id: rule.blink1Id || "0"
         });
	},
    handleClose: function() {
        this.props.onSave(this.state);
    },
    handleBlink1SerialChange: function(blink1Id) {
        this.setState({blink1Id: blink1Id});
    },
    handleChangeHours: function(event) {
		var number = parseInt(event.target.value);
        if(isNaN(number)) { console.log("not a number"); return; }
		number = ( number < 0 ) ? 0 : (number>23) ? 23 : number;
        this.setState({alarmHours: number});
    },
    handleChangeMinutes: function(event) {
		var number = parseInt(event.target.value);
        if(isNaN(number)) { console.log("not a number"); return; }
		number = ( number < 0 ) ? 0 : (number>59) ? 59 : number;
        this.setState({alarmMinutes: number});
    },

    render: function() {
        var self = this;

        var createPatternOption = function(item, idx) {
          return ( <option key={idx} value={item.id}>{item.name}</option> );
        };
        // var createNumberOption = function(item, idx) {
        //     return ( <option key={idx} value={item}>{item}</option> );
        // };
        //
        // var hoursList = _.range(0,23);
        // var minutesList = _.range(0,59);

        // convert number to string with leading zero if necessary
        var hrs = parseInt(this.state.alarmHours);
        hrs = (hrs < 9) ? '0'+hrs : hrs;
        var mins = parseInt(this.state.alarmMinutes);
        mins = (mins < 9) ? '0'+mins : mins;

        // var everyHourInput = <input type="number" min={0} max={59} step={1} size={2}
        //     value={mins} onChange={this.handleChangeMinutes} />

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Alarm / Timer Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <form>
                        <Row>
                            <div className="form-horizontal">
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                    type="text" label="Rule Name" placeholder="Name of rule on IFTTT"
                                    valueLink={this.linkState('name')} />
                            </div>
                        </Row>
                        <Row>
                            <Col xs={3} className="text-right">
                                <label> Trigger when </label>
                            </Col>
                            <Col xs={9}>
                                <Input>
                                <div className="form-inline" >
                                    <div className="radio-inline">
                                        <input type="radio" name="hourly" value="hourly"
                                            checked={this.state.alarmType==='hourly'}
                                            onChange={function(){self.setState({alarmType:'hourly'});}} />
                                        every hour at:
                                    </div>
                                    <input type="number" min={0} max={59} step={1} size={2}
                                        value={mins} onChange={this.handleChangeMinutes} />
                                    minutes
                                </div>
                            </Input>
                            <Input>
                                <div className="form-inline" >
                                    <div className="radio-inline">
                                        <input type="radio" name="daily" value="daily"
                                            checked={this.state.alarmType==='daily'}
                                            onChange={function(){self.setState({alarmType:'daily'});}}/>
                                        every day at:
                                    </div>
                                    <input type="number" min={0} max={23} step={1} size={2}
                                        style={{textAlign:'right'}}
                                        value={hrs} onChange={this.handleChangeHours}/> :
                                    <input type="number" min={0} max={59} step={1} size={2}
                                        style={{textAlign:'right'}}
                                        value={mins} onChange={this.handleChangeMinutes}/>
                                </div>
                            </Input>

                            </Col>
                        </Row>
                        <Row>
                            <div className="form-horizontal">
                                <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                                    type="select" label="Pattern"
                                    valueLink={this.linkState('patternId')} >
                                    {this.props.patterns.map( createPatternOption, this )}
                                </Input>
                                {!this.props.allowMultiBlink1 ? null :
                                    <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                        labelClassName="col-xs-3" wrapperClassName="col-xs-4"
                                        serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}
                            </div>
                        </Row>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small"  onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                          </Col>
                          <Col xs={3}>
                                <Switch labelText="Enable" size="small"
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

module.exports = TimeForm;