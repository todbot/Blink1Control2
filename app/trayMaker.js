"use strict";

var remote = require('electron').remote;
var Menu = remote.Menu;
var Tray = remote.Tray;
var app = remote.app;
var BrowserWindow = remote.BrowserWindow;
var ipcRenderer = require('electron').ipcRenderer;

var AutoLaunch = remote.require('auto-launch');

var pkg = require('./package.json');
var config = require('./configuration');
var log = require('./logger');

var Blink1Service = require('./server/blink1Service');
var PatternsService = require('./server/patternsService');

var blink1ControlAutoLauncher = new AutoLaunch({ name: pkg.productName});

var mainWindow = BrowserWindow.getAllWindows()[0];

var tray = null;

var pressBigButton = function( event,arg ) {
    var bigButtonsConfig = config.readSettings('bigButtons');
    var button = bigButtonsConfig[ arg ];
    if( button ) {
        PatternsService.stopAllPatterns();
        log.addEvent({type:'trigger', source:'button', id:button.name, text:button.name} );
        // FIXME: this is duplicating (badly) code in BigButtonSet
        if( button.type === 'color' ) {
            Blink1Service.fadeToColor( 100, button.color, button.ledn || 0 );  // 0=all leds
        }
        else if( button.type === 'pattern' ) {
            PatternsService.playPattern( button.patternId );
        }
    }
};

var trayMaker = {

    updateTrayMenu: function() {
        console.log("TRAY MENU UPDATE...");
        var bigButtonsConfig = config.readSettings('bigButtons') || [];
        var statusButtons = bigButtonsConfig.map( function(bb,idx) {
            return {
                label: bb.name,
                // icon: swatchIcon,
                click: function(/*item*/) {
                    // console.log("click item",item);
                    pressBigButton(null,idx);
                    // mainWindow.webContents.send('pressBigButton', idx);
                }
            };
        });

        var contextMenuTemplate = [
            { label: 'Blink1Control2 is running', enabled: false
            },

            // {	label: 'About ' + pkg.productName,
            // 	click: function() { openAboutWindow(); }
            // },
            // {	type: "separator" },
            {	label: 'Start minimized',
                type: 'checkbox',
                checked: config.readSettings('startup:startMinimized'),
                click: function(menuItem) {
                    config.saveSettings('startup:startMinimized', menuItem.checked);
                },
            },
            {	label: 'Start at login',
                type: 'checkbox',
                checked: config.readSettings('startup:startAtLogin'),
                click: function(menuItem) {
                    config.saveSettings('startup:startAtLogin', menuItem.checked);
                    // test on Mac with:  osascript -e 'tell application "System Events" to get the name of every login item'
                    if( menuItem.checked ) {
                        blink1ControlAutoLauncher.enable();
                    } else {
                        blink1ControlAutoLauncher.disable();
                    }
                }
            },
            {	label: 'Enable API server',
                type: 'checkbox',
                checked: config.readSettings('apiServer:enabled'),
                click: function(menuItem) {
                    config.saveSettings('apiServer:enabled', menuItem.checked);
                    // mainWindow.webContents.send('reloadConfig', 'apiServer');
                }
            },
            {	type: "separator" },
            { 	label: 'Set Status...',
                submenu: statusButtons
            },
            {	type: "separator" },
            {	label: 'Open Settings...',
                click: function() {
                    console.log("Open Settings...");
                    mainWindow.show();
                }
            },
            {	label: 'Off / Reset Alerts',  // Note: only works when DevTools is hiddden, else Cmd-r reloads
                // accelerator: 'CommandOrControl+R',	// accelerator: 'CmdOrCtrl+R',
                click: function() {
                    // mainWindow.webContents.send('resetAlerts', 'woot');
                    PatternsService.stopAllPatterns();
                    Blink1Service.off();
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
        ];
        var contextMenu = Menu.buildFromTemplate( contextMenuTemplate );
        tray.setContextMenu(contextMenu);
        if (process.platform === 'darwin') {
            app.dock.setMenu( contextMenu ); // Make Dock have same context menu
        }

    },

    setupTrayMenu: function() {
        var self = this;
        console.log("resourcesPath:",process.resourcesPath, "appPath:",app.getAppPath());
        if( process.platform === 'win32' ) {  // FIXME: make this icon better for Windows
            tray = new Tray( app.getAppPath() + '/images/icons/blink1mk2-icon2-128px.ico' );
        }
        else {
            tray = new Tray( app.getAppPath() + '/images/icons/blink1mk2-icon-16px.png' );
        }
        tray.on('click', function() {
            console.log("TRAY MENU CLICK!");
            self.updateTrayMenu();
            tray.popUpContextMenu();
        });
        tray.on('double-click', function() {
            console.log("tray DOUBLE-CLICK!");
            // mainWindow.show();
        });
        tray.setToolTip( pkg.productName + ' is running...');

        // delete tray object to eliminate duplicates on reload
        window.onbeforeunload = function(/*e*/) {
            console.log("killing tray");
            if(tray) { tray.destroy(); tray = null; }
        };

        // this.updateTrayMenu();

    }

};

module.exports = trayMaker;
