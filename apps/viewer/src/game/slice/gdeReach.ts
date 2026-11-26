import { ChunkType, type ChunkRuntimeData, type ViewerSliceGde } from '../../api'
import {
  GDE_CHUNK_SPAWN_MARGIN,
  GDE_IMPOSTOR_RANGE_LIMIT,
  GDE_NEAR_SPAWN_MARGIN,
  GDE_NEAR_SWEEP,
  GDE_SMALL_MESH_CHUNK_SIZE,
  type ObjectDetailValues,
} from '../../constants'

/**
 * Spawn reach of a GDE capital across the ground from its position,
 * the spawn radius held to the impostor range, times the AOI scale, held to the near reach unless
 * the slice is isLongDistanceGDE, plus the physical radius.
 */
export function capitalSpawnReach(
  spawnRadius: number,
  physicalRadius: number,
  longDistance: boolean,
  tier: ObjectDetailValues,
): number {
  let radius = Math.min(spawnRadius, GDE_IMPOSTOR_RANGE_LIMIT, tier.impostorRange) * tier.aoiScale
  if (!longDistance) {
    radius = Math.min(radius, GDE_NEAR_SWEEP + GDE_NEAR_SPAWN_MARGIN)
  }
  return radius + Math.max(physicalRadius, 0)
}

/**
 * Reach within which the meshes of a slice stand: the near sweep builds them progressively within 225 m plus the
 * physical radius, before the entities spawn. Slices that opt out
 * (isLongDistanceGDE, skipMidRangeImpostors) keep their spawn reach.
 */
export function meshStandReach(spawnReach: number, physicalRadius: number, optOut: boolean): number {
  if (optOut) {
    return spawnReach
  }
  return Math.max(spawnReach, GDE_NEAR_SWEEP + Math.max(physicalRadius, 0))
}

/**
 * Spawn radius of the capital the game makes of a chunk entry: `spawnRadius - size`, at least
 * 25, but at least 0 for mesh chunks smaller than 128 m
 */
export function chunkSpawnRadius(chunk: Pick<ChunkRuntimeData, 'size' | 'chunkType' | 'spawnRadius'>): number {
  const margin = (chunk.spawnRadius ?? 0) - chunk.size
  if (chunk.chunkType === ChunkType.Mesh && chunk.size < GDE_SMALL_MESH_CHUNK_SIZE) {
    return Math.max(margin, 0)
  }
  return Math.max(margin, GDE_CHUNK_SPAWN_MARGIN)
}

/**
 * Reach of a chunk across the ground from its cell center, within which its slice stands: the chunk capital reach
 * (never isLongDistanceGDE, physical radius = size), and the near sweep reach of its meshes
 */
export function chunkReach(
  chunk: Pick<ChunkRuntimeData, 'size' | 'chunkType' | 'spawnRadius'>,
  tier: ObjectDetailValues,
): number {
  const spawn = capitalSpawnReach(chunkSpawnRadius(chunk), chunk.size, false, tier)
  return meshStandReach(spawn, chunk.size, false)
}

/**
 * Reach of a capital slice across the ground from its position, within which the slice stands (entities and meshes)
 *
 * @param capitalRadius - physical radius of the capital record
 *
 * @remarks
 * The physical radius is the larger of the capital record's and the slice's (`slicePhysicalRadius`). Records of
 * volume slices carry 0 while the slice covers the volume, e.g. the 1000 m snow volume of `4_3_snow`, whose AOI radius
 * (1025) is its GDE spawn radius (25) plus that physical radius.
 */
export function capitalReach(gde: ViewerSliceGde, capitalRadius: number, tier: ObjectDetailValues): number {
  const physicalRadius = Math.max(capitalRadius, gde.physicalRadius)
  const spawn = capitalSpawnReach(gde.spawnRadius, physicalRadius, !!gde.longDistance, tier)
  return meshStandReach(spawn, gde.physicalRadius, !!gde.longDistance || !!gde.skipMidRangeImpostors)
}
