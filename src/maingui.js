
"use strict";

// these requires are for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-yeti.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-lumen.min.css');
//require('../bootstrap-sb-admin-2.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');

var React = require('react');
var ReactDOM = require('react-dom');

// var remote = require('electron').remote;
// var BrowserWindow = remote.BrowserWindow;
var ipcRenderer = require('electron').ipcRenderer;

// TESTING BEGIN
// var express      = require('express');
// var appsrv = express();
// appsrv.get('/', function (req, res) {
// 	res.send('Blink1Control2 API server');
// });
// var server = appsrv.listen(5245);
//
// var Blink1 = require('node-blink1');
// var devices = Blink1.devices();
// console.log("Blink1 devices:", devices);

// var HID = require('node-hid');
// var devices = HID.devices();
// console.log("HID devices:", devices);

// var serialPort = require("serialport");
// serialPort.list(function (err, ports) {
//   ports.forEach(function(port) {
//     console.log(port.comName);
//     console.log(port.pnpId);
//     console.log(port.manufacturer);
//   });
// });

// TESTING END

var _ = require('lodash');

var conf = require('./configuration');
var log = require('./logger');

// maybe this goes in another file?
var ApiServer = require('./server/apiServer');
var Blink1Service = require('./server/blink1Service');
var PatternsService = require('./server/patternsService');

ApiServer.start();
Blink1Service.start();
PatternsService.initialize();

// FIXME: IDEA for event source modularity. almost there
// var _ = require('lodash');
// var eventServices = conf.readSettings('eventServices');
// var services = [];
// console.log("eventServices:");
// _.map(eventServices, function(s) {
//     console.log("service:",s.service, s.type, s.enabled);
//     var service = require('./server/'+s.service);
//     service.start();
//     services.push();
// });

var IftttService = require('./server/iftttService');
var MailService = require('./server/mailService');
var SkypeService = require('./server/skypeService');
var ScriptService = require('./server/scriptService');

IftttService.start();
MailService.start();
SkypeService.start();
ScriptService.start();

// events from the main process, from menu actions
ipcRenderer.on('reloadConfig', function( event,arg ) {
    console.log("RELOAD CONFIG ... ",arg);
    if( arg === 'apiServer' ) {
        ApiServer.reloadConfig();
    }
});
ipcRenderer.on('resetAlerts', function( /*event,arg*/ ) {
    PatternsService.stopAllPatterns();
    Blink1Service.off();
});
ipcRenderer.on('pressBigButton', function( event,arg ) {
    var bigButtonsConfig = conf.readSettings('bigButtons');
    var bigButton = bigButtonsConfig[ arg ];
    if( bigButton ) {
        // FIXME: this is duplicating code in BigButton
        if( bigButton.type === 'color' ) {
            console.log("buttontype color", bigButton);
            log.addEvent({type:'trigger', source:'button', id:bigButton.name} );
            Blink1Service.fadeToColor( 100, bigButton.color, bigButton.ledn || 0 );
        }
        else if( bigButton.type === 'pattern' ) {
            console.log("buttontype pattern");
            PatternsService.playPattern( bigButton.patternId );
        }
    }
});


// run startup script, if any
var laterfunc = function() {
    var startupPattern = conf.readSettings('startup:startupPattern');
    if( startupPattern ) {
        console.log("starting up with:", startupPattern);
        PatternsService.playPattern( startupPattern );
    }
};
setTimeout( laterfunc, 1000 );


// Begin actual render code

var Blink1ControlView = require('./components/gui/blink1ControlView');

var App = React.createClass({
  render: function() {
    return (
		// <div className="container-fluid">
			<Blink1ControlView />
    );
  }
});

ReactDOM.render( <App />, document.getElementById('app'));
