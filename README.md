# Electron builds via GitHub actions

## Quick increment of version number and push

    npm version patch
    git push --follow-tags

## Stopping two build jobs being triggered

When you do a push followed by push tags, this results in two pushes, which can result in two github actions build jobs being triggered.  

Avoid this by using the modern one push `git push --follow-tags` or by defining the `yml` as

```yml
on:
  push:
    tags:
    - 'v*'
```

# Electron Forge Approach

This works.

## The publishers

All you do is call `npm publish` in the Github `yml` workflow file. This calls the official github publisher as long as you have this in package.json

```json
      "publishers": [
        {
          "name": "@electron-forge/publisher-github",
          "config": {
            "repository": {
              "owner": "abulka",
              "name": "electron-actions1"
            }
          }
        }
      ]
```

Ensure you have your Github username and repo name in the config, as `owner` and `name`.

You can add additional publishers, like copying files to s3 etc.  All publishers listed in your `package.json` are run when you type `npm run publish` (which incidentally just is shorthand for `electron-forge publish`)

## The makers

Makers are the `exe` types e.g. `.deb`, `snap` etc that you want to make. Just list the makers in `package.json` - each one has a config entry where you can say which os to be active for. All makers you list are run, if the os matches - though sometimes the plugin itself knows which os to run on and which not to run on.

Ensure you install each maker plugin using npm install.  E.g.
```json
  "devDependencies": {
    "@electron-forge/maker-deb": "^6.0.0-beta.54",
    "@electron-forge/maker-dmg": "*",
    "@electron-forge/maker-rpm": "^6.0.0-beta.54",
    "@electron-forge/maker-squirrel": "^6.0.0-beta.54",
    "@electron-forge/maker-zip": "^6.0.0-beta.54",

    "electron-forge-maker-appimage": "github:Marcus10110/electron-forge-maker-appimage"

    etc.
```

Most makers are official `@electron-forge/...` but the [Appimage](https://www.npmjs.com/package/electron-forge-maker-appimage) plugin is not, its third party `electron-forge-maker-appimage`.
ACTUALLY THAT'S BROKEN
Use https://github.com/saleae/electron-forge-maker-appimage
instead.

## results

    v1.0.32
    @github-actions github-actions drafted this 5 minutes ago
    Assets 8

    electron-actions1-1.0.32-1.x86_64.rpm
    electron-actions1-1.0.32.AppImage
    electron-actions1-1.0.32.dmg
    electron-actions1-1.0.32.Setup.exe
    electron-actions1-darwin-x64-1.0.32.zip
    electron-actions1_1.0.32_amd64.deb
    electron_actions1-1.0.32-full.nupkg


# Electron Builder Approach

A little bit more flaky and relies on a 3rd party github 'uses' script:

    uses: samuelmeuli/action-electron-builder@v1
    # uses: wixplosives/action-electron-builder@v1

A 'uses' script is javascript. You can run your own uses script via specifying a path something like `./github/workflow/uses/test.js` (untried), or use scripts from the marketplace.  The `wixplosives` is just a version of `samuelmeuli` with a minor change, to allow specifying a build command as an input parameter.

The `electron builder` vs `electron forge` parts of `package.json` are

```json
  "scripts": {
    // ELECTRON FORGE SCRIPTS
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "publish": "electron-forge publish",

    // ELECTRON BUILDER SCRIPTS
    "postinstall": "electron-builder install-app-deps",
    "build": "electron-builder --mac --windows --linux",
    "release": "electron-builder --mac --windows --linux --publish always"
```

Thus `npm run make` will run the electron forge maker (which generates exes for all os platforms we are on) into `out/`, 

whereas `npm run build` runs electron builder exe maker into `dist/`

Similarly for publishing, which is the act of creating the final installer for an os, and optionally publishing it on some server (in the case of forge with a github publish plugin specified in package.json). If you run `npm run publish` locally e.g. on a Mac it will build the zip, dmg etc then will try to publish to a GitHub release, you will need to have set your `GITHUB_TOKEN`.

# Manual Approach

Just run `npm run ....` whatever you want, and the output will be in `out` (forge) or `dist` (builder) but these need to be copied into a release. Use the 3rd party `uses: softprops/action-gh-release@v1` action to do this as long as you know the filenames involved e.g.

```yml
uses: softprops/action-gh-release@v1
# must have this 'if' because releasing only works for tag pushes
if: startsWith(github.ref, 'refs/tags/')
with:
    files: |
    result.txt
    result-py-${{ matrix.os }}-${{ matrix.python-version }}.txt
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

# CLI

    $ gh workflow run "Manual python matrix os workflow"

✓ Created workflow_dispatch event for manual-python-matrix.yml at main

To see runs for this workflow, try: gh run list --workflow=manual-python-matrix.yml

    $ gh run list --workflow=manual-python-matrix.yml

    -  added python script              Manual python matrix os workflow  main  workflow_dispatch  753900673
    ✓  added python script              Manual python matrix os workflow  main  workflow_dispatch  753892011
    ✓  Update manual-python-matrix.yml  Manual python matrix os workflow  main  workflow_dispatch  752265606
    ✓  Update manual-python-matrix.yml  Manual python matrix os workflow  main  workflow_dispatch  752246735
    ✓  Create manual-python-matrix.yml  Manual workflow                   main  workflow_dispatch  752226522

# OLD notes

for electron builder, try changing

    "build": "electron-builder --mac --windows --linux",
    "release": "electron-builder --mac --windows --linux --publish always"

to

    "build": "electron-builder --linux",
    "release": "electron-builder --linux --publish always"

test

