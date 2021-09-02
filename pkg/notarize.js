
//require('dotenv').config();  // we'll set env vars by hand
const { notarize } = require('electron-notarize');

const appleId = process.env.APPLEID;
const appleIdPassword = process.env.APPLEIDPASS;
const ascProvider = process.env.TEAM_SHORT_NAME;

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // if(!appleId) throw new Error("no $APPLEID environment variable set");
  // if(!appleIdPassword) throw new Error("no $APLEIDPASS environment variable set");
  // if(!ascProvider) throw new Error("No $TEAM_SHORT_NAME environment variable set");

  const appId = pkg.build.appId

  return await notarize({
    // appBundleId: 'com.todbot.electron-blink1-toy',  // FIXME
    appBundleId: appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    ascProvider: process.env.TEAM_SHORT_NAME,
  });
};
