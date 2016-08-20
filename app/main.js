"use strict";

// FIXME: how to make JSHint not say "illegal return statement"
if( require('electron-squirrel-startup') ) { return; }

var electron = require('electron');
var app = electron.app;
var ipcMain = electron.ipcMain;

var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var crashReporter = electron.crashReporter;

var path = require('path');


// var nativeImage = electron.nativeImage;
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

// Someone tried to run a second instance, we should focus our window.
// Really only applicable on Windows, maybe Linux
var shouldQuitMultiInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    if(mainWindow) {
        if (mainWindow.isMinimized()) { mainWindow.restore(); }
        mainWindow.focus()
    }
});
if(shouldQuitMultiInstance) {
    app.quit()
}

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
	console.log("Blink1Control2: quit. quitting...",isQuitting);
	if( !isQuitting ) {
		mainWindow.webContents.send('quitting', 'blink1control2');
	}
	isQuitting = true;
	app.quit();
};

app.on('window-all-closed', function () {
	console.log("Blink1Control2: app.window-all-closed");
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
					{ label: 'Preferences...', accelerator: "CommandOrControl+,", click: function() { openPreferences(); } },
                    { type: "separator" },
                    { label: 'Open DevTools', accelerator: 'Alt+Command+I', click: function() {
            				mainWindow.show(); mainWindow.webContents.openDevTools({mode:'bottom'}); }
            		},
                    { type: "separator" },
					{ label: 'Close Window', accelerator: "CommandOrControl+W", role:'close' },
					{ type: "separator" },
					{ label: "Quit", accelerator: "CommandOrControl+Q", click: function() { quit(); }}
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
			}
            // ,
			// { label: "View",
			// 	submenu: contextMenuTemplate
			// }
		];
		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}; // makeMenus


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
			maximizable: false,
			width: 1040,
			height: 900,
            resizable: true,
            show: true,
            webPreferences: {
                zoomFactor: 1.0,
                backgroundThrottling: false,
                webgl: false
            }
		});
		mainWindow.loadURL('file://' + __dirname + '/index-dev.html');
        mainWindow.webContents.openDevTools({mode:'bottom'});
    }
    else {
	  mainWindow = new BrowserWindow({
		  title: "Blink1Control2",
		  width: 1040,
		  height: 700 + ((process.platform !== 'darwin') ? 20 : 0),
		  resizable: false,
          show: false,  // show later based on config value
          webPreferences: {
              zoomFactor: 1.0,
              backgroundThrottling: false,
              webgl: false
          }
          // closable: false,
          // useContentSize: true,
		  // center: true
	  });
	  mainWindow.loadURL('file://' + __dirname + '/index-prod.html');
    }

	// mainWindow.setMenu(null);  // remove default menu
	mainWindow.on('close', function (e) {
		console.log("Blink1Control2: mainWindow.close");
		if( !isQuitting ) {
			mainWindow.hide();
			return e.preventDefault();
		}
	});

	mainWindow.on('closed', function () {
		console.log("Blink1Control2: mainWindow.closed");
		quit();
		mainWindow = null;
	});
	mainWindow.on('minimize', function() {
		console.log("Blink1Control2: mainWindow.minimize");
		mainWindow.hide();
	});
	mainWindow.webContents.on('new-window', function(e, url) {
		console.log("Blink1Control2: mainWindow.new-window");
		e.preventDefault();
	  	require('shell').openExternal(url);
	});

	app.on('will-quit', function() {
		console.log("Blink1Control2: app will-quit");
	});
	app.on('activate', function() {
		mainWindow.show();
	});

	makeMenus();

	//
	// FIXME: surely there's a better place to put this
	//
	ipcMain.on('openHelpWindow', function() {
		openHelpWindow();
	});
    ipcMain.on('quitnow', function() {
        quit();
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
