### Publishing Releases

Releases are built, signed, and uploaded by GitHub Actions
(`.github/workflows/macos.yml`, `windows.yml`, `linux.yml`).
Nothing needs to be built locally.

#### Steps

1. Update `version` in `package.json` and `app/package.json`
   (they must match!), commit, and push.

2. Optional: test signing without publishing, from the Actions tab
   or the command line:
    ```
    gh workflow run windows.yml --ref main -f sign=true
    gh workflow run macos.yml   --ref main -f notarize=true
    ```
   Then download and check the artifacts (see "Checking signatures").

3. Create a draft release *before* publishing, so the three jobs
   don't each create their own draft:
    ```
    gh release create vX.Y.Z --draft --title "Blink1Control2 vX.Y.Z" \
      --notes-file notes.md
    ```

4. Trigger the publish builds with `[publish]` in a commit message:
    ```
    git commit --allow-empty -m "release X.Y.Z [publish]"
    git push
    gh run list --limit 4
    ```
   Or run a single platform by hand, e.g. to redo one that failed:
    ```
    gh workflow run linux.yml --ref main -f publish=true
    ```

5. Check the draft has every file:
    ```
    gh release view vX.Y.Z --json assets --jq '.assets[].name'
    ```
   Expect: mac x64 + arm64 `.dmg` and `.zip`; win `win.exe`,
   `win-x64.exe`, `win-ia32.exe`, `win-x64.zip`, `win-ia32.zip`;
   linux `.deb`, `.tar.gz`, `.AppImage` (plus `.yml`/`.blockmap`).

6. Download and test each platform (install / unzip / launch).

7. Publish the release:
    ```
    gh release edit vX.Y.Z --draft=false --latest
    ```
   This creates the `vX.Y.Z` tag. Running copies of the app check
   `releases/latest` and will now offer the update.

8. Publish announcement.

#### Release notes

Follow the v2.4.0 layout: "New in this release", "Fixes in this
release", requirements, a "Full Changelog" compare link, then the
per-platform download list. Start from
`git log --no-merges --oneline vPREV..HEAD` and keep only
user-facing changes.

#### How CI signs and publishes

- Each run does one electron-builder build. The mode depends on how
  it was triggered:
  - push / PR: unsigned `npm run dist:draft`
  - `sign` / `notarize` input: signed, not published
  - `[publish]` commit or `publish` input: signed and published
- **macOS**: signed with the Developer ID cert and notarized by
  electron-builder (secrets `MACOS_CERTIFICATE`,
  `MACOS_CERTIFICATE_PWD`, `CSC_NAME`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`).
- **Windows**: signed with Azure Trusted Signing *inside* the
  electron-builder build, via `-c.win.azureSignOptions.*` on the
  command line in `windows.yml` (secrets `AZURE_TENANT_ID`,
  `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`). This signs the app exe,
  installer, and uninstaller. Don't sign as a separate step after
  the build: `npm run dist` rebuilds and would publish unsigned files.
- **Uploading**: electron-builder uploads into the draft release
  using the built-in `GITHUB_TOKEN` (`permissions: contents: write`).
  No personal access token is needed.

#### Checking signatures

- macOS: electron-builder signs and notarizes the `.app`, not the
  `.dmg`, so `spctl -t install` on the DMG says "rejected". Check the
  app inside it instead:
    ```
    spctl -a -vv -t exec /Volumes/Blink1Control2*/Blink1Control2.app
    # → accepted, source=Notarized Developer ID
    xcrun stapler validate /Volumes/Blink1Control2*/Blink1Control2.app
    ```
- Windows: on Windows, in PowerShell:
    ```
    Get-AuthenticodeSignature .\Blink1Control2-X.Y.Z-win.exe
    # Status should be Valid
    ```
  On a Mac, `osslsigncode verify -in file.exe` shows the ThingM
  signer but reports chain errors ("unable to get local issuer
  certificate"). That's expected: macOS doesn't ship Microsoft's
  code-signing root. Check that "Current message digest" matches
  "Calculated message digest".
  The Azure cert is only valid for ~3 days; the timestamp keeps
  signatures valid after it expires.
- `gh run download` prints nothing while it downloads; the Windows
  artifact is ~600 MB, so give it time (or use the browser).

#### Mac signing notes

  - To get appId / bundleId, do one of:
    ```
    mdls -name kMDItemCFBundleIdentifier -r ~/Desktop/Blink1Control2-2.2.1.app
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

  - Check codesigning:
    ```
    codesign -dv --verbose=4 ./dist/mac/Blink1Control2.app
    ```

#### Local builds

`npm run dist:draft` builds unsigned, un-notarized installers in
`dist/` for local testing. Local mac builds sign automatically if a
Developer ID cert is in your keychain.
