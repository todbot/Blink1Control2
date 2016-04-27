"use strict";

var electron = require('electron');
var app = electron.app;

var BrowserWindow = require('browser-window');
var Tray = require('tray');
var Menu = require('menu');
var path = require('path');

var AutoLaunch = require('auto-launch');

// var runtime = require('./src/core/runtime');
// var appMenu = require('./src/core/app-menu');
var pkg = require('../package.json');

var config = require('./configuration');

require('crash-reporter').start({
	productName: 'Blink1Control2',
	companyName: 'ThingM',
	submitURL: 'http://thingm.com/blink1/blink1control2-crash-reporter', // FIXME:
	autoSubmit: true
});

// Load external modules
// var mods = require('./core/modules');
// mods.load(runtime);

var mainWindow = null;
var appIcon = null;

// var menu = null;
// var trayIconPath = path.join(__dirname, './dist/images/blink1-icon0-bw16.png');
// var appIcon = null;
//
// var configInit = function() {
// 	// if (!configuration.readSettings('shortcutKeys')) {
// 	 //	 configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
// 	 // }
// 	if (!configuration.readSettings('shortcutKeys')) {
// 		 configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
// 	 }
// };
var isQuitting = false;

var quit = function() {
	console.log("quit. quitting...");
	isQuitting = true;
	app.quit();
};

app.on('window-all-closed', function () {
	console.log("app.window-all-closed");
	if (process.platform !== 'darwin') {
		quit();
	}
});

// var globalShortcut = electron.globalShortcut;

app.on('ready', function () {

	// Register a 'ctrl+x' shortcut listener.
    // var ret = globalShortcut.register('ctrl+x', function() {
    //   console.log('ctrl+x is pressed');
    // });
	//
    // if (!ret) { console.log('registration failed');  }
	//
    // // Check whether a shortcut is registered.
    // console.log(globalShortcut.isRegistered('ctrl+x'));

	if( process.env.NODE_ENV === 'development' ) {
		mainWindow = new BrowserWindow({
			// closable: false,
			maximizable: false,
			width: 1040,
			height: 900
		});
		mainWindow.loadURL('file://' + __dirname + '/index-dev.html');
        mainWindow.webContents.openDevTools();
    }
    else {
	  mainWindow = new BrowserWindow({
		  width: 1040,
		  height: 700,
		  // useContentSize: true,
		  // center: true
		  resizable: false
		  // see https://github.com/atom/electron/blob/master/docs/api/browser-window.md
	  });
	  mainWindow.loadURL('file://' + __dirname + '/index-prod.html');
    }

	// mainWindow.setMenu(null);  // remove default menu
	mainWindow.on('close', function (e) {
		console.log("mainWindow.close");
		if( !isQuitting ) {
			mainWindow.hide();
			return e.preventDefault();
		}
	});

	mainWindow.on('closed', function () {
		console.log("mainWindow.closed");
		quit();
		mainWindow = null;
	});
	mainWindow.on('minimize', function() {
		console.log("mainWindow.minimize");
		mainWindow.hide();
	});
	mainWindow.webContents.on('new-window', function(e, url) {
		console.log("mainWindow.new-window: HEY THERE EVERYONE");
		e.preventDefault();
	  	require('shell').openExternal(url);
	});

	app.on('will-quit', function() {
		console.log("app will-quit");
	});
	app.on('activate', function() {
		mainWindow.show();
	});

	appIcon = new Tray( path.join(__dirname, './images/icons/blink1mk2-icon-16px.png') );

	// stolen from https://github.com/twolfson/google-music-electron/blob/master/lib/google-music-electron.js
	var openAboutWindow = function () {
	    var info = [
			'<div style="text-align: center; font-family: \'Helvetica Neue\', \'Helvetica\', \'Arial\', \'sans-serif\'">',
			'<h2>Blink1Control2</h2>',
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
			height: 180,
			width: 400
			// icon: assets['icon-32'],
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
				mainWindow.webContents.send('reloadConfig', 'apiServer');
			}
		},
		{	type: "separator" },
		{	label: 'Open Settings',
			click: function() { mainWindow.show(); }
		},
		{	label: 'Off / Reset Alerts',  // Note: only works when DevTools is hiddden, else Cmd-r reloads
			accelerator: 'CommandOrControl+R',	// accelerator: 'CmdOrCtrl+R',
			click: function() {
				mainWindow.webContents.send('resetAlerts', 'woot');
			}
		},
		{	label: 'Quit',
			accelerator: 'CommandOrControl+Q',
			// selector: 'terminate:',
			click: function() { quit(); }
		}
	];
	var devMenuTemplate = [
		{	type: "separator" },
		{	label: 'Reload',
			// icon: trayIconPath,
			click: function() {  mainWindow.reload(); }
			//accelerator: 'Command+Z'
		},
		{	label: 'Show/Hide',
			click: function() {	if( mainWindow.isVisible() ) { mainWindow.hide(); } else { mainWindow.show(); } }
		},
		{	label: 'Toggle DevTools',
			accelerator: 'Alt+Command+I',
			click: function() {
				mainWindow.show();
				mainWindow.toggleDevTools();
			}
		}
	];
	if( process.env.NODE_ENV === 'development' ) {
		contextMenuTemplate = contextMenuTemplate.concat( devMenuTemplate );
	}
	var contextMenu = Menu.buildFromTemplate( contextMenuTemplate );

	appIcon.setToolTip('Blink1Control2 is running...');
	appIcon.setContextMenu(contextMenu);

	// Mac-specific menu  (enables Command-Q )
	if (process.platform === 'darwin') {
		app.dock.setMenu( contextMenu );

		var template = [
			{	label: "Blink1Control",
				submenu: [
					// { label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
					{ label: "About Blink1Control", click: function() { openAboutWindow(); } },
					{ type: "separator" },
					{ label: "Quit", accelerator: "CommandOrControl+Q", click: function() { quit(); }}
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

	if( config.readSettings('startup:startMinimized') ) {
		mainWindow.hide();
	} else  {
		mainWindow.focus();
	}
});



/*
	appIcon = new Tray(trayIconPath);
	var contextMenu = Menu.buildFromTemplate([
	{
		label: 'Item1',
		type: 'radio',
		icon: trayIconPath,
		click: function() {
			mainWindow.reload();
		}
		//accelerator: 'Command+Z'
	},
	{
	label: 'Item2',
		submenu: [
		{ label: 'submenu1' },
		{ label: 'submenu2' }]
	},
	{
		label: 'Item3',
		type: 'radio',
		checked: true
	},
	{
		label: 'Toggle DevTools',
		accelerator: 'Alt+Command+I',
		click: function() {
			mainWindow.show();
			mainWindow.toggleDevTools();
		}
	},
	{
		label: 'Quit',
		accelerator: 'Command+Q',
		//selector: 'terminate:',
		click: function() { quit(); }
	}
	]);
	appIcon.setToolTip('This is my application.');
	appIcon.setContextMenu(contextMenu);
	//mainWindow.setMenu( contextMenu );

	// ---
	var template = [{
		label: "Application",
		submenu: [
			{ label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
			{ type: "separator" },
			{ label: "Quit", accelerator: "Command+Q", click: function() { quit(); }}
		]}, {
		label: "Edit",
			submenu: [
			{ label: "ZZUndo", accelerator: "Command+Z", selector: "undo:" },
			{ label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
			{ type: "separator" },
			{ label: "Cut", accelerator: "Command+X", selector: "cut:" },
			{ label: "Copy", accelerator: "Command+C", selector: "copy:" },
			{ label: "Paste", accelerator: "Command+V", selector: "paste:" },
			{ label: "Select All", accelerator: "Command+A", selector: "selectAll:" }
		]}
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	*/

	// runtime.emit(runtime.events.INIT_ROUTES, appMenu);
	// initialize runtime reference to main window
	// runtime.windowId = mainWindow.id;


	// electron-connect to server process
	// client.create(mainWindow);

	/*
	// Dock Menu (Mac)
	if (process.platform === 'darwin') {
		var dockMenu = Menu.buildFromTemplate([
		{ label: 'New Window', click: function() { console.log('New Window'); } },
		{ label: 'New Window with Settings', submenu: [
		{ label: 'Basic' },
		{ label: 'Pro'},
		]},
		{ label: 'New Command...'},
		]);
		app.dock.setMenu(dockMenu);
	}
	// Application Menu
	runtime.emit(runtime.events.INIT_APP_MENU, appMenu);

	var template = appMenu.template;
	menu = Menu.buildFromTemplate(template);

	if (process.platform === 'darwin') {
		Menu.setApplicationMenu(menu);
	} else {
		mainWindow.setMenu(menu);
	}*/
