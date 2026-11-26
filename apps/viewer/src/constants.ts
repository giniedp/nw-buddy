export const REGION_SIZE = 2048
export const SEGMENT_SIZE = 128
export const QUAD_TREE_LEAF_SIZE = 32
export const TERRAIN_LOD_RANGE_FACTOR = 2

// terrain virtual texture, see coatlicue-terrain.cfx and the GPA capture findings
// world size of a page at mip m is VT_PAGE_WORLD_SIZE * 2^m
export const VT_TEXELS_PER_METER = 256
export const VT_PAGE_SIZE = 512
export const VT_PAGE_WORLD_SIZE = VT_PAGE_SIZE / VT_TEXELS_PER_METER
export const VT_MIP_COUNT = 8
export const VT_PAGE_CAPACITY = 640
// texel to pixel ratio for the page selection, 1 = page texel density matches the screen pixel density
// at perpendicular view, higher values keep detail at grazing angles
export const VT_LOD_QUALITY = 1.5

/**
 * How ambient only lights (light component flag Ambient) are rendered.
 *
 * Ambient lights do not emit light, they multiply the ambient lighting of the environment probes
 * (lerp(1, color, attenuation), TiledShading.cfi).
 *
 * - `modulate`: multiply the environment probe ambient (diffuse and specular), as the original does
 * - `skip`: ignore them
 * - `direct`: render them as regular direct lights, adds light the original does not have
 */
export const AMBIENT_LIGHT_MODE: 'modulate' | 'skip' | 'direct' = 'modulate'

/**
 * Loads only the smaller mips of split DDS material textures instead of the merged texture (merge=partial in nwbt).
 * The textures are allocated with their full mip chain, only the loaded mips are sampled (Texture.residentMipLevel).
 * Impostor and terrain textures are always loaded in full.
 */
export const PARTIAL_TEXTURES = false
/**
 * Largest mip size that is loaded for partial textures
 */
export const PARTIAL_TEXTURE_SIZE = 256
/**
 * Size of the merged material textures (`merge=true&size=N`), same as the `--texture-size` of nwbt (pnpm dev:nwbt)
 * that it uses for the textures of its glTF files
 */
export const MATERIAL_TEXTURE_SIZE = 2048
/**
 * Requests the `.cgfheap` of a model only after its `.cgf` is parsed, and only if the file references heap data.
 *
 * Off: `.cgf` and `.cgfheap` are requested in parallel (one round trip). Files of the old format (inline vertex data,
 * 0.7% of the files) have no heap, their heap request fails with 404.
 * On: no heap request for those files, but one more round trip per model.
 */
export const CGF_HEAP_AFTER_PARSE = true
/**
 * Renders meshes with an instance array (InstancedMeshComponent) with GPU culling and indirect draws.
 * Disabled: indirect draws are expensive per call and level objects have few instances per draw.
 * Measured at x=5500 y=600: all level objects 82ms vs 37ms, instance arrays only 25ms vs 16.8ms (median frame).
 * The regular render path already merges instances of the same mesh into instanced draws per frame.
 */
export const ENABLE_INSTANCED_LEVEL_OBJECTS = false
/**
 * Creates a single entity for all instances of an instance array (InstancedMeshComponent) instead of one entity per instance.
 * Reduces the number of entities, spatial nodes and bounds, culling happens per instance array.
 */
export const COMBINE_INSTANCE_ARRAYS = true

/**
 * A level of detail with at most this many triangles is cheap enough, coarser sibling files are not requested.
 *
 * @remarks
 * Saves the failing request of the probe after the last level: in the paks 46% of the last levels have at most
 * 128 triangles. A skipped coarser level would have even fewer triangles.
 */
export const LOD_PROBE_MIN_TRIANGLES = 128

/**
 * Base view distance of road decals, scaled by the road ViewDistanceMultiplier
 */
export const ROAD_VIEW_DISTANCE = 256

/**
 * Vegetation is rendered up to this distance. The game keeps `veg_bubbleSize` (16 at high, sys_spec_terrain.cfg) sectors
 * of 16 m around the camera and draws them up to half the bubble width, 128 m.
 * The game sinks the grass into the ground from 0.4 of that distance on, the viewer dithers it out over
 * VEGETATION_FADE_RANGE instead.
 */
export const VEGETATION_VISIBLE_DISTANCE = 128
/**
 * Cells within visible distance + margin are uploaded, so they are ready when they become visible
 */
export const VEGETATION_LOAD_MARGIN = 16
/**
 * Cells beyond visible distance + margin are released
 */
export const VEGETATION_UNLOAD_MARGIN = 32
/**
 * Number of cells a region can keep loaded at once (each cell holds up to 1024 instances)
 */
export const VEGETATION_SLOT_COUNT = 320
export const VEGETATION_CELL_UPLOADS_PER_FRAME = 16

/**
 * Range activation of slice entities (meshes, lights with a view distance), see RangeActivationSystem.
 * Smallest range class, also the cell size of the finest grid. Smaller ranges are rounded up.
 * Ranges are bucketed into power of two classes, the cell size of a class equals its range.
 */
export const RANGE_CLASS_MIN = 32
/**
 * Largest range class, larger ranges are clamped (1.5% of the meshes, up to 80km).
 */
export const RANGE_CLASS_MAX = 4096
/**
 * Entities activate at their range and deactivate at range * hysteresis
 */
export const RANGE_HYSTERESIS = 1.1
/**
 * A range class is re-evaluated when the camera moved this fraction of its cell size
 */
export const RANGE_UPDATE_DISTANCE_FACTOR = 1 / 64
/**
 * Time budget for entity activations per frame
 */
export const RANGE_ACTIVATION_BUDGET_MS = 2
/**
 * Time budget per frame for creating the capital and chunk spawners of a region, at least. The scheduler's High lane
 * budget is used when it is larger. The spawn continues in the next frame.
 */
export const CAPITAL_SPAWN_BUDGET_MS = 2
/**
 * Time budget per frame for destroying the content of unloaded regions (DeferredDestroySystem)
 */
export const TEARDOWN_BUDGET_MS = 2
/**
 * Time budget per frame for initializing and activating slice spawner entities (SliceSystem)
 */
export const SPAWNER_ACTIVATION_BUDGET_MS = 2

export type LodSpan = {
  start: number
  visibleFor: number
  keepAliveFor: number
}

export const ENABLE_IMPOSTOR_VEG = true
export const ENABLE_IMPOSTOR_POI = true
export const ENABLE_DISTRIBUTION = true
export const ENABLE_VEGETATION = true
export const ENABLE_CAPITALS = true
export const ENABLE_CHUNKS = true

/**
 * Distance from camera to where impostor begin, where game objects fade out and impostor fades in.
 * The game clips impostor pixels inside 185 m (IMPOSTOR_MIN_VIEW_DISTANCE = 185 * g_GDE_ImpostorNearFadeDistanceScale)
 * and dissolves them over the next 20 m (Illum %IS_GDE_IMPOSTOR / %IS_POI_IMPOSTOR).
 */
export const IMPOSTOR_VISIBILITY_START = 185

/**
 * Object detail tiers of the game (sys_spec_ObjectDetail), selected by the config setting `objectDetail`
 */
export type ObjectDetailTier = 'low' | 'medium' | 'high' | 'veryHigh'

export interface ObjectDetailValues {
  /**
   * g_GDE_ImpostorsRenderMaxRange: impostor cells draw within this distance, and every slice spawn radius is held to
   * it. The viewer keeps at most 4 regions loaded (at least 1024 m around the camera), larger ranges end where the
   * loaded regions end.
   */
  impostorRange: number
  /**
   * g_GDE_AOIScale (held to 0.1..1): scales the spawn radius of slices and chunks (GdeSettings::spawn_radius)
   */
  aoiScale: number
  /**
   * e_LodFaceAreaTargetSize: level 1 begins at `sqrt(geometric mean face area) / lodFaceAreaTargetSize`, see
   * ContentService.cgfLodInfo. Needs reload.
   */
  lodFaceAreaTargetSize: number
  /**
   * g_GDE_SlicesCreatedPerFrame: slices spawned per frame, nearest first
   */
  slicesPerFrame: number
}

/**
 * Values of the object detail tiers, from config/cvargroups/sys_spec_objectdetail.cfg (read with nwbt):
 * low = [4]/[5], medium = [6], high = [7] (the cfg default), veryHigh = [8].
 *
 * Not adopted: coat_terrainViewDistance (needs more than 4 regions), e_ObjQuality (light
 * MinimumSpec gate), r_MaxParticleEmitters, g_GDE_GeomsCreatedPerFrame / DeletedPerFrame, the impostor memory budget.
 * e_LodRatio does not apply to static meshes: MeshComponentRenderNode::GetLodDistances divides by
 * the mesh LODRatio and e_LodFaceAreaTargetSize only. It scales skinned meshes and particles (generic LOD fill) from a
 * character face area mean the viewer does not compute.
 */
export const OBJECT_DETAIL_TIERS: Record<ObjectDetailTier, ObjectDetailValues> = {
  low: { impostorRange: 600, aoiScale: 0.8, lodFaceAreaTargetSize: 0.01, slicesPerFrame: 7 },
  medium: { impostorRange: 800, aoiScale: 0.9, lodFaceAreaTargetSize: 0.0075, slicesPerFrame: 8 },
  high: { impostorRange: 1200, aoiScale: 1, lodFaceAreaTargetSize: 0.005, slicesPerFrame: 10 },
  veryHigh: { impostorRange: 1400, aoiScale: 1, lodFaceAreaTargetSize: 0.005, slicesPerFrame: 10 },
}

/**
 * Upper limit of g_GDE_ImpostorsRenderMaxRange (IMPOSTORS_RENDER_MAX_RANGE_LIMIT), slice spawn radii are held to it
 */
export const GDE_IMPOSTOR_RANGE_LIMIT = 1500
/**
 * Half width of the GDE near sweep: the game builds
 * the meshes of chunks and static slices progressively within this distance plus their physical radius, and tends the
 * impostor cells within this distance plus the cell size (square around the camera)
 */
export const GDE_NEAR_SWEEP = 225
/**
 * Added to {@link GDE_NEAR_SWEEP} for the reach of slices that are not isLongDistanceGDE
 */
export const GDE_NEAR_SPAWN_MARGIN = 10
/**
 * Spawned slices go this far beyond their spawn reach
 */
export const GDE_DESPAWN_MARGIN = 5
/**
 * Smallest spawn margin of a chunk, `max(spawnRadius - size, 25)`
 */
export const GDE_CHUNK_SPAWN_MARGIN = 25
/**
 * Mesh chunks smaller than this have no smallest spawn margin, `max(spawnRadius - size, 0)` (SMALL_MESH_CHUNK_SIZE)
 */
export const GDE_SMALL_MESH_CHUNK_SIZE = 128

/**
 * Highest level of detail the engine supports (MAX_STATOBJ_LODS_NUM - 1), the upper bound for probing sibling files
 */
export const ENGINE_MAX_LOD_LEVEL = 5

/**
 * Material used when a model has none, same as nwbt (game/resolvers.go)
 */
export const DEFAULT_MATERIAL = 'materials/references/base_colors/purple_trans_glowing.mtl'

/**
 * Hold the impostor visible until all objects inside the cell are loaded
 */
export const IMPOSTOR_HOLD = true

/**
 * Range
 */
export const IMPOSTOR_LOAD_RANGE = SEGMENT_SIZE * 0.25

/**
 * Width of the dithered crossfade between the distribution and the vegetation impostors.
 * The band ends where the impostor span starts, impostor cells are activated early enough to cover it.
 */
export const IMPOSTOR_FADE_RANGE = 20
/**
 * Fade out distance of the groundcover vegetation before VEGETATION_VISIBLE_DISTANCE
 */
export const VEGETATION_FADE_RANGE = 24

/**
 * View distance cap of meshes in chunk slices. POI impostor cells start loading their content at
 * {@link GDE_NEAR_SWEEP} plus the cell size (square around the camera).
 *
 * The game builds the geometry of slices and chunks progressively within 225 m * g_GDE_ImpostorNearFadeDistanceScale
 */
export const CHUNK_MESH_RANGE = 225
/**
 * Mesh chunk sizes whose meshes hold their cell's POI impostor (see RegionImpostorComponent cell state).
 * Chunk meshes have no impostor flag (see ViewerMeshComponent.impostor), the large chunks hold the far visible meshes.
 */
export const IMPOSTOR_HOLD_CHUNK_SIZES: number[] = [128, 64, 32]

/**
 * Collision shape assets are loaded for debug display within this distance of the camera
 */
export const COLLISION_DEBUG_RANGE = 128
/**
 * Maximum number of collision shape assets that load at the same time
 */
export const COLLISION_LOAD_CONCURRENCY = 32
/**
 * Enables the third person mode (key T), the mode select of the player movement and the player collision setting
 */
export const THIRD_PERSON_ENABLED = false
/**
 * Player capsule radius of the third person character. The game's Player capsule has radius 0.41 and a segment of 0.8, its
 * bottom at the feet
 */
export const PLAYER_RADIUS = 0.41
/**
 * Player capsule height (feet to head) of the third person character: segment 0.8 plus both caps
 */
export const PLAYER_HEIGHT = 0.8 + 2 * PLAYER_RADIUS
/**
 * Height of the camera above a teleport position, which is at the feet
 */
export const PLAYER_EYE_HEIGHT = 1.8
/**
 * Ground up to this height above the feet is stepped onto instantly
 */
export const PLAYER_STEP_HEIGHT = 0.5
/**
 * Constant fall speed in m/s (no acceleration) when the ground is below the feet
 */
export const PLAYER_FALL_SPEED = 20
/**
 * Collider shapes are loaded for the player within this distance (third person mode)
 */
export const COLLISION_PLAYER_RANGE = 64
/**
 * Maximum number of collider shape assets the collision worker loads at the same time for the player
 */
export const COLLISION_PLAYER_LOAD_CONCURRENCY = 16
/**
 * Cell size of the collision worker's spatial grid in meters
 */
export const COLLISION_GRID_CELL_SIZE = 16
/**
 * The culling worker culls with a frustum widened by this fraction (tangent of the half field of view), so objects
 * do not pop in at the screen edges while turning, its results are 1–2 frames late
 */
export const WORKER_CULLING_FOV_MARGIN = 0.15
/**
 * Maximum number of cull requests that wait for the culling worker
 */
export const WORKER_CULLING_IN_FLIGHT = 2
/**
 * Walking speed of a patrol in m/s: the travel speed its `Move` blend space gets, and the step when the clip has no
 * root motion. The game's creature movement speeds are not ported.
 */
export const PATROL_SPEED = 1.5
/**
 * How fast a patrol turns toward its next waypoint, radians per second
 */
export const PATROL_TURN_RATE = Math.PI
/**
 * A patrol arrives at a waypoint within this distance in meters (across the ground)
 */
export const PATROL_ARRIVE_DISTANCE = 0.2
/**
 * A creature stands on the terrain when its feet are within this height of the terrain height
 */
export const GROUND_SNAP_HEIGHT = 1
/**
 * The game's ground probe of a character without a controller starts this far above its feet (`ground_probe`,
 */
export const GROUND_PROBE_HEIGHT = 1.7
/**
 * Length of the game's downward ground probe, its first hit is the ground
 */
export const GROUND_PROBE_LENGTH = 10
/**
 * Seconds a grounded spawn waits for a collider hit, early answers may come before the colliders loaded
 */
export const GROUND_SETTLE_TIMEOUT = 5
/**
 * Collider shapes are loaded within this distance of the walking patrols that need collider ground
 */
export const COLLISION_PATROL_RANGE = 16
