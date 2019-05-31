### Publishing Releases

Steps:
- Update version in `package.json` and `app/package.json` (they must match!)
- Build release:
    ```
    npm run clean  # removes node_modules so they get rebuilt, does not remove 'dist' dir
    npm install    # installs & builds node_modules
    npm run pack   # bundles app code using webpack to bundle.js
    rimraf dist    # delete previous dist products (optional)
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
- Mac OS X 10.12.6 on Macbook Pro 2013
- Windows 10 Pro (in VM)
- Ubuntu 14.04 (in VM)  (must be 14.04 for earlier libc)



#### random notes
- For actual publishing, use github releases (default), which requires `GH_TOKEN` secure environment variable and:
    ```
    "build": {
      "publish": {
        "provider": "github"
      }
    }
