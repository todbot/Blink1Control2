// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = require('nconf');
var log = require('./logger');

var conf_file = getUserHome() + '/blink1control2-config.json';

nconf.file({file: conf_file});
//console.log( "config file", conf_file);
log.msg("config file:"+conf_file);

function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
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
