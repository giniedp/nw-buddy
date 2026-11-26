import { describe, expect, it } from 'vitest'
import { columnChars, columnFilter, indexColumn, parseFloat32 } from './columns'

describe('parseFloat32', () => {
  it('rounds a typed number to the float32 of the datasheets', () => {
    expect(parseFloat32('1.2')).toBe(Math.fround(1.2))
    expect(parseFloat32('1.2')).not.toBe(1.2)
    expect(parseFloat32(' 120 ')).toBe(120)
    expect(parseFloat32('-0,5')).toBe(-0.5)
  })

  it('has no number for empty or other text', () => {
    expect(parseFloat32(null)).toBeNull()
    expect(parseFloat32('')).toBeNull()
    expect(parseFloat32('abc')).toBeNull()
  })
})

describe('columnChars', () => {
  it('fits the widest value, up to a cap', () => {
    expect(columnChars('Id', 12)).toBe(12)
    expect(columnChars('Id', 500)).toBe(60)
  })

  it('fits at least the header with its menu and sort icon', () => {
    expect(columnChars('Description', 3)).toBe(15)
    expect(columnChars('Description', 3, false)).toBe(13)
    expect(columnChars('', 0)).toBe(4)
  })
})

describe('columnFilter', () => {
  it('filters numbers by equality, as float32, and texts by contains', () => {
    expect(columnFilter(true)).toMatchObject({
      filter: 'agNumberColumnFilter',
      filterParams: { numberParser: parseFloat32 },
      floatingFilterComponentParams: { filterPlaceholder: 'equals' },
    })
    expect(columnFilter(false)).toMatchObject({
      filter: 'agTextColumnFilter',
      floatingFilterComponentParams: { filterPlaceholder: 'contains' },
    })
  })
})

describe('indexColumn', () => {
  it('is pinned, not sortable and as wide as the largest row number', () => {
    const small = indexColumn(10)
    const large = indexColumn(100_000)
    expect(small).toMatchObject({ pinned: 'left', sortable: false, filter: false })
    expect(large.width!).toBeGreaterThan(small.width!)
  })
})
