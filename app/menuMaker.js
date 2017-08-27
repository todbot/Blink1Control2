"use strict";

var remote = require('electron').remote;
var Menu = remote.Menu;
var Tray = remote.Tray;
var app = remote.app;
var ipcRenderer = require('electron').ipcRenderer;

var pkg = require('./package.json');
var config = require('./configuration');
var log = require('./logger');
var Eventer = require('./eventer');

var Blink1Service = require('./server/blink1Service');

var tray = null;


var MenuMaker = {

    /**
     * Return an array of MenuItem templates
     * @method createBigButtonMenu
     * @return {Array}         MenuItem templates
     */
    createBigButtonMenu: function(withAccelerators) {
        var bigButtonsConfig = config.readSettings('bigButtons') || [];
        var statusButtons = bigButtonsConfig.map( function(bb,idx) {
            return {
                label: "Set: " + bb.name,
                accelerator: (withAccelerators) ? "CommandOrControl+" + (idx+1): null,
                // icon: swatchIcon,
                click: function(/*item*/) {
                    Eventer.emit('playBigButtonUser', idx);
                }
            };

        });
        return statusButtons;
    },

    updateTrayMenu: function() {
        log.msg("MenuMaker.updateTrayMenu");

        var contextMenuTemplate = [
            {  label: 'Blink1Control2 is running', enabled: false},
            {  label: 'status: '+ Blink1Service.getStatusString(), enabled: false },
            {  type:  'separator' }
        ];
        var bigButtonMenu = MenuMaker.createBigButtonMenu();
        // Array.prototype.push.apply( contextMenuTemplate, bigButtonMenu );
        contextMenuTemplate = contextMenuTemplate.concat( bigButtonMenu );

        var contextMenuTemplateB = [
            {  type: "separator" },
            {  label: 'Off / Reset Alerts',
                // accelerator: 'CommandOrControl+R',
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
            {	label: 'Open Controls...',
                click: function() {
                    ipcRenderer.send('openMainWindow');
                }
            },
            {	type: "separator" }
        ];
        var contextMenuTemplateC = [
            {	label: 'Quit',
                click: function() {
                    ipcRenderer.send('quitnow');
                }
            }
        ];
        contextMenuTemplate = contextMenuTemplate.concat( contextMenuTemplateB );
        // Array.prototype.push.apply( contextMenuTemplate, contextMenuTemplateB );

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
        if (process.platform === 'darwin') {
            app.dock.setMenu( contextMenu ); // Make Dock have same context menu
        }
        // add on the Quit button for the Tray but not for the Dock menu above
        contextMenu = Menu.buildFromTemplate( contextMenuTemplate.concat( contextMenuTemplateC ));
        tray.setContextMenu( contextMenu );
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
    },

    setupMainMenu: function() {
        // var swatchIconImg = new Jimp(32, 32, 0xFF0000FF, function (err, image) {
        // };
        // var swatchIconBuffer = new Buffer( 32 * 32 * 4 );
        // for( var i = 0; i < swatchIconBuffer.length; i=i+4) {
        // 	swatchIconBuffer.writeUInt32BE( 0xFF0000FF, i );
        // }
        // var swatchIcon = nativeImage.createFromBuffer( swatchIconBuffer );

        var bigButtonMenu = MenuMaker.createBigButtonMenu(true);

        var controlMenuTemplate = [
            { label: 'Off / Reset Alerts', accelerator: "CommandOrControl+R", click: function() {
                mainWindow.webContents.send('resetAlerts');
            }},
            { type: "separator" }
        ];

        controlMenuTemplate = controlMenuTemplate.concat( bigButtonMenu );

        // Mac-specific menu  (hide, unhide, etc. enables Command-Q )
        var templateMac = [
            {	label: pkg.productName,
                submenu: [
                    // { label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
                    { label: "About Blink1Control2",
                        click: function() {
                            ipcRenderer.send('openAboutWindow');
                        }
                    },
                    // FIXME: make appropriate OS-specific version of Windows
                    { type: 'separator' },
                    { label: 'Hide Blink1Control2', accelerator: "CommandOrControl+H", role: 'hide' },
                    { label: 'Hide Others', accelerator: 'CommandOrControl+Shift+H', role: 'hideothers' },
                    { label: 'Show All', role: 'unhide' },
                    { type: "separator" },
                    { label: 'Preferences...', accelerator: "CommandOrControl+,",
                        click: function() {
                            ipcRenderer.send('openPreferences');
                        }
                    },
                    { type: "separator" },
                    { label: 'Open Controls...', accelerator: 'CommandOrControl+O',
                        click: function() {
                            ipcRenderer.send('openMainWindow');
                        }
                    },
                    { type: "separator" },
                    { label: 'Open DevTools', accelerator: 'Alt+CommandOrControl+I',
                        click: function() {
                            ipcRenderer.send('openDevTools');
                        }
                    },
                    { type: "separator" },
                    { label: 'Close Window', accelerator: "CommandOrControl+W", role:'close' },
                    { type: "separator" },
                    { label: "Quit", accelerator: "CommandOrControl+Q",
                        click: function() {
                             ipcRenderer.send('quitnow');
                        }
                    }
                ]
            },
            {	label: "Edit",
                submenu: [
                    // { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
                    // { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
                    // { type: "separator" },
                    { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
                    { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
                    { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
                    { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectall" }
                ]
            },
            { label: "Control",
                submenu: controlMenuTemplate
            }
        ];
        Menu.setApplicationMenu(Menu.buildFromTemplate(templateMac));

    }

};

module.exports = MenuMaker;
