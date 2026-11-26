# nw-viewer UI

The UI is Solid + [tweak-ui](../../../../../tweak-ui). Simplicity and consistency come first.

## Components

- Use tweak-ui components first.
- Write a custom Solid component only where tweak-ui has nothing. Build it from tweak-ui's component
  classes (`twk-btn`, `twk-input`, `twk-tabs`, …) and the tokens below.
- Heavy dependencies load lazily on first use: monaco for text, ag-grid community for tables.
- Label / value rows of facts use `InfoRow` (`ui/common/InfoRow.tsx`). tweak-ui's `PollWidget` reads its value on an
  interval: only for values the engine changes without telling, never for props or store state.
- Engine objects edited in panels go through `PanelScope` / `usePanel()` (`ui/viewer/PanelScope.tsx`). Values the
  engine changes on its own go through `track`. Viewer and config events go through `fromChannel` / `configValue`
  (`ui/common/reactive.ts`).

## Views and stores

A view with state or logic gets its own folder, named after the area (`browser/views/texture/`):

```
texture/
├── TextureMode.tsx          component, render only
├── TextureMode.store.ts     state + actions (createTextureModeStore)
├── TextureMode.css          styles of this view only, if needed
├── TextureMode.spec.ts      tests, if needed
└── types.ts                 the interfaces of the folder
```

Helpers used by this view only (loaders, formatters) go into the folder too, e.g. `texture/dds.ts`.

- **Component**: calls `createXStore(props)` once and renders `store.state`. It keeps only what belongs to the DOM: refs,
  pointer tracking, translating DOM events into store actions (e.g. into fractions of the element size). Option lists
  for buttons (labels, titles) are view constants and stay in the component.
- **Store**: `createXStore(props)` runs inside the component, so its effects, memos and `onCleanup` belong to it. It
  returns `{ state, ...actions }`:
  - `state` is one Solid `createStore`, read-only for the view. Plain fields hold what the user changes, derived values
    are getters backed by memos (`get info() { return info() }`).
  - Actions are plain functions with no `this`, so the view passes them directly (`onClick={store.fit}`).
  - Engine objects (viewer, previews, grid api) are private variables of the store, the view never sees them.
  - Data for other libraries or objects of other owners (grid rows, an `AudioBuffer` for a canvas) stay out of
    `state`: a store wraps plain objects and arrays in proxies. The store hands them out through an accessor next to
    the state (`store.rows()`, `store.clip()`).
- **Several views in one folder** (e.g. `audio/` with `AudioBankMode` and `AudioMediaMode`): one component and store
  pair per view. Store parts they share are plain modules named for what they do (`audio/playback.ts`,
  `createPlayback`), and they return the same `{ state, ...actions }` shape.
- **One view for different data** (e.g. `code/`: text, xml, json, lua): the variants are data objects (`sources.ts`,
  `TextSource`), the registry builds the components with a factory (`codeMode(sources.lua)`).
- **Views by type** (`NODE_VIEWS` in `viewer/nodes/registry.ts`, `PASS_FIELDS` in `viewer/pipeline/passFields.tsx`,
  like `ASSET_VIEWS`): a module constant of descriptors, each built by a typed helper (`nodeView(Mesh, { … })`) so the
  component's props match the class. The lookup takes the view of the class or of its closest base class
  (`nodeViewOf`), no registry instance is passed around. `<NodeProps data={x} />` renders the view of any object: it
  guards null and renders anew for another object, so the props components get an object that does not change and
  need no `Show`.
- **Panels of engine objects** (the `XProps` in `viewer/nodes/`) bind the object with `panel.bind` / `panel.pull` and
  have no store, unless they have logic of their own (`entity/GameEntityProps.store.ts`).
- **Dialogs** use `ModalDialog` (`ui/common`). The open state and the `open` / `close` actions are in the store of the
  view that opens it. Content that loads something is created on open (`<Show when={store.state.open}>`).
- **Child views of a view** (e.g. `character/` with `CharacterAnimations`, `CharacterAdbFragments`) get the parent
  store as a prop (`mode={store}`) instead of a set of callbacks, and their own store reads and calls it. Engine
  objects the children need go through accessors of the parent store (`mode.character()`), not through the views.
- **Polled engine data** (parts, play state) goes into the state with `setState('parts', reconcile(list))`: rows keep
  their identity and only the changed fields update, no `equals` functions on signals.
- **Shared JSX** (e.g. a `Reading…` fallback used twice) is a function (`const reading = () => <p/>`): an element in a
  variable is one DOM node and can only be in one place.
- **Initial state** is new objects on every call (`defaultSettings()`), never a shared constant: the store changes
  nested objects in place.
- **Props in stores**: read an expression prop (e.g. `shown={a() && b()}`) through a memo created in the store. Solid
  compiles it into a getter that creates a memo on every read, and a read from an async callback (engine, events)
  leaks one each time ("computations created outside a `createRoot`").
- **Effects** that push state into an object must read the state first, before any early return. Otherwise the effect
  tracks nothing on its first run and never runs again.
- **Resources**: reading a failed resource throws. Guard the value with `res.error`, e.g. in a memo.
- **Pure functions** (formatting, counts) are exported from the store file, or a helper file of the folder, and tested
  in the spec without a component.
- **Styles**: the component imports its `.css` (`import './TextureMode.css'`). Rules shared by several views stay in
  `src/ui/styles/`. A component's css loads with its chunk: the tools are lazy (`App.tsx`), so a rule one tool takes
  from another (e.g. the Data tool's sidebar from the browser) belongs in `src/ui/styles/`, not in the other tool's css. The rules of the Styles section below apply to both.

## Content: does the user need to know it?

Before adding a label, number, badge or panel, ask whether the user needs it for the task at hand.
If not, leave it out, or put it where it is looked up on purpose (a details view, a tooltip).

## Styles

- Styles are `nw-` classes in `src/ui/styles/`, one file per area, imported by `styles/index.css`. The styles of a
  single view live next to it (see Views and stores). The lib build bundles both into one stylesheet:
  - `tokens.css`: tokens and tweak-ui theme overrides
  - `base.css`: fonts (`fonts/`, relative urls), shared helpers
  - `app.css`: the shell of the tools, and `.nw-viewer-app`, the mount element of the app lib
  - a file per new area

  The viewer tool has no file there: each of its views has its css next to it.

- `page.css` is the page of the standalone app (`index.html`). It is not imported by `index.css`: the app lib
  (`src/app.tsx`) is mounted into a host page, so no rule may target `html`, `body` or plain elements.
- No inline styles for look. `style` is only for geometry computed at runtime, e.g. a popover
  positioned from a measured rect.
- **Colors** use only the `--nw-*` tokens from `tokens.css`, never literals. Tints use `color-mix`
  with the text color, so they follow the theme. Add a token instead of a one-off color.
- **Sizes** are rem. Only border and separator widths use px (`1px solid var(--nw-line)`). Relative
  units (`%`, `vh`, `fr`) are fine for layout.
- **Font sizes**: there are three, and no others:
  - `--nw-text-sm` (0.6875rem): secondary text such as counts, type labels and units
  - `--nw-text-md` (0.75rem): body text, the default, and the tweak-ui control text
  - `--nw-text-lg` (0.875rem): titles

  For emphasis, use weight or `--nw-text-dim` before another size.

- **Shared helpers**:
  - `.nw-muted`: secondary text
  - `.nw-note`: a short message in place of content, such as an empty list
- tweak-ui's public utilities (`twk:bg-*`, `twk:p-*`, …) are allowed in small amounts. A
  repeated combination becomes an `nw-` class.

## Icons

- Use only Font Awesome Pro icons (we have a license), style **sharp-light** (`svgs-full`).
- `src/ui/icons/` is the single source of all icons. It is flat and named exactly like the FA icon
  (`folder-open.svg`). Files there may be replaced by hand at any time, and code only refers to the
  name.
- Icons color through `fill="currentColor"` only, and are colored from CSS with `color`. No
  other fill or stroke colors, no `style`/`class` in the svg.
- Import with Vite's raw loader and pass it to tweak-ui:
  `import svgFolder from '../icons/folder.svg?raw'`, then `<Icon svg={svgFolder} />`.
- Never write svg markup in `.ts`/`.tsx`.

## Logging

Never log data objects, only primitives. Chrome keeps logged objects alive.
