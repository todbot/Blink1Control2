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
var DEV_PORT = require('../devPort');

// ── Services (run in main process) ───────────────────────────────
var config = require('./configuration');
// Populate global.logconfig before any service requires logger
global.logconfig = config.readSettings('logger') || {};

var Eventer = require('./eventer');
var Blink1Service = require('./server/blink1Service');
var PatternsService = require('./server/patternsService');
var ApiServer = require('./server/apiServer');
var IftttService = require('./server/iftttService');
var MailService = require('./server/mailService');
var SkypeService = require('./server/skypeService');
var ScriptService = require('./server/scriptService');
var TimeService = require('./server/timeService');
var MqttService = require('./server/mqttService');

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
var tray = null;
var logWindow = null;

// Map of action names callable from serialized menu clickSpec.target='main'
var mainActions = {};

// Build an Electron Menu template from a serializable template.
// clickSpec: { target:'main', action:'name' } OR { target:'renderer', channel:'ipc-chan', args:[] }
function buildMenuFromTemplate(template, sender) {
    return template.map(function(item) {
        if (!item) return item;
        var built = {};
        Object.keys(item).forEach(function(k) {
            if (k === 'clickSpec') {
                var spec = item.clickSpec;
                if (spec.target === 'main') {
                    built.click = (function(action) {
                        return function() { mainActions[action] && mainActions[action](); };
                    })(spec.action);
                } else {
                    built.click = (function(channel, args) {
                        return function() { sender.send.apply(sender, [channel].concat(args || [])); };
                    })(spec.channel, spec.args);
                }
            } else if (k === 'submenu' && Array.isArray(item.submenu)) {
                built.submenu = buildMenuFromTemplate(item.submenu, sender);
            } else {
                built[k] = item[k];
            }
        });
        return built;
    });
}

// Build context menu template from serializable items that carry action/arg fields.
// Clicks send 'contextMenuResult:<menuId>' back to the renderer.
function buildContextMenuTemplate(template, sender, menuId) {
    return template.map(function(item) {
        if (!item) return item;
        var built = {};
        Object.keys(item).forEach(function(k) {
            if (k === 'action' || k === 'arg') return;
            if (k === 'submenu' && Array.isArray(item.submenu)) {
                built.submenu = buildContextMenuTemplate(item.submenu, sender, menuId);
                return;
            }
            built[k] = item[k];
        });
        if ('action' in item) {
            built.click = (function(action, arg) {
                return function() { sender.send('contextMenuResult:' + menuId, action, arg); };
            })(item.action, item.arg);
        }
        return built;
    });
}

var quit = function() {
  Blink1Service.off();
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
var openLogWindow = function(html) {
  if (logWindow) {
    logWindow.show();
  } else {
    logWindow = new BrowserWindow({
      title: 'Blink1Control2 Event List',
      alwaysOnTop: true,
      autoHideMenuBar: true,
      height: 300,
      width: 400,
      webPreferences: { contextIsolation: true }
    });
    logWindow.on('closed', function() { logWindow = null; });
  }
  logWindow.loadURL('data:text/html,' + html);
};

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
    loadurl = 'http://localhost:' + DEV_PORT + '/index-dev.html';
  }
  console.log("loadurl:"+loadurl);

  // Synchronous data request from renderer (used at module init time by configuration.js, about.html)
  // Must be registered before BrowserWindow is created so the preload script can call it.
  ipcMain.on('getAppData', function(event) {
    event.returnValue = {
      userData: app.getPath('userData'),
      appPath:  app.getAppPath(),
      appName:  app.getName()
    };
  });

  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'images/icons/blink1mk2-icon2-128px.png'),
    title: "Blink1Control2",
    maximizable: false,
    width: 1040,
    height: 700 + ((process.platform !== 'darwin') ? 20 : 0),
    resizable: isDevelopment && showDebug,
    show: false, // show later based on config
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });
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

  // Populate mainActions now that all action functions are defined
  mainActions.openMainWindow   = openMainWindow;
  mainActions.openAboutWindow  = openAboutWindow;
  mainActions.openPreferences  = openPreferences;
  mainActions.openDevTools     = openDevTools;
  mainActions.openHelpWindow   = openHelpWindow;
  mainActions.quitnow          = quit;
  mainActions.checkForUpdates  = function() { updater.checkForUpdates(); };

  // Log window (from eventList.js)
  ipcMain.on('openLogWindow', function(event, html) {
    openLogWindow(html);
  });

  // File open dialog (from scriptForm.js)
  ipcMain.handle('showOpenDialog', async function(event, options) {
    return dialog.showOpenDialog(options);
  });

  // Context menus (from bigButton.js, blink1Status.js)
  ipcMain.on('showContextMenu', function(event, data) {
    var menu = Menu.buildFromTemplate(
      buildContextMenuTemplate(data.template, event.sender, data.menuId)
    );
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });

  // Application menu (from menuMaker.js)
  ipcMain.on('setApplicationMenu', function(event, template) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuFromTemplate(template, event.sender)));
  });

  // Tray (from menuMaker.js)
  ipcMain.on('setupTray', function(event, data) {
    if (tray) { tray.destroy(); }
    var Tray = electron.Tray;
    tray = new Tray(data.iconPath);
    tray.setToolTip(data.tooltip);
    if (process.platform === 'win32') {
      tray.on('click', function() { event.sender.send('trayClick'); });
    }
  });
  ipcMain.on('updateTrayMenu', function(event, data) {
    if (!tray) return;
    var trayMenu = Menu.buildFromTemplate(buildMenuFromTemplate(data.trayTemplate, event.sender));
    if (process.platform === 'darwin' && data.dockTemplate) {
      app.dock.setMenu(Menu.buildFromTemplate(buildMenuFromTemplate(data.dockTemplate, event.sender)));
    }
    tray.setContextMenu(trayMenu);
  });
  ipcMain.on('destroyTray', function() {
    if (tray) { tray.destroy(); tray = null; }
  });

  // Preferences / dock actions (from preferencesModal.js)
  ipcMain.on('dockHide', function() {
    if (process.platform === 'darwin') { app.dock.hide(); }
  });
  ipcMain.on('dockShow', function() {
    if (process.platform === 'darwin') { app.dock.show(); }
  });
  ipcMain.on('setLoginItemSettings', function(event, settings) {
    app.setLoginItemSettings(settings);
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
  });

  // ── Service startup ──────────────────────────────────────────────
  Blink1Service.start();
  ApiServer.start();
  PatternsService.initialize();

  // Wire services to push state to renderer whenever they change.
  // Called after initialize() so the initial push includes populated data.
  Blink1Service.setSendState(function(state) {
    if (mainWindow && !isQuitting) mainWindow.webContents.send('blink1:state', state);
  });
  PatternsService.setSendState(function(state) {
    if (mainWindow && !isQuitting) mainWindow.webContents.send('patterns:state', state);
  });

  // Forward Eventer events that renderer components consume
  Eventer.on('newStatus', function(statuses) {
    if (mainWindow) mainWindow.webContents.send('eventer:newStatus', statuses);
  });
  Eventer.on('deviceUpdated', function() {
    if (mainWindow) mainWindow.webContents.send('bus:event', 'deviceUpdated');
  });

  // Re-push current state once the renderer has fully loaded
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.send('blink1:state', Blink1Service._getState());
    mainWindow.webContents.send('patterns:state', PatternsService._getState());
  });

  setTimeout(function() {
    IftttService.start();
    MailService.start();
    SkypeService.start();
    ScriptService.start();
    TimeService.start();
    MqttService.start();
  }, 2000);

  // Run startup pattern after a short delay
  setTimeout(function() {
    Blink1Service.off();
    var startupPattern = config.readSettings('startup:startupPattern');
    if (startupPattern) {
      PatternsService.playPatternFrom('startup', startupPattern);
    }
  }, 1000);

  // ── Blink1 IPC handlers ──────────────────────────────────────────
  ipcMain.on('blink1:fadeToColor', function(event, millis, color, ledn, id) {
    Blink1Service.fadeToColor(millis, color, ledn, id);
  });
  ipcMain.on('blink1:off', function() { Blink1Service.off(); });
  ipcMain.on('blink1:toyStart', function(event, mode) { Blink1Service.toyStart(mode); });
  ipcMain.on('blink1:setCurrentBlink1Id', function(event, id) { Blink1Service.setCurrentBlink1Id(id); });
  ipcMain.on('blink1:setCurrentLedN', function(event, n, id) { Blink1Service.setCurrentLedN(n, id); });
  ipcMain.on('blink1:setCurrentMillis', function(event, m, id) { Blink1Service.setCurrentMillis(m, id); });
  ipcMain.on('blink1:reloadConfig', function() { Blink1Service.reloadConfig(); });
  ipcMain.handle('blink1:setHostId', function(event, id) { return Blink1Service.setHostId(id); });
  ipcMain.handle('blink1:writePatternToBlink1', function(event, patt, save, serial) {
    return Blink1Service.writePatternToBlink1(patt, save, serial);
  });

  // ── PatternsService IPC handlers ─────────────────────────────────
  ipcMain.on('patterns:playPatternFrom', function(event, source, id, blink1id) {
    PatternsService.playPatternFrom(source, id, blink1id);
  });
  ipcMain.on('patterns:stopPattern', function(event, id) { PatternsService.stopPattern(id); });
  ipcMain.on('patterns:stopAllPatterns', function() { PatternsService.stopAllPatterns(); });
  ipcMain.on('patterns:savePattern', function(event, p) { PatternsService.savePattern(p); });
  ipcMain.on('patterns:deletePattern', function(event, id) { PatternsService.deletePattern(id); });
  ipcMain.on('patterns:reloadConfig', function() { PatternsService.reloadConfig(); });
  ipcMain.on('patterns:setInEditing', function(event, val) { PatternsService.setInEditing(val); });
  ipcMain.handle('patterns:newPattern', function() { return PatternsService.newPattern(); });
  ipcMain.handle('patterns:newPatternFromString', function(event, name, str) {
    return PatternsService.newPatternFromString(name, str);
  });

  // ── Event services IPC handler ───────────────────────────────────
  ipcMain.on('eventServices:reloadConfig', function(event, serviceType) {
    if      (serviceType === 'ifttt')                           IftttService.reloadConfig();
    else if (serviceType === 'mail')                            MailService.reloadConfig();
    else if (serviceType === 'script' || serviceType === 'url'
          || serviceType === 'file')                            ScriptService.reloadConfig();
    else if (serviceType === 'skype')                           SkypeService.reloadConfig();
    else if (serviceType === 'time')                            TimeService.reloadConfig();
    else if (serviceType === 'mqtt')                            MqttService.reloadConfig();
    else if (serviceType === 'apiServer')                       ApiServer.reloadConfig();
  });

  // ── Eventer IPC handlers ─────────────────────────────────────────
  ipcMain.on('eventer:addStatus', function(event, status) { Eventer.addStatus(status); });
  ipcMain.on('eventer:clearStatuses', function() { Eventer.clearStatuses(); });

  // ── Bus events from renderer ─────────────────────────────────────
  ipcMain.on('bus:emit', function(event, busEvent, data) {
    // Currently no bus events from renderer need main-process handling
  });

  // ── Config reload IPC (menu-driven) ─────────────────────────────
  ipcMain.on('reloadConfig:blink1Service', function() {
    Blink1Service.reloadConfig();
  });

});

