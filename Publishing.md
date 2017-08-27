### Publishing

[FIXME: need to update this]

Steps:
- Create tag in git repository
- Make release on github
- Copy files from dev boxes / CI to github release page
    - dist/mac/Blink1Control2-{version}-mac.dmg
    - dist/mac/Blink1Control2-{version}-mac.zip
    - dist/win/Blink1Control2.Setup-{version}-win32-x64.exe
    - dist/Blink1Control2-{version}-win32-x64.zip
- Write release notes (changelog)
- Publish release
- Check release
    - Download each version, unzip / install / launch to test
- Publish announcement

Packaging deltas from standard electron-builder
```
 mv dist/Blink1Control2-win32-x64.zip  dist/win/Blink1Control2-{version}-win32-x64.zip
```
