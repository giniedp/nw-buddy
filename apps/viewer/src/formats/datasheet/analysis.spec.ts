import { describe, expect, it } from 'vitest'
import { cellText, filledColumns, findGroups, formatF32, splitNumber } from './analysis'
import { ColumnType, type CellValue, type Datasheet, type DatasheetColumn } from './datasheet'

/**
 * A sheet from plain values; '' / 0 / false are the defaults like in the file format
 */
function fakeSheet(columns: Array<[string, ColumnType]>, rows: CellValue[][]): Datasheet {
  const cols: DatasheetColumn[] = columns.map(([name, type]) => ({ name, type, crc: 0 }))
  return {
    version: 0x12,
    name: 'Fake',
    typeName: 'Fake',
    columns: cols,
    rowCount: rows.length,
    cell: (r: number, c: number) => rows[r][c],
    isDefault: (r: number, c: number) => rows[r][c] === '' || rows[r][c] === 0 || rows[r][c] === false,
  } as unknown as Datasheet
}

const S = ColumnType.String
const N = ColumnType.Number

describe('splitNumber', () => {
  it('splits a trailing number', () => {
    expect(splitNumber('LootBucket12')).toEqual({ base: 'LootBucket', n: 12 })
    expect(splitNumber('Item1')).toEqual({ base: 'Item', n: 1 })
    expect(splitNumber('Name')).toBeNull()
    expect(splitNumber('123')).toBeNull()
    expect(splitNumber('Id1234567')).toBeNull()
  })
})

describe('formatF32', () => {
  it('writes the shortest float32 text', () => {
    expect(formatF32(Math.fround(0.1))).toBe('0.1')
    expect(formatF32(Math.fround(2.5))).toBe('2.5')
    expect(formatF32(Math.fround(1 / 3))).toBe('0.33333334')
    expect(formatF32(42)).toBe('42')
  })
})

describe('filledColumns', () => {
  it('finds columns with a filled cell', () => {
    const sheet = fakeSheet(
      [
        ['A', S],
        ['B', N],
        ['C', S],
      ],
      [
        ['x', 0, ''],
        ['', 0, ''],
        ['', 3, ''],
      ],
    )
    expect(filledColumns(sheet)).toEqual([true, true, false])
  })
})

describe('findGroups', () => {
  // a loot bucket sheet: a key, then Item<n> and Qty<n> for 12 groups, and LootBucket<n> only in FIRSTROW
  function lootBuckets() {
    const columns: Array<[string, ColumnType]> = [['RowPlaceholders', S]]
    for (let n = 1; n <= 12; n++) {
      columns.push([`LootBucket${n}`, S], [`Item${n}`, S], [n === 3 ? `qty${n}` : `Qty${n}`, N])
    }
    const row = (key: string, fill: (n: number) => CellValue[]) => [
      key,
      ...Array.from({ length: 12 }, (_, i) => fill(i + 1)).flat(),
    ]
    return fakeSheet(columns, [
      row('FIRSTROW', (n) => [`Bucket${n}`, '', 0]),
      row('', (n) => ['', n <= 2 ? `item_${n}` : '', n <= 2 ? n : 0]),
      row('', (n) => ['', n === 3 ? 'item_3b' : '', 0]),
    ])
  }

  it('unpivots a wide sheet', () => {
    const sheet = lootBuckets()
    const groups = findGroups(sheet, filledColumns(sheet))
    expect(groups).not.toBeNull()
    // `qty3` joins `Qty`, the first spelling names the base
    expect(groups.bases).toEqual(['LootBucket', 'Item', 'Qty'])
    expect(groups.numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(groups.headerRow).toBe(0)
    expect(groups.headers.slice(0, 3)).toEqual(['Bucket1', 'Bucket2', 'Bucket3'])
    // the key column is filled (FIRSTROW), so it is a key
    expect(groups.keys).toEqual([0])
    expect(groups.entries).toEqual([
      [0, 1],
      [1, 1],
      [2, 2],
    ])
    // LootBucket is only filled in the header row
    expect(groups.baseFilled).toEqual([false, true, true])
    expect(cellText(sheet, 1, groups.field[1][2])).toBe('2')
  })

  it('leaves narrow sheets alone', () => {
    const sheet = fakeSheet(
      [
        ['Name', S],
        ['Item1', S],
        ['Item2', S],
      ],
      [['a', 'b', 'c']],
    )
    expect(findGroups(sheet, filledColumns(sheet))).toBeNull()
  })
})
