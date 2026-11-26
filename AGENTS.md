# nw-buddy

New World Buddy: a database and toolset for the game New World. A pnpm workspace (pnpm 9) with an Angular web app, a
game file viewer, a Windows desktop app and Go tooling that reads the game's `.pak` files.

If `AGENTS.local.md` exists next to this file, read it too: it describes repositories on the maintainer's machine
that are not part of this checkout.

## Layout

- `apps/web`: the Angular app (www.nw-buddy.de). Tailwind v4 + daisyUI, Ionic, ag-grid (see below)
- `apps/viewer`: `@nw-buddy/viewer`, the game file viewer (SolidJS + gglib, WebGPU). Runs standalone and is embedded
  into the web app at `/pak` as a lib build
- `apps/desktop`: the Windows desktop app (Wails v3, Go): the web app in a WebView2 window with nwbt as child process
- `apps/server` (SSR), `apps/storybook`, `apps/e2e` (Playwright), `apps/pocketbase`, `apps/docker`
- `libs/nw-data`: data types and generated code
- `tools/nwbt`: nwbt, the Go CLI and server for the game files. `tools/*.ts`: generators and CDN scripts
- `dist/nw-data`: git submodule with the extracted game data; `dist/nw-data/.current` links to the active workspace
  (live or ptr). The web app serves it at `/nw-data`
- `tmp/`: plans and scratch files, not checked in

## Development

All commands run from the repository root.

- `pnpm dev`: everything at once: web app (dev-cdn config), viewer lib watch build, nwbt and the desktop app
- `pnpm dev:web`: only the Angular dev server at localhost:4200. `/pak` needs a viewer lib build
  (`pnpm viewer dev:lib` or `pnpm viewer build:lib`) and a running nwbt
- `pnpm dev:viewer:only`: the standalone viewer (localhost:5173) with nwbt
- `pnpm dev:desktop:only`: the desktop app with nwbt, needs the web dev server at localhost:4200
- `pnpm lint`, `pnpm test:unit`, `pnpm test:e2e`

### Angular dev server

- `angular.proxy.mjs`: `/nwbt` goes to nwbt at localhost:8000. `/nw-data` and `/viewer-lib` are served by static
  servers (sirv) that the proxy config starts inside the `ng serve` process
- The dev configurations in `angular.json` have their own asset lists without nw-data and the viewer lib: Angular
  globs and watches its assets on every rebuild, and nw-data alone has ~60k files. Production builds still copy both
- Tailwind only scans `apps/web` (`source('../..')` in `styles/vendor/tailwind.css`): every scanned file is a watch
  file of the stylesheet

### Viewer

- `pnpm viewer <script>` runs a script of `apps/viewer`: `dev` (standalone dev server), `dev:lib` (lib watch build),
  `build:lib`, `build:types`, `test` (vitest browser mode), `exec tsc` (type check)
- Lib mode (`build:lib`, `dev:lib`): the engine and the app in `apps/viewer/dist/lib` with a relative base (workers and
  assets load next to the module). Vite empties `dist/lib` on every build, so the declarations go to `dist/types`
  (`build:types`), which the web app's tsconfig paths point to
- App mode: `pnpm viewer:build` builds and zips the standalone app into `tools/bin/viewer.zip` (not in git), which nwbt
  serves at `/`. `nwbt serve` exits without it

### nwbt

- `pnpm nwbt <command>` runs nwbt from source (`go run ./tools/nwbt`), `pnpm nwbt help` lists the commands. New
  commands go into `tools/nwbt/commands`
- `pnpm nwbt:build` builds `tools/bin/nwbt.exe` (not in git), which the desktop app starts and packages. The other
  files in `tools/bin` (cLuaDecompiler, Oodle DLLs) are checked in
- `pnpm dev:nwbt` serves the game files at localhost:8000 and HTTPS/HTTP2 at :8443 (self-signed localhost
  certificate). Restart it after code changes. The game folder comes from `.env`
- It reads the `.pak` files directly, nothing is unpacked. Use `nwbt list`, `nwbt cat` or the HTTP API to inspect
  game files. Level files: see [Docs](#docs)
- Conversions to `.glb`, `.png` and `.zip` (previews, exports) are cached in `.nwbt/cache`, `nwbt cache clear` clears it

### Desktop app

- `go -C apps/desktop run ./tools/build [-dev] [-package] [-exclude=a,b] [-run -- <app args>]` builds into
  `dist/desktop` (`pnpm build:desktop` builds nwbt, the viewer and the web app first,
  `pnpm dev:desktop` builds nwbt). `apps/desktop` has a `go.work` of its own:
  it is not part of the root `go.work` (Wails needs Go >= 1.26)
- Packaged layout: `nw-buddy.exe`, `nw-data.zip` (the standalone web build, served from the archive, map tiles excluded by
  default), `bin/` (nwbt.exe, viewer.zip and its helper files) and, from `apps/desktop/templates`, `nw-buddy-tools.bat` (runs
  `bin\nwbt.exe` in the app folder, `serve` without arguments), `.env` (game folder for nw-buddy-tools.bat, commented out) and `README.md`. Each build
  writes `rsrc_windows_amd64.syso` (icon, version info)
- Portable: a packaged app keeps config, WebView2 profile and nwbt caches in `data/` next to the exe (user folders
  when that is not writable, and in dev runs). A `dist/desktop/data` from a local run must not go into a release zip
- Update check (`apps/web/app/widgets/update-alert`): the newest `v*` GitHub release (prereleases included) against
  `package.json` version. Tag releases `v<package.json version>`
- The page origin is `http://wails.localhost` (`http://wails.localhost:4200` with `-dev-server`); CDN CORS rules
  must allow it. The app proxies `/nwbt` to its nwbt child process on the same origin. Wails turns a 304 into a 500,
  so the proxy drops conditional request headers
- Single instance per Windows session (`de.nw-buddy.desktop`): a second start hands its arguments to the first and
  exits. Dev and release builds share the ID
- Releases (desktop app with nwbt) go to https://github.com/giniedp/nw-buddy/releases

### ag-grid

- The web app and the viewer both use `ag-grid-community` with the Theming API, pinned to the same exact version in
  both package.json files. Keep them in sync: ag-grid keeps its style state per version, different versions both
  name their theme classes `ag-theme-params-1` and override each other
- Web app: the `nwbGrid` directive, theme in `apps/web/app/ui/data/ag-grid/theme.ts`, extra rules scoped to
  `.nwb-grid` in `styles/vendor/ag-grid.css`. No legacy CSS themes: they style every grid on the page

## Docs

### Level format

`docs/level-format.md`: the file structure of New World levels and how nwbt parses it: `tracts.json`, impostors,
`world.json`/`playable.json`, terrain, region distribution, capitals, chunks, and how levels, slice spawns and entity
data are traversed.

### Level server

`docs/level-server.md`: manual use of nwbt: `.env` setup, `nwbt vet`, `nwbt serve` (HTTP and HTTPS/HTTP2), opening
the viewer, camera controls and the other nwbt commands.

## gglib and tweak-ui

The viewer uses the gglib packages (`@gglib/*`, rendering framework) and `tweak-ui` (UI components). For now they are
`file:` dependencies on sibling checkouts (`../../../glib/packages/*`, `../../../tweak-ui`) and resolve to hard-linked
copies of their `dist`: after a change, build the package there and run `pnpm install` here, otherwise the viewer keeps
the stale copy. They will soon be regular package dependencies, a checkout of nw-buddy alone will then be enough.

## Working rules

- Create files with the Write tool and change them with the Edit tool. No heredocs (`cat > file <<'EOF'`,
  `node - <<'EOF'`), `sed -i`, or python / node patch scripts
- Scripts that import project packages (playwright) go into a folder of the project (e.g. `tmp/<plan>/`), so Node
  resolves them from its `node_modules`
- Always use braced `if` blocks, never single line inline ifs
- Arrow functions and ternaries stay inline only when short. Longer ones get a braced body with `if` blocks and an
  explicit `return`
- Format every touched file with prettier (`npx prettier --write <files>`)
- Files are LF, in git and on disk (`.gitattributes`: `eol=lf`, `.bat` files CRLF). Check with `git ls-files --eol`:
  Git Bash's grep hides the CR of CRLF lines
- Do not commit, the maintainer commits
- Plans: one folder per plan in `tmp/<topic>/`, screenshots go there too. Older viewer plans are in `apps/viewer/tmp`.
  Plans are not checked in and may be deleted after a session
- Time requests against `127.0.0.1`, not `localhost`: on Windows curl tries IPv6 first and adds ~200 ms per request

## Chrome

- Start one Chrome session with remote debugging enabled, so the maintainer can open scene locations to work on
- Connect over the debug port for inspecting and profiling
- Agree on scene changes; preferably do not move between profiling sessions
