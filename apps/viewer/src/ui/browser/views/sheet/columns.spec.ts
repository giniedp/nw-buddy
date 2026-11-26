import { describe, expect, it } from 'vitest'
import { ColumnType, type Datasheet } from '../../../../formats/datasheet/datasheet'
import { firstColumnOf, formatValue, tableColumns } from './columns'
import type { SheetData } from './sheet'
import { groupsCount } from './SheetGroupsMode'
import { tableCount } from './SheetTableMode.store'

describe('formatValue', () => {
  it('leaves empty cells blank', () => {
    expect(formatValue(null)).toBe('')
    expect(formatValue(undefined)).toBe('')
  })

  it('writes strings and booleans as they are', () => {
    expect(formatValue('Sword')).toBe('Sword')
    expect(formatValue(true)).toBe('true')
  })
})

describe('tableColumns', () => {
  // no rows: the widths come from the names only
  const data = {
    sheet: {
      rowCount: 0,
      columns: [
        { name: 'Key', type: ColumnType.String },
        { name: 'Unused', type: ColumnType.String },
        { name: 'Weight', type: ColumnType.Number },
      ],
    } as unknown as Datasheet,
    filled: [true, false, true],
    groups: null,
  } satisfies SheetData

  it('hides the columns without a filled cell unless asked for', () => {
    expect(tableColumns(data, false).map((it) => it.headerName)).toEqual(['Key', 'Weight'])
    expect(tableColumns(data, true).map((it) => it.headerName)).toEqual(['Key', 'Unused', 'Weight'])
  })

  it('aligns number columns right', () => {
    const [key, weight] = tableColumns(data, false)
    expect(key.type).toBeUndefined()
    expect(weight.type).toBe('rightAligned')
  })
})

describe('firstColumnOf', () => {
  it('finds the first group that has the base', () => {
    const field = [Int32Array.of(-1, 4), Int32Array.of(7, 9)]
    expect(firstColumnOf(field, 0)).toBe(7)
    expect(firstColumnOf(field, 1)).toBe(4)
    expect(firstColumnOf([Int32Array.of(-1)], 0)).toBe(-1)
  })
})

describe('counts', () => {
  it('tells rows and columns, entries and groups', () => {
    expect(tableCount(1234, 56)).toBe(`${(1234).toLocaleString()} rows × 56 columns`)
    expect(
      groupsCount({
        entries: [
          [0, 0],
          [1, 0],
        ],
        numbers: [1, 2, 3],
      } as never),
    ).toBe('2 entries in 3 groups')
  })
})
