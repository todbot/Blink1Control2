### Publishing Releases

Steps:
- Update version in `package.json` and `app/package.json` (they must match!)
- Build release:
    ```
    npm run clean  // removes node_modules so they get rebuilt
    npm install    // installs & builds node_modules
    npm run pack   // bundles app code using webpack to bundle.js
    npm run dist   // this does the publish, must do it on each OS (Mac,Win,Linux)
    ```
- Make release on github (creates tag)
- Write release notes (changelog)
- Upload build artifacts
- Publish release
- Check release
    - Download each version, unzip / install / launch to test
- Publish announcement




#### random notes
- Test out S3 artifact publishing by setting in package.json:
    ```
    "build": {
      "publish": {
        "provider": "s3",
        "bucket": "blink1control2"
      }
    }
    ```
  and setting `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` environment variable in Travis and Appveyor environment settings
- But for actual publishing, use github releases (default), which requires `GH_TOKEN` secure environment variable and:
    ```
    "build": {
      "publish": {
        "provider": "github"
      }
    }
