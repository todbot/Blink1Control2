### Publishing Releases

Steps:
- Update version in `package.json` and `app/package.json` (they must match!)
- Build release:
    ```
    rimraf dist    # delete previous dist products (optional)
    npm run clean  # removes node_modules so they get rebuilt, does not remove 'dist' dir
    npm install    # installs & builds node_modules
    npm run pack   # bundles app code using webpack to bundle.js
    npm run dist   # build the dist products, and publish, must do it on each OS (Mac,Win,Linux)
    ```
    To test "pack" run `npm run dist:draft`.
    Note: must set GH_TOKEN for `npm run dist` to publish to github
    (e.g. `export GH_TOKEN=...` on Mac & Linux, `$env:GH_TOKEN=...` on Windows Powershell)

- Edit release on github (tag created by 'dist' above)
- Write release notes (changelog)
- Publish release
- Check release
    - Download each version, unzip / install / launch to test
- Publish announcement

#### Current build machines
- Mac OS X 10.14.6 on Macbook Pro 2015
- Windows 10 Pro (in VM)
- Ubuntu 18 (in VM)  (but must be 14.04 for earlier libc)



#### Notes

- Mac signed apps:
    - Before running `npm run dist`, set three environment variables:
      ```
      export APPLEID="appleid@appleid.com" (but real appleId)
      export APPLEIDPASSWD="app-specific-password" (generated from appleid.apple.com)
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

  

- Windows signed apps:
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
