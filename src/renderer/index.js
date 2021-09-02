
//"use strict";

import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/css/bootstrap-theme.min.css';
import 'font-awesome/css/font-awesome.min.css';
//fooimport 'react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css';

import React from 'react';
import ReactDOM from 'react-dom';

import Blink1ControlView from './components/gui/blink1ControlView'

var ipcRenderer = require('electron').ipcRenderer;

var conf = require('common/blink1control2config');
var log = require('./logger');

var MenuMaker = require('./menuMaker');
var Eventer = require('./eventer');

// maybe these go in another file?
var Blink1Service = require('./server/blink1Service');
var ApiServer = require('./server/apiServer');
var PatternsService = require('./server/patternsService');

// log.msg("---- before service start");

MenuMaker.setupMainMenu();
MenuMaker.setupTrayMenu();

Blink1Service.start();
ApiServer.start();
PatternsService.initialize();


ReactDOM.render(
  <Blink1ControlView />,
  document.getElementById('app')
);


var IftttService = require('./server/iftttService');
var MailService = require('./server/mailService');
var ScriptService = require('./server/scriptService');
var TimeService = require('./server/timeService');
var MqttService = require('./server/mqttService');

setTimeout( function() {
  log.msg("services starting...");
  IftttService.start();
  MailService.start();
  ScriptService.start();
  TimeService.start();
  MqttService.start();
  log.msg("services started");
}, 2000);


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
ipcRenderer.on('resetAlerts', function() {
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
