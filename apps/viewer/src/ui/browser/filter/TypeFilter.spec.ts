import { describe, expect, it } from 'vitest'
import type { AssetType, TypeGroup } from '../../../api/browse'
import { filterTitle, groupLabel, groupTypes } from './TypeFilter.store'

const type = (label: string, group: TypeGroup, count: number) => ({ label, group, count }) as AssetType

describe('groupTypes', () => {
  const types = [
    type('Mip', 'hidden', 900),
    type('Texture', 'texture', 50),
    type('Model', 'geometry', 30),
    type('Skin', 'geometry', 40),
  ]

  it('sorts groups by file count, the hidden group last', () => {
    expect(groupTypes(types).map((it) => [it.group, it.count])).toEqual([
      ['geometry', 70],
      ['texture', 50],
      ['hidden', 900],
    ])
  })

  it('sorts the types of a group by file count and keeps their indices', () => {
    const geometry = groupTypes(types)[0]
    expect(geometry.entries.map((it) => [it.type.label, it.index])).toEqual([
      ['Skin', 3],
      ['Model', 2],
    ])
  })
})

describe('labels', () => {
  it('names the filter by what it shows', () => {
    const types = [type('Texture', 'texture', 1), type('Model', 'geometry', 1)]
    expect(filterTitle(types, new Set())).toBe('Filter by type: all types')
    expect(filterTitle(types, new Set([1]))).toBe('Filter by type: Model')
    expect(filterTitle(types, new Set([0, 1]))).toBe('Filter by type: 2 types')
  })

  it('writes the short groups in capitals', () => {
    expect(groupLabel('ui')).toBe('UI')
    expect(groupLabel('texture')).toBe('texture')
  })
})
