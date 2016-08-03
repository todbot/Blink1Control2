
"use strict";

// these requires are for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-yeti.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-lumen.min.css');
//require('../bootstrap-sb-admin-2.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');

var React = require('react');
var ReactDOM = require('react-dom');

// var Perf = require('react-addons-perf');

var ipcRenderer = require('electron').ipcRenderer;


var conf = require('./configuration');
var log = require('./logger');

// maybe this goes in another file?
var Blink1Service = require('./server/blink1Service');
var ApiServer = require('./server/apiServer');
var PatternsService = require('./server/patternsService');

log.msg("---- before service start");

Blink1Service.start();
ApiServer.start();
PatternsService.initialize();

log.msg("---- before render");
// Perf.start();

// Begin actual render code
var Blink1ControlView = require('./components/gui/blink1ControlView');
var App = React.createClass({
  render: function() {
    return ( <Blink1ControlView /> );
  }
});
ReactDOM.render( <App />, document.getElementById('app'));

// Perf.stop();
// var perfmeasurements = Perf.getLastMeasurements();
// console.log("Perf output:\n");
// Perf.printInclusive(perfmeasurements);
log.msg("---- after render");


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

// FIXME:
// Need to start these after a bit, so blink1s can be registerd
// (really, they should be called on a calback of Blink1Service.isReady() or something)
setTimeout( function() {
    IftttService.start();
    MailService.start();
    SkypeService.start();
    ScriptService.start();
}, 3000);

// events from the main process, from menu actions
ipcRenderer.on('quitting', function( event,arg ) {
    console.log("QUITTING ... ",arg);
    Blink1Service.off();
    // if( arg === 'apiServer' ) {
    //     ApiServer.reloadConfig();
    // }
});
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
            Blink1Service.fadeToColor( 100, bigButton.color, bigButton.ledn || 0 );  // 0=all leds
        }
        else if( bigButton.type === 'pattern' ) {
            console.log("buttontype pattern");
            PatternsService.playPattern( bigButton.patternId );
        }
    }
});


// run startup script, if any
var laterfunc = function() {
    Blink1Service.off();
    var startupPattern = conf.readSettings('startup:startupPattern');
    if( startupPattern ) {
        console.log("starting up with:", startupPattern);
        PatternsService.playPattern( startupPattern );
    }
};
setTimeout( laterfunc, 1000 );
