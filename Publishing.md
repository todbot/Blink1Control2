### Publishing Releases

Steps:
- Update version in package.json
- Build release:
    ```
    npm install
    npm run pack
    npm run dist  // this does the publish
    ```
-



- Create tag in git repository
- Make release on github
- Write release notes (changelog)
- Publish release
- Check release
    - Download each version, unzip / install / launch to test
- Publish announcement




#### random notes
- Testing out S3 artifact publishing by setting:
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
