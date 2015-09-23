// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
// FIXME: tortured function def before require() because "no-use-before-define" eslint
var nconf = require('nconf').file({file: getUserHome() + '/blink1controljs-config.json'});

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
    readSettings: readSettings
};
