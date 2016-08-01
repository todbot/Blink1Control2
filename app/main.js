"use strict";

var electron = require('electron');
var app = electron.app;
var ipcMain = electron.ipcMain;

var BrowserWindow = electron.BrowserWindow;
var Tray = electron.Tray;
var Menu = electron.Menu;
var crashReporter = electron.crashReporter;

var path = require('path');

// var nativeImage = electron.nativeImage;

var AutoLaunch = require('auto-launch');

// var runtime = require('./src/core/runtime');
// var appMenu = require('./src/core/app-menu');
var pkg = require('./package.json');

var config = require('./configuration');

crashReporter.start({
	productName: pkg.productName,
	companyName: pkg.companyName,
	submitURL: 'http://thingm.com/blink1/blink1control2-crash-reporter', // FIXME:
	autoSubmit: true
});


var mainWindow = null;
var tray = null;

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
	console.log("quit. quitting...",isQuitting);
	if( !isQuitting ) {
		mainWindow.webContents.send('quitting', 'blink1control2');
	}
	isQuitting = true;
	app.quit();
};



app.on('window-all-closed', function () {
	console.log("app.window-all-closed");
	if (process.platform !== 'darwin') {
		quit();
	}
});

// stolen from https://github.com/twolfson/google-music-electron/blob/master/lib/google-music-electron.js
var openAboutWindow = function () {
	// DEV: aboutWindow will be garbage collection automatically
	var aboutWindow = new BrowserWindow({
		title: "About Blink1Control2",
		alwaysOnTop: true,
		autoHideMenuBar: true,
		height: 350,
		width: 500
		// icon: assets['icon-32'],
	});
	aboutWindow.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		require('shell').openExternal(url);
	});

	// aboutWindow.loadURL('data:text/html,' + info);
	aboutWindow.loadURL( 'file://' + __dirname + '/about.html' );
	return aboutWindow;
};

var openPreferences = function() {
	mainWindow.show();
	mainWindow.webContents.send('showPreferences');
};

// called via ipcMain below
var openHelpWindow = function() {
	var helpWindow = new BrowserWindow({
			title: "Blink1Control2 Help",
			// alwaysOnTop: true,
			autoHideMenuBar: true,
			center: true,
			height: 700,
			width: 800
			// icon: assets['icon-32'],
		});
	helpWindow.on("closed", function() {
		// helpWindow = null;
	});
	helpWindow.loadURL( 'file://' + __dirname + '/help/index.html' );
};

var makeMenus = function() {

	// var swatchIconImg = new Jimp(32, 32, 0xFF0000FF, function (err, image) {
	// };
	// var swatchIconBuffer = new Buffer( 32 * 32 * 4 );
	// for( var i = 0; i < swatchIconBuffer.length; i=i+4) {
	// 	swatchIconBuffer.writeUInt32BE( 0xFF0000FF, i );
	// }
	// var swatchIcon = nativeImage.createFromBuffer( swatchIconBuffer );

	var bigButtonsConfig = config.readSettings('bigButtons') || [];
	var statusButtons = bigButtonsConfig.map( function(bb,idx) {
		return {
			label: bb.name,
			// icon: swatchIcon,
			click: function(/*item*/) {
				// console.log("click item",item);
				mainWindow.webContents.send('pressBigButton', idx);
			}
		};
	});

	var contextMenuTemplate = [
		{	label: 'About ' + pkg.productName,
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
				var blink1ControlAutoLauncher = new AutoLaunch({ name: pkg.productName});
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
		{ 	label: 'Set Status...',
			submenu: statusButtons
		},
		{	type: "separator" },
		{	label: 'Open Settings...',
			click: function() { mainWindow.show(); }
		},
		{	label: 'Off / Reset Alerts',  // Note: only works when DevTools is hiddden, else Cmd-r reloads
			accelerator: 'CommandOrControl+R',	// accelerator: 'CmdOrCtrl+R',
			click: function() {
				mainWindow.webContents.send('resetAlerts', 'woot');
			}
		},
		{	label: 'Quit',
			// accelerator: 'CommandOrControl+Q',
			// selector: 'terminate:',
			click: function() { quit(); }
		}
	];
	var devMenuTemplate = [
		{	type: "separator" },
		{	label: 'Reload',
			click: function() {  mainWindow.reload(); }
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

	// if( process.env.NODE_ENV === 'development' ) {
	contextMenuTemplate = contextMenuTemplate.concat( devMenuTemplate );
	// }
	var contextMenu = Menu.buildFromTemplate( contextMenuTemplate );

	if( process.platform === 'win32' ) {  // FIXME: make this icon better for Windows
		tray = new Tray( path.join(__dirname, './images/icons/blink1mk2-icon2-128px.ico') );
	}
	else {
		tray = new Tray( path.join(__dirname, './images/icons/blink1mk2-icon-16px.png') );
	}
	tray.on('click', function() {
		console.log("tray CLICK!");
		tray.popUpContextMenu();
	});
	tray.on('double-click', function() {
		console.log("tray DOUBLE-CLICK!");
		mainWindow.show();
	});
	tray.setToolTip( pkg.productName + ' is running...');
	tray.setContextMenu(contextMenu);

	if (process.platform === 'darwin') {
		app.dock.setMenu( contextMenu ); // Make Dock have same context menu
	}
		// Mac-specific menu  (hide, unhide, etc. enables Command-Q )
		var template = [
			{	label: pkg.productName,
				submenu: [
					// { label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
					{ label: "About "+ pkg.productName, click: function() { openAboutWindow(); } },
					{ type: 'separator' },
					{ label: 'Hide '+pkg.productName, accelerator: "CommandOrControl+H", role: 'hide' },
					{ label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
					{ label: 'Show All', role: 'unhide' },
					{ type: "separator" },
					{ label: 'Preferences', accelerator: "CommandOrControl+.", click: function() { openPreferences(); } },
					{ label: 'Close Window', accelerator: "CommandOrControl+W", role:'close' },
					{ type: "separator" },
					{ label: "Quit", accelerator: "CommandOrControl+Q", click: function() { quit(); }}
				]
			},
			{	label: "Edit",
				submenu: [
					{ label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
					{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
					{ type: "separator" },
					{ label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
					{ label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
					{ label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
					{ label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectall" }
				]
			},
			{ label: "View",
				submenu: contextMenuTemplate
			}
		];
		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};


app.on('ready', function () {
	var startMinimized = config.readSettings('startup:startMinimized');
	if( !startMinimized ) {
		var splash = openAboutWindow();
		setTimeout( function() {
			splash.close();
			mainWindow.show();
		}, 2000 );
	}

	// var globalShortcut = electron.globalShortcut;

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
			title: "Blink1Control2",
			// closable: false,
// backgroundThrottling Boolean - Whether to throttle animations and timers when the page becomes background. Defaults to true.
			maximizable: false,
			width: 1040,
			height: 900
		});
		mainWindow.loadURL('file://' + __dirname + '/index-dev.html');
        mainWindow.webContents.openDevTools();
    }
    else {
	  mainWindow = new BrowserWindow({
		  title: "Blink1Control2",
		  width: 1040,
		  height: 700 + ((process.platform !== 'darwin') ? 20 : 0),
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

	mainWindow.hide();

	makeMenus();


	//
	// FIXME: surely there's a better place to put this
	//
	ipcMain.on('openHelpWindow', function() {
		openHelpWindow();
	});

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
