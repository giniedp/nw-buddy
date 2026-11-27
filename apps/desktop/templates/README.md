# New World Buddy

## Desktop app

`nw-buddy.exe` is the desktop version of what is available at `https://www.nw-buddy.de/`

All data is local (`nw-data.zip`) except map tiles and 3D models.

The app starts its own tools server for the level viewer and game file browser. It reads the New World installation
directory from `.env` next to `nw-buddy.exe`, the same file `nw-buddy-tools.bat` uses. When it is not set, the app asks
for it and writes your choice to `.env`.

The app is portable: it keeps its settings, your local data (gear sets, trackers, ...) and caches in the `data` folder
next to `nw-buddy.exe`. Keep that folder when you update the app to a new version. If the app folder is not writable
(e.g. in `Program Files`), it uses `%APPDATA%\nw-buddy-desktop` and `%LOCALAPPDATA%\nw-buddy-desktop` instead.

## Tools server

The `nw-buddy-tools.bat` is a shortcut to start the tools server, without running `nw-buddy.exe`.
Use this, if you want to use `https://www.nw-buddy.de/pak` with tools enabled, instead of running the desktop app

1. In `.env`, set `NW_GAME` to the New World installation directory and remove the `#` in front of it (already done
   if you chose the folder in the desktop app)
2. run `nw-buddy-tools.bat` to start the server
3. Open http://localhost:8000 in Chrome or Edge, or https://www.nw-buddy.de/pak

You can improve load times a bit by using https://localhost:8443 instead. This requires you to run a `certutil` command
(logged on first start) and accept that generated certificate. This enables HTTP/2 over HTTPS which does not have the 6 connection
limit as HTTP does. Skip this, if you're not sure. HTTP is still fine.

## Links

- https://github.com/giniedp/nw-buddy
- https://github.com/giniedp/nw-buddy/blob/master/docs/level-server.md
- https://www.nw-buddy.de/pak
