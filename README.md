# Electron builds via GitHub actions

I use the `Electron Forge` approach rather than the `Electron Builder` approach.

To build a quick electron app using electron forge:

    npx create-electron-app my-app
    cd my-app
    npm start
    npm run make

# Electron Forge Approach

This works. 

You must understand that a 'maker' creates the exe or dmg.

The publisher takes the exe and tries to publish it into a release on github, or as a s3 file on aws.

The scripts which trigger forge behaviour are `start`, `package`, `make` and `publish`. Make creates the exe's in `out/` dir and publish tries to upload them to GitHub (you can have a list of publisher plugins). A plugin is just a npm installed library, which is listed in `package.json` plus a config entry inside `config.forge` of `package.json`.

To hook up with GitHub releases, all you need is a single entry in `package.json` which is the `"@electron-forge/publisher-github"` entry, which has your repo info in its options. Then you tag (or just do `npm version patch`) and run `npm run publish` locally. This will create a release! But only for the current operating system. It will also try and contact Github to upload those files into a release.

To hook up with GitHub actions (which runs workflow scripts specified in `yml` syntax on OS's of your choice), you just need to add a `yml` workflow file into `.github/workflows/` which, for each OS, checks out the code, installs nodejs, runs `npm init`, and runs `npm run publish` in an OS vm. This will create a release for all OS's. Cool.

You specify the exe types you want by listing them in the `config.forge.makers` array of `package.json`. Some of them know which OS they apply to, others you specify if you want that maker to be run on that OS (e.g. zip). For each OS on Github actions, all the makers are attempted to run - but only a few actually run because of the OS.  The `Exe/DMG/Zip` etc are generated and appended to the release for that tag.

More detail:

## The publishers

All you do is call `npm run publish` in the Github `yml` workflow file. This calls the official github publisher as long as you have this in package.json

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
},
...
]
```

Ensure you have your Github username and repo name in the config, as `owner` and `name`.

You can add additional publishers, like copying files to s3 etc.  All publishers listed in your `package.json` are run when you type `npm run publish` (which incidentally just is shorthand for `electron-forge publish`)

If you run `npm run publish` locally e.g. on a Mac it will build the zip, dmg etc then will try to publish to a GitHub release, you will need to have set your `GITHUB_TOKEN` in order for to access your GitHub repo.

When running inside a GitHub workflow `yml` file (inside GitHub actions tab of GitHub) then the same behaviour will happen - exes are built and copied into a release for the current tag. The access to Github is done via your GitHub access token via

```yml
- name: publish
    env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: npm run publish
```


## The makers

Makers are the `exe` types e.g. `.deb`, `snap` etc that you want to make. Just list the makers in `package.json` - each one has a config entry where you can say which os to be active for, as well as possible other minor config settings (like in the case of a DMG you can specify the particular DMG format). 

```json
"config": {
"forge": {
    "makers": [
    {
        "name": "@electron-forge/maker-squirrel",
        "config": {
        "name": "electron_actions1"
        }
    },
    {
        "name": "@electron-forge/maker-zip",
        "platforms": [
        "darwin"
        ]
    },
    ...
```

All makers you list are run, if the OS matches - though sometimes the plugin itself knows which OS to run on and which OS not to run on.

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

> I got this partially working, but abandoned it when I got the forge approach working.

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

Similarly for publishing, which is the act of creating the final installer for an os, and optionally publishing it on some server (in the case of forge with a github publish plugin specified in package.json). 

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

# Tips

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

## Artifacts

Note GitHub actions used for testing and mucking around can generate files in the OS vm, e.g. if you ran `npm run make` or some test script with logging, for example. These files are discared after the run unless you specifically save them into the 'run' using `actions/upload-artifact@v2` e.g.

```yml
- name: Run a fun Python script
run: python fun1.py > result-py-${{ matrix.os }}-${{ matrix.python-version }}.txt

- name: Archive result of calling version
uses: actions/upload-artifact@v2
with:
    name: result-${{ matrix.os }}-${{ matrix.python-version }}
    path: result.txt
```

This will make those 'artifact' files available in the github action workflow run, kind of like attachments.

You can also feed artifacts from one job into another job using the 'upload' and 'download' artifact. The upload saves it and the download restores it into the file system for the current job to use. See the Github actions doco for more info.

# GitHub CLI

Install with brew. Then you can run workflows from your devel machine etc.

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

