// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = require('nconf'); // webpack external — safe to require at runtime
var fs = require('fs');
var path = require('path');

var confdefaults = require('./blink1control2-config-defaults.json');

// Get userData path: in preload/renderer read from additionalArguments; in main process use app directly.
// In a plain Node.js context (standalone package), conf_dir stays '' and init() must be called
// with an explicit configPath before any service reads settings.
var conf_dir = '';
if (process.type === 'renderer') {
    var appDataArg = process.argv.find(function(a) { return a.startsWith('--appData='); });
    conf_dir = appDataArg ? JSON.parse(appDataArg.slice('--appData='.length)).userData : '';
} else if (process.versions && process.versions.electron) {
    conf_dir = require('electron').app.getPath('userData');
}

if (conf_dir) {
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
}

var Config = {
    // For use outside Electron: call this before requiring any service that reads config.
    // Creates the file with defaults if it does not exist.
    init: function(configPath) {
        var dir = path.dirname(configPath);
        if (!fs.existsSync(configPath)) {
            if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
            fs.writeFileSync(configPath, JSON.stringify(confdefaults, null, 2));
        }
        nconf.file({file: configPath});
    },
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
        return nconf.get(settingKey);
    }
};

module.exports = Config;
