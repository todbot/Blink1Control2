"use strict";

var remote = require('electron').remote;
var Menu = remote.Menu;
var Tray = remote.Tray;
var app = remote.app;
var BrowserWindow = remote.BrowserWindow;
var ipcRenderer = require('electron').ipcRenderer;

var pkg = require('./package.json');
var config = require('./configuration');
var log = require('./logger');
var Eventer = require('./eventer');

var Blink1Service = require('./server/blink1Service');

var mainWindow = BrowserWindow.getAllWindows()[0];

var tray = null;


var TrayMaker = {
    bip: function() {

    },
    // showTrayMenu: function() {
    updateTrayMenu: function() {
        log.msg("TrayMaker.updateTrayMenu");
        var bigButtonsConfig = config.readSettings('bigButtons') || [];
        var statusButtons = bigButtonsConfig.map( function(bb,idx) {
            return {
                label: "Set: " + bb.name,
                // accelerator: "CommandOrControl+" + (idx+1),
                // icon: swatchIcon,
                click: function(/*item*/) {
                    Eventer.emit('playBigButtonUser', idx);
                }
            };

        });

        var contextMenuTemplate = [
            {  label: 'Blink1Control2 is running', enabled: false},
            {  label: 'status: '+ Blink1Service.getStatusString(), enabled: false },
            {  type:  'separator' }
        ];

        Array.prototype.push.apply( contextMenuTemplate, statusButtons );

        var contextMenuTemplateB = [
            {  type: "separator" },
            {  label: 'Off',
                click: function() {
                    Eventer.emit('playBigButtonSys', 'Off');
                }
            },
            // {	label: 'Reset Alerts',
            //     click: function() {
            //         // FIXME: TBD
            //     }
            // },
            {	type: "separator" },
            {	label: 'Open Settings...',
                click: function() {
                    mainWindow.show();
                }
            },
            {	label: 'Quit',
                click: function() {
                    ipcRenderer.send('quitnow');
                }
            }
        ];
        Array.prototype.push.apply( contextMenuTemplate, contextMenuTemplateB );

            // {	label: 'About ' + pkg.productName,
            // 	click: function() { openAboutWindow(); }
            // },
            // {	type: "separator" },
            // {	label: 'Start minimized',
            //     type: 'checkbox',
            //     checked: config.readSettings('startup:startMinimized'),
            //     click: function(menuItem) {
            //         config.saveSettings('startup:startMinimized', menuItem.checked);
            //     },
            // },
            // {	label: 'Start at login',
            //     type: 'checkbox',
            //     checked: config.readSettings('startup:startAtLogin'),
            //     click: function(menuItem) {
            //         config.saveSettings('startup:startAtLogin', menuItem.checked);
            //         // test on Mac with:  osascript -e 'tell application "System Events" to get the name of every login item'
            //         if( menuItem.checked ) {
            //             blink1ControlAutoLauncher.enable();
            //         } else {
            //             blink1ControlAutoLauncher.disable();
            //         }
            //     }
            // },
            //
            /*
            {	label: 'Off / Reset Alerts',  // Note: only works when DevTools is hiddden, else Cmd-r reloads
                // accelerator: 'CommandOrControl+R',	// accelerator: 'CmdOrCtrl+R',
                click: function() {
                    // mainWindow.webContents.send('resetAlerts', 'woot');
                    PatternsService.stopAllPatterns();
                    Blink1Service.off();
                }
            },
            {	type: "separator" },
            {	label: 'Enable API server',
                type: 'checkbox',
                checked: config.readSettings('apiServer:enabled'),
                click: function(menuItem) {
                    config.saveSettings('apiServer:enabled', menuItem.checked);
                    // mainWindow.webContents.send('reloadConfig', 'apiServer');
                }
            },
            // {	type: "separator" },
            // { 	label: 'Set Status...',
            //     submenu: statusButtons
            // },
            {	type: "separator" },
            {	label: 'Open Settings...',
                click: function() {
                    console.log("Open Settings...");
                    mainWindow.show();
                }
            },
            {	label: 'Quit',
                // accelerator: 'CommandOrControl+Q',
                // selector: 'terminate:',
                click: function() {
                    // app.quit(); // doesn't actually cause app to quit
            		ipcRenderer.send('quitnow');
                }
            }
        ];*/

        var contextMenu = Menu.buildFromTemplate( contextMenuTemplate );
        // tray.popUpContextMenu(contextMenu);
        tray.setContextMenu( contextMenu );

        if (process.platform === 'darwin') {
            app.dock.setMenu( contextMenu ); // Make Dock have same context menu
        }

    },

    setupTrayMenu: function() {
        // var self = this;
        console.log("resourcesPath:",process.resourcesPath, "appPath:",app.getAppPath());
        if( process.platform === 'win32' ) {  // FIXME: make this icon better for Windows
            tray = new Tray( app.getAppPath() + '/images/icons/blink1mk2-icon2-128px.ico' );
        }
        else {
            tray = new Tray( app.getAppPath() + '/images/icons/blink1mk2-icon-16px.png' );
        }
        tray.setToolTip( pkg.productName + ' is running...');

        // delete tray object to eliminate duplicates on reload
        window.onbeforeunload = function(/*e*/) {
            console.log("killing tray");
            if(tray) { tray.destroy(); tray = null; }
        };

        this.updateTrayMenu();

        Eventer.on('deviceUpdated', this.updateTrayMenu);
        Eventer.on('bigButtonsUpdated', this.updateTrayMenu);

        // tray.on('click', function() {
        //     self.showTrayMenu();
        // });
        // tray.on('right-click', function() {
        //     self.showTrayMenu();
        // });
        // tray.on('double-click', function() {
        // });
    }

};

module.exports = TrayMaker;
