![New World Buddy](./docs/screenshots/nw-buddy-1.png)

# New World Buddy

New World Buddy is a desktop application designed to be used while playing New World.

## Features

- Browse ingame items (links to nwdb.info or nw-guide)
- Tracking/Bookmarking system (Track your learned recipes or named items collections)
- Crafting calculator and shopping list tool
- Price importer
- Expedition insights
- Armorsets overview and tracker
- XP and Tradeskill tracker
- Gearset builder
- Umbral shard upgrade tool

## Links

- website: https://www.nw-buddy.de/
- github: https://github.com/giniedp/nw-buddy
- releases: https://github.com/giniedp/nw-buddy/releases
- discord permalink: https://discord.gg/PWxUwUagVX 


# Development

This repository does not contain the ingame data. Ingame data must be extracted from a local New World installation during development.

The software and development stack is based on the following technologies:

- pnpm
- Angular
- Tailwind css (Daisy UI)
- Electron

For build commands, see package.json

## Quickstart

```bash
git clone git@github.com:giniedp/nw-buddy.git
cd nw-buddy
# create a .env file from example file
cp .env.example .env
# install dependencies
pnpm install
# download recent new world data files
pnpm nw-cdn download
# start development server
pnpm dev:web
```

## Game Data Extraction

You can download game data from CDN (see quickstart) and skip the extraction step.

### Prerequirements

- Review the [tools/bin](tools/bin) directory. Those binaries are used during data import.
- Requirements of https://github.com/giniedp/nw-extract do apply.
  - `oo2core_8_win64.dll` and `texconv.exe` are already in the tools/bin directory
- Install [ImageMagick](https://imagemagick.org/), which is required to convert images
- Copy `.env.example` to `.env` and adjust env variables as you need
  - When working on PTR use the `NW_USE_PTR=true` variable or switch to the `ptr` branch

### Unpack (optional)

If you have already unpacked the game folder, adjust the `NW_UNPACK_LIVE` and/or `NW_UNPACK_PTR` env variables accordingly and skip the rest of this step.

Run `pnpm nw-extract`. This will extract all the necessary game data to whatever `NW_UNPACK_LIVE` and/or `NW_UNPACK_PTR` is set to.

### Convert (mandatory)
This will read files from the unpacked game data folder, convert them and place the results in `tmp/nw-data/live` (or `tmp/nw-data/ptr`). The conversion includes:

- `.dds` -> `.png`
- `.datasheet` -> `.json`
- `.loc.xml` -> `.loc.json`
- object stream conversion into `.json`

### Import (mandatory)
This will read files from the conversion folder and prepare them for runtime use, e.g.
- convert `.png` -> `.webp`
- generate code and types from datatables
- exctract only neccassary localization strings
- and more (check code)

The results are written to `dist/nw-data/live` (or `dist/nw-data/ptr`)

## Running dev server

Run `pnpm dev`. Starts both, the electron app and a web browser in parallel
Run `pnpm dev:web` if you only need a web browser for development

## Building the app

There are multiple target that can be built

### Electron App
Run `build:electron`. This will build the electron frame, the web app with electron target and then bundle it all together. The resulting `.exe` is written to `releases/nw-buddy [VERSION].exe`

### Web App
Run `build:web`. This will build the web app that can be uploaded and hosted on a server. The result is written to `dist/web`
