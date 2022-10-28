![New World Buddy](./docs/nw-buddy-1.png)

# New World Buddy

New World Buddy is a desktop application that is meant to be used along while playing "New World".

## Features

- Browse ingame items (links to nwdb.info)
- Bookmark items (3 star system)
- Calculate crafting shopping list, prices and rewarded xp
- Price importer
- Expedition insights
- Armorsets overview and tracker
- XP and Tradeskill tracker
- Gearset builder
- Umbral shard upgrade tool

## Links

- website: https://nw-buddy.ginie.eu/
- github: https://github.com/giniedp/nw-buddy
- releases: https://github.com/giniedp/nw-buddy/releases
- discord permalink: https://discord.gg/PWxUwUagVX 


# Development

This repository does not include the ingame data. Ingame data needs to be extracted from a local "New World" installation during development.

Besides that, the software is based on following technologies

- Yarn
- Angular
- Tailwind css (Daisy UI)
- Electron

For build commands please see package.json

## Prerequirements

1. Requirements of https://github.com/giniedp/nw-extract do apply.
  - put the `oo2core_8_win64.dll` into project root folder
  - download [texconv.exe](https://github.com/microsoft/DirectXTex/releases) and put it in project root
2. install `yarn` (https://yarnpkg.com/) and run `yarn install`
3. create a `.env` file and copy contents of `.env.example`. Adjust env variables as you need
4. When working on PTR change the `NW_USE_PTR=true` in `.env`

## Extracting and importing game data

Run `yarn nw-extract`. This will extract all necessary game data to `tmp/nw-data/live` (or `tmp/nw-data/ptr`)

Run `yarn nw-import`. This will import data from `tmp/nw-data/live` to `apps/web/nw-data/live` and convert images to `.webp`

## Running dev server

Run `yarn dev`. Starts both, the electron app and a web browser in parallel
Run `yarn dev:web` if you only need a web browser for development

## Building the app

Run `yarn build` to compile the web and build the electron app. The resulting `.exe` is written to `releases/nw-buddy [VERSION].exe`

Run `yarn ng build --base-href /` for a pure web build (wihtout electron). Result is written to `dist/web`

## Building with docker

Run `yarn docker:build` to build the web app and the docker container. The container is named `nw-buddy:latest`
Run `yarn docker:start` to start the container. Navigate to `http://0.0.0.0:4200`
