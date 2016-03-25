// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var log = require('./logger');
var nconf = null; // later

// make sure we only use 'nconf' from non-renderer process
// because nconf uses yargs which makes webpack choke
var p = process;
if( process.browser === true ) {
    p = window.require('remote').require('process');
    nconf = window.require('remote').require('nconf');
}
else {
    nconf = require('nconf');
}

// var conf_file = getUserHome() + '/.configgg' + '/blink1control2-config.json';
var conf_file = getUserHome() + '/blink1control2-config.json';

nconf.file({file: conf_file});
//console.log( "config file", conf_file);
log.msg("config file:"+conf_file);

function getUserHome() {
    var home = p.env[(p.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    console.log("configuration: home=",home);
    return home;
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
    userHome: getUserHome
};
