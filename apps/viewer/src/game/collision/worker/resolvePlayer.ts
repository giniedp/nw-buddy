import { vec3, type IVec3 } from '@gglib/math'
import { PLAYER_FALL_SPEED, PLAYER_HEIGHT, PLAYER_RADIUS, PLAYER_STEP_HEIGHT } from '../../../constants'
import { regionContains, sampleRegionHeightAsTerrain, type RegionHeightmap } from '../../terrain/heightSampling'
import { PlayerFlags, type PlayerRequest, type PlayerResult } from '../shared'
import type { CollisionWorld } from './CollisionWorld'

export interface PlayerWorld {
  heightmaps: ReadonlyMap<string, RegionHeightmap>
  colliders: CollisionWorld
}

/**
 * Number of push out iterations per movement step
 */
const ITERATIONS = 3
/**
 * Spheres that approximate the capsule body above the step height
 */
const BODY_SPHERES = 3
/**
 * Movement is split into steps of at most this length, so fast movement does not pass thin walls
 */
const MAX_STEP = PLAYER_RADIUS * 0.5

const center = vec3()
const push = vec3()

/**
 * Resolves the requested feet position of the player, no physics
 *
 * - walls: the capsule body above the step height is pushed out of colliders horizontally
 * - ground: highest of terrain (always), colliders below `feet + step` and z = 0. Steps up instantly and falls with
 *   a constant speed when the ground is below the feet.
 *
 * @param previous - feet position of the previous result, the movement from there is swept in steps
 */
export function resolvePlayer(
  world: PlayerWorld,
  req: PlayerRequest,
  previous: IVec3,
  out: PlayerResult,
): PlayerResult {
  let x = req.x
  let y = req.y
  const feet = req.z

  if (req.flags & PlayerFlags.Walls && !(req.flags & PlayerFlags.Teleport)) {
    const dx = x - previous.x
    const dy = y - previous.y
    const steps = Math.min(16, Math.max(1, Math.ceil(Math.hypot(dx, dy) / MAX_STEP)))
    x = previous.x
    y = previous.y
    for (let s = 1; s <= steps; s++) {
      x += dx / steps
      y += dy / steps
      for (let i = 0; i < ITERATIONS; i++) {
        push.x = 0
        push.y = 0
        let contacts = 0
        for (let k = 0; k < BODY_SPHERES; k++) {
          center.x = x
          center.y = y
          center.z = bodySphereZ(feet, k)
          contacts += world.colliders.pushOut(center, PLAYER_RADIUS, push)
        }
        if (!contacts) {
          break
        }
        x += push.x / BODY_SPHERES
        y += push.y / BODY_SPHERES
      }
    }
  }

  const terrain = terrainHeight(world, x, y)
  const shapes = world.colliders.groundHeight(x, y, feet + PLAYER_STEP_HEIGHT, terrain)
  const ground = Number.isNaN(shapes) ? terrain : Math.max(terrain, shapes)

  out.x = x
  out.y = y
  if (ground >= feet) {
    // on the ground or a step up
    out.z = ground
  } else {
    // falling, no acceleration
    out.z = Math.max(ground, feet - PLAYER_FALL_SPEED * req.dt)
  }
  return out
}

/**
 * Height of the k-th body sphere center, the lowest touches the step height, the highest the head
 */
function bodySphereZ(feet: number, k: number) {
  const low = feet + PLAYER_STEP_HEIGHT + PLAYER_RADIUS
  const high = feet + PLAYER_HEIGHT - PLAYER_RADIUS
  return low + ((high - low) * k) / (BODY_SPHERES - 1)
}

/**
 * Terrain height at x/y, at least 0. Terrain has no overhangs, so it always counts as ground.
 */
function terrainHeight(world: PlayerWorld, x: number, y: number): number {
  let ground = 0
  for (const region of world.heightmaps.values()) {
    if (!regionContains(region, x, y)) {
      continue
    }
    const height = sampleRegionHeightAsTerrain(region, x, y)
    if (height > ground) {
      ground = height
    }
  }
  return ground
}
