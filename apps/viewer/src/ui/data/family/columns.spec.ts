import { describe, expect, it } from 'vitest'
import { kindLabel } from '../families'
import { familyRowData, selectedRow } from './columns'

describe('familyRowData', () => {
  const data = { count: 4, sheetOf: Uint16Array.of(0, 1, 0, 1) } as never

  it('has every row, or those of one sheet', () => {
    expect(familyRowData(data, -1).map((it) => it.i)).toEqual([0, 1, 2, 3])
    expect(familyRowData(data, 1).map((it) => it.i)).toEqual([1, 3])
  })
})

describe('selectedRow', () => {
  const data = { count: 3, keys: new Map([['sword_t5', 2]]) } as never

  it('finds the row of the key, case ignored', () => {
    expect(selectedRow(data, 'Sword_T5', null)).toBe(2)
    expect(selectedRow(data, 'missing', 1)).toBeNull()
  })

  it('takes an index of the family without a key', () => {
    expect(selectedRow(data, null, 1)).toBe(1)
    expect(selectedRow(data, null, 3)).toBeNull()
    expect(selectedRow(data, null, null)).toBeNull()
  })
})

describe('kindLabel', () => {
  it('tells what the cells of a column hold', () => {
    expect(kindLabel('ref', ['ItemData', 'PerkData'])).toBe('rows of ItemData, PerkData')
    expect(kindLabel('loc')).toBe('localized text')
    expect(kindLabel('other')).toBe('other')
  })
})
