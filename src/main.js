"use strict";

var app = require('app');
var BrowserWindow = require('browser-window');
// var Tray = require('tray');
// var Menu = require('menu');
// var path = require('path');
// var runtime = require('./src/core/runtime');
// var appMenu = require('./src/core/app-menu');

// var config = require('./configuration');
var apiServer = require('./server/apiServer');
var Blink1Service = require('./server/blink1Service');
var PatternsService = require('./server/patternsService');
var IftttService = require('./server/iftttService');
var MailService = require('./server/mailService');

//var flux = require('./server/fluxtest');

// electron-connect is for development
//var client = require('electron-connect').client;
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
// var menu = null;

//var trayIconPath = path.join(__dirname, './dist/images/blink1-icon0-bw16.png');
//var appIcon = null;

apiServer.start(); 

// var configInit = function() {
// 	// if (!configuration.readSettings('shortcutKeys')) {
//	 //	 configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
//	 // }
// 	if (!configuration.readSettings('shortcutKeys')) {
//		 configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
//	 }
// };

var quit = function() {
	console.log("quitting...");
	// FIXME: put in blink1 & usb-detection closedown
	Blink1Service.closeAll(); // FIXME: this causes coredump
	app.quit();

};

app.on('window-all-closed', function () {
	console.log("window-all-closed");
	if (process.platform !== 'darwin') {
		quit();
	}
});

app.on('ready', function () {

	Blink1Service.start();
	PatternsService.initialize();
	IftttService.start();
	MailService.start();


	if( process.env.NODE_ENV === 'development' ) {
		mainWindow = new BrowserWindow({
			width: 1050,
			height: 900
		});
		mainWindow.loadURL('file://' + __dirname + '/index-dev.html');
        mainWindow.webContents.openDevTools();
    }
    else {
	  mainWindow = new BrowserWindow({
		  width: 1050,
		  height: 700,
		  // useContentSize: true,
		  // center: true
		  resizable: false
		  // see https://github.com/atom/electron/blob/master/docs/api/browser-window.md
	  });
	  mainWindow.loadURL('file://' + __dirname + '/index-prod.html');
    }

	// mainWindow.setMenu(null);  // remove default menu
	mainWindow.on('close', function () {
		console.log("mainWindow will close");
		apiServer.stop();
	});

	mainWindow.on('closed', function () {
		console.log("mainWindow is now closed");
		quit();
		mainWindow = null;
	});

	mainWindow.focus();
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
