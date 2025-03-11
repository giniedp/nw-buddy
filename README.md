![New World Buddy](./docs/screenshots/nw-buddy-1.png)

# New World Buddy

New World Buddy is a web application that provides data and tools for the game [New World](https://newworld.com/).

This is a private project. We are not affiliated by Amazon or Amazon Game Studios.

All data and assets extracted using these tools are the intellectual property of AGS. Please respect the
[Amazon Games Content Usage Policy](https://www.amazon.com/gp/help/customer/display.html?nodeId=GNX7GA7HXVL9V8XZ&pop-up=1).


## Features

- Browse ingame items (links to nwdb.info or nw-guide)
- Tracking/Bookmarking system (Track your learned recipes or named items collections)
- Crafting calculator and shopping list tool
- Price importer
- Expedition insights
- Armorsets overview and tracker
- XP and Tradeskill tracker
- Gearset builder

## Links

- website: https://www.nw-buddy.de/
- github: https://github.com/giniedp/nw-buddy
- discord permalink: https://discord.gg/PWxUwUagVX

# Development

This repository does not contain the game data. Game data must be extracted from a local New World installation during development.

The software and development stack is based on the following technologies:

- golang
- pnpm
- Angular
- Tailwind css (Daisy UI)
- Electron

For build commands, see package.json

## Quickstart

- `node` runtime and `pnpm` package manager are required. See [.nvmrc](.nvmrc) for current version

```bash
git clone git@github.com:giniedp/nw-buddy.git
cd nw-buddy
# create a .env file from example file
cp .env.example .env
# install dependencies
pnpm install
# download recent new world data files
pnpm nw-cdn download -v live
# start development server
pnpm dev:web
```

## Prepare dev environment

- make sure golang is installed. See  [go.work](go.work) for current version
- if you use `vscode`, make sure the `go` extension is installed
- make sure `.env` file exists, copy it from [.env.example](.env.example) and update `NW_GAME_LIVE` (and `NW_GAME_PTR`) variables
- run `pnpm nwbt vet` to check if game packages can be accessed and tools are available

Some missing tools can be ignored. All required tools are in the `./tools/bin` directory and should be available.

## Update game data for small patches

```bash
pnpm nwbt pull
```

This extracts and processes assets and datasheets. It also generates and updates front-end type definition files. Use a git diff tool to see what has changed.
If there are breaking changes, `pnpm dev:web` should yell at you. Small patches are usually fine without further code changes.

## Update for big patches

Scan data for runtime type information

```bash
pnpm nwbt types scan
```

This should update type information json files without changing source code files. Again, use git diff tools to see what has changed.

Now generate source code

```bash
pnpm nwbt types generate
```

This will generate golang source code and may break the `nwbt` tools. Fix golang errors to continue.

```bash
pnpm nwbt pull
```

This updates frontend data and generates types. Fix whatever needs to be fixed.

## NWBT

`pnpm nwbt --help` shows all available commands.

## Running dev server

Run `pnpm dev`. Starts both, the electron app and a web browser in parallel
Run `pnpm dev:web` if you only need a web browser for development

## Building the app

There are multiple target that can be built

### Electron App

Run `build:electron`. This will build the electron frame, the web app with electron target and then bundle it all together. The resulting `.exe` is written to `releases/nw-buddy [VERSION].exe`

### Web App

Run `build:web`. This will build the web app that can be uploaded and hosted on a server. The result is written to `dist/web`
