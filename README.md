# Electron builds via GitHub actions

try changing

    "build": "electron-builder --mac --windows --linux",
    "release": "electron-builder --mac --windows --linux --publish always"

to

    "build": "electron-builder --linux",
    "release": "electron-builder --linux --publish always"

