// See: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db

const fs = require('fs');
const path = require('path');
var electron_notarize = require('electron-notarize');

const pkg = require('../package.json')

const appleId = process.env.APPLEID;
const appleIdPassword = process.env.APPLEIDPASSWD;
const ascProvider = process.env.TEAM_SHORT_NAME;
const ELECTRON_SKIP_NOTARIZATION = process.env.ELECTRON_SKIP_NOTARIZATION

module.exports = async function (params) {
    // Only notarize the app on Mac OS only.
    if (process.platform !== 'darwin' || ELECTRON_SKIP_NOTARIZATION === 'true') {
      return;
    }
    console.log('afterSign hook triggered', params);
    if(!appleId) throw new Error("no $APPLEID environment variable set");
    if(!appleIdPassword) throw new Error("no $APLEIDPASSWD environment variable set");
    if(!ascProvider) throw new Error("No $TEAM_SHORT_NAME environment variable set");

    const appId = pkg.build.appId
    if (!appId) throw new Error('no appId found in package.json')
    const appPath = path.join(
      params.appOutDir,
      `${params.packager.appInfo.productFilename}.app`
    )
    if (!fs.existsSync(appPath)) {
      throw new Error(`Cannot find application at: ${appPath}`)
    }

    console.log(`Notarizing ${appId} found at ${appPath} with appleId ${appleId}`);

    try {
        await electron_notarize.notarize({
            appBundleId: appId,
            appPath: appPath,
            appleId: appleId,
            appleIdPassword: appleIdPassword,
            ascProvider: ascProvider
        });
    } catch (error) {
        console.error(error);
    }

    console.log(`Done notarizing ${appId}`);
};
