"use strict";

import React from 'react';
import { Panel } from 'react-bootstrap';
import { Well } from 'react-bootstrap';

const { ipcRenderer } = require('electron')
const remote = require('electron').remote;

const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const currentWindow = remote.getCurrentWindow();

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');
var VirtualBlink1 = require('./virtualBlink1');

var PreferencesModal = require('./preferencesModal');

var log = require('../../logger');

export default class Blink1ControlView extends React.Component {

    constructor(props)  {
      super(props);
      this.state = {
        blink1Color: Blink1Service.getCurrentColor(),
        statusStr: Blink1Service.getStatusString(),
        serialNumber: Blink1Service.serialNumberForDisplay(),
        blink1Serials: Blink1Service.getAllSerials(),
        iftttKey: Blink1Service.getIftttKey(),
        currentPattern: '-',
        showForm: false
      };
      // things that can be clicked on, basically
      this.updateColorState = this.updateColorState.bind(this);
      this.updatePatternState = this.updatePatternState.bind(this);
      this.onPrefsClick = this.onPrefsClick.bind(this);
      this.cancelForm = this.saveForm.bind(this);
      this.saveForm = this.saveForm.bind(this);
      this.showIfttContextMenu = this.showIfttContextMenu.bind(this);
    }

    componentDidMount() {
        var self = this;
        Blink1Service.addChangeListener( this.updateColorState, "blink1Status" );
        PatternsService.addChangeListener( this.updatePatternState, "blink1Status" );

        ipcRenderer.on('showPreferences', function( /*event,arg*/ ) {
            self.setState({showForm: true});
        });
    }

    updateColorState(/*currentColor,  colors,ledn */) {
        this.setState({
                        blink1ColorLast: Blink1Service.getCurrentColor(),//currentColor,
                        statusStr: Blink1Service.getStatusString(),
                        serialNumber: Blink1Service.serialNumberForDisplay(),
                        blink1Serials: Blink1Service.getAllSerials(),
                        iftttKey: Blink1Service.getIftttKey()
                    });
    }

    updatePatternState() {
        this.setState( {
            currentPattern: PatternsService.getPlayingPatternName(),
            currentSource: PatternsService.getPlayingPatternSource() });
    }

    onIftttKeyClick() {
        log.msg("Blink1Status.onIfttKeyClick!");
    }

    onPrefsClick() {
        this.setState({showForm: true});
        log.msg("PREFS CLICK");
    }

    saveForm(/*data*/) {
        this.setState({ showForm: false });
    }

    cancelForm() {
        this.setState({ showForm: false });
    }

    showIfttContextMenu() {
        log.msg("Blink1Status.showIfttContextMenu: ",event);
        // var menu = this.makeMenu();
        var mymenu = new Menu(); // OS-specific pop-up menu
        mymenu.append( new MenuItem({label:'Copy IFTTT Key', role:'copy'} ));
        mymenu.popup(currentWindow);
    }
    render() {
        // console.log("blink1Status.render: ", this.state.blink1Color);
        var currentPattern = this.state.currentPattern;
        if( !currentPattern ) { currentPattern = '-'; }
        var currentSource = this.state.currentSource;
        if( !currentSource ) { currentSource = '-'; }

        var labelStyle = {width: 80, display: "inline-block", textAlign:'right', paddingRight:5};
        var serialNums = "serials:\n";
        this.state.blink1Serials.forEach(function(s){ serialNums+= "blink1:"+s+"\n"; });
        var onlineStatus = (navigator.onLine ? 'network online' : 'network offline');

        // <VirtualBlink1 blink1Color={this.state.blink1Color} /> // FIXME
        var header = <h4>Device <button style={{float:'right' }} onClick={this.onPrefsClick}><i className="fa fa-gear" title="Open Preferences..."></i></button></h4>;

        return (
            <Panel header={header} style={{ width: 280, height: 320, margin:5, padding:0 }}>
                <PreferencesModal show={this.state.showForm}
                    onSave={this.saveForm} onCancel={this.cancelForm} blink1Serials={this.state.blink1Serials} />

                <VirtualBlink1 />

                <Well bsSize="small" style={{margin: 0}}>
                    <div>
                        <span style={labelStyle}>Status:</span>
                        <span><b title={onlineStatus}>{this.state.statusStr}</b></span>
                    </div>
                    <div>
                        <span style={labelStyle} title={serialNums}>Serial num:</span>
                        <code style={{WebkitUserSelect: "text"}} title={serialNums}>
                            {this.state.serialNumber}
                        </code>
                    </div>
                    <div>
                        <span style={labelStyle}>IFTTT Key:</span>
                        <code style={{WebkitUserSelect: "text"}} onContextMenu={this.showIfttContextMenu}>
                            {this.state.iftttKey}
                        </code>
                    </div>
                    <div>
                        <span style={labelStyle}>Source:</span>
                        <span><b>{currentSource}</b></span>
                    <div></div>
                        <span style={labelStyle}>Pattern:</span>
                        <span><b>{currentPattern}</b></span>
                    </div>
                </Well>
            </Panel>
        );
    }

}

// no exports, we declared as export default className
