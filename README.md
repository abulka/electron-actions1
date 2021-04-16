# Electron builds via GitHub actions

try changing

    "build": "electron-builder --mac --windows --linux",
    "release": "electron-builder --mac --windows --linux --publish always"

to

    "build": "electron-builder --linux",
    "release": "electron-builder --linux --publish always"

test

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

