"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;

var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;
var currentWindow = remote.getCurrentWindow();

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');
var VirtualBlink1 = require('./virtualBlink1');

// var PreferencesModal = require('./preferencesModal');
import PreferencesModal from './preferencesModal';

var log = require('../../logger');

var Blink1Status = React.createClass({

    getInitialState: function() {
        return {
            blink1Color: Blink1Service.getCurrentColor(),
            statusStr: Blink1Service.getStatusString(),
            serialNumber: Blink1Service.serialNumberForDisplay(),
            blink1Serials: Blink1Service.getAllSerials(),
            iftttKey: Blink1Service.getIftttKey(),
            currentPattern: '-',
            showForm: false
        };
    },
    componentDidMount: function() {
        var self = this;
        Blink1Service.addChangeListener( this.updateColorState, "blink1Status" );
        PatternsService.addChangeListener( this.updatePatternState, "blink1Status" );

        ipcRenderer.on('showPreferences', function( /*event,arg*/ ) {
            self.setState({showForm: true});
        });

        this.makeMenu();
    },
    updateColorState: function(/*currentColor,  colors,ledn */) {
        this.setState({
                        blink1ColorLast: Blink1Service.getCurrentColor(),//currentColor,
                        statusStr: Blink1Service.getStatusString(),
                        serialNumber: Blink1Service.serialNumberForDisplay(),
                        blink1Serials: Blink1Service.getAllSerials(),
                        iftttKey: Blink1Service.getIftttKey()
                    });
    },
    updatePatternState: function() {
        this.setState( {
            currentPattern: PatternsService.getPlayingPatternName(),
            currentSource: PatternsService.getPlayingPatternSource() });
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
        log.msg("Blink1Status.showIfttContextMenu: ",event);
        var menu = this.makeMenu();
        menu.popup(currentWindow);
    },
    // doContextMenu: function(event, eventKey, arg) {
    // 	log.msg("Blink1Status.doContextMenu: eventKey:",eventKey, "arg:",arg);
    // 	//this.props.onEdit(eventKey, this.props.idx, arg);
    // },
    makeMenu: function() {
        var mymenu = new Menu();
        // mymenu.append( new MenuItem({label:'copy', click: self.doContextMenu.bind(null,null, 'copyiftttkey', null)}) );
        mymenu.append( new MenuItem({label:'Copy IFTTT Key', role:'copy'} ));
        // mymenu.append( new MenuItem({label:'Edit Host Id', click: this.doEditHostId} ));
        return mymenu;
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
