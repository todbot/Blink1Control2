"use strict";

var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
//var runtime = require('./core/runtime');
//var appMenu = require('./core/app-menu');
var client = require('electron-connect').client;

require('crash-reporter').start();

// Load external modules
//var mods = require('./core/modules');
//mods.load(runtime);

//var rpcserver = new rpcServer();

var mainWindow = null;
var menu = null;

/*
var enableApiServer = false;
var apiPort = 8935;

var http = require('http');

function handleHttpRequest(request, response){
	response.end('It Works!! Path Hit: ' + request.url);
}
if( enableApiServer ) {
	var server = http.createServer(handleHttpRequest);
	server.listen(apiPort, function() {
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", apiPort);
	});
}
*/

app.on('window-all-closed', function () {
	//if (process.platform !== 'darwin') {
		app.quit();
	//}
});

app.on('ready', function () {

	//runtime.emit(runtime.events.INIT_ROUTES, appMenu);

	mainWindow = new BrowserWindow({
		width: 1300,
		height: 800
		// use-content-size: true
		// center: true
		// resizable: false
		// see https://github.com/atom/electron/blob/master/docs/api/browser-window.md
	});
	

	// initialize runtime reference to main window
	//runtime.windowId = mainWindow.id;

	//mainWindow.loadUrl('file://' + __dirname + '/dist/index.html#/todtests');
	mainWindow.loadUrl('file://' + __dirname + '/dist/index.html');
	mainWindow.focus();

	mainWindow.openDevTools();  

	mainWindow.on('closed', function () {
		mainWindow = null;
	});

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
});
