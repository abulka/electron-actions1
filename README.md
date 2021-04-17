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

Most makers are official `@electron-forge/...` but the [Appimage](https://www.npmjs.com/package/electron-forge-maker-appimage) plugin is not, its third party `electron-forge-maker-appimage`.
ACTUALLY THAT'S BROKEN
Use https://github.com/saleae/electron-forge-maker-appimage
instead.



# Electron Builder Approach

A little bit more flaky and relies on a 3rd party github 'uses' action script.


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

