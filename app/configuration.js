// stolen from: https://medium.com/developers-writing/building-a-desktop-application-with-electron-204203eeb658

'use strict';

var nconf = null; // later
var app = null; //
var fs = require('fs');
var isRenderer = require('is-electron-renderer');

var confdefaults = require('./blink1control2-config-defaults.json');
// var log = require('./logger');

// make sure we only use 'nconf' from non-renderer process
// because nconf uses yargs which makes webpack choke
if( isRenderer ) {
    var remote = require('electron').remote;
    nconf = remote.require('nconf');
    app = remote.app;
}
else {
    nconf = require('nconf');
    app = require('electron').app;
}

var conf_file = app.getPath('userData') + '/blink1control2-config.json';
console.log("config file:"+conf_file);

// if no conf file, put in a default one
if( ! fs.existsSync(conf_file) ) {
    console.log("config: no conf file at "+conf_file+", writing defaults");
    fs.writeFileSync( conf_file, JSON.stringify(confdefaults,null, 2) );
}
nconf.file({file: conf_file});

var Config = {
    // start: function() {
    //     var logconfig = this.readSettings('logger');
    //     // log.setConfig( logconfig );
    // },
    saveSettings: function(settingKey, settingValue) {
        nconf.set(settingKey, settingValue);
        nconf.save();
    },
    readSettings: function(settingKey) {
        nconf.load();
        return nconf.get(settingKey);
    },
    getFilepath: function() {
        return nconf.stores.file.file;  //FIXME: seems weird
    }
    // getUserDataHome: function() {
    //     var userDataHome = app.getPath('userData');
    //     return userDataHome;
    // }
};

module.exports = Config;
