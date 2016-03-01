// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = require('nconf');

nconf.file({file: getUserHome() + '/blink1control2-config.json'});

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
