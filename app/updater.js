/**
 * updater.js
 *
 * Please use manual update only when it is really required, otherwise please use recommended non-intrusive auto update.
 *
 * Import steps:
 * 1. create `updater.js` for the code snippet
 * 2. require `updater.js` for menu implementation, and set `checkForUpdates` callback from `updater` for the click property of `Check Updates...` MenuItem.
 */
const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

let updater = {}
autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {
  // dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
  var status = (error && error.status) ? error.status : '';
  dialog.showErrorBox('Error: could not check for updates. ', status);
})

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Found Updates',
    message: 'Found updates from Blink1Control2 github. Do you want update now?',
    buttons: ['Sure', 'No']
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      autoUpdater.downloadUpdate()
    }
    else {
      updater.enabled = true
      // updater = null
    }
  })
})

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.'
  })
  updater.enabled = true
  // updater = null
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    title: 'Install Updates',
    message: 'Updates downloaded. Quit application to update...'
  }, () => {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
})

// export this to MenuItem click callback
// function checkForUpdates (menuItem, focusedWindow, event) {
function checkForUpdates() {
  // updater = menuItem
  updater.enabled = false
  autoUpdater.checkForUpdates()
}
module.exports.checkForUpdates = checkForUpdates
