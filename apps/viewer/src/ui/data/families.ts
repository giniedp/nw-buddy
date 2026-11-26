/**
 * The data of the Data tool: the datasheet families of nwbt (`/browse/datasheets`) and their rows, parsed in the
 * frontend. A family is the row type of the sheet header (e.g. MasterItemDefinitions over 43 sheets).
 */
import type { NwbtClient, SheetColumn, SheetFamily } from '../../api/browse'
import { filledColumns, findGroups, formatF32 } from '../../formats/datasheet/analysis'
import { parseDatasheet, type CellValue, type Datasheet } from '../../formats/datasheet/datasheet'
import type { FileContents } from '../../api/files'
import type { SheetData } from '../browser/views/sheet/sheet'

export interface DataSchema {
  families: SheetFamily[]
  /**
   * By lowercase name
   */
  byName: Map<string, SheetFamily>
}

/**
 * The rows of a family: the rows of its sheets one after the other, in the order the game visits the sheets
 */
export interface FamilyRows {
  family: SheetFamily
  /**
   * Parsed sheets, as `family.sheets`
   */
  sheets: Datasheet[]
  /**
   * Per sheet: the sheet column of each family column, -1 if the sheet lacks it
   */
  columnMap: Int32Array[]
  /**
   * Per row: its sheet
   */
  sheetOf: Uint16Array
  /**
   * Per row: its row in the sheet
   */
  rowOf: Uint32Array
  count: number
  /**
   * Lowercase key (first cell) → row. The first row with a key wins, like the game's named row lookup.
   */
  keys: Map<string, number>
  /**
   * Per family column: whether any row has a value
   */
  filled: boolean[]
  /**
   * The numbered column groups of a wide family of one sheet (LootBuckets), for the Groups view
   */
  groups: SheetData | null
}

/**
 * Families kept parsed. The rows of all families are 214 MB, a link follow loads a few.
 */
const KEEP_FAMILIES = 12

/**
 * The datasheet families of a nwbt server and their parsed rows
 */
export class Datasheets {
  private readonly nwbt: NwbtClient
  private readonly files: FileContents
  private schema: Promise<DataSchema> | null = null
  private readonly families = new Map<string, Promise<FamilyRows>>()

  public constructor(nwbt: NwbtClient, files: FileContents) {
    this.nwbt = nwbt
    this.files = files
  }

  /**
   * The families, loaded once. The first request makes nwbt read every datasheet (about 2 s).
   */
  public loadSchema(): Promise<DataSchema> {
    if (!this.schema) {
      this.schema = this.nwbt.getDatasheets().then(({ families }) => ({
        families,
        byName: new Map(families.map((family) => [family.name.toLowerCase(), family])),
      }))
      this.schema.catch(() => (this.schema = null))
    }
    return this.schema
  }

  /**
   * Loads and parses the sheets of a family. The last {@link KEEP_FAMILIES} stay cached.
   */
  public loadFamily(family: SheetFamily): Promise<FamilyRows> {
    const id = family.name.toLowerCase()
    let rows = this.families.get(id)
    if (rows) {
      // most recent last
      this.families.delete(id)
      this.families.set(id, rows)
      return rows
    }
    rows = this.readFamily(family)
    rows.catch(() => this.families.delete(id))
    this.families.set(id, rows)
    while (this.families.size > KEEP_FAMILIES) {
      this.families.delete(this.families.keys().next().value)
    }
    return rows
  }

  /**
   * Loads the family of a name (any case), null if there is none
   */
  public async loadFamilyByName(name: string): Promise<FamilyRows | null> {
    const family = (await this.loadSchema()).byName.get(name.toLowerCase())
    return family ? this.loadFamily(family) : null
  }

  /**
   * The rows a reference may name: every referenced family that has the key, best match of the column first.
   * Families share keys (an ability id is also a progression point id), so it may be several.
   *
   * @param from - the row of the cell: a link to itself is left out (an item's ItemStatsRef is often its own ItemID)
   */
  public async resolveRefs(column: SheetColumn, key: string, from?: RowRef): Promise<RowRef[]> {
    const lower = key.toLowerCase()
    const families = await Promise.all((column.refs ?? []).map((target) => this.loadFamilyByName(target)))
    return families.flatMap((rows) => {
      if (!rows?.keys.has(lower)) {
        return []
      }
      const self = from && rows.family.name === from.family && from.key.toLowerCase() === lower
      return self ? [] : [{ family: rows.family.name, key }]
    })
  }

  private async readFamily(family: SheetFamily): Promise<FamilyRows> {
    const sheets = await Promise.all(
      family.sheets.map(async (info) => parseDatasheet(await this.files.fileBytes(info.path))),
    )
    const columnIndex = new Map(family.columns.map((column, i) => [column.name.toLowerCase(), i]))
    const columnMap = sheets.map((sheet) => {
      const map = new Int32Array(family.columns.length).fill(-1)
      sheet.columns.forEach((column, col) => {
        const at = columnIndex.get(column.name.toLowerCase())
        // the first sheet column of a name, like the family union
        if (at != null && map[at] < 0) {
          map[at] = col
        }
      })
      return map
    })
    const count = sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
    const sheetOf = new Uint16Array(count)
    const rowOf = new Uint32Array(count)
    const keys = new Map<string, number>()
    const filled = new Array<boolean>(family.columns.length).fill(false)
    let i = 0
    sheets.forEach((sheet, s) => {
      const map = columnMap[s]
      const sheetFilled = filledColumns(sheet)
      map.forEach((col, at) => {
        if (col >= 0 && sheetFilled[col]) {
          filled[at] = true
        }
      })
      // the key is the first cell of the sheet, sheets of a family may start with other columns (VariationData:
      // VariantID, HouseItems: HouseItemID)
      for (let row = 0; row < sheet.rowCount; row++, i++) {
        sheetOf[i] = s
        rowOf[i] = row
        if (sheet.columns.length && !sheet.isDefault(row, 0)) {
          const key = String(sheet.cell(row, 0)).toLowerCase()
          if (!keys.has(key)) {
            keys.set(key, i)
          }
        }
      }
    })
    let groups: SheetData | null = null
    if (sheets.length === 1) {
      const sheetFilled = filledColumns(sheets[0])
      const found = findGroups(sheets[0], sheetFilled)
      if (found) {
        groups = { sheet: sheets[0], filled: sheetFilled, groups: found }
      }
    }
    return { family, sheets, columnMap, sheetOf, rowOf, count, keys, filled, groups }
  }
}

/**
 * The value of a family column in a row, null when the cell is empty or the row's sheet lacks the column
 */
export function familyCell(rows: FamilyRows, row: number, column: number): CellValue | null {
  const s = rows.sheetOf[row]
  const col = rows.columnMap[s][column]
  if (col < 0) {
    return null
  }
  const sheet = rows.sheets[s]
  const at = rows.rowOf[row]
  return sheet.isDefault(at, col) ? null : sheet.cell(at, col)
}

/**
 * A cell as text, '' when empty
 */
export function familyText(rows: FamilyRows, row: number, column: number): string {
  const value = familyCell(rows, row, column)
  if (value == null) {
    return ''
  }
  return typeof value === 'number' ? formatF32(value) : String(value)
}

/**
 * The family column of a name (any case), -1 if there is none
 */
export function columnOf(family: SheetFamily, name: string): number {
  const lower = name.toLowerCase()
  return family.columns.findIndex((column) => column.name.toLowerCase() === lower)
}

/**
 * The text of a named column in a row, '' when empty or missing
 */
export function namedText(rows: FamilyRows, row: number, name: string): string {
  const column = columnOf(rows.family, name)
  return column < 0 ? '' : familyText(rows, row, column)
}

/**
 * The key of a row: the first cell of its sheet
 */
export function rowKey(rows: FamilyRows, row: number): string {
  const sheet = rows.sheets[rows.sheetOf[row]]
  const at = rows.rowOf[row]
  if (!sheet.columns.length || sheet.isDefault(at, 0)) {
    return ''
  }
  const value = sheet.cell(at, 0)
  return typeof value === 'number' ? formatF32(value) : String(value)
}

/**
 * The items of a list cell: a ref or asset cell may hold several, separated by `,` `;` or `+` (as nwbt infers)
 */
export function cellItems(text: string): string[] {
  return text
    .split(/[,;+]/)
    .map((it) => it.trim())
    .filter((it) => it !== '')
}

/**
 * A row of another family that a reference names
 */
export interface RowRef {
  family: string
  key: string
}

/**
 * What the cells of a column hold, for the tooltips of the column and the field (see `SheetColumnKind`)
 */
export function kindLabel(kind: string, refs?: string[]) {
  switch (kind) {
    case 'key':
      return 'the key of the rows'
    case 'ref':
      return `rows of ${refs?.join(', ')}`
    case 'loc':
      return 'localized text'
    case 'asset':
      return 'file paths'
    case 'audio':
      return 'audio triggers'
  }
  return kind
}
