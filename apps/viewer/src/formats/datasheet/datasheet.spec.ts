import { describe, expect, it } from 'vitest'
import { CELL_SIZE, COLUMN_SIZE, ColumnType, DatasheetError, HEADER_SIZE, parseDatasheet } from './datasheet'

// string table: "" at 0, then the names and values
const STRINGS = '\0Loot\0LootData\0Name\0Qty\0On\0apple\0Grüße\0'

/**
 * The offset of a whole string in the string table
 */
function at(s: string): number {
  const bytes = new TextEncoder().encode(STRINGS)
  const needle = new TextEncoder().encode(s)
  for (let i = 0; i + needle.length < bytes.length; i++) {
    if (
      (i === 0 || bytes[i - 1] === 0) &&
      bytes[i + needle.length] === 0 &&
      needle.every((b, j) => bytes[i + j] === b)
    ) {
      return i
    }
  }
  throw new Error(`no ${s}`)
}

interface Fixture {
  version?: number
  columns?: Array<{ name: number; type: number }>
  cells?: number[]
  dataSize?: number
  nameOffset?: number
}

/**
 * A sheet "Loot" of type "LootData": columns Name (string), Qty (number), On (bool) and three rows:
 * apple 2.5 true; empty defaults; Grüße -0 false
 */
function writeSheet(fixture: Fixture = {}): Uint8Array {
  const columns = fixture.columns ?? [
    { name: at('Name'), type: 1 },
    { name: at('Qty'), type: 2 },
    { name: at('On'), type: 3 },
  ]
  const f32 = (v: number) => new Uint32Array(new Float32Array([v]).buffer)[0]
  const cells = fixture.cells ?? [at('apple'), f32(2.5), 1, 0, 0, 0, at('Grüße'), f32(-0), 0]
  const rows = cells.length / columns.length
  const strings = new TextEncoder().encode(STRINGS)
  const cellsOffset = HEADER_SIZE + columns.length * COLUMN_SIZE
  const size = cellsOffset + cells.length * CELL_SIZE + strings.length
  const data = new Uint8Array(size)
  const view = new DataView(data.buffer)
  view.setUint32(0x00, fixture.version ?? 0x12, true)
  view.setUint32(0x08, fixture.nameOffset ?? at('Loot'), true)
  view.setUint32(0x10, at('LootData'), true)
  view.setUint32(0x38, fixture.dataSize ?? cellsOffset + cells.length * CELL_SIZE - 0x3c, true)
  view.setUint32(0x44, columns.length, true)
  view.setUint32(0x48, rows, true)
  columns.forEach((c, i) => {
    view.setUint32(HEADER_SIZE + i * COLUMN_SIZE, 0xabcd, true)
    view.setUint32(HEADER_SIZE + i * COLUMN_SIZE + 4, c.name, true)
    view.setUint32(HEADER_SIZE + i * COLUMN_SIZE + 8, c.type, true)
  })
  cells.forEach((v, i) => {
    view.setUint32(cellsOffset + i * CELL_SIZE, 0x7051, true)
    view.setUint32(cellsOffset + i * CELL_SIZE + 4, v, true)
  })
  data.set(strings, cellsOffset + cells.length * CELL_SIZE)
  return data
}

function code(fn: () => unknown) {
  try {
    fn()
  } catch (err) {
    return err instanceof DatasheetError ? err.code : String(err)
  }
  return 'no error'
}

describe('parseDatasheet', () => {
  it('reads the header and the columns', () => {
    const sheet = parseDatasheet(writeSheet())
    expect(sheet.version).toBe(0x12)
    expect(sheet.name).toBe('Loot')
    expect(sheet.typeName).toBe('LootData')
    expect(sheet.rowCount).toBe(3)
    expect(sheet.columns.map((c) => [c.name, c.type, c.crc])).toEqual([
      ['Name', ColumnType.String, 0xabcd],
      ['Qty', ColumnType.Number, 0xabcd],
      ['On', ColumnType.Boolean, 0xabcd],
    ])
  })

  it('reads cells and tells defaults', () => {
    const sheet = parseDatasheet(writeSheet())
    const row = (r: number) => [0, 1, 2].map((c) => sheet.cell(r, c))
    const defaults = (r: number) => [0, 1, 2].map((c) => sheet.isDefault(r, c))
    expect(row(0)).toEqual(['apple', 2.5, true])
    expect(defaults(0)).toEqual([false, false, false])
    expect(row(1)).toEqual(['', 0, false])
    expect(defaults(1)).toEqual([true, true, true])
    // utf-8 strings, -0 is a default
    expect(row(2)).toEqual(['Grüße', -0, false])
    expect(defaults(2)).toEqual([false, true, true])
  })

  it('accepts version 0x11', () => {
    expect(parseDatasheet(writeSheet({ version: 0x11 })).version).toBe(0x11)
  })

  it('rejects what is not a datasheet', () => {
    expect(code(() => parseDatasheet(new Uint8Array(10)))).toBe('too-short')
    expect(code(() => parseDatasheet(writeSheet({ version: 3 })))).toBe('unsupported-version')
    expect(code(() => parseDatasheet(writeSheet({ dataSize: 4 })))).toBe('bad-layout')
    expect(code(() => parseDatasheet(writeSheet({ columns: [{ name: at('Name'), type: 7 }], cells: [0] })))).toBe(
      'unknown-column-type',
    )
    // an offset inside a string does not start one
    expect(code(() => parseDatasheet(writeSheet({ nameOffset: at('Loot') + 1 })))).toBe('bad-string')
  })

  it('reads a bad string cell as empty', () => {
    const sheet = parseDatasheet(writeSheet({ columns: [{ name: at('Name'), type: 1 }], cells: [at('apple') + 2] }))
    expect(sheet.cell(0, 0)).toBe('')
  })
})
