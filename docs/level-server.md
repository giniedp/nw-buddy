# Browse game files and levels with nwbt

`nwbt` reads the `.pak` files of a New World installation and serves them over HTTP. Files are converted on request if needed.
The viewer runs in the browser and loads its data from `nwbt`.

The desktop app starts its own `nwbt`. This guide is for running `nwbt` manually.

## Requirements

- Windows with New World installed
- Chrome or Edge (WebGPU)
- Go and pnpm to build `nwbt`, see the readme

`nwbt.exe` needs the other files in `tools/bin`: the Oodle DLLs and `viewer.zip`. `NW_OODLE` in `.env` points to
another Oodle library file (required off Windows, where nwbt has no default).

## Setup

```
git clone git@github.com:giniedp/nw-buddy.git
cd nw-buddy
copy .env.example .env
pnpm install
pnpm nwbt:build
pnpm viewer:build
```

`nwbt:build` and `viewer:build` build `tools/bin/nwbt.exe` and `tools/bin/viewer.zip`, they are not in git.

In `.env`, set `NW_GAME_LIVE` to the New World installation directory, e.g.
`C:/Program Files (x86)/Steam/steamapps/common/New World`. For the PTR, set `NW_GAME_PTR` and `NW_WORKSPACE=PTR`.

Run all commands from the repository root. Check the setup:

```
./tools/bin/nwbt vet
```

`vet` loads all `.pak` files and lists the helper programs it found. If loading fails, fix `NW_GAME_LIVE`.
ktx ([KTX-Software](https://github.com/KhronosGroup/KTX-Software/releases), for KTX2 textures) and gltf-transform
are optional. Without ktx, KTX2 exports fail (`models --ktx`, `textures=ktx2`).

`./tools/bin/nwbt` lists all commands, `./tools/bin/nwbt <command> --help` lists the options of a command.

## Start the server

```
./tools/bin/nwbt serve
```

- http://localhost:8000: game files and the viewer app
- https://localhost:8443: the same over HTTPS with HTTP/2
- Conversions to `.glb`, `.png` and `.zip` (previews and exports) are cached in `.nwbt/cache`
- Options: `--port`, `--host`, `--tls-port` (`0` disables HTTPS), `--mem-limit` (default `8GiB`)

### HTTPS

HTTP/2 loads levels much faster than HTTP/1.1, which limits the browser to 6 connections per host. On the first start
`nwbt` creates a self-signed certificate in `.nwbt/tls` and logs the command to trust it for the current Windows user:

```
certutil -user -addstore Root "<repository>/.nwbt/tls/cert.pem"
```

Run it once, then use https://localhost:8443.

## Open the viewer

- https://localhost:8443 or http://localhost:8000
- https://www.nw-buddy.de/pak (connects to http://localhost:8000)

Tools:

- **Viewer**: levels, starts with the main menu scene
- **Browser**: files in the `.pak` archives, with previews and exports
- **Data**: datasheets

Camera:

- `W` `A` `S` `D`: move, `Q` `E`: down and up, `Shift`: faster
- Left mouse drag: turn
- `Alt` + mouse wheel: movement speed

## Other commands

- `list`, `cat`, `stat`, `inspect`: find files and print their content or metadata
- `models`: convert models to glTF / glb
- `unpack`: extract files, optionally converted (object streams to JSON, images)
- `cache clear`: delete the cache
