"use strict";

var { contextBridge, ipcRenderer } = require('electron');
var conf = require('./configuration'); // has Node access in preload context

// ── App data ─────────────────────────────────────────────────────
var appDataArg = process.argv.find(function(a) { return a.startsWith('--appData='); });
var appData = appDataArg ? JSON.parse(appDataArg.slice('--appData='.length)) : { userData: '', appPath: '', appName: '' };

// ── State caches ──────────────────────────────────────────────────
var blink1State = {
    currentColor: '#000000',
    currentColorPerSerial: { '': '#000000' },
    currentMillis: 100,
    currentMillisPerSerial: { '': 100 },
    currentLedn: 0,
    currentLednPerSerial: { '': 0 },
    currentColorsPerSerial: { '': ['#000000', '#000000'] },
    statusStr: 'not connected',
    allSerials: [],
    serialNumberForDisplay: '-',
    currentBlink1Id: '',
    iftttKey: '',
    hostId: '',
    defaultPatternStr: '',
    isConnected: 0,
};
var patternsState = {
    allPatterns: [],
    playingPatternName: '',
    playingPatternSource: '',
};
var statusCache = [];

// ── Change listener maps ───────────────────────────────────────────
var blink1Listeners = {};   // name → fn
var patternsListeners = {}; // name → fn

// ── Renderer-side event bus ────────────────────────────────────────
var busListeners = {};
function busOn(event, fn) {
    if (!busListeners[event]) busListeners[event] = [];
    busListeners[event].push(fn);
}
function busOff(event, fn) {
    if (!busListeners[event]) return;
    busListeners[event] = busListeners[event].filter(function(f) { return f !== fn; });
}
function busEmit(event, data) {
    (busListeners[event] || []).forEach(function(fn) { fn(data); });
}

// ── IPC → cache, listeners, bus ───────────────────────────────────
ipcRenderer.on('blink1:state', function(_, state) {
    blink1State = state;
    Object.keys(blink1Listeners).forEach(function(name) {
        if (blink1Listeners[name]) blink1Listeners[name]();
    });
});
ipcRenderer.on('patterns:state', function(_, state) {
    patternsState = state;
    Object.keys(patternsListeners).forEach(function(name) {
        if (patternsListeners[name]) patternsListeners[name](state.allPatterns);
    });
});
ipcRenderer.on('eventer:newStatus', function(_, statuses) {
    statusCache = statuses;
    busEmit('newStatus', statuses);
});
ipcRenderer.on('bus:event', function(_, event, data) {
    busEmit(event, data);
});

// IPC events forwarded into bus (keyboard shortcuts, menu actions)
ipcRenderer.on('resetAlerts', function() {
    busEmit('playBigButtonSys', 'Off');
});
ipcRenderer.on('playBigButtonUser', function(_, arg) {
    busEmit('playBigButtonUser', arg);
});
ipcRenderer.on('showPreferences', function() {
    busEmit('showPreferences');
});

// ── Pure helper replicated from patternsService ────────────────────
function generateIdSync(pattern) {
    return pattern.name.toLowerCase().replace(/\W+/g, '');
}

// ── contextBridge ─────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {

    blink1: {
        getState:             function() { return blink1State; },
        addChangeListener:    function(fn, name) { blink1Listeners[name] = fn; },
        removeChangeListener: function(name) { delete blink1Listeners[name]; },
        // Sync accessors from cache
        getCurrentColor:   function(blink1id) {
            if (!blink1id) return blink1State.currentColor;
            return (blink1State.currentColorPerSerial[blink1id] || blink1State.currentColor);
        },
        getCurrentMillis:  function(blink1id) {
            if (!blink1id) return blink1State.currentMillis;
            return (blink1State.currentMillisPerSerial[blink1id] !== undefined
                ? blink1State.currentMillisPerSerial[blink1id] : blink1State.currentMillis);
        },
        getCurrentLedN:    function(blink1id) {
            if (!blink1id) return blink1State.currentLedn;
            return (blink1State.currentLednPerSerial[blink1id] !== undefined
                ? blink1State.currentLednPerSerial[blink1id] : blink1State.currentLedn);
        },
        getCurrentColors:  function(serial) {
            return (blink1State.currentColorsPerSerial[serial]
                || blink1State.currentColorsPerSerial['']
                || ['#000000', '#000000']);
        },
        getCurrentBlink1Id: function() { return blink1State.currentBlink1Id; },
        getAllSerials:      function() { return blink1State.allSerials; },
        getStatusString:   function() { return blink1State.statusStr; },
        serialNumberForDisplay: function() { return blink1State.serialNumberForDisplay; },
        getIftttKey:       function() { return blink1State.iftttKey; },
        getHostId:         function() { return blink1State.hostId; },
        isConnected:       function() { return blink1State.isConnected; },
        // Commands (fire-and-forget)
        fadeToColor:       function(millis, color, ledn, id) {
            ipcRenderer.send('blink1:fadeToColor', millis, color, ledn, id);
        },
        off:               function() { ipcRenderer.send('blink1:off'); },
        toyStart:          function(mode) { ipcRenderer.send('blink1:toyStart', mode); },
        setCurrentBlink1Id: function(id) { ipcRenderer.send('blink1:setCurrentBlink1Id', id); },
        setCurrentLedN:    function(n, id) { ipcRenderer.send('blink1:setCurrentLedN', n, id); },
        setCurrentMillis:  function(m, id) { ipcRenderer.send('blink1:setCurrentMillis', m, id); },
        reloadConfig:      function() { ipcRenderer.send('blink1:reloadConfig'); },
        // Commands with return values
        setHostId:         function(id) { return ipcRenderer.invoke('blink1:setHostId', id); },
        writePatternToBlink1: function(patt, save, serial) {
            return ipcRenderer.invoke('blink1:writePatternToBlink1', patt, save, serial);
        },
    },

    patterns: {
        getState:             function() { return patternsState; },
        addChangeListener:    function(fn, name) { patternsListeners[name] = fn; },
        removeChangeListener: function(name) { delete patternsListeners[name]; },
        // Sync accessors from cache
        getAllPatterns:        function() { return patternsState.allPatterns; },
        getPlayingPatternName: function() { return patternsState.playingPatternName; },
        getPlayingPatternSource: function() { return patternsState.playingPatternSource; },
        getPatternById:        function(id) {
            return patternsState.allPatterns.find(function(p) { return p.id === id; }) || null;
        },
        getNameForId:          function(id) {
            var p = patternsState.allPatterns.find(function(p) { return p.id === id; });
            return p ? p.name : null;
        },
        generateId:            function(pattern) { return generateIdSync(pattern); },
        // Commands (fire-and-forget)
        playPatternFrom:  function(source, id, blink1id) {
            ipcRenderer.send('patterns:playPatternFrom', source, id, blink1id);
        },
        stopPattern:      function(id) { ipcRenderer.send('patterns:stopPattern', id); },
        stopAllPatterns:  function() { ipcRenderer.send('patterns:stopAllPatterns'); },
        savePattern:      function(p) { ipcRenderer.send('patterns:savePattern', p); },
        deletePattern:    function(id) { ipcRenderer.send('patterns:deletePattern', id); },
        reloadConfig:     function() { ipcRenderer.send('patterns:reloadConfig'); },
        setInEditing:     function(val) { ipcRenderer.send('patterns:setInEditing', val); },
        // Commands with return values
        newPattern:           function() { return ipcRenderer.invoke('patterns:newPattern'); },
        newPatternFromString: function(name, str) {
            return ipcRenderer.invoke('patterns:newPatternFromString', name, str);
        },
    },

    eventServices: {
        reloadConfig: function(serviceType) {
            ipcRenderer.send('eventServices:reloadConfig', serviceType);
        },
    },

    config: {
        readSettings:    function(key) { return conf.readSettings(key); },
        saveSettings:    function(key, value) { conf.saveSettings(key, value); },
        saveSettingsMem: function(key, value) { conf.saveSettingsMem(key, value); },
        saveSettingsSync: function() { conf.saveSettingsSync(); },
    },

    eventer: {
        addStatus:    function(status) { ipcRenderer.send('eventer:addStatus', status); },
        getStatuses:  function() { return statusCache; },
        clearStatuses: function() {
            statusCache = [];
            ipcRenderer.send('eventer:clearStatuses');
        },
    },

    bus: {
        on:   busOn,
        off:  busOff,
        emit: function(event, data) {
            busEmit(event, data);
            ipcRenderer.send('bus:emit', event, data);
        },
    },

    dialog: {
        showOpenDialog: function(options) { return ipcRenderer.invoke('showOpenDialog', options); },
    },

    scriptService: {
        test: function(rule) { return ipcRenderer.invoke('scriptService:test', rule); },
    },

    menu: {
        setApplicationMenu: function(template) { ipcRenderer.send('setApplicationMenu', template); },
        setupTray:          function(data) { ipcRenderer.send('setupTray', data); },
        updateTrayMenu:     function(data) { ipcRenderer.send('updateTrayMenu', data); },
        destroyTray:        function() { ipcRenderer.send('destroyTray'); },
        showContextMenu:    function(data) { ipcRenderer.send('showContextMenu', data); },
        onContextMenuResult: function(menuId, fn) {
            ipcRenderer.once('contextMenuResult:' + menuId, function(_, action, arg) { fn(action, arg); });
        },
        onTrayClick: function(fn) { ipcRenderer.on('trayClick', fn); },
        send: function(channel, data) { ipcRenderer.send(channel, data); },
    },

    app: {
        platform: process.platform,
        name:     appData.appName,
        appPath:  appData.appPath,
        send: function(channel, data) { ipcRenderer.send(channel, data); },
    },
});
