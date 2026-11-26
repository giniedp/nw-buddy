import { mat4CreateScaleXYZ, mat4CreateTranslation, mat4Multiply, vec3 } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { PlayerFlags } from '../shared'
import { CollisionWorld } from './CollisionWorld'
import { resolvePlayer } from './resolvePlayer'
import type { ShapeAssets } from './ShapeAssets'

const noAssets = { load: () => Promise.reject(new Error('no assets')) } as unknown as ShapeAssets

function translation(x: number, y: number, z: number) {
  return Array.from(mat4CreateTranslation(vec3(x, y, z)))
}

describe('CollisionWorld', () => {
  it('ground ray hits the top of a box below the start', () => {
    const world = new CollisionWorld(noAssets)
    world.add({ id: 1, primitive: { kind: 'box', halfExtents: [2, 2, 1] }, world: translation(10, 10, 5) })
    expect(world.groundHeight(10, 10, 20, 0)).toBeCloseTo(6)
    // the start lies inside the box: no hit
    expect(world.groundHeight(10, 10, 5.5, 0)).toBeNaN()
    // outside the box in xy
    expect(world.groundHeight(13, 10, 20, 0)).toBeNaN()
  })

  it('ground ray respects scale and the lower bound', () => {
    const world = new CollisionWorld(noAssets)
    const m = mat4Multiply(mat4CreateTranslation(vec3(0, 0, 2)), mat4CreateScaleXYZ(1, 1, 3))
    world.add({ id: 1, primitive: { kind: 'sphere', radius: 1 }, world: Array.from(m) })
    expect(world.groundHeight(0, 0, 10, 0)).toBeCloseTo(5)
    expect(world.groundHeight(0, 0, 10, 6)).toBeNaN()
  })

  it('pushes a sphere out of a wall horizontally', () => {
    const world = new CollisionWorld(noAssets)
    // wall: thin box along y at x = 0
    world.add({ id: 1, primitive: { kind: 'box', halfExtents: [0.1, 5, 5] }, world: translation(0, 0, 5) })
    const push = vec3(0, 0, 0)
    const contacts = world.pushOut(vec3(0.3, 0, 2), 0.4, push)
    expect(contacts).toBe(1)
    expect(push.x).toBeCloseTo(0.2)
    expect(push.y).toBeCloseTo(0)
  })

  it('removes colliders', () => {
    const world = new CollisionWorld(noAssets)
    world.add({ id: 1, primitive: { kind: 'box', halfExtents: [2, 2, 1] }, world: translation(0, 0, 0) })
    world.remove(1)
    expect(world.groundHeight(0, 0, 20, -10)).toBeNaN()
    expect(world.stats.leaves).toBe(0)
  })
})

describe('resolvePlayer', () => {
  const heightmaps = new Map()

  it('stops at a wall', () => {
    const colliders = new CollisionWorld(noAssets)
    colliders.add({ id: 1, primitive: { kind: 'box', halfExtents: [0.1, 5, 5] }, world: translation(2, 0, 5) })
    const out = { x: 0, y: 0, z: 0 }
    // walk 4 m towards +x through the wall at x = 2 in one request
    resolvePlayer(
      { heightmaps, colliders },
      { x: 4, y: 0, z: 0, dt: 0.016, flags: PlayerFlags.Walls },
      vec3(0, 0, 0),
      out,
    )
    expect(out.x).toBeLessThan(2 - 0.1)
    expect(out.x).toBeGreaterThan(1)
  })

  it('walks through walls without the walls flag', () => {
    const colliders = new CollisionWorld(noAssets)
    colliders.add({ id: 1, primitive: { kind: 'box', halfExtents: [0.1, 5, 5] }, world: translation(2, 0, 5) })
    const out = { x: 0, y: 0, z: 0 }
    resolvePlayer({ heightmaps, colliders }, { x: 4, y: 0, z: 0, dt: 0.016, flags: 0 }, vec3(0, 0, 0), out)
    expect(out.x).toBe(4)
  })

  it('steps up onto low geometry and falls from high', () => {
    const colliders = new CollisionWorld(noAssets)
    // 0.3 m step at x > 0
    colliders.add({ id: 1, primitive: { kind: 'box', halfExtents: [5, 5, 0.15] }, world: translation(5, 0, 0.15) })
    const out = { x: 0, y: 0, z: 0 }
    resolvePlayer(
      { heightmaps, colliders },
      { x: 1, y: 0, z: 0, dt: 0.016, flags: PlayerFlags.Walls },
      vec3(0, 0, 0),
      out,
    )
    expect(out.z).toBeCloseTo(0.3)
    // above the box by 10 m: falls at constant speed
    resolvePlayer(
      { heightmaps, colliders },
      { x: 1, y: 0, z: 10, dt: 0.1, flags: PlayerFlags.Walls },
      vec3(1, 0, 10),
      out,
    )
    expect(out.z).toBeCloseTo(8)
    // nothing below: falls down to 0 at most
    resolvePlayer(
      { heightmaps, colliders },
      { x: -20, y: 0, z: 1, dt: 1, flags: PlayerFlags.Teleport },
      vec3(-20, 0, 1),
      out,
    )
    expect(out.z).toBe(0)
  })
})
