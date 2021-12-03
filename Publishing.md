## Publishing Releases

### Steps:
[tbd]

### Old Steps:
- Update version in both `package.json` and `app/package.json` (they must match!)
- Build release:
  ```
    rimraf dist    # delete previous dist products (optional)
    npm run clean  # removes node_modules so they get rebuilt, does not remove 'dist' dir
    npm install    # installs & builds node_modules
    npm run pack   # bundles app code using webpack to bundle.js
    npm run dist   # build the dist products, and publish, must do it on each OS (Mac,Win,Linux)
  ```
  Note: must set GH_TOKEN for `npm run dist` to publish to github
  (e.g. `export GH_TOKEN=...` on Mac & Linux, `$env:GH_TOKEN=...` on Windows Powershell)

  To test "pack", run `npm run start` (to start app pre-dist) or `npm run dist:draft`.

- Edit release on github (tag created by 'dist' above)

- Write release notes (changelog)

- Publish release

- Check release
  - Download each version, unzip / install / launch to test

- Publish announcement



### Notes

####  Mac signed apps:

- Before running `npm run dist`, set three environment variables:
  ```
  export APPLEID="appleid@appleid.com" (but real appleId)
  export APPLEIDPASS="app-specific-password" (generated from appleid.apple.com)
  export TEAM_SHORT_NAME="MyTeamShortName" (obtained from iTMSTransporter below)
  ```

- To get 'short name' ("ascProvider" to electron-notarize):
  ```
  /Applications/Transporter.app/Contents/itms/bin/iTMSTransporter -m provider -u $APPLEID -p $APPLEIDPASSWD
  ```
- To get appId / bundleId, do one of:
  ```
  mdls -name kMDItemCFBundleIdentifier -r ~/Desktop/Blink1Control2-2.2.1.app`
  osascript -e 'id of app "Blink1Control2-2.2.1"'
  osascript -e "id of app \"`pwd`/dist/mac/Blink1Control2.app\""
  ```
  and that should return appId of "com.thingm.blink1control2"

- Test if app is notarized:
  ```
  codesign --test-requirement="=notarized" --verify --verbose myapp.app
  xcrun stapler validate myapp.app
  ```
  also see https://eclecticlight.co/2019/05/31/can-you-tell-whether-code-has-been-notarized/

- To reset privacy database for particular app (to test Mac access dialogs):
  ```
  tccutil reset All com.thingm.blink1control2
  ```

- To see valid signing identities
  ```
  security find-identity -v -p codesigning
  ```

- Which can then be used to sign command-line apps with:
  ```
  codesign -s (identity from above) /path/to/executable
  ```

- Check if app was signed:
  ```
  codesign -vvvv -d /path/to/executable
  ```

- In some cases, may need to sign native hared library with your developer credentials and copy it into the app:

  ```
  npm install -g electron-osx-sign
  cp node_modules/node-hid/build/Release/HID.node dist/mac/
  electron-hid-toy.app/Contents/MacOS
  electron-osx-sign dist/mac/electron-hid-toy.app  dist/mac/electron-hid-toy.app/Contents/MacOS/HID.node
  ```

- To see output from `electron-builder`:
  ```
  cross-env DEBUG=electron-builder npm run dist:draft
  ```

#### Windows signed apps:

  - Get Code Signing cert. w/ Internet Explorer 11:
    - Submit CSR to codesigning site, then it issues cert
    - Internet Explorerer Prefs -> Internet Options -> Content -> Certificates ->
        Pick certificate -> Export -> "Yes, export private key" -> Format "PKCS #12 (.PFX)" ->
        Choose Password -> pick filename -> saves as .PFX file
        See: https://support.comodo.com/index.php?/comodo/Knowledgebase/Article/View/1001/7/how-to-verify-your-code-signing-certificate-is-installed-windows
    - Get Code Signing cert w/ Firefox-ESR  (not supported any more?)
      - Export it from Firefox-ESR as .p12 file (which requires a password to encrypt)
    - Set env vars described in https://www.electron.build/code-signing#windows, e.g.:
      ```
      $env:CSC_LINK="c:\users\biff\desktop\codesign-cert.p12" (or .pfx file)
      $env:CSC_KEY_PASSWORD="hunter2"
      ```
    - Run `npm run dist`  (or `npm run dist:draft` to sign but not publish to github)

- For actual publishing, use github releases (default), which requires `GH_TOKEN` secure environment variable and:
  ```
  "build": {
    "publish": {
      "provider": "github"
    }
  }
  ```

#### Raspbery Pi build:

 - Problem: `electron-build` doesn't build correctly
 - So, need to to some hacks, as described here:
    https://github.com/electron-userland/electron-builder/issues/5432
    https://github.com/hovancik/stretchly/blob/trunk/.doneyml
   - install `libopenjp2-tools` to get `opj_decompress`
   - install `ruby` to get `gem`
   - install FPM system-wide
   ```
   sudo apt install libopenjp2-tools ruby-full
   sudo gem install fpm -v 1.10.1
   export USE_SYSTEM_FPM="true"
   ./node_modules/.bin/electron-builder --armv7l
   ```
   - The above will build same packages as 'linux' in package.json: tar.gz, deb, appimage


#### Old Build Machines
 - Mac OS X 11 on MacBook Pro Intel 2015
 - Mac OS X 11 on MacBook Pro M1
 - Windows 10 Pro (in VM)
 - Ubuntu 20 (in VM)
 - Raspberry Pi 4
 - Test on 14.04  (for earlier libc?)
