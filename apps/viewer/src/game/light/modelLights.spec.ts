import { mat4GetRight, mat4GetTranslation, Transform } from '@gglib/math'
import type { LightData, Model, NodeData } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import { getModelLights, lightConfigFromData } from './modelLights'

function modelOf(lights: LightData[], nodes: NodeData[], parents: Record<number, number>): Model {
  const root = new Transform<NodeData>()
  const transforms = nodes.map((data) => {
    const it = new Transform<NodeData>()
    it.data = data
    if (data.translation) {
      it.setPosition(data.translation[0], data.translation[1], data.translation[2])
    }
    return it
  })
  transforms.forEach((it, i) => {
    const parent = parents[i] != null ? transforms[parents[i]] : root
    parent.addChildInLocal(it)
  })
  root.updateIfNeeded()
  for (const it of transforms) {
    it.updateIfNeeded()
  }
  return { lights, transformNodes: transforms } as unknown as Model
}

describe('model lights', () => {
  it('uses the game light of nwbt exports', () => {
    const nwLight = { type: 'Projector', diffuseMultiplier: 3, projectorFOV: 60 }
    const config = lightConfigFromData({ type: 'spot', intensity: 1500, extras: { nwLight } })
    expect(config).toBe(nwLight)
  })

  it('maps plain glTF lights', () => {
    const spot = lightConfigFromData({
      type: 'spot',
      intensity: 2,
      range: 5,
      color: [1, 0.5, 0],
      outerConeAngle: Math.PI / 6,
    })
    expect(spot.type).toBe('Projector')
    expect(spot.diffuseMultiplier).toBe(2)
    expect(spot.color).toEqual([1, 0.5, 0, 1])
    expect(spot.projectorFOV).toBeCloseTo(60)
    expect(spot.projectorDistance).toBe(5)
    expect(lightConfigFromData({ type: 'point' }).type).toBe('Point')
    expect(lightConfigFromData({ type: 'directional' })).toBeNull()
  })

  it('places the lights relative to the model root, emitting along -Z of the node', () => {
    const model = modelOf(
      [{ type: 'spot', name: 'Key' }],
      [{ name: 'Lights', translation: [0, 2, 0] }, { name: 'Key', light: 0, translation: [1, 0, 0] }, { name: 'Mesh' }],
      { 1: 0 },
    )
    const lights = getModelLights(model)
    expect(lights.length).toBe(1)
    expect(lights[0].name).toBe('Key')
    const position = mat4GetTranslation(lights[0].local)
    expect([position.x, position.y, position.z]).toEqual([1, 2, 0])
    // the viewer's lights emit along local +X, that is the node's -Z
    const right = mat4GetRight(lights[0].local)
    expect(right.x).toBeCloseTo(0)
    expect(right.y).toBeCloseTo(0)
    expect(right.z).toBeCloseTo(-1)
  })
})
