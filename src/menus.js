// menus

"use strict";

var electron = require('electron');
var remote = electron.remote;
var app = remote.app;
var Menu = remote.Menu;
var Tray = remote.Tray;
var BrowserWindow = remote.BrowserWindow;

var path = require('path');
var AutoLaunch = require('auto-launch');

var config = require('./configuration');
var pkg = require('../package.json');

var appIcon = null;

var mainWindow = BrowserWindow.getAllWindows()[0];

// stolen from https://github.com/twolfson/google-music-electron/blob/master/lib/google-music-electron.js
var openAboutWindow = function () {
    var info = [
        '<div style="text-align: center; font-family: \'Helvetica Neue\', \'Helvetica\', \'Arial\', \'sans-serif\'">',
        '<h2>Blink1Control2</h2>',
        '<p> for blink(1) USB RGB LED notification devices. <p>',
        '<p><a target="_blank" href="http://blink1.thingm.com/">blink1.thingm.com</a></p>',
        '<p>',
          'Version: ' + pkg.version + '<br/>',
          'Electron version: ' + process.versions.electron + '<br/>',
          'Node.js version: ' + process.versions.node + '<br/>',
          'Chromium version: ' + process.versions.chrome,
        '</p>',
        '</div>'
        ].join('');
    // DEV: aboutWindow will be garbage collection automatically
    var aboutWindow = new BrowserWindow({
        height: 280,
        width: 400
        // icon: assets['icon-32'],
    });
    aboutWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        require('shell').openExternal(url);
    });

    aboutWindow.loadURL('data:text/html,' + info);
};


var contextMenuTemplate = [
    {	label: 'About Blink1Control2',
        click: function() { openAboutWindow(); }
    },
    {	type: "separator" },
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
            var blink1ControlAutoLauncher = new AutoLaunch({ name: 'Blink1Control2'});
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
            //mainWindow.webContents.send('reloadConfig', 'apiServer');
        }
    },
    {	type: "separator" },
    {	label: 'Open Settings...',
        click: function() { mainWindow.show(); }
    },
    {	label: 'Off / Reset Alerts',  // Note: only works when DevTools is hiddden, else Cmd-r reloads
        accelerator: 'CommandOrControl+R',	// accelerator: 'CmdOrCtrl+R',
        click: function() {
        //    mainWindow.webContents.send('resetAlerts', 'woot');
        }
    },
    {	label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        selector: 'terminate:',
        //click: function() { quit(); }
    }
];

var devMenuTemplate = [
    {	type: "separator" },
    {	label: 'Reload',
        // icon: trayIconPath,
        //click: function() {  mainWindow.reload(); }
        //accelerator: 'Command+Z'
    },
    {	label: 'Show/Hide',
        //click: function() {	if( mainWindow.isVisible() ) { mainWindow.hide(); } else { mainWindow.show(); } }
    },
    {	label: 'Toggle DevTools',
        accelerator: 'Alt+Command+I',
        click: function() {
        //    mainWindow.show();
        //    mainWindow.toggleDevTools();
        }
    }
];

//

var Menus = {

    setupMenus: function() {
        var appPath = app.getAppPath();
        console.log("__dirname: ",__dirname, appPath);
        appIcon = new Tray( path.join(appPath, './src/images/icons/blink1mk2-icon-16px.png') );
        if( process.env.NODE_ENV === 'development' ) {
            contextMenuTemplate = contextMenuTemplate.concat( devMenuTemplate );
        }
        var contextMenu = Menu.buildFromTemplate( contextMenuTemplate );

        appIcon.setToolTip('Blink1Control2 is running...');
        appIcon.setContextMenu(contextMenu);

        // ---------------
        if (process.platform === 'darwin') {
            // enable Dock icon to have same context menu
            app.dock.setMenu( contextMenu );

            // Mac-specific menu  (enables Command-Q )
            var template = [
                {	label: "Blink1Control",
                    submenu: [
                        // { label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
                        { label: "About Blink1Control", click: function() { openAboutWindow(); } },
                        { type: "separator" },
                        // { label: "Quit", accelerator: "CommandOrControl+Q", click: function() { quit(); }}
                    ]
                },
                {	label: "Edit",
                    submenu: [
                        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                        { type: "separator" },
                        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
                    ]
                },
                { label: "View",
                    submenu: contextMenuTemplate
                }
            ];
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        }

    } // setupMenus

};

module.exports = Menus;
