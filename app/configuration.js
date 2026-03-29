// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = require('nconf'); // webpack external — safe to require at runtime
var fs = require('fs');

var confdefaults = require('./blink1control2-config-defaults.json');

// Get userData path: in renderer ask main via IPC; in main process use app directly
var conf_dir;
if (require('is-electron-renderer')) {
    conf_dir = require('electron').ipcRenderer.sendSync('getAppData').userData;
} else {
    conf_dir = require('electron').app.getPath('userData');
}

var conf_file = conf_dir + '/blink1control2-config.json';
console.log("Blink1Control2: config file:" + conf_file);

// if no conf file, put in a default one
if (!fs.existsSync(conf_file)) {
    if (!fs.existsSync(conf_dir)) {
        console.log("Blink1Control2: no config dir, creating it");
        fs.mkdirSync(conf_dir); // for Windows
    }
    console.log("Blink1Control2: config: no conf file at " + conf_file + ", writing defaults");
    fs.writeFileSync(conf_file, JSON.stringify(confdefaults, null, 2));
}
nconf.file({file: conf_file});

var Config = {
    saveSettings: function(settingKey, settingValue) {
        nconf.set(settingKey, settingValue);
        nconf.save();
    },
    saveSettingsMem: function(settingKey, settingValue) {
        nconf.set(settingKey, settingValue);
    },
    // save settings to disk (after multiple saveSettingsMem() calls)
    saveSettingsSync: function() {
        nconf.save();
    },
    readSettings: function(settingKey) {
        nconf.load();
        return nconf.get(settingKey);
    }
};

module.exports = Config;
