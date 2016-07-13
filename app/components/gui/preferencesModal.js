"use strict";

var React = require('react');

// var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
// var Well = require('react-bootstrap').Well;
// var Panel = require('react-bootstrap').Panel;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var ButtonInput = require('react-bootstrap').ButtonInput;
var Button = require('react-bootstrap').Button;
// var ButtonGroup = require('react-bootstrap').ButtonGroup;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var PatternsService = require('../../server/patternsService');
var Blink1Service   = require('../../server/blink1Service');
var ApiServer   = require('../../server/apiServer');

var conf = require('../../configuration');
var log = require('../../logger');

var Blink1SerialOption = require('./blink1SerialOption');

var PreferencesModal = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
		// rule: React.PropTypes.object.isRequired
        // patternId: React.PropTypes.string.isRequired,
        // onPatternUpdated: React.PropTypes.func.isRequired
        blink1Serials:  React.PropTypes.array
	},
    getInitialState: function() {
        return {
            startMinimized:   conf.readSettings('startup:startMinimized') || false,
            startAtLogin:     conf.readSettings('startup:startAtLogin') || false,
            startupPattern:   conf.readSettings('startup:startupPattern') || "",
            enableGamma:      conf.readSettings('blink1Service:enableGamma') || true,
            blink1ToUse:      conf.readSettings('blink1Service:blink1ToUse') || "0", // 0 == use first avail
            allowMultiBlink1: conf.readSettings('blink1Service:allowMulti') || false,
            apiServerEnable:  conf.readSettings('apiServer:enabled') || false,
            apiServerPort:    conf.readSettings('apiServer:port') || 8934,
            apiServerHost:    conf.readSettings('apiServer:host') || 'localhost',
            proxyEnable:      conf.readSettings('proxy:enable') || false,
            proxyHost:        conf.readSettings('proxy:host') || 'localhost',
            proxyPort:        conf.readSettings('proxy:port') || 8080,
            proxyUser:        conf.readSettings('proxy:username') || '',
            proxyPass:        conf.readSettings('proxy:password') || '',
            patterns: PatternsService.getAllPatterns(),
            // blink1Serials: Blink1Service.getAllSerials(),
            // blink1Serials: ['12345678','abcdabcd'], // FIXME: make a prop
            patternId: 'whiteflashes'
        };
    },
    // FIXME: why am I doing this?
    // componentWillReceiveProps: function(nextProps) {
	// 	// this.setState({ name: nextProps.rule.name, patternId: nextProps.rule.patternId }); // FIXME: why
	// },
    saveSettings: function() {
        conf.saveSettings('startup:startMinimized', this.state.startMinimized);
        conf.saveSettings('startup:startAtLogin', this.state.startAtLogin);
        conf.saveSettings('blink1Service:enableGamma', this.state.enableGamma);
        conf.saveSettings('blink1Service:blink1ToUse', this.state.blink1ToUse);
        conf.saveSettings('blink1Service:allowMulti', this.state.allowMultiBlink1);
        conf.saveSettings('apiServer:enabled', this.state.apiServerEnable);
        conf.saveSettings('apiServer:port', this.state.apiServerPort);
        conf.saveSettings('apiServer:host', this.state.apiServerHost);
        conf.saveSettings('proxy:enable', this.state.proxyEnable);
        conf.saveSettings('proxy:host', this.state.proxyHost);
        conf.saveSettings('proxy:port', this.state.proxyPort);
        conf.saveSettings('proxy:username', this.state.proxyUser);
        conf.saveSettings('proxy:password', this.state.proxyPass);

        Blink1Service.reloadConfig();
        ApiServer.reloadConfig();

        // FIXME: a hack to get ToolTable to refetch allowMulti pref
        log.addEvent({type:'info', source:'preferences', text:'settings updated'});
    },
    close: function() {
        this.saveSettings();
        this.props.onSave(this.state);
    },
    cancel: function() {
        this.props.onCancel();
    },
    // delete: function() {
    //     this.props.onDelete();
    // },
    // handleBlink1SerialChoice: function(e) {
    //     // log.msg("handleBlink1SerialChoice: ",e.target.value);
    //     var choice = e.target.value;
    //     if( choice === 'first' ) {
    //         this.setState({blink1ToUse: 0});
    //     }
    // },
    handleBlink1SerialChange: function(serial) {
        log.msg("handleBlink1NonComputerChange: ",serial);
        // if( serial )
        PatternsService.playPattern( '~blink-#888888-3', serial);
        this.setState({blink1ToUse: serial});
    },
    handleBlink1NonComputerChoice: function(e) {
        var choice = e.target.value;
        log.msg("handleBlink1NonComputerChange: ",choice);
        this.setState({blink1NonComputer: choice});
        if( choice === 'off' ) {
            log.msg("settting OFF");
        }
        else if( choice === 'default' ) {
            log.msg("settting default");
        }
        else if( choice === 'pattern' ) {
            log.msg("setting pattern");
        }
    },
    handleApiServerHostChoice: function(e) {
        this.setState({apiServerHost: e.target.value});
    },
    handleBlink1NonComputerSet: function(e) {
        log.msg("SET!!",e);
    },
    render: function() {
        var createPatternOption = function(item, idx) {
            return ( <option key={idx} value={item.id}>{item.name}</option> );
        };

        return (
        <div>
            <Modal show={this.props.show} onHide={this.close} bsSize="large">
                <Modal.Header>
                    <Modal.Title style={{fontSize:"95%"}}>Preferences</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{fontSize:"100%", paddingTop:0}}>
                    <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                    <p></p>
                        <Row>
                        <Col md={4}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> General </u></h5>
                                <form className="form-horizontal">
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Start minimized" checkedLink={this.linkState('startMinimized')} />
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Start at login" checkedLink={this.linkState('startAtLogin')} />
                                <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                    type="checkbox" label="Enable gamma correction" checkedLink={this.linkState('enableGamma')} />
                                </form>
                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> API server configuration </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                        type="checkbox" label="Start API server" checkedLink={this.linkState('apiServerEnable')}  />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                      type="number" label="port" placeholder=""
                                      valueLink={this.linkState('apiServerPort')} />
                                    <Row className="form-group form-group-sm">
                                        <Col xs={3} className="control-label">
                                        <label> host</label>
                                        </Col><Col xs={4}>
                                        <Input type="radio" label="localhost" value="localhost"
                                            checked={this.state.apiServerHost==='localhost'}
                                            onChange={this.handleApiServerHostChoice}
                                            wrapperClassName="col-xs-offset-1 col-xs-12" bsSize="small" />
                                        </Col><Col xs={4}>
                                        <Input type="radio" label="any" value="any"
                                            checked={this.state.apiServerHost==='any'}
                                            onChange={this.handleApiServerHostChoice}
                                            wrapperClassName="col-xs-offset-1 col-xs-12" bsSize="small"/>
                                        </Col>
                                    </Row>
                                </form>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> blink(1) device use </u></h5>
                                    <form className="form-horizontal">
                                        <Blink1SerialOption labelClassName="col-xs-6" wrapperClassName="col-xs-5"
                                            label="preferred device" defaultText="- use first -"
                                            serial={this.state.blink1ToUse} onChange={this.handleBlink1SerialChange}/>
                                        <Input labelClassName="col-xs-12" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="Use multi blink(1) devices in rules" checkedLink={this.linkState('allowMultiBlink1')}  />
                                    </form>
                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> blink(1) nightlight mode </u></h5>

                                    <form className="form-horizontal">
                                        <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                            type="radio" label="Off / Dark" value="off"
                                            checked={this.state.blink1NonComputer==='off'}
                                            onChange={this.handleBlink1NonComputerChoice} />
                                        <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                            type="radio" label="Default pattern" value="default"
                                            checked={this.state.blink1NonComputer==='default'}
                                            onChange={this.handleBlink1NonComputerChoice} />
                                        <Row>
                                            <Col xs={4}>
                                        <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                            type="radio" label="Play:" value="pattern"
                                            checked={this.state.blink1NonComputer==='pattern'}
                                            onChange={this.handleBlink1NonComputerChoice} />
                                    </Col><Col xs={8}>
                                        <Input labelClassName="col-xs-1" wrapperClassName="col-xs-8" bsSize="small"
                                            type="select" label=""
                                            valueLink={this.linkState('patternId')} >
                                            {this.state.patterns.map( createPatternOption, this )}
                                        </Input>
                                    </Col></Row>
                                        <Row>
                                            <Col xs={1}></Col>
                                            <Col xs={2}>
                                                <ButtonInput bsSize="small" value="Set" onClick={this.handleBlink1NonComputerSet} />
                                            </Col>
                                        </Row>
                                    </form>

                            </div>
                        </Col>
                        <Col md={4}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}} enabled={false}>
                                <h5><u> Proxy configuration </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                        type="checkbox" label="Use HTTP proxy" checkedLink={this.linkState('proxyEnable')}  />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="host" placeholder="localhost"
                                        valueLink={this.linkState('proxyHost')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="number" label="port" placeholder="8080"
                                        valueLink={this.linkState('proxyPort')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="username" placeholder=""
                                        valueLink={this.linkState('proxyUser')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="password" placeholder=""
                                        valueLink={this.linkState('proxyPass')} />
                                </form>
                            </div>

                        </Col>
                        </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button bsSize="small" onClick={this.cancel}>Cancel</Button>
                  <Button bsSize="small" onClick={this.close}>OK</Button>
                </Modal.Footer>
            </Modal>
        </div>
      );
    }
});

module.exports = PreferencesModal;
