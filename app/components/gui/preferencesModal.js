"use strict";

// import React from 'react';
var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var ButtonInput = require('react-bootstrap').ButtonInput;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;
var Radio = require('react-bootstrap').Radio;
var Checkbox = require('react-bootstrap').Checkbox;

var isAccelerator = require("electron-is-accelerator");

var PatternsService = require('../../server/patternsService');
var Blink1Service   = require('../../server/blink1Service');
var ApiServer   = require('../../server/apiServer');
var MenuMaker = require('../../menuMaker');

var conf = require('../../configuration');
var log = require('../../logger');
var Eventer = require('../../eventer');

var Blink1SerialOption = require('./blink1SerialOption');

var app = require('electron').remote.app;
var path = require('path');

const propTypes = {
};

var PreferencesModal = React.createClass({
  propTypes: {
    show: React.PropTypes.bool,
    blink1Serials:  React.PropTypes.array
  },
  getInitialState: function() {
    return this.loadSettings();
  },
  // doing this so we get guaranteed fresh config
  componentWillReceiveProps: function(nextProps) {
    // if (!this.props.show) {
    if( !this.props.show && nextProps.show ) {
      var settings = this.loadSettings();
      this.setState(settings);
    }
},
loadSettings: function() {
  var patterns = PatternsService.getAllPatterns();
  var settings = {
    hideDockIcon:     conf.readSettings('startup:hideDockIcon') || false,
    startMinimized:   conf.readSettings('startup:startMinimized') || false,
    startAtLogin:     conf.readSettings('startup:startAtLogin') || false,
    startupPattern:   conf.readSettings('startup:startupPattern') || "", // FIXME: not used yet
    shortcutPrefix:   conf.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift',
    shortcutResetKey: conf.readSettings('startup:shortcutResetKey') || 'R',
    enableDegamma:    conf.readSettings('blink1Service:enableDegamma') || false,
    hostId: Blink1Service.getHostId(),
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
    playingSerialize: conf.readSettings('patternsService:playingSerialize') || false,
    patterns: patterns,
    patternId: 'whiteflashes',
    nonComputerPattern: patterns[0].id,
    errorMsg: ''
  };
  return settings;
},

saveSettings: function() {
  if (!Blink1Service.setHostId(this.state.hostId)) {
    this.setState({errormsg: 'HostId must be 8-digit hexadecimal'});
    return false;
  }

  conf.saveSettingsMem('startup:hideDockIcon', this.state.hideDockIcon);
  conf.saveSettingsMem('startup:startMinimized', this.state.startMinimized);
  conf.saveSettingsMem('startup:startAtLogin', this.state.startAtLogin);
  // conf.saveSettings('startup:startupPattern', this.state.startupPattern);
  conf.saveSettingsMem('startup:shortcutPrefix', this.state.shortcutPrefix);
  conf.saveSettingsMem('startup:shortcutResetKey', this.state.shortcutResetKey);
  conf.saveSettingsMem('blink1Service:enableDegamma', this.state.enableDegamma);
  conf.saveSettingsMem('blink1Service:blink1ToUse', this.state.blink1ToUse);
  conf.saveSettingsMem('blink1Service:allowMulti', this.state.allowMultiBlink1);
  conf.saveSettingsMem('apiServer:enabled', this.state.apiServerEnable);
  conf.saveSettingsMem('apiServer:port', this.state.apiServerPort);
  conf.saveSettingsMem('apiServer:host', this.state.apiServerHost);
  conf.saveSettingsMem('proxy:enable', this.state.proxyEnable);
  conf.saveSettingsMem('proxy:host', this.state.proxyHost);
  conf.saveSettingsMem('proxy:port', this.state.proxyPort);
  conf.saveSettingsMem('proxy:username', this.state.proxyUser);
  conf.saveSettingsMem('proxy:password', this.state.proxyPass);
  conf.saveSettingsMem('patternsService:playingSerialize', this.state.playingSerialize);
  conf.saveSettingsSync(); // save settings to disk

  Blink1Service.reloadConfig();
  ApiServer.reloadConfig();
  PatternsService.reloadConfig();

  MenuMaker.setupMainMenu(); // FIXME: find way to do spot edit of shortcut keys?
  MenuMaker.updateTrayMenu();

  this.updateStartAtLogin();

  if (process.platform === 'darwin') {
    if (this.state.hideDockIcon) {
      app.dock.hide();
    } else {
      app.dock.show();
    }
  }

  // FIXME: a hack to get ToolTable to refetch allowMulti pref
  Eventer.addStatus({type: 'info', source: 'preferences', text: 'settings updated'});

  return true;
},

updateStartAtLogin: function() {
  // log.msg("PreferencesModal.updateStartAtLogin:",this.state.startAtLogin);
  app.setLoginItemSettings({
    openAtLogin: this.state.startAtLogin,
  });
},

close: function() {
  if( this.saveSettings() ) {
    this.props.onSave(this.state);
  }
},
cancel: function() {
  this.props.onCancel();
},
handleBlink1SerialChange: function(serial) {
  log.msg("handleBlink1SerialChange: ", serial);
  PatternsService.playPatternFrom('prefs', '~blink:#888888-3', serial);
  this.setState({blink1ToUse: serial});
},
handleBlink1NonComputerSet: function(event) {
  var choice = event.target.value
  log.msg("handleBlink1NonComputerSet: ",choice, ",", this.state.nonComputerPattern );
  var err = '';
  if( choice === 'off' ) {
    log.msg("settting OFF");
    var patt = PatternsService.newPatternFromString( 'offpatt', '0,#000000,0.0,0');
    err = Blink1Service.writePatternToBlink1(patt,true,0);
  }
  else if( choice === 'default' ) {
    log.msg("settting default:",Blink1Service.defaultPatternStr);
    var patt = PatternsService.newPatternFromString('default', Blink1Service.defaultPatternStr);
    err = Blink1Service.writePatternToBlink1(patt,true,0);
  }
   else if ( choice === 'pattern' ) {
    var patt = PatternsService.getPatternById(this.state.nonComputerPattern);
    log.msg("setting pattern:",patt);
    err = Blink1Service.writePatternToBlink1(patt,true,0);
  }
  err = ( !err ) ? "success" : err;
  this.setState({errorMsg: err});
},
handleInputChange: function(event) {
  var target = event.target;
  var value = target.type === 'checkbox' ? target.checked : target.value;
  var name = target.name;
  if( name == 'shortcutResetKey' && value != '') {
    var accel = this.state.shortcutPrefix +"+"+ value;
    log.msg("accel:",accel);
    if( !isAccelerator(accel) ) {
      this.setState({errorMsg: "Cannot use '"+value+"' as shortcut key"});
      return;
    }
  }
  this.setState({[name]: value});
},

render: function() {
  var createPatternOption = function(patt, idx) {
    return (<option key={idx} value={patt.id}>{patt.name}</option>);
  };
  var createShortcutPrefixOption = function(item, idx) {
    return (<option key={idx} value={item.what}>{item.what2}</option>);
  };
  var isMac = (process.platform === 'darwin');
  // var showIfMac = (isMac) ? '':'hidden';
  var cmdKeyStr = (isMac) ? 'Cmd' : 'Ctrl';
  var sectStyle = {
    border: '1px solid #ddd',
    paddingLeft: 15,
    paddingBottom: 10
  };
  var errorSectStyle = { paddingLeft: 15, color:'red'};

  return (
    <div>
      <Modal show={this.props.show} onHide={this.close} bsSize="large">
        <Modal.Header>
          <Modal.Title style={{fontSize:"95%"}}>Preferences</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{fontSize:"100%", paddingTop:0}}>
          <p style={{color: "#f00"}}>{this.state.errormsg}</p>
          <Row>
          <Col md={4}>
            <div style={sectStyle}>
              <h5><u> General </u></h5>
              <Form horizontal>
                <Checkbox bsSize="small" title="On next restart, app is systray/menubar only"
                  name="startMinimized" checked={this.state.startMinimized} onChange={this.handleInputChange}>
                  Start minimized
                </Checkbox>
                <Checkbox bsSize="small" title="Start app at login"
                  name="startAtLogin" checked={this.state.startAtLogin} onChange={this.handleInputChange} >
                  Start at login
                </Checkbox>

                {isMac ?
                  <Checkbox bsSize="small" title="Don't show app in Dock"
                    name="hideDockIcon" checked={this.state.hideDockIcon} onChange={this.handleInputChange} >
                    Hide Dock Icon
                  </Checkbox> : <div/>}

                <Checkbox bsSize="small" title="Use more accurate colors. When off, colors are brighter"
                  name="enableDegamma" checked={this.state.enableDegamma} onChange={this.handleInputChange} >
                  LED gamma-correction
                </Checkbox>
                <Checkbox bsSize="small" title="Only allow color patterns to play single-file, not at the same time"
                  name="playingSerialize" checked={this.state.playingSerialize} onChange={this.handleInputChange} >
                  Pattern play serialize
                </Checkbox>
              </Form>
            </div>
            <div style={sectStyle}>
              <h5><u> Global Shortcut Keys (on restart) </u></h5>
                <Form horizontal>
                  <Row className="form-group form-group-sm">
                    <Col xs={3}>
                      Reset Alerts
                    </Col>
                    <Col xs={5}>
                      <FormControl bsSize="small" componentClass="select"
                        name="shortcutPrefix" value={this.state.shortcutPrefix} onChange={this.handleInputChange} >
                        <option value="CommandOrControl+Shift">{cmdKeyStr}+Shift</option>
                        <option value="CommandOrControl">{cmdKeyStr}</option>
                        <option value="CommandOrControl+Alt">{cmdKeyStr}+Alt</option>
                        <option value="Alt">Alt</option>
                      </FormControl>
                    </Col>
                    <Col xs={3}>
                      <FormControl bsSize="small"
                        type="text" label="" placeholder="" size="1"
                        name="shortcutResetKey" value={this.state.shortcutResetKey} onChange={this.handleInputChange} />
                    </Col>
                  </Row>
                </Form>
              </div>
            </Col>
            <Col md={4}>
              <div style={sectStyle}>
                <h5><u> blink(1) device use </u></h5>
                  <Form horizontal>
                    <FormGroup controlId="formHostId" bsSize="small">
                      <Col sm={6} componentClass={ControlLabel}>  HostId  </Col>
                      <Col sm={5}>
                        <FormControl
                          type="text" label="HostId" placeholder=""
                          name="hostId" value={this.state.hostId} onChange={this.handleInputChange} />
                      </Col>
                    </FormGroup>
                    <Blink1SerialOption label="Preferred device" defaultText="-use first-"
                      labelColWidth={6} controlColWidth={5} bsSize="small"
                      serial={this.state.blink1ToUse} onChange={this.handleBlink1SerialChange}/>
                    <FormGroup bsSize="small">
                      <Col sm={11}>
                        <Checkbox
                          name="allowMultiBlink1" checked={this.state.allowMultiBlink1} onChange={this.handleInputChange}>
                          Use multi blink(1) devices in rules
                        </Checkbox>
                      </Col>
                    </FormGroup>
                  </Form>
                </div>
                <div style={sectStyle}>
                  <h5><u> API server configuration </u></h5>
                  <Form horizontal>
                    <FormGroup bsSize="small">
                      <Col sm={11}>
                        <Checkbox
                          name="apiServerEnable" checked={this.state.apiServerEnable} onChange={this.handleInputChange} >
                          Start API server
                        </Checkbox>
                      </Col>
                    </FormGroup>
                    <FormGroup controlId="formPort" bsSize="small">
                      <Col sm={3} componentClass={ControlLabel}>  port  </Col>
                      <Col sm={7}>
                        <FormControl type="number" placeholder=""
                        name="apiServerPort" value={this.state.apiServerPort} onChange={this.handleInputChange} />
                      </Col>
                    </FormGroup>
                    <FormGroup controlId="formHost" bsSize="small">
                      <Col sm={3} componentClass={ControlLabel}>  host  </Col>
                      <Col sm={4}>
                        <Radio name="apiServerHost" value="localhost"
                          checked={this.state.apiServerHost==='localhost'} onChange={this.handleInputChange} >
                          localhost
                        </Radio>
                      </Col>
                      <Col xs={4}>
                        <Radio name="apiServerHost" value="any"
                          checked={this.state.apiServerHost==='any'} onChange={this.handleInputChange} >
                          any
                        </Radio>
                      </Col>
                    </FormGroup>
                  </Form>
                </div>
              </Col>

              <Col md={4}  title="Set what the blink(1) does when powered but no computer">
                <div style={sectStyle}>
                  <h5><u> blink(1) no-computer mode </u></h5>
                  <small>Set what blink(1) does when powered but no computer controlling it, aka "nightlight mode".
                  </small>

                  <Form horizontal>
                    <FormGroup controlId="formNonComputerMode" bsSize="small">
                      <Col sm={10}>
                        <Button bsSize="xsmall" value="off" block
                          title="blink(1) is off when powered but computer is off"
                          onClick={this.handleBlink1NonComputerSet}>
                          Set to Off
                        </Button>
                        <Button bsSize="xsmall" value="default" block
                          title="blink(1) plays its default RGB pattern when powered but computer is off"
                          onClick={this.handleBlink1NonComputerSet}>
                          Set to Default
                        </Button>
                        <Button bsSize="xsmall" value="pattern" block
                          title="blink(1) plays one the following patterns when powered but computer is off"
                          onClick={this.handleBlink1NonComputerSet}>
                          Set to Pattern:
                        </Button>
                        <FormControl bsSize="small" componentClass="select"
                          name="nonComputerPattern" value={this.state.nonComputerPattern} onChange={this.handleInputChange} >
                          {this.state.patterns.map( createPatternOption )}
                        </FormControl>
                      </Col>
                    </FormGroup>
                  </Form>
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
              <div style={errorSectStyle}>{this.state.errorMsg}</div>
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

// </div> style={{border:'1px solid #ddd', paddingLeft:15, opacity:0.5 }} >
/*
</Col>
<Col md={4}>
<div style={{border:'1px solid #ddd', paddingLeft:15,      opacity:0.5 }} >
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
        <Input labelClassName="col-xs-1" wrapperClassName="col-xs-10" bsSize="small"
            type="select" label=""
            name="patternId" value={this.state.patternId} onChange={this.handleInputChange} >
            {this.state.patterns.map( createPatternOption )}
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
</Row>
*/

/// old 3rd column
/*
                             <div style={{border:'1px solid #ddd', paddingLeft:15, opacity:0.5 }}>
                                <h5><u> Proxy configuration </u></h5>
                                <form className="form-horizontal">
                                    <Input labelClassName="col-xs-8" wrapperClassName="col-xs-12" bsSize="small"
                                        type="checkbox" label="Use HTTP proxy" checkedLnk={this.linkState('proxyEnable')}  />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="host" placeholder="localhost"
                                        valueLink={this.lnkState('proxyHost')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="number" label="port" placeholder="8080"
                                        valueLink={this.lnkState('proxyPort')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="username" placeholder=""
                                        valueLink={this.lnkState('proxyUser')} />
                                    <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8" bsSize="small"
                                        type="text" label="password" placeholder=""
                                        valueLink={this.lnkState('proxyPass')} />
                                </form>
                            </div>
*/
