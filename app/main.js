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

var mainWindow = null;

// Someone tried to run a second instance, we should focus our window.
// Really only applicable on Windows, maybe Linux
var shouldQuitMultiInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    if(mainWindow) {
        if(mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
    }
});
if(shouldQuitMultiInstance) {
    app.quit()
}

var pkg = require('./package.json');
var config = require('./configuration');

crashReporter.start({
	productName: pkg.productName,
	companyName: pkg.companyName,
	submitURL: 'http://thingm.com/blink1/blink1control2-crash-reporter', // FIXME:
	autoSubmit: true
});


// global shortcut idea (see below also)
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
	console.log("Blink1Control2:  app.window-all-closed");
	if (process.platform !== 'darwin') {
		quit();
	}
});

var handleUrl = function(e,url) {
    console.log("event:",e);
    // console.log("handleUrl: ",url);
    if(url != mainWindow.webContents.getURL()) {
        e.preventDefault();
        electron.shell.openExternal(url);
    }
}

// stolen from https://github.com/twolfson/google-music-electron/blob/master/lib/google-music-electron.js
var openAboutWindow = function () {
	// DEV: aboutWindow will be garbage collection automatically
	var aboutWindow = new BrowserWindow({
		title: "About Blink1Control2",
		alwaysOnTop: true,
		autoHideMenuBar: true,
		height: 375,
		width: 500
		// icon: assets['icon-32'],
	});
    aboutWindow.webContents.on('new-window',    function(e,url) { handleUrl(e,url); } );
    aboutWindow.webContents.on('will-navigate', function(e,url) { handleUrl(e,url); } );

	// aboutWindow.loadURL('data:text/html,' + info);
	aboutWindow.loadURL( 'file://' + __dirname + '/about.html' );
	return aboutWindow;
};

var openPreferences = function() {
	mainWindow.show();
	mainWindow.webContents.send('openPreferences');
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
    helpWindow.webContents.on('new-window',    function(e,url) { handleUrl(e,url); } );
    helpWindow.webContents.on('will-navigate', function(e,url) { handleUrl(e,url); } );
	helpWindow.on("closed", function() {
		// helpWindow = null;
	});
	helpWindow.loadURL( 'file://' + __dirname + '/help/index.html' );
};

//
// the main deal
//
app.on('ready', function () {
	var startMinimized = config.readSettings('startup:startMinimized');
	if( !startMinimized ) {
		var splash = openAboutWindow();
		setTimeout( function() {
			splash.close();
			mainWindow.show();
		}, 2000 );
	}
    var showDebug = config.readSettings('logger.showDebug') || false;

	// var globalShortcut = electron.globalShortcut;
	// // Register a 'ctrl+x' shortcut listener.
    // var ret = globalShortcut.register('Command+R', function() {
    //   console.log('command+r is pressed');
    // });
    // if (!ret) { console.log('globalShortcut registration failed');  }
    // // Check whether a shortcut is registered.
    // console.log(globalShortcut.isRegistered('Command+R'));

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
                backgroundThrottling: false
                // webgl: false
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
		  resizable: showDebug, // allow resize when in debug mode
          show: false,  // show later based on config value
          webPreferences: {
              zoomFactor: 1.0,
              backgroundThrottling: false
            //   webgl: false
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
	  	electron.shell.openExternal(url);
	});

	app.on('will-quit', function() {
		console.log("Blink1Control2: app will-quit");
	});
	app.on('activate', function() {
		mainWindow.show();
	});


    ipcMain.on('openAboutWindow', function() {
		openAboutWindow();
	});
	ipcMain.on('openHelpWindow', function() {
		openHelpWindow();
	});
    ipcMain.on('quitnow', function() {
        quit();
    });

});
