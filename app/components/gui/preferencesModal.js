"use strict";

var React = require('react');

var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var ButtonInput = require('react-bootstrap').ButtonInput;
var Button = require('react-bootstrap').Button;

var LinkedStateMixin = require('react-addons-linked-state-mixin');

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
var AutoLaunch = require('electron').remote.require('auto-launch');
var appPath = app.getAppPath();
if( process.platform === 'darwin' ) {
    appPath = path.resolve( appPath, '../../..');
}
console.log("appPath:",appPath);
var blink1ControlAutoLauncher = new AutoLaunch({
    name: 'Blink1Control2',
    path: appPath

}); // FIXME: pkg.productName

var PreferencesModal = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
        show: React.PropTypes.bool,
        // rule: React.PropTypes.object.isRequired
        // patternId: React.PropTypes.string.isRequired,
        // onPatternUpdated: React.PropTypes.func.isRequired
        blink1Serials:  React.PropTypes.array
    },
    getInitialState: function() {
        return {
            hideDockIcon:     conf.readSettings('startup:hideDockIcon') || false,
            startMinimized:   conf.readSettings('startup:startMinimized') || false,
            startAtLogin:     conf.readSettings('startup:startAtLogin') || false,
            startupPattern:   conf.readSettings('startup:startupPattern') || "", // FIXME: not used yet
            shortcutPrefix:   conf.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift',
            shortcutResetKey: conf.readSettings('startup:shortcutResetKey') || 'R',
            enableGamma:      conf.readSettings('blink1Service:enableGamma') || false, // NOTE this fails if flop default to true
            hostId:           Blink1Service.getHostId(),
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
            patterns: PatternsService.getAllPatterns(),
            // blink1Serials: Blink1Service.getAllSerials(),
            // blink1Serials: ['12345678','abcdabcd'], // FIXME: make a prop
            patternId: 'whiteflashes',
            errormsg: ''
        };
    },
    // doing this so we get guaranteed fresh config
    componentWillReceiveProps: function(/*nextProps*/) {
        if( !this.props.show ) {
            this.setState( this.getInitialState() );
        }
    },
    saveSettings: function() {

        if( ! Blink1Service.setHostId( this.state.hostId ) ) {
            this.setState({errormsg: 'HostId must be 8-digit hexadecimal'});
            return false;
        }

        conf.saveSettings('startup:hideDockIcon', this.state.hideDockIcon);
        conf.saveSettings('startup:startMinimized', this.state.startMinimized);
        conf.saveSettings('startup:startAtLogin', this.state.startAtLogin);
        // conf.saveSettings('startup:startupPattern', this.state.startupPattern);
        conf.saveSettings('startup:shortcutPrefix', this.state.shortcutPrefix);
        conf.saveSettings('startup:shortcutResetKey', this.state.shortcutResetKey);
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
        conf.saveSettings('patternsService:playingSerialize', this.state.playingSerialize);

        Blink1Service.reloadConfig();
        ApiServer.reloadConfig();
        PatternsService.reloadConfig();

        MenuMaker.setupMainMenu(); // FIXME: find way to do spot edit of shortcut keys?
        MenuMaker.updateTrayMenu();

        // the startAtLogin option isn't covered by any reloadConfig() call
        blink1ControlAutoLauncher.isEnabled()
        .then( isEnabled => {
            if( isEnabled ) {
                if( !this.state.startAtLogin ) {
                    blink1ControlAutoLauncher.disable(); // disable if enabled
                }
            }
            else { // not enabled
                if( this.state.startAtLogin ) {
                    blink1ControlAutoLauncher.enable(); // enable if disabled
                }
            }
        })
        .catch(err => {
            console.log("PreferencesModal: error setting startAtLogin"); // handle error
        });

        if( this.state.hideDockIcon && process.platform === 'darwin' ) {
            app.dock.hide();
        } else {
            app.dock.show();
        }

        // FIXME: a hack to get ToolTable to refetch allowMulti pref
        Eventer.addStatus({type:'info', source:'preferences', text:'settings updated'});

        return true;
    },
    close: function() {
        if( this.saveSettings() ) {
            this.props.onSave(this.state);
        }
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
        PatternsService.playPatternFrom( 'prefs', '~blink:#888888-3', serial);
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
        log.msg("PreferncesModal: SET!!",e);
    },
    render: function() {
        var createPatternOption = function(patt, idx) {
            return ( <option key={idx} value={patt.id}>{patt.name}</option> );
        };
        var createShortcutPrefixOption = function(item,idx) {
            return ( <option key={idx} value={item.what}> {item.what2}</option> );
        };
        var isMac = (process.platform === 'darwin');
        var showIfMac = (isMac) ? '':'hidden';
        var cmdKeyStr = (isMac) ? 'Cmd' : 'Ctrl';

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
                                    <div title="On next restart, app is systray/menubar only">
                                        <Input labelClassName="col-xs-10" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="Start minimized"
                                            checkedLink={this.linkState('startMinimized')} />
                                    </div>
                                    <div title="Start app at login">
                                        <Input labelClassName="col-xs-10" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="Start at login"
                                            checkedLink={this.linkState('startAtLogin')} />
                                    </div>
                                    <div title="Don't show app in Dock">
                                        <Input labelClassName="col-xs-10" wrapperClassName="col-xs-12 {showIfMac}" bsSize="small"
                                            type="checkbox" label="Hide Dock Icon"
                                            checkedLink={this.linkState('hideDockIcon')} />
                                    </div>
                                    <div title="Use more accurate colors. When off, colors are brighter">
                                        <Input labelClassName="col-xs-10" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="LED gamma-correction"
                                            checkedLink={this.linkState('enableGamma')} />
                                    </div>
                                    <div title="Only allow color patterns to play single-file, not at the same time">
                                        <Input labelClassName="col-xs-10" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="Pattern play serialize"
                                            checkedLink={this.linkState('playingSerialize')} />
                                    </div>
                                </form>

                            </div>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> Global Shortcut Keys (on restart) </u></h5>
                                <form className="form-horizontal">
                                <Row className="form-group form-group-sm">
                                    <Col xs={3}>
                                        Reset Alerts
                                    </Col>
                                    <Col xs={5}>
                                        <Input labelClassName="" wrapperClassName="col-xs-12"  bsSize="small"
                                            type="select" label=""
                                            valueLink={this.linkState('shortcutPrefix')} >
                                            <option key={1} value="CommandOrControl+Shift">{cmdKeyStr}+Shift</option>
                                            <option key={2} value="CommandOrControl">{cmdKeyStr}</option>
                                            <option key={3} value="CommandOrControl+Alt">{cmdKeyStr}+Alt</option>
                                            <option key={4} value="Alt">Alt</option>
                                        </Input>
                                    </Col><Col xs={4}>
                                        <Input labelClassName="" wrapperClassName="col-xs-10" bsSize="small"
                                            type="text" label="" placeholder="" size="1"
                                            valueLink={this.linkState('shortcutResetKey')} />
                                    </Col>
                                </Row>
                                </form>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div style={{border:'1px solid #ddd', paddingLeft:15}}>
                                <h5><u> blink(1) device use </u></h5>
                                    <form className="form-horizontal">
                                        <Input labelClassName="col-xs-6" wrapperClassName="col-xs-5" bsSize="small"
                                          type="text" label="HostId" placeholder=""
                                          valueLink={this.linkState('hostId')} />
                                        <Blink1SerialOption labelClassName="col-xs-6" wrapperClassName="col-xs-5"
                                            label="Preferred device" defaultText="- use first -"
                                            serial={this.state.blink1ToUse} onChange={this.handleBlink1SerialChange}/>
                                        <Input labelClassName="col-xs-12" wrapperClassName="col-xs-12" bsSize="small"
                                            type="checkbox" label="Use multi blink(1) devices in rules" checkedLink={this.linkState('allowMultiBlink1')}  />
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


/// old 3rd column
/*
                             <div style={{border:'1px solid #ddd', paddingLeft:15, opacity:0.5 }}>
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
*/
