"use strict";

var electron = require('electron');
var app = electron.app;
var ipcMain = electron.ipcMain;
var dialog = electron.dialog;

var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var crashReporter = electron.crashReporter;

var path = require('path');
var isAccelerator = require("electron-is-accelerator");

var updater = require('./updater');

require('@electron/remote/main').initialize()

var isDevelopment = process.env.NODE_ENV === 'development';

var mainWindow = null;

if(isDevelopment) { console.log("Development Mode"); }

const instanceLock = app.requestSingleInstanceLock()

if (!instanceLock) {
  app.quit();
  return;
}
else {
  app.on('second-instance', function (event, argv, cwd) {
    if(mainWindow) {
        if(mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
    }
  })
}

//
// now that we're ready to go, let's get started for real...
//
var pkg = require('./package.json');
var config = require('./configuration');

//console.log("config: ", config);

crashReporter.start({
  productName: pkg.productName,
  companyName: pkg.companyName,
  submitURL: 'http://thingm.com/blink1/blink1control2-crash-reporter', // FIXME:
  autoSubmit: true
});

// turn off 'app-suspension' because it was causing bad timing in renderer
// FIXME: check if this is still the case in Electron
// update: 18 Sep 2017, this seems to not be an issue, so make it a configurable
var preventAppSuspension = config.readSettings('startup:preventAppSuspension');
if( preventAppSuspension ) {
    var powerSaveBlocker= require('electron').powerSaveBlocker;
    var id = powerSaveBlocker.start('prevent-app-suspension');
    console.log("powerSaveBlocker id:",id);
}

// Linux 3d acceleration sometimes causes black screen for Electron-based apps, so turn it off
var disablegpu = config.readSettings('startup:disableHardwareAcceleration');
if( disablegpu || (disablegpu === undefined && process.platform === 'linux') ) {
    console.log("disabling hardware acceleration");
    app.disableHardwareAcceleration();
}
//// ignore-gpu-blacklist o maybe fix bad performance issue in Mac Sierra beta
//app.commandLine.appendSwitch('ignore-gpu-blacklist');
// app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Fix Windows Electron throttling down the timers
app.commandLine.appendSwitch('disable-background-timer-throttling');


var isQuitting = false;

var quit = function() {
  //console.log("Blink1Control2: quit. sent quit to renderer?",isQuitting);
  if( !isQuitting ) {
    mainWindow.webContents.send('quitting', 'blink1control2');
  }
  isQuitting = true;
  app.quit();
};

app.on('window-all-closed', function () {
  //console.log("Blink1Control2:  app.window-all-closed");
  if (process.platform !== 'darwin') {
    quit();
  }
});

var handleUrl = function(e,url) {
    if( url.startsWith("chrome://") ) { return; }
    else if(url != mainWindow.webContents.getURL()) {
        e.preventDefault();
        electron.shell.openExternal(url);
    }
}

// stolen from https://github.com/twolfson/google-music-electron/blob/master/lib/google-music-electron.js
var openAboutWindow = function () {
  // DEV: aboutWindow will be garbage collection automatically
  var aboutWindow = new BrowserWindow({
    icon: path.join(__dirname, 'images/icons/blink1mk2-icon2-128px.png'),
    title: "About Blink1Control2",
    alwaysOnTop: true,
    autoHideMenuBar: true,
    height: 375,
    width: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  require("@electron/remote/main").enable(aboutWindow.webContents);
  //aboutWindow.webContents.openDevTools({mode:'detach'});
  aboutWindow.webContents.on('new-window',    function(e,url) { handleUrl(e,url); } );
  aboutWindow.webContents.on('will-navigate', function(e,url) { handleUrl(e,url); } );
  aboutWindow.loadURL( 'file://' + __dirname + '/about.html') //+autoUpdateMsg );
  return aboutWindow;
};

var openMainWindow = function() {
  mainWindow.show();
};
var openDevTools = function() {
  mainWindow.show();
  mainWindow.webContents.openDevTools({mode:'detach'});
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
    width: 800,
    webPreferences: { nodeIntegration: true }
  });
  helpWindow.webContents.on('new-window',    function(e,url) { handleUrl(e,url); } );
  helpWindow.webContents.on('will-navigate', function(e,url) { handleUrl(e,url); } );
  helpWindow.on("closed", function() {
    // helpWindow = null;
  });

  helpWindow.loadURL( 'file://' + __dirname + '/help/index.html' );
};

// autoUpdater.on('checking-for-update', () => {
//   console.log('Checking for update...');
// });
// autoUpdater.on('update-available', (info) => {
//   console.log('Update available.');
// });
// autoUpdater.on('update-not-available', (info) => {
//   console.log('Update not available.');
// });
// autoUpdater.on('error', (err) => {
//   console.log('Error in auto-updater.');
// });


// ------------------------------------------------------------------------
//
// the main deal
//
app.on('ready', function () {

    // autoUpdater.autoDownload = false;
    // autoUpdater.checkForUpdates();

  // if (!isDevelopment) {
  //   launchAtStartup();
  // }

  var hideDockIcon = config.readSettings('startup:hideDockIcon');
  if( hideDockIcon && process.platform === 'darwin' ) {
    app.dock.hide();
  }

  var startMinimized = config.readSettings('startup:startMinimized');
  if( !startMinimized ) {
    var splash = openAboutWindow();
    setTimeout( function() {
      splash.close();
      mainWindow.show();
    }, 3000 );
  }
  var showDebug = config.readSettings('logger.showDebug') || false;

  // Install global shortcut key (see also MenuMaker)
  var globalShortcut = electron.globalShortcut;
  // var ret = globalShortcut.register('CommandOrControl+3', function() {
  //     mainWindow.webContents.send('playBigButtonUser', 3);
  // });
  var globalShortcutPrefix = config.readSettings('startup:shortcutPrefix') || 'CommandOrControl+Shift';
  var resetKey = config.readSettings('startup:shortcutResetKey') || 'R';
  var resetShortcut = globalShortcutPrefix + '+' + resetKey;
  //console.log("global shortcut:", resetShortcut);

  if( isAccelerator( resetShortcut)) {
    var ret = globalShortcut.register(resetShortcut, function() {
      //console.log('resetShortcut is pressed');
        mainWindow.webContents.send('resetAlerts');
    });
    if (!ret) { console.log('globalShortcut registration failed');  }
    // Check whether a shortcut is registered.
    //console.log("globalShortcut key registered:", globalShortcut.isRegistered(resetShortcut));
  }
  else {
    //console.log("ignoring bad globalShortcutkey: ",resetShortcut);
  }

  var loadurl = 'file://' + __dirname + '/index-prod.html';
  if( isDevelopment ) {
    loadurl = 'file://' + __dirname + '/index-dev.html';
  }
  console.log("loadurl:"+loadurl);

  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'images/icons/blink1mk2-icon2-128px.png'),
    title: "Blink1Control2",
    maximizable: false,
    width: 1040,
    height: 700 + ((process.platform !== 'darwin') ? 20 : 0),
    resizable: isDevelopment && showDebug,
    show: false, // show later based on config
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });
  require("@electron/remote/main").enable(mainWindow.webContents);

  mainWindow.loadURL(loadurl);
  if(isDevelopment) {
    mainWindow.webContents.openDevTools({mode:'detach'});
  }

  // mainWindow.setMenu(null);  // remove default menu
  mainWindow.on('close', function (e) {
    //console.log("Blink1Control2: mainWindow.close:");
    if( !isQuitting ) {
      mainWindow.hide();
      return e.preventDefault();
    }
  });

  mainWindow.on('closed', function () {
    //console.log("Blink1Control2: mainWindow.closed");
    quit();
    mainWindow = null;
  });

  mainWindow.on('minimize', function() {
    //console.log("Blink1Control2: mainWindow.minimize");
    mainWindow.hide();
  });

  mainWindow.webContents.on('new-window', function(e, url) {
    //console.log("Blink1Control2: mainWindow.new-window");
    e.preventDefault();
      electron.shell.openExternal(url);
  });

  app.on('will-quit', function() {
    //console.log("Blink1Control2: app will-quit");
  });
  app.on('activate', function() {
    mainWindow.show();
  });

  // https://discuss.atom.io/t/how-to-catch-the-event-of-clicking-the-app-windows-close-button-in-electron-app/21425/8
  /* 'before-quit' is emitted when Electron receives
   * the signal to exit and wants to start closing windows */
  app.on('before-quit', function() {
      //console.log("Blink1Control2: mainWindow.before-quit");
      isQuitting = true;
  });

  ipcMain.on('openMainWindow', function() {
    openMainWindow();
  });
  ipcMain.on('openAboutWindow', function() {
    openAboutWindow();
  });
  ipcMain.on('openPreferences', function() {
    openPreferences();
  });
  ipcMain.on('openDevTools', function() {
    openDevTools();
  });
  ipcMain.on('openHelpWindow', function() {
    openHelpWindow();
  });
  ipcMain.on('quitnow', function() {
    quit();
  });
  ipcMain.on('checkForUpdates', function() {
    updater.checkForUpdates();
  })

});
