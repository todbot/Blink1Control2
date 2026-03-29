"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;

var VirtualBlink1 = require('./virtualBlink1');

// var PreferencesModal = require('./preferencesModal');
var PreferencesModal = require('./preferencesModal');

var log = require('../../logger');

var Blink1Status = React.createClass({

    getInitialState: function() {
        var b1state = window.electronAPI.blink1.getState();
        var pstate = window.electronAPI.patterns.getState();
        return {
            blink1Color: b1state.currentColor,
            statusStr: b1state.statusStr,
            serialNumber: b1state.serialNumberForDisplay,
            blink1Serials: b1state.allSerials,
            iftttKey: b1state.iftttKey,
            currentPattern: pstate.playingPatternName || '-',
            currentSource: pstate.playingPatternSource || '-',
            showForm: false
        };
    },
    componentDidMount: function() {
        var self = this;
        window.electronAPI.blink1.addChangeListener(this.updateColorState, "blink1Status");
        window.electronAPI.patterns.addChangeListener(this.updatePatternState, "blink1Status");
        window.electronAPI.bus.on('showPreferences', function() {
            self.setState({showForm: true});
        });
    },
    updateColorState: function() {
        var b1state = window.electronAPI.blink1.getState();
        this.setState({
            blink1ColorLast: b1state.currentColor,
            statusStr: b1state.statusStr,
            serialNumber: b1state.serialNumberForDisplay,
            blink1Serials: b1state.allSerials,
            iftttKey: b1state.iftttKey
        });
    },
    updatePatternState: function() {
        var pstate = window.electronAPI.patterns.getState();
        this.setState({
            currentPattern: pstate.playingPatternName,
            currentSource: pstate.playingPatternSource
        });
    },

    onIftttKeyClick: function() {
        log.msg("Blink1Status.onIfttKeyClick!");
    },
    onPrefsClick: function() {
        this.setState({showForm: true});
        log.msg("PREFS CLICK");
    },
    saveForm: function(/*data*/) {
        this.setState({ showForm: false });
    },
    cancelForm: function() {
        this.setState({ showForm: false });
    },
    showIfttContextMenu: function(event) {
        log.msg("Blink1Status.showIfttContextMenu: ", event);
        window.electronAPI.menu.showContextMenu({
            menuId: 'ifttt-' + Date.now(),
            template: [{ label: 'Copy IFTTT Key', role: 'copy' }]
        });
    },
    render: function() {
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


});

module.exports = Blink1Status;
