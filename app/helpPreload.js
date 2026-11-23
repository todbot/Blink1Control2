"use strict";

var { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('helpAPI', {
    savePDF: function() { return ipcRenderer.invoke('help:savePDF'); }
});
