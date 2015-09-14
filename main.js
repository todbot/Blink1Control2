var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
//var runtime = require('./core/runtime');
//var appMenu = require('./core/app-menu');

var HID = require('node-hid');
var Blink1 = require('node-blink1');
var ipc = require('ipc');


require('crash-reporter').start();

// Load external modules
//var mods = require('./core/modules');
//mods.load(runtime);

var mainWindow = null;
var menu = null;

ipc.on('tod-async-message', function(event, arg) {
  console.log("main process: ",arg);  // prints "ping"
  event.sender.send('tod-async-reply', HID.devices());
});

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

  var devices = HID.devices();
  //console.log("devices: ", devices);
  console.log("blink1 serials:", Blink1.devices() ); // returns array of serial numbers 
  //var blink1 = new Blink1();
  //blink1.fadeToRGB(400 , 255,0,255 ); // r, g, b: 0 - 255
  //blink1.close();


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
