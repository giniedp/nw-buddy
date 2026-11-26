import { describe, expect, it } from 'vitest'
import { PatrolPolicy } from '../../api'
import { nextWaypoint, turnToward, waypointWait, type PatrolStep } from './patrol'

function walk(policy: number, count: number, steps: number, random = () => 0) {
  const step: PatrolStep = { index: 0, direction: 1 }
  const result = [step.index]
  for (let i = 0; i < steps; i++) {
    result.push(nextWaypoint(policy, count, step, random).index)
  }
  return result
}

describe('nextWaypoint', () => {
  it('loops', () => {
    expect(walk(PatrolPolicy.Loop, 3, 4)).toEqual([0, 1, 2, 0, 1])
    expect(walk(PatrolPolicy.Undefined, 3, 3)).toEqual([0, 1, 2, 0])
  })

  it('bounces without repeating the ends', () => {
    expect(walk(PatrolPolicy.Bounce, 3, 6)).toEqual([0, 1, 2, 1, 0, 1, 2])
    expect(walk(PatrolPolicy.Bounce, 2, 3)).toEqual([0, 1, 0, 1])
  })

  it('picks another waypoint at random', () => {
    expect(walk(PatrolPolicy.Random, 3, 3, () => 0)).toEqual([0, 1, 0, 1])
    expect(walk(PatrolPolicy.Random, 3, 2, () => 0.99)).toEqual([0, 2, 1])
  })

  it('stays on a one waypoint path', () => {
    expect(walk(PatrolPolicy.Bounce, 1, 2)).toEqual([0, 0, 0])
  })
})

describe('waypointWait', () => {
  it('does not wait without a task', () => {
    expect(waypointWait('', 5, 10, () => 0.5)).toBe(0)
    expect(waypointWait(undefined, -1, -1, () => 0.5)).toBe(0)
  })

  it('stays for a negative minimum', () => {
    expect(waypointWait('POI_Sit', -1, -1, () => 0.5)).toBe(-1)
  })

  it('takes the minimum of an empty range, else draws', () => {
    expect(waypointWait('POI_Stand', 3, 3, () => 0.5)).toBe(3)
    expect(waypointWait('POI_Stand', 4, 8, () => 0.5)).toBe(6)
  })
})

describe('turnToward', () => {
  it('turns by at most the step, the short way', () => {
    expect(turnToward(0, 1, 0.25)).toBeCloseTo(0.25)
    expect(turnToward(0, 1, 2)).toBe(1)
    // from just below +PI to just above -PI is a small turn across the seam
    expect(turnToward(3, -3, 0.1)).toBeCloseTo(3.1)
  })
})
