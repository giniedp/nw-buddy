# Stage of the transmog editor

Builds `character/stage.glb`, the character creation ship (`ftue_v2_cc`), from the game files:

```sh
pnpm dev:nwbt                     # in another shell, the publish step downloads the probe cubes from it
pnpm nw-stage                     # writes dist/nw-cdn/models/character/stage.glb, about 6 minutes
pnpm nw-stage --from=shrink       # starts at a step, with the results of the last build
pnpm nw-stage --out=<models root> # writes to <models root>/character/stage.glb instead
```

Needs Go, the game folder in `.env` and `ktx` (KTX-Software) in the path. Work files are in `.nwbt/stage`.

## Steps

1. `export`: `nwbt models entities` with the settings of `config.json` and the original textures (PNG), and a tiny DDS
   export for the formats of the textures. Fails if the nodes or materials differ from the ones `data/frame.json` was
   made for; `--accept-export` stores the new signature
2. `process` (`process.mjs`): keeps what the fixed camera sees, drops and replaces the picks, culls lights, adds the
   detail maps and the light blockers, instancing, writes the `nwStage` node. The textures stay untouched
3. `analyze` (`analyze.mjs`): rasterizes the editor's camera views, the needed texture size and the largest screen share
   of every material. `.nwbt/stage/ids.png` shows the default view, a color per material
4. `shrink` (`shrink.mjs`): removes textures the viewer does not sample (also all of the plain glTF materials, other
   viewers show the stage untextured) and Illum models no view sees, resizes the original textures and encodes them as
   KTX2. The only step that encodes
5. `publish`: embeds the probe cubes as RGB9E5 KTX2 and writes the stage

## What to adjust

| what | where | rerun from |
| --- | --- | --- |
| drop a model | its diffuse map in `data/drop.json` `diffuse` | `process` |
| replace a texture set by another | `data/reuse.json` | `process` |
| character spot, camera, time, exposure | `config.json` `stage` | `process` |
| black walls beside the visible part of the ship | `config.json` `blockers` (a plane at `x`, its `y` and `z` range, glTF coordinates) | `process` |
| detail map of a close surface (Illum detail mapping) | `config.json` `details`: diffuse of the material, detail texture of the export, tiling, strengths | `process` |
| size of one texture | `config.json` `textures.sizes`: image name or its file name → larger side, up to its original size, e.g. `{ "jav_prp_rumjug_diff.dds": 512 }` | `shrink` |
| textures encoded with less loss | `config.json` `textures.fine` | `shrink` |
| largest and smallest size | `config.json` `textures.maxSize`, `minSize` | `shrink` |
| which models get smaller textures | `config.json` `textures.smallShare` (share of the screen) | `shrink` |
| screen the sizes are made for | `config.json` `textures.screenHeight` | `analyze` |
| level, box, excludes, cutscene | `config.json` `export` | `export` |

`data/frame.json` and `data/frame-points.json` (what the fixed camera sees) come from `blender_frame.py`, only needed
again when the camera range or the export changes. `data/similar.json`: flat textures that become factors.

The camera ranges in `analyze.mjs` follow `DEFAULT_VIEW_LIMITS` in `apps/viewer/src/character-viewer.ts`.
