"use strict";

var remote = require('electron').remote;
var Menu = remote.Menu;
var Tray = remote.Tray;
var app = remote.app;
var ipcRenderer = require('electron').ipcRenderer;

var path = require('path')

var config = require('common/blink1control2config');
var log = require('./logger');
var Eventer = require('./eventer');

var Blink1Service = require('./server/blink1Service');

var tray = null;

var myname = app.getName();

var MenuMaker = {

    getShortcutReset: function() {
        var globalShortcutPrefix = config.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift';
        var resetKey = config.readSettings('startup:shortcutResetKey') || 'R';
        return globalShortcutPrefix + '+' + resetKey;
    },
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
                // FIXME: would be nice to have little swatch of button color
                click: function(/*item*/) {
                    Eventer.emit('playBigButtonUser', idx);
                }
            };

        });
        return statusButtons;
    },

    updateTrayMenu: function() {
        log.msg("MenuMaker.updateTrayMenu");
        var resetShortcut = MenuMaker.getShortcutReset();

        var contextMenuTemplate = [
            {  label: 'Blink1Control2 is running', enabled: false},
            {  label: 'status: '+ Blink1Service.getStatusString(), enabled: false },
            {  type:  'separator' }
        ];
        var bigButtonMenu = MenuMaker.createBigButtonMenu();
        // Array.prototype.push.apply( contextMenuTemplate, bigButtonMenu );
        contextMenuTemplate = contextMenuTemplate.concat( bigButtonMenu );

        var contextMenuTemplateB = [
            {  type: 'separator' },
            {  label: 'Off / Reset Alerts',
                accelerator: resetShortcut,
                click: function() {
                    Eventer.emit('playBigButtonSys', 'Off');
                }
            },
            // {	label: 'Reset Alerts',
            //     click: function() {
            //         // FIXME: TBD
            //     }
            // },
            {	type: 'separator' },
            {	label: 'Open Controls...',
                click: function() {
                    ipcRenderer.send('openMainWindow');
                }
            },
            {	type: 'separator' }
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
            // tray = new Tray( app.getAppPath() + '/images/icons/blink1mk2-icon2-128px.ico' );
            tray = new Tray(path.join(__static, 'images/icons/blink1mk2-icon2-128px.ico'))
        }
        else {
          // img = require('images/icons/blink1mk2-icon-16px.png')
            tray = new Tray(path.join(__static, 'images/icons/blink1mk2-icon-16px.png'))
        }
        tray.setToolTip( myname + ' is running...');

        // delete tray object to eliminate duplicates on reload
        window.onbeforeunload = function(/*e*/) {
            console.log("killing tray");
            if(tray) { tray.destroy(); tray = null; }
        };

        this.updateTrayMenu();

        Eventer.on('deviceUpdated', this.updateTrayMenu);
        Eventer.on('bigButtonsUpdated', this.updateTrayMenu);

        if( process.platform === 'win32' ) {
            tray.on('click', function() {
                ipcRenderer.send('openMainWindow');
            });
        }
        // tray.on('right-click', function() { self.showTrayMenu(); });
        // tray.on('double-click', function() { });
    },

    setupMainMenu: function() {

        var resetShortcut = MenuMaker.getShortcutReset();

        var bigButtonMenu = MenuMaker.createBigButtonMenu(true);

        var controlMenuTemplate = [
            { label: 'Off / Reset Alerts', accelerator: resetShortcut, click: function() {
                // mainWindow.webContents.send('resetAlerts');
                Eventer.emit('playBigButtonSys', 'Off'); // FIXME: super fixme
            }},
            { type: 'separator' }
        ];

        controlMenuTemplate = controlMenuTemplate.concat( bigButtonMenu );

        // Mac-specific menu  (hide, unhide, etc. enables Command-Q )
        var templateAppMac = [
            {	label: myname,
                submenu: [
                    { label: 'About ' + myname,
                        click: function() {
                            ipcRenderer.send('openAboutWindow');
                        }
                    },
                    { label: 'Check for Updates...',
                      click: function(menuItem) {
                        // console.log("MENUITEM:", menuItem);
                        ipcRenderer.send('checkForUpdates');
                      }
                    },
                    { type: 'separator' },
                    { label: 'Preferences...', accelerator: "CommandOrControl+,",
                        click: function() {
                            ipcRenderer.send('openPreferences');
                        }
                    },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { label: 'Open Controls...', accelerator: 'CommandOrControl+O',
                        click: function() {
                            ipcRenderer.send('openMainWindow');
                        }
                    },
                    { label: 'Rescan for devices',
                        click: function() {
                            console.log("rescan menu click");
                            Blink1Service.reloadConfig();
                        }
                    },
                    { type: 'separator' },
                    { role: 'toggledevtools',label: 'Toggle Dev Tools' },
                    { type: 'separator' },
                    { role: 'close' },
                    { type: 'separator' },
                    { label: "Quit", accelerator: "CommandOrControl+Q",
                        click: function() {
                             ipcRenderer.send('quitnow');
                        }
                    }
                ]
            }
        ];

        var templateApp = [
            {	label: 'File',
                submenu: [
                    { label: 'About ' + myname,
                        click: function() {
                            ipcRenderer.send('openAboutWindow');
                        }
                    },
                    { label: 'Check for updates',
                      click: function() {
                        ipcRenderer.send('checkForUpdates');
                      }
                    },
                    { type: 'separator' },
                    { label: 'Preferences...', accelerator: "CommandOrControl+,",
                        click: function() {
                            ipcRenderer.send('openPreferences');
                        }
                    },
                    { role: 'toggledevtools', label: 'Toggle Dev Tools' },
                    { type: 'separator' },
                    { role: 'close' },
                    { type: 'separator' },
                    { label: "Quit", accelerator: "CommandOrControl+Q",
                        click: function() {
                             ipcRenderer.send('quitnow');
                        }
                    }
                ]
            }
        ];

        var templateEdit = [
            {	label: "Edit",
                submenu: [
                    // { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
                    // { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
                    // { type: 'separator' },
                    { role: "cut" },
                    { role: "copy" },
                    { role: "paste" },
                    { role: "delete" },
                    { role: "selectall" }
                ]
            },
        ];
        var templateControl = [
            { label: "Control",
                submenu: controlMenuTemplate
            }
        ];

        var template = [];
        if( process.platform === 'darwin' ) {
            template = templateAppMac.concat(templateEdit,templateControl);
        }
        else {
            template = templateApp.concat(templateEdit,templateControl);
        }
        // console.log("template = ", template);

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    }

};

module.exports = MenuMaker;
