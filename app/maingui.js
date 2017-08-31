
"use strict";

// begin requires for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-yeti.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-lumen.min.css');
//require('../bootstrap-sb-admin-2.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');
// end requires for webpack

var React = require('react');
var ReactDOM = require('react-dom');

// var Perf = require('react-addons-perf');

var ipcRenderer = require('electron').ipcRenderer;


var conf = require('./configuration');
var log = require('./logger');

var MenuMaker = require('./menuMaker');
var Eventer = require('./eventer');

// maybe these go in another file?
var Blink1Service = require('./server/blink1Service');
var ApiServer = require('./server/apiServer');
var PatternsService = require('./server/patternsService');

// log.msg("starting up global-tunnel");
// var globalTunnel = require('global-tunnel');
// globalTunnel.initialize({
//   host: '127.0.0.1',
//   port: 8888
//   // sockets: 50 // optional pool size for each http and https
// });

// log.msg("---- before service start");

MenuMaker.setupMainMenu();
MenuMaker.setupTrayMenu();

Blink1Service.start();
ApiServer.start();
PatternsService.initialize();

// log.msg("---- before render");
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
var TimeService = require('./server/timeService');

// FIXME:
// Need to start these after a bit, so blink1s can be registerd
// (really, they should be called on a calback of Blink1Service.isReady() or similar)
setTimeout( function() {
    IftttService.start();
    MailService.start();
    SkypeService.start();
    ScriptService.start();
    TimeService.start();
}, 3000);

// events from the main process, from menu actions
ipcRenderer.on('quitting', function( event,arg ) {
    log.msg("QUITTING renderer... ",arg);
    Blink1Service.off();
    // if( arg === 'apiServer' ) {
    //     ApiServer.reloadConfig();
    // }
});
ipcRenderer.on('reloadConfig', function( event,arg ) {
    log.msg("RELOAD CONFIG renderer... ",arg);
    if( arg === 'apiServer' ) {
        ApiServer.reloadConfig();
    }
});

// used by Main because menus are there
// (can these be in renderer process? why not)
ipcRenderer.on('resetAlerts', function( /*event,arg*/ ) {
    log.msg("resetAlerts");
    Eventer.emit('playBigButtonSys', 'Off');

});

ipcRenderer.on('playBigButtonUser', function(event,arg) {
    log.msg("maingui ipc playBigButtonUser",arg);
    Eventer.emit('playBigButtonUser', arg);
});

// run startup script, if any, after a bit so system is init'd
var startupfunc = function() {
    Blink1Service.off();
    var startupPattern = conf.readSettings('startup:startupPattern');
    if( startupPattern ) {
        console.log("starting up with:", startupPattern);
        PatternsService.playPatternFrom( 'startup', startupPattern );
    }
};
setTimeout( startupfunc, 1000 );
