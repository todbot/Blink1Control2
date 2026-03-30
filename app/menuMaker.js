"use strict";

var log = require('./logger');

var MenuMaker = {

    getShortcutReset: function() {
        var globalShortcutPrefix = window.electronAPI.config.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift';
        var resetKey = window.electronAPI.config.readSettings('startup:shortcutResetKey') || 'R';
        return globalShortcutPrefix + '+' + resetKey;
    },

    /**
     * Return a serializable array of menu item templates for big buttons.
     * Clicks are dispatched back to renderer via existing 'playBigButtonUser' channel.
     */
    createBigButtonMenu: function(withAccelerators) {
        var bigButtonsConfig = window.electronAPI.config.readSettings('bigButtons') || [];
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
        var myname = window.electronAPI.app.name;

        var trayTemplate = [
            { label: myname + ' is running', enabled: false },
            { label: 'status: ' + window.electronAPI.blink1.getStatusString(), enabled: false },
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

        window.electronAPI.menu.updateTrayMenu({ trayTemplate: trayTemplate, dockTemplate: dockTemplate });
    },

    setupTrayMenu: function() {
        var iconPath;
        if (window.electronAPI.app.platform === 'win32') {
            iconPath = window.electronAPI.app.appPath + '/images/icons/blink1mk2-icon2-128px.ico';
        } else {
            iconPath = window.electronAPI.app.appPath + '/images/icons/blink1mk2-icon-16px.png';
        }
        window.electronAPI.menu.setupTray({
            iconPath: iconPath,
            tooltip: window.electronAPI.app.name + ' is running...'
        });

        // delete tray object to eliminate duplicates on reload
        window.onbeforeunload = function() {
            console.log("killing tray");
            window.electronAPI.menu.destroyTray();
        };

        this.updateTrayMenu();

        window.electronAPI.bus.on('deviceUpdated', MenuMaker.updateTrayMenu);
        window.electronAPI.bus.on('bigButtonsUpdated', MenuMaker.updateTrayMenu);

        if (window.electronAPI.app.platform === 'win32') {
            window.electronAPI.menu.onTrayClick(function() {
                window.electronAPI.app.send('openMainWindow');
            });
        }
    },

    setupMainMenu: function() {
        var myname = window.electronAPI.app.name;
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
                  clickSpec: { target: 'main', action: 'reloadBlink1Config' } },
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
        if (window.electronAPI.app.platform === 'darwin') {
            template = templateAppMac.concat(templateEdit, templateControl);
        } else {
            template = templateApp.concat(templateEdit, templateControl);
        }

        window.electronAPI.menu.setApplicationMenu(template);
    },
};

module.exports = MenuMaker;
