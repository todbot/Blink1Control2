"use strict";

var ipcRenderer = require('electron').ipcRenderer;

var config = require('./configuration');
var log = require('./logger');
var Eventer = require('./eventer');
var Blink1Service = require('./server/blink1Service');

var appData = ipcRenderer.sendSync('getAppData');
var myname = appData.appName;

var MenuMaker = {

    getShortcutReset: function() {
        var globalShortcutPrefix = config.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift';
        var resetKey = config.readSettings('startup:shortcutResetKey') || 'R';
        return globalShortcutPrefix + '+' + resetKey;
    },

    /**
     * Return a serializable array of menu item templates for big buttons.
     * Clicks are dispatched back to renderer via existing 'playBigButtonUser' channel.
     */
    createBigButtonMenu: function(withAccelerators) {
        var bigButtonsConfig = config.readSettings('bigButtons') || [];
        return bigButtonsConfig.map(function(bb, idx) {
            return {
                label: "Set: " + bb.name,
                accelerator: withAccelerators ? "CommandOrControl+" + (idx + 1) : null,
                clickSpec: { target: 'renderer', channel: 'playBigButtonUser', args: [idx] }
            };
        });
    },

    updateTrayMenu: function() {
        log.msg("MenuMaker.updateTrayMenu");
        var resetShortcut = MenuMaker.getShortcutReset();

        var trayTemplate = [
            { label: 'Blink1Control2 is running', enabled: false },
            { label: 'status: ' + Blink1Service.getStatusString(), enabled: false },
            { type: 'separator' }
        ].concat(MenuMaker.createBigButtonMenu()).concat([
            { type: 'separator' },
            { label: 'Off / Reset Alerts', accelerator: resetShortcut,
              clickSpec: { target: 'renderer', channel: 'resetAlerts' } },
            { type: 'separator' },
            { label: 'Open Controls...',
              clickSpec: { target: 'main', action: 'openMainWindow' } },
            { type: 'separator' }
        ]);

        // Dock menu (macOS): same as tray but without Quit
        var dockTemplate = trayTemplate.concat();

        // Tray gets the Quit item too
        trayTemplate = trayTemplate.concat([
            { label: 'Quit',
              clickSpec: { target: 'main', action: 'quitnow' } }
        ]);

        ipcRenderer.send('updateTrayMenu', { trayTemplate: trayTemplate, dockTemplate: dockTemplate });
    },

    setupTrayMenu: function() {
        var iconPath;
        if (process.platform === 'win32') {
            iconPath = appData.appPath + '/images/icons/blink1mk2-icon2-128px.ico';
        } else {
            iconPath = appData.appPath + '/images/icons/blink1mk2-icon-16px.png';
        }
        ipcRenderer.send('setupTray', { iconPath: iconPath, tooltip: myname + ' is running...' });

        // delete tray object to eliminate duplicates on reload
        window.onbeforeunload = function() {
            console.log("killing tray");
            ipcRenderer.send('destroyTray');
        };

        this.updateTrayMenu();

        Eventer.on('deviceUpdated', this.updateTrayMenu);
        Eventer.on('bigButtonsUpdated', this.updateTrayMenu);

        if (process.platform === 'win32') {
            ipcRenderer.on('trayClick', function() {
                ipcRenderer.send('openMainWindow');
            });
        }
    },

    setupMainMenu: function() {
        var resetShortcut = MenuMaker.getShortcutReset();
        var bigButtonMenu = MenuMaker.createBigButtonMenu(true);

        var controlMenuTemplate = [
            { label: 'Off / Reset Alerts', accelerator: resetShortcut,
              clickSpec: { target: 'renderer', channel: 'resetAlerts' } },
            { type: 'separator' }
        ].concat(bigButtonMenu);

        // Mac-specific menu (hide, unhide, etc. enables Command-Q)
        var templateAppMac = [
            { label: myname,
              submenu: [
                { label: 'About ' + myname,
                  clickSpec: { target: 'main', action: 'openAboutWindow' } },
                { label: 'Check for Updates...',
                  clickSpec: { target: 'main', action: 'checkForUpdates' } },
                { type: 'separator' },
                { label: 'Preferences...', accelerator: 'CommandOrControl+,',
                  clickSpec: { target: 'main', action: 'openPreferences' } },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { label: 'Open Controls...', accelerator: 'CommandOrControl+O',
                  clickSpec: { target: 'main', action: 'openMainWindow' } },
                { label: 'Rescan for devices',
                  clickSpec: { target: 'renderer', channel: 'reloadConfig:blink1Service' } },
                { type: 'separator' },
                { role: 'toggledevtools', label: 'Toggle Dev Tools' },
                { type: 'separator' },
                { role: 'close' },
                { type: 'separator' },
                { label: 'Quit', accelerator: 'CommandOrControl+Q',
                  clickSpec: { target: 'main', action: 'quitnow' } }
              ]
            }
        ];

        var templateApp = [
            { label: 'File',
              submenu: [
                { label: 'About ' + myname,
                  clickSpec: { target: 'main', action: 'openAboutWindow' } },
                { label: 'Check for updates',
                  clickSpec: { target: 'main', action: 'checkForUpdates' } },
                { type: 'separator' },
                { label: 'Preferences...', accelerator: 'CommandOrControl+,',
                  clickSpec: { target: 'main', action: 'openPreferences' } },
                { role: 'toggledevtools', label: 'Toggle Dev Tools' },
                { type: 'separator' },
                { role: 'close' },
                { type: 'separator' },
                { label: 'Quit', accelerator: 'CommandOrControl+Q',
                  clickSpec: { target: 'main', action: 'quitnow' } }
              ]
            }
        ];

        var templateEdit = [
            { label: 'Edit',
              submenu: [
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectall' }
              ]
            }
        ];

        var templateControl = [
            { label: 'Control', submenu: controlMenuTemplate }
        ];

        var template;
        if (process.platform === 'darwin') {
            template = templateAppMac.concat(templateEdit, templateControl);
        } else {
            template = templateApp.concat(templateEdit, templateControl);
        }

        ipcRenderer.send('setApplicationMenu', template);
    }

};

module.exports = MenuMaker;
