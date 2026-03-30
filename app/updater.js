'use strict';
/**
 * updater.js
 *
 * Minimal update checker: fetches the latest GitHub release and compares
 * to the running version. Shows a dialog if a newer version is available.
 * No code signing, no download, no update server required.
 */

const { app, dialog, shell } = require('electron');
const https = require('https');

const RELEASES_API = 'https://api.github.com/repos/todbot/Blink1Control2/releases/latest';
const RELEASES_PAGE = 'https://github.com/todbot/Blink1Control2/releases/latest';

function fetchLatestRelease(callback) {
    const options = {
        headers: { 'User-Agent': 'Blink1Control2-updater' }
    };
    https.get(RELEASES_API, options, function(res) {
        var body = '';
        res.on('data', function(chunk) { body += chunk; });
        res.on('end', function() {
            try {
                var data = JSON.parse(body);
                callback(null, data.tag_name);
            } catch(e) {
                callback(e);
            }
        });
    }).on('error', callback);
}

// Strip leading 'v' and compare as semver [major, minor, patch]
function normalize(v) {
    return (v || '').replace(/^v/, '');
}

function isNewer(latest, current) {
    var a = latest.split('.').map(Number);
    var b = current.split('.').map(Number);
    for (var i = 0; i < 3; i++) {
        if ((a[i] || 0) > (b[i] || 0)) return true;
        if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
}

function checkForUpdates() {
    fetchLatestRelease(function(err, latestTag) {
        if (err) {
            dialog.showErrorBox('Update check failed', err.message || String(err));
            return;
        }
        var current = normalize(app.getVersion());
        var latest  = normalize(latestTag);

        if (latest && isNewer(latest, current)) {
            dialog.showMessageBox({
                type: 'info',
                title: 'Update available',
                message: 'A new version of Blink1Control2 is available.',
                detail: 'Current: v' + current + '\nLatest:  v' + latest,
                buttons: ['Download', 'Later'],
                defaultId: 0
            }).then(function(result) {
                if (result.response === 0) {
                    shell.openExternal(RELEASES_PAGE);
                }
            });
        } else {
            dialog.showMessageBox({
                type: 'info',
                title: 'No updates',
                message: 'Blink1Control2 v' + current + ' is up to date.'
            });
        }
    });
}

module.exports.checkForUpdates = checkForUpdates;
