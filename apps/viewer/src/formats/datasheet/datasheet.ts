/**
 * Datasheets: New World's binary game data tables (.datasheet, 2,250 files). A header, typed columns,
 * row-major cells of 8 bytes and a table of NUL-terminated strings.
 *
 * Layout (little endian, strict):
 *
 * ```
 * 0x00 version (0x11 or 0x12)     0x04 name crc    0x08 name string offset
 * 0x0c type crc                   0x10 type string offset
 * 0x38 data size: the string table starts at data size + 0x3c
 * 0x44 column count               0x48 row count
 * 0x5c column records, 12 bytes: crc, name offset, type (1 string, 2 number, 3 bool)
 *      then the cells, 8 bytes: crc, value (string offset, f32 or bool)
 * ```
 *
 * Empty cells are stored as their type's default: "", 0 or false. The cell crc is not a crc of the cell's text and
 * never 0, so it can not tell "empty" from a written default.
 *
 * Cells are read on demand from the file data, large sheets have millions of cells (LootBuckets: 5.8M).
 */

export const ColumnType = {
  String: 1,
  Number: 2,
  Boolean: 3,
} as const
export type ColumnType = (typeof ColumnType)[keyof typeof ColumnType]

export interface DatasheetColumn {
  crc: number
  name: string
  type: ColumnType
}

export type CellValue = string | number | boolean

export type DatasheetErrorCode =
  | 'too-short'
  | 'unsupported-version'
  | 'bad-layout'
  | 'bad-string'
  | 'unknown-column-type'

export class DatasheetError extends Error {
  public readonly code: DatasheetErrorCode

  public constructor(code: DatasheetErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export const HEADER_SIZE = 0x5c
export const COLUMN_SIZE = 12
export const CELL_SIZE = 8

export class Datasheet {
  public readonly version: number
  /**
   * Table name, e.g. "LootBucketData"
   */
  public readonly name: string
  /**
   * Row type name
   */
  public readonly typeName: string
  public readonly columns: readonly DatasheetColumn[]
  public readonly rowCount: number

  private readonly view: DataView
  private readonly cellsOffset: number
  private readonly strings: Uint8Array
  // strings repeat a lot (ids, enums), decode each once
  private readonly stringCache = new Map<number, string>()
  private readonly decoder = new TextDecoder('utf-8')

  public constructor(data: Uint8Array) {
    if (data.length < HEADER_SIZE) {
      throw new DatasheetError('too-short', `${data.length} bytes, the header has ${HEADER_SIZE}`)
    }
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    this.view = view
    this.version = view.getUint32(0x00, true)
    if (this.version !== 0x11 && this.version !== 0x12) {
      throw new DatasheetError('unsupported-version', `version 0x${this.version.toString(16)}`)
    }
    const dataSize = view.getUint32(0x38, true)
    const columnCount = view.getUint32(0x44, true)
    const rowCount = view.getUint32(0x48, true)
    const cellsOffset = HEADER_SIZE + columnCount * COLUMN_SIZE
    const stringsOffset = dataSize + 0x3c
    if (columnCount > data.length / COLUMN_SIZE || rowCount > data.length || cellsOffset > data.length) {
      throw new DatasheetError('bad-layout', `${columnCount} columns, ${rowCount} rows in ${data.length} bytes`)
    }
    if (cellsOffset + rowCount * columnCount * CELL_SIZE !== stringsOffset || stringsOffset > data.length) {
      throw new DatasheetError('bad-layout', 'the cells do not end where the strings start')
    }
    this.cellsOffset = cellsOffset
    this.rowCount = rowCount
    this.strings = data.subarray(stringsOffset)
    this.name = this.stringAt(view.getUint32(0x08, true))
    this.typeName = this.stringAt(view.getUint32(0x10, true))

    const columns: DatasheetColumn[] = []
    for (let i = 0; i < columnCount; i++) {
      const at = HEADER_SIZE + i * COLUMN_SIZE
      const type = view.getUint32(at + 8, true)
      if (type < ColumnType.String || type > ColumnType.Boolean) {
        throw new DatasheetError('unknown-column-type', `column ${i} has type ${type}`)
      }
      columns.push({
        crc: view.getUint32(at, true),
        name: this.stringAt(view.getUint32(at + 4, true)),
        type: type as ColumnType,
      })
    }
    this.columns = columns
  }

  /**
   * The value of a cell. A string cell whose offset is bad reads as "".
   */
  public cell(row: number, col: number): CellValue {
    const raw = this.raw(row, col)
    switch (this.columns[col].type) {
      case ColumnType.String:
        return this.tryStringAt(raw) ?? ''
      case ColumnType.Number:
        return this.number(row, col)
      case ColumnType.Boolean:
        return raw !== 0
    }
  }

  /**
   * Whether a cell holds its type's default ("", 0, false): how empty cells are stored
   */
  public isDefault(row: number, col: number): boolean {
    const raw = this.raw(row, col)
    switch (this.columns[col].type) {
      case ColumnType.String:
        return raw < this.strings.length && this.strings[raw] === 0
      case ColumnType.Number:
        // +0 and -0
        return (raw & 0x7fffffff) === 0
      case ColumnType.Boolean:
        return raw === 0
    }
  }

  private raw(row: number, col: number) {
    return this.view.getUint32(this.cellsOffset + (row * this.columns.length + col) * CELL_SIZE + 4, true)
  }

  private number(row: number, col: number) {
    return this.view.getFloat32(this.cellsOffset + (row * this.columns.length + col) * CELL_SIZE + 4, true)
  }

  private stringAt(offset: number): string {
    const value = this.tryStringAt(offset)
    if (value == null) {
      throw new DatasheetError('bad-string', `no string starts at offset ${offset}`)
    }
    return value
  }

  /**
   * The string at an offset of the string table. It must start a string: offset 0 or after a NUL.
   */
  private tryStringAt(offset: number): string | null {
    const cached = this.stringCache.get(offset)
    if (cached != null) {
      return cached
    }
    const strings = this.strings
    if (offset >= strings.length || (offset > 0 && strings[offset - 1] !== 0)) {
      return null
    }
    const end = strings.indexOf(0, offset)
    if (end < 0) {
      return null
    }
    const value = this.decoder.decode(strings.subarray(offset, end))
    this.stringCache.set(offset, value)
    return value
  }
}

/**
 * Reads a datasheet, throws a {@link DatasheetError} if the data is not one
 */
export function parseDatasheet(data: Uint8Array): Datasheet {
  return new Datasheet(data)
}
