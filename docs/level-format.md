# Level format

A New World level has two parts:

- the CryEngine level under `levels/`: level info, mission and the level's root slice
- the Coatlicue project under `sharedassets/coatlicue/<project>`: regions, terrain, placements and streaming data

The level does not name its project. The game sets the project before it loads the level. A `GameModeMapStaticData`
row names its project by `CoatlicueName` (`coatlicue\NW_Dungeon_Everfall_00`). The project finds its level by name
(case insensitive), then by the name's last folder (`coatlicue/FTUE_V2` → `levels/ftue_v2`).

World space is Z up, in metres. Region `(x, y)` covers `[x, x + 1) × [y, y + 1)` times `regionSize`.

## File structure

```
levels/<path>/<level>/
├─ level.pak                     cooked level archive
├─ levelinfo.xml                 HeightmapSize, missions
├─ mission_mission0.xml          environment, time of day; every level declares one mission, Mission0
├─ mission0.entities_xml         the level's root slice: level wide entities no placed slice owns
└─ resourcelist.txt              .cgf / .mtl preload list

sharedassets/coatlicue/<project>/
├─ tracts.json                   region size, cell sizes, regions, tract definitions, territories
├─ terrain.json                  terrain generator, mountain height, ocean level, world material
├─ offlineoptions.json           impostor cell size, distribution / vegetation switches
├─ world.json                    region list (optional)
├─ playable.json                 region list
└─ regions/r_<±XX>_<±YY>/
   ├─ capitals/**/<layer>.capitals.json   placements of one layer
   ├─ capitals/**/<layer>.chunks          chunk list of one layer
   ├─ capitals/**/<layer>.metadata        map records of one layer
   ├─ region.chunks             chunk list of all layers
   ├─ region.distribution       scattered slices (trees, rocks, gatherables)
   ├─ region.slicedata          slice descriptors of the distribution
   ├─ region.heightmap          16 bit TIFF
   ├─ region.waterqt            water quadtree
   ├─ region.tractmap.tif       tract index per cell
   ├─ localmappings.json        tract map palette
   ├─ region.vegetation         baked grass and bushes
   ├─ region.metadata           map records of the region
   ├─ mapsettings.json          cellResolution, regionSize, regionType
   ├─ impostors.json            far meshes, vegetation
   ├─ impostors/impostor_<cell>.cgf, .cgfheap
   ├─ poi_impostors.json        far meshes, points of interest
   └─ poi_impostors/impostor_<cell>.cgf, .cgfheap
```

A region directory is named by its column and row, signed and zero padded: `r_+05_+03`.

## `tracts.json`

```json
{
  "tractmapCellSize": 1,
  "heightmapCellSize": 1,
  "regionSize": 2048,
  "territoryMasterSlicePath": "slices/POIs/Territories/Territories_Master.dynamicslice",
  "world": { "type": "Island", "width": 7, "height": 7 },
  "tracts": [{ "name": "grassland", "displayColor": { "r": 204, "g": 255, "b": 204 } }],
  "regions": [{ "name": "greenZone", "spawnManifests": ["greenZone"] }],
  "forcedRegions": [{ "location": { "x": 0, "y": 0 }, "regionName": "greenZone" }]
}
```

- `regionSize`: side of a region in metres. 2048 for Aeternum and most levels, 1024 for FTUE
- `heightmapCellSize`: heightmap sample spacing
- `tractmapCellSize`: authored tract map spacing. The shipped tract maps are baked at a different spacing, see
  [tract map](#regiontractmaptif-and-localmappingsjson)
- `world`: `worldOrigin` (default 0), `width` and `height` in regions (default 1)
- `tracts`: ordered tract definitions
- `forcedRegions`: binds a `regionName` to a `location`
- `territoryMasterSlicePath`: the slice that leads to the territory areas
  - Aeternum, battle royale and the frontend: `Territories_Master.dynamicslice`
  - combat levels: `Territories_Master_Combat.dynamicslice`
  - FTUE: none, no territory areas

### Territory areas

1. The master slice's `PrefabReferencerComponent` lists the slices of its `Slice Asset List`
2. Every entity of those slices with a `TransformComponent`, a `PolygonPrismShapeComponent` and a
   `TerritoryDataProviderComponent` is an area: territory id from the provider, outline from the prism's vertices
   placed by the entity's world transform, height from the prism

Points of interest are territory areas, not landmarks.

## `world.json` and `playable.json`

Both list region coordinates `[x, y]`:

```json
[
  [0, 5],
  [1, 2],
  [1, 3]
]
```

- `world.json`: the regions of the level
- `playable.json`: a subset of the regions that are playable

## `terrain.json`

```json
{
  "generatorType": "Heightmap",
  "heightCrop": 0.0,
  "mountainRoughness": 0.7,
  "mountainHeight": 2048.0,
  "snowMinimumSlope": 0.0,
  "snowStartHeight": 100.0,
  "valleyIntensity": 0.17,
  "oceanLevel": 40.0,
  "worldMaterialAssetPath": "Materials/terrain/NW_OPR_004_Trench/NW_OPR_004_Trench.worldmat"
}
```

- `mountainHeight`: the height of the largest heightmap sample
- `oceanLevel`: ocean surface height, `-1000` for no ocean
- `worldMaterialAssetPath`: a `.worldmat` object stream that lists one `.regionmat` per region. A region material
  holds `Layers` (`Material`, `SplatMap`, `AffectedTiles`, `Priority`), a `Default Material`, and macro color, gloss
  and normal maps

## `offlineoptions.json`

```json
{
  "distributionBakeSeed": 93016,
  "distributionDataEnabled": true,
  "vegetationDataEnabled": true,
  "streaming": { "impostorCellEdgeLength": 128, "regionChunksEnabled": true }
}
```

`streaming.impostorCellEdgeLength` is the impostor cell side in metres.

## Regions

### `region.heightmap`

- square TIFF, one unsigned 16 bit sample per `heightmapCellSize`, `regionSize / heightmapCellSize` samples a side
- scanlines run from the region's maximum y: the first row in the file is the last row in world space
- height = `sample * mountainHeight / 65535`
- terrain cookies are not in the file, they apply at load time, see [terrain cookies](#terrain-cookies)

### `region.waterqt`

The region's water heights as a quadtree, nodes listed breadth first. A node of height 65535 has four children. The
file is optional; a file that fails to decode fails the region.

### `region.tractmap.tif` and `localmappings.json`

- `region.tractmap.tif`: one byte per cell, a local tract position. Scanlines run from the region's maximum y
- `localmappings.json`: `localMappings.tracts` (`name`, `index`) and `localMappings.m_colors`, the palette. The name
  links a local position to a tract definition of `tracts.json`
- map side = `max(1, trunc(regionSize / spacing + 0.5))`. The shipped maps are baked:
  `sharedassets/coatlicue/tractoutputsettings.json` `targetSize` (1024) gives spacing `regionSize / targetSize`
  (2 for 2048 regions)
- the extensionless `region.tractmap` is read only when `region.tractmap.tif` does not exist

### `region.vegetation`

Baked grass and bushes in 16 m sectors: the bake of the region's vegetation areas. A header, an offset table and an
asset table, then the sectors. The game keeps sectors within `veg_bubbleSize` sectors of the camera and draws them
out to half that width.

### `region.metadata` and `<layer>.metadata`

ObjectStream `RegionMetadataAsset` (`BDA6ADF9-991E-489D-B0F5-796CC24D7AFB`): NPCs, AI spawn locations, gatherables,
territory landmarks, encounters, lore, in-game cinematics and instanced script parts, each at its world position, all
inside the region. `region.metadata` holds the region's records, a layer's `.metadata` the layer's.

### Impostors

Far meshes, one per cell of `impostorCellEdgeLength` (128 m, 16 × 16 cells in a 2048 m region). Two sets:

| Document             | Meshes             | Material                                                |
| -------------------- | ------------------ | ------------------------------------------------------- |
| `impostors.json`     | vegetation         | `Vegetation`, `%IS_GDE_IMPOSTOR%LEAVES`, alpha test 0.2 |
| `poi_impostors.json` | points of interest | `Illum`, `%IS_POI_IMPOSTOR`, alpha test 0.025           |

```json
{
  "materialAssetID": "",
  "impostors": [
    {
      "cellIndex": 0,
      "meshAssetID": "{D46366CA-BD6A-5CBE-8722-E3D7E067ED37}",
      "worldPosition": { "x": 64.0, "y": 64.0 }
    }
  ]
}
```

- only listed cells have a mesh. `meshAssetID` is the source UUID: sub id 0 is the `.cgf`, 1 its `.cgfheap`
- `worldPosition` is the cell centre. The vertices are placed across the cell in world x / y and carry their own
  heights
- the shipped documents leave `materialAssetID` empty: the cells use their own material, `<set folder>/r_+XX_+YY.mtl`,
  which samples the region's baked atlas. Vertex colors are white
- drawn out to 5000 m. Inside `185 m * g_GDE_ImpostorNearFadeDistanceScale` the shader clips impostor pixels, over
  the next 20 m it dissolves them
- no `_lodN` meshes

## Placements

### `*.capitals.json`

Capital layers load from `<region>/capitals.json` (if present) and from every file below `<region>/Capitals`
matching `.*\.json?` (case sensitive, breadth first). A layer's name is its file name without the last extension:
`art.capitals.json` → `art.capitals`.

```json
{
  "Capitals": [
    {
      "id": "6f218469-dae9-618c-c7ec-67caf94962eb",
      "worldPosition": { "x": 220.0, "y": 930.0, "z": 143.0 },
      "rotation": { "x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0 },
      "footprint": { "type": "Circle", "id": "3ce007f9-9711-0778-dadd-1f878cffbb20", "radius": 1.0 },
      "sliceName": "CoatGen\\831a57a1\\AI_CutNav_Box_3m_6f218469dae9618cc7ec67caf94962eb",
      "sliceAssetId": "{E4520C92-6BE0-536E-8E1F-2050EDB6CC91}:4962eb"
    }
  ]
}
```

- `id`: lower case UUID, unique across the install
- `worldPosition`, `rotation`, `scale` (default 1): the placement, in world space. Footprints add no offset
- `sliceName`, `variantName` (default empty), `sliceAssetId`: the slice
- `footprint`: a circle or a rectangle, with its own `id`
- `params`: editor values, e.g. `CAPITAL_TYPE` (`Claim`, `Settlement`, `Outpost`)
- `cookie`: terrain deformation, see [terrain cookies](#terrain-cookies)

A capital with `sliceName` exactly `<PLOT>` places no slice. Its `sliceAssetId` is the null id. Plots are most of a
level's capitals (Aeternum: 182,417 of 267,847). A plot's contents ship baked into the layer's chunks; a placed slice
is never baked.

### Chunks

ObjectStream `GridGenericAsset<AssetData>`. The region's `region.chunks` holds the chunks of all layers. When it is
absent, the region's `.chunk` and `.chunks` files are read. Only Aeternum ships `region.chunks`; battle royale and
the frontend ship layer `.chunks` only.

```json
{
  "chunks": [
    {
      "cellIndex": { "x": 0, "y": 0, "z": 0 },
      "size": 1024,
      "spawnRadius": 0,
      "layer": "08qp_roads",
      "chunkType": 0,
      "worldPosition": [6656, 6656, 48.77],
      "assetId": { "guid": "ebaf58f8-cd54-5f1e-a90f-ae4e3ddda43d", "subid": 3197738318 }
    }
  ]
}
```

- `size`: cell side, 32 m to 1024 m. `cellIndex`: the cell on the grid of that size from the region's low corner,
  `z` the level up the column
- `chunkType`: 0 static entities, 1 meshes, 2 collision
- `worldPosition`: cell centre at the height of the content. The chunk slice stands there, unturned; its entities are
  relative to it
- `layer`: the capital layer the chunk bakes
- a chunk becomes a capital with physical radius `size` and spawn radius `max(spawnRadius - size, 25)`, or
  `max(spawnRadius - size, 0)` for mesh chunks smaller than 128 m. Distances are measured past the physical radius

### Terrain cookies

A capital's `cookie` flattens the terrain towards `worldPosition.z`:

```json
"cookie": {
  "innerRadius": 10.0,
  "outerRadius": 20.0,
  "maxHeightBlend": 0.7,
  "edgeNoise": 0.15,
  "edgeNoiseFeatureSize": 4.0,
  "groundNoiseScale": 1.0
}
```

- defaults: radii 0, `maxHeightBlend` 0, `edgeNoise` 0.5, `edgeNoiseFeatureSize` 8, `groundNoiseScale` 0.5
- every capital of the tile's region with a positive `maxHeightBlend` applies, plots and placed slices, in ascending
  target z
- sample `(i, j)` of the tile is evaluated at `origin + (i + 1, j + 1) * cell`
- the edge is displaced by noise, the target gets ground noise (fBm): seed `0x12e3e`, a 1024 texel toroidal image of
  three OpenSimplex 4D octaves
- the target is quantized to u16, the blend is truncated

Blend per sample at `p`, `base` the current height:

```
inner  = innerRadius + edgeNoise * (outerRadius - innerRadius) * 0.5
d      = length(p + edgeNoiseOffset(p) - cookie.xy)
alpha  = smoothstep(0, 1, 1 - saturate(max(0, d - inner) / (outerRadius - innerRadius))) * saturate(maxHeightBlend)
height = mix(base, cookie.z + groundNoise(p), alpha)
```

`edgeNoiseOffset` samples at frequency `1 / edgeNoiseFeatureSize`, `groundNoise` has amplitude `groundNoiseScale`.

### `region.distribution`

Slices scattered over the region. Little endian, columnar:

| Field                   | Type                                            |
| ----------------------- | ----------------------------------------------- |
| magic `0xb9d6`, version | u16, u16; absent in the compact layout          |
| entry count `n`         | u16                                             |
| slice names             | `n` × (u8 length, bytes)                        |
| variant names           | `n` × (u8 length, bytes)                        |
| placement count `m`     | u32                                             |
| entry index             | `m` × u16                                       |
| position                | `m` × u32                                       |
| rotation                | `m` × u32                                       |
| scale                   | `m` × u8                                        |
| height mode             | `m` × u8, version ≥ 1 only                      |
| two point layers        | u32 count `k`, `k` × u32 position, `k` × u8 tag |

- slice path: `slices/<name>`, `.dynamicslice` appended unless present. An entry without a name places nothing. The
  entry's descriptor comes from `region.slicedata` by (`sliceName`, `variantName`), else from the slice's
  `.slice.meta`
- position: x in the high 16 bits, y in the low, each `code / 65535 * regionSize` from the region's low corner
- rotation: x in bits 21-30 and y in bits 11-20 (`code / 255 - 1`), z in bits 0-10 (`code / 511 - 1`), w rebuilt
  from them, negative when bit 31 is set; normalized
- scale: uniform, `code * 0.01`
- height: not stored. Mode 0 samples the terrain, 2 the water, 1 and above 2 the higher of both
- instance numbers count from 1 over the placements, then the point layers, in file order. Only the placements
  become capitals; inserting one renumbers every later one

`region.slicedata`: ObjectStream `RegionSliceDataLookup`, `sliceMetaDataMap` from (`sliceName`, `variantName`) to a
`SliceMetaData`. Lookup lowercases both names.

## Slices

### Slice metadata

`<slice>.slice.meta` beside each `.dynamicslice`: ObjectStream `SliceMetaData`, flattened at bake time.

| Member                                     | From                                  |
| ------------------------------------------ | ------------------------------------- |
| `gdeSpawnRadius`                           | `AoiComponent::m_sliceSpawnRadius`    |
| `gridRegistrationRadius`                   | `m_slicePhysicalGridRadius`           |
| `aoiDistance`                              | `m_aoiRadius`                         |
| `slicePhysicalRadius`                      | `m_slicePhysicalRadius`               |
| `gridCategory`                             | `m_aoiGridCategory`                   |
| `isStaticSlice`                            | `m_isStaticSlice`                     |
| `sliceTags`                                | `m_sliceTags`                         |
| `usesCustomDefinedSpawnRadius`             | `m_useUserDefinedSpawnRadius`         |
| `hasCollision`                             | the slice's physics components        |
| `meshes`, `spawners`, `childSpawnSliceIds` | the slice's meshes and child spawners |

Authored flags: `isRequiredOnServer`, `skipMidRangeImpostors`, `forceWaitReplicatedData`, `isLongDistanceGDE`,
`phasingRestriction`, `spawnInInstances`, `prioritizeGDEWhenMounted`.

- a mesh entry: `meshAssetId`, `materialOverrideAssetId`, `maxViewDistance`, `m_impostorFarDistance`,
  `rootRelativeTransform`, `rootRelativeInstanceTransforms`, `meshOptionsBitset`, `lodRatio`
- a spawner entry: `worldTM`, `sliceAssetId`, `sliceName`, `variationName`, `prefabPersists`, `maxRotationAngle`

### Spawn rule

Per frame and capital:

- spawn radius = `gdeSpawnRadius` clamped to `g_GDE_ImpostorsRenderMaxRange`, times `g_GDE_AOIScale`
- a slice that is not `isLongDistanceGDE` counts only within `225 m * g_GDE_ImpostorNearFadeDistanceScale + 10 m`.
  It spawns within the spawn radius and despawns beyond the spawn radius plus 5 m. Unless `skipMidRangeImpostors`,
  its meshes build progressively, nearest first, within `225 m * g_GDE_ImpostorNearFadeDistanceScale`
- an `isLongDistanceGDE` slice spawns within its spawn radius alone

### Entity transforms

```json
{
  "__type": "GameTransformComponent",
  "m_worldtm": { "data": [-0.978, 0.208, 0, -0.208, -0.978, 0, 0, 0, 1, -2.448, 3.536, -1.724] },
  "m_parentid": { "__type": "EntityId", "id": "16624699878889673125" },
  "m_localtm": { "data": [-0.978, 0.208, 0, -0.208, -0.978, 0, 0, 0, 1, -2.448, 3.536, -1.724] },
  "m_onnewparentkeepworldtm": true,
  "m_isstatic": false
}
```

- `m_worldtm` is the entity's transform in slice space. `m_localtm` does not match `parent worldtm * localtm` for
  about half of the child entities
- a spawned slice stands by its root entity: the root stands at the spawn transform and every entity at
  `spawn * inverse(root) * worldtm`. Roots carry no translation, but many are rotated (up to half a turn)
- a slice with several entities without a parent has no root and keeps its own space
- the shipped levels use `GameTransformComponent` only; a `TransformComponent` reads the same way

### Spawners

- `SpawnerComponent`, `PointSpawnerComponent`, `PrefabSpawnerComponent`: spawn at the entity. Most static level
  geometry comes from prefab spawners
- `AreaSpawnerComponent`: spawns at its `m_locations`, entities of the spawner's slice placed in slice space like the
  spawner itself, not relative to it
- `EncounterManagerComponent`: its waves spawn through the area spawner on the manager entity: at the spawn's own
  locations, else at the area spawner's locations, else at the manager
- `ProjectileSpawnerComponent`: spawns a projectile; the asset comes from the ammo datasheet
- `ProjectileComponent`: `spawnOnHitAsset`, e.g. a gleamite meteor turning into gleamite ore
- an alias asset holds several slice options, the game draws one

### Entity data

| Component                               | Data                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| `NpcComponent`                          | NPC id                                                                              |
| `VitalsComponent`                       | vitals id                                                                           |
| `AIVariantProviderComponent`            | vitals id, category id, level, territory level flag: applies to the entity's spawns |
| `ActionListComponent`                   | damage table, `.adb` animation database                                             |
| `VariationDataComponent`                | gatherable variant id                                                               |
| `GatherableControllerComponent`         | gatherable id                                                                       |
| `ReadingInteractionComponent`           | lore id                                                                             |
| `MeshComponent`, `SkinnedMeshComponent` | mesh asset                                                                          |
| `HousingPlotComponent`                  | house type (no datasheet)                                                           |
| `AssemblyComponent`                     | crafting station id (no datasheet)                                                  |

Vitals: a spawned creature takes the vitals variant (row, category, level) of the `AIVariantProviderComponent` on
the entity that spawned it, else of the only one in the spawner's slice, else keeps its own `VitalsComponent` row. A
provider never applies to its own entity, and a provider further up the spawn chain does not reach through. Encounter names
pass from an encounter manager to the entities below it and everything they spawn.
