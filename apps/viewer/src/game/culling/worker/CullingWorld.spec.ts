import {
  mat4CreateLookAt,
  mat4CreatePerspectiveFieldOfView,
  mat4CreateTranslation,
  mat4Invert,
  vec3,
} from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { CullingWorld, type CullView } from './CullingWorld'
import type { CullLevel, CullRecord } from './protocol'

function level(nodes: Array<{ x: number; batches: number[] }>): CullLevel {
  const matrices = new Float32Array(nodes.length * 16)
  const boxes = new Float32Array(nodes.length * 6)
  const batchStart = [0]
  const batches: number[] = []
  nodes.forEach((node, i) => {
    matrices.set(mat4CreateTranslation(vec3(node.x, 0, 0)), i * 16)
    boxes.set([-1, -1, -1, 1, 1, 1], i * 6)
    batches.push(...node.batches)
    batchStart.push(batches.length)
  })
  return { matrices, boxes, batchStart: new Uint32Array(batchStart), batches: new Uint32Array(batches) }
}

function record(id: number, x: number, base: CullLevel, lod: CullRecord['lod'] = null): CullRecord {
  const data = new Float32Array(16)
  data[0] = id
  return {
    id,
    sphere: new Float32Array([x, 0, 0, 1]),
    box: new Float32Array([x - 1, -1, -1, x + 1, 1, 1]),
    data,
    lod,
    base,
  }
}

// camera at the origin, looking along +x
function view(mask = 0xff): CullView {
  const view = mat4Invert(mat4CreateLookAt(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 0, 1)))
  const projection = mat4CreatePerspectiveFieldOfView(Math.PI / 2, 1, 0.1, 1000, 0)
  return { frame: 1, view, projection, projectionScaleY: projection[5], position: [0, 0, 0], visibilityMask: mask }
}

describe('CullingWorld', () => {
  it('groups the visible instances by batch', () => {
    const world = new CullingWorld()
    world.addBatches([
      { id: 1, layer: 1 },
      { id: 2, layer: 1 },
    ])
    world.add(record(1, 10, level([{ x: 10, batches: [1, 2] }])))
    world.add(record(2, 20, level([{ x: 20, batches: [1] }])))
    // behind the camera
    world.add(record(3, -10, level([{ x: -10, batches: [1] }])))

    const result = world.cull(view(), null)
    expect(result.instanceCount).toBe(3)
    expect(result.batchCount).toBe(2)
    const batches = Array.from(result.batches.subarray(0, 6))
    const first = batches.indexOf(1)
    expect(batches.slice(first, first + 3)).toEqual([1, 2, batches[first + 2]])
    // instances of batch 1 are back to back, with the record data
    const offset = batches[first + 2]
    const ids = [result.data[offset * 16], result.data[(offset + 1) * 16]].sort()
    expect(ids).toEqual([1, 2])
    expect(result.transforms[offset * 16 + 12]).toBe(result.data[offset * 16] === 1 ? 10 : 20)
  })

  it('skips batches hidden by the visibility mask', () => {
    const world = new CullingWorld()
    world.addBatches([
      { id: 1, layer: 1 },
      { id: 2, layer: 2 },
    ])
    world.add(record(1, 10, level([{ x: 10, batches: [1, 2] }])))
    const result = world.cull(view(2), null)
    expect(result.instanceCount).toBe(1)
    expect(result.batches[0]).toBe(2)
  })

  it('requests missing levels and draws the closest loaded finer level', () => {
    const world = new CullingWorld()
    world.addBatches([
      { id: 1, layer: 1 },
      { id: 2, layer: 1 },
    ])
    const lod = {
      distance: 10,
      spacing: 'linear' as const,
      maxLevel: 2,
      hysteresis: 0.1,
      maxScreenSize: null as number[],
    }
    world.add(record(1, 25, level([{ x: 25, batches: [1] }]), lod))

    let result = world.cull(view(), null)
    expect(result.requests).toEqual([1, 2])
    expect(result.batches[0]).toBe(1)

    world.setLevel(1, 2, level([{ x: 25, batches: [2] }]))
    result = world.cull(view(), result)
    expect(result.requests).toEqual([])
    expect(result.batches[0]).toBe(2)
  })

  it('selects levels with doubling distances', () => {
    const world = new CullingWorld()
    world.addBatches([{ id: 1, layer: 1 }])
    // level 1 from 10, 2 from 20, 3 from 40: 35 is level 2 (linear spacing would select 3)
    const lod = {
      distance: 10,
      spacing: 'doubling' as const,
      maxLevel: 3,
      hysteresis: 0.1,
      maxScreenSize: null as number[],
    }
    world.add(record(1, 35, level([{ x: 35, batches: [1] }]), lod))
    const result = world.cull(view(), null)
    expect(result.requests).toEqual([1, 2])
  })

  it('removes records and keeps the others', () => {
    const world = new CullingWorld()
    world.addBatches([{ id: 1, layer: 1 }])
    world.add(record(1, 10, level([{ x: 10, batches: [1] }])))
    world.add(record(2, 20, level([{ x: 20, batches: [1] }])))
    world.remove(1)
    const result = world.cull(view(), null)
    expect(world.recordCount).toBe(1)
    expect(result.instanceCount).toBe(1)
    expect(result.data[0]).toBe(2)
  })

  it('raycasts the node boxes of the base level', () => {
    const world = new CullingWorld()
    world.addBatches([{ id: 1, layer: 1 }])
    world.add(record(7, 10, level([{ x: 10, batches: [1] }])))
    const hits = world.raycast([0, 0, 0], [1, 0, 0], 100)
    expect(hits.length).toBe(1)
    expect(hits[0].record).toBe(7)
    expect(hits[0].distance).toBeCloseTo(9)
  })
})
