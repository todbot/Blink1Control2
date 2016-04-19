// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = null; // later
var app = null; //
var fs = require('fs');
var log = require('./logger');
var isRenderer = require('is-electron-renderer');

var confdefaults = require('./blink1control2-config-defaults.json');

// make sure we only use 'nconf' from non-renderer process
// because nconf uses yargs which makes webpack choke
if( isRenderer ) {
    var remote = require('electron').remote;
    // nconf = window.require('remote').require('nconf');
    // var remote = window.require('remote');
    // nconf = remote.require('nconf');
    // app = window.require('remote').app;
    nconf = remote.require('nconf');
    app = remote.app;
}
else {
    nconf = require('nconf');
    app = require('electron').app;
}

var conf_file = getUserDataHome() + '/blink1control2-config.json';

log.msg("config file:"+conf_file);
// if no conf file, put in a default one
if( ! fs.existsSync(conf_file) ) {
    log.msg("config: no conf file at "+conf_file+", writing defaults");
    fs.writeFileSync( conf_file, JSON.stringify(confdefaults,null, 2) );
}
nconf.file({file: conf_file});


function getUserDataHome() {
    var userDataHome = app.getPath('userData');
    return userDataHome;
}

function saveSettings(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function readSettings(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

module.exports = {
    saveSettings: saveSettings,
    readSettings: readSettings,
    userHome: getUserDataHome
};
