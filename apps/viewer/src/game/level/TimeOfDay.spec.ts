import { describe, expect, it } from 'vitest'
import { TimeOfDay } from './TimeOfDay'
import { TodParams } from './TimeOfDayParams'
import { TimeOfDayPreset } from './TimeOfDayPreset'

const PARAM = TodParams.SUN_RAYS_VISIBILITY

function preset(value: number) {
  const it = new TimeOfDayPreset()
  it.variables[PARAM.name].value = value
  return it
}

function setup(base: number) {
  const tod = new TimeOfDay(preset(base))
  tod.enablePoiLayers = true
  return tod
}

function setWeight(tod: TimeOfDay, layer: TimeOfDayPreset, weight: number) {
  tod.poiLayers.find((it) => it.preset === layer).blendWeight = weight
}

describe('TimeOfDay layers', () => {
  it('blends one layer like a lerp', () => {
    const tod = setup(0)
    const a = preset(1)
    tod.scheduleAdd(a, 0, 1)
    setWeight(tod, a, 0.25)
    expect(tod.getParamValue(PARAM)).toBeCloseTo(0.25)
  })

  it('gives the level what the layers leave, the highest priority first', () => {
    const tod = setup(0)
    const low = preset(1)
    const high = preset(2)
    tod.scheduleAdd(low, 0, 1)
    tod.scheduleAdd(high, 1, 1)
    // both at 0.5: the level keeps nothing, a lerp chain would give 0.25 level + 0.25 low + 0.5 high
    setWeight(tod, low, 0.5)
    setWeight(tod, high, 0.5)
    expect(tod.getParamValue(PARAM)).toBeCloseTo(0.5 * 1 + 0.5 * 2)
  })

  it('cuts the weights so that the total never passes one', () => {
    const tod = setup(0)
    const low = preset(1)
    const high = preset(2)
    tod.scheduleAdd(low, 0, 1)
    tod.scheduleAdd(high, 1, 1)
    setWeight(tod, low, 1)
    setWeight(tod, high, 0.75)
    expect(tod.getParamValue(PARAM)).toBeCloseTo(0.75 * 2 + 0.25 * 1)
  })

  it('prefers the newest layer on equal priority', () => {
    const tod = setup(0)
    const first = preset(1)
    const second = preset(2)
    tod.scheduleAdd(first, 0, 1)
    tod.scheduleAdd(second, 0, 1)
    setWeight(tod, first, 1)
    setWeight(tod, second, 1)
    expect(tod.getParamValue(PARAM)).toBeCloseTo(2)
  })

  it('switches at once without a blend time', () => {
    const tod = setup(0)
    const a = preset(1)
    tod.scheduleAdd(a, 0, 0)
    tod['updateWeights'](0.016)
    expect(tod.poiLayers[0].blendWeight).toBe(1)
  })

  it('ignores layers below the minimum weight', () => {
    const tod = setup(0)
    const a = preset(1)
    tod.scheduleAdd(a, 0, 1)
    setWeight(tod, a, 0.005)
    expect(tod.getParamValue(PARAM)).toBe(0)
  })

  it('drops the layers of the previous level on reset', () => {
    // a zone of the previous level was fully blended in when the level switched (no page load in between)
    const tod = setup(0)
    const a = preset(1)
    tod.scheduleAdd(a, 0, 0)
    setWeight(tod, a, 1)
    tod.reset()
    expect(tod.poiLayers).toEqual([])
    expect(tod.getParamValue(PARAM)).toBe(tod.base.variables[PARAM.name].value)
  })

  it('blends out the layers of zones that are gone', () => {
    const tod = setup(0)
    const kept = preset(1)
    const unloaded = preset(2)
    tod.scheduleAdd(kept, 0, 0)
    tod.scheduleAdd(unloaded, 0, 0)
    tod.scheduleRemoveMissing(new Set([kept]))
    tod['updateWeights'](0.016)
    tod['removeLayers']()
    expect(tod.poiLayers.map((it) => it.preset)).toEqual([kept])
  })
})
