import { describe, expect, it } from 'vitest'
import type { FragmentTimeline } from '../../../game/character/mannequin/timeline'
import { paramEntries, trackBarKind, trackRows } from './TrackBar.store'

const damage = { type: 'CAGE-Damage', contextType: 'DamageContext', params: { DamageTableRow: 'Attack_Bite' } }
const homing = { type: 'Homing', contextType: 'HomingContext', params: { Offset: ['0', '1', '2'] } }

const TIMELINE: FragmentTimeline = {
  duration: 2,
  loop: null,
  animLayers: [],
  procLayers: [
    [
      { start: 0, end: 0.5, procedural: null },
      { start: 0.5, end: 0.7, procedural: damage },
      { start: 0.7, end: 2, procedural: null },
    ],
    [{ start: 0, end: 1, procedural: homing }],
  ],
}

describe('TrackBar', () => {
  it('lays out the bars of each proc layer in percent, gaps left out', () => {
    const rows = trackRows(TIMELINE)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(1)
    expect(rows[0][0]).toMatchObject({ layer: 0, index: 1, kind: 'damage' })
    expect(rows[0][0].left).toBeCloseTo(25)
    expect(rows[0][0].width).toBeCloseTo(10)
    expect(rows[1][0]).toMatchObject({ layer: 1, index: 0, kind: 'homing', left: 0, width: 50 })
    expect(trackRows(null)).toEqual([])
  })

  it('colors by type and lists the params', () => {
    expect(trackBarKind('CAGE-CastSpell')).toBe('spell')
    expect(trackBarKind('CAGE-RangedAttack')).toBe('spell')
    expect(trackBarKind('CAGE-Named')).toBe('other')
    expect(paramEntries(homing)).toEqual([['Offset', '0, 1, 2']])
  })
})
