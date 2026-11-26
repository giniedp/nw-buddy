/**
 * What a datasheet holds beyond its cells: which columns are used, and the numbered column groups of wide
 * sheets.
 */
import { ColumnType, type Datasheet } from './datasheet'

/**
 * A wide sheet has at least this many groups, covering half of the columns or more
 */
export const MIN_GROUPS = 10

/**
 * The unpivot of a wide sheet: columns named `<base><n>` (LootBucket1, Item1, Quantity1, …) form group n.
 * Each (group, row) with a filled field is one entry. Bases compare without case, like the game's column crcs
 * (`Odds1` … and `odds432`).
 */
export interface SheetGroups {
  /**
   * Base names in order of appearance, the first spelling of each
   */
  bases: string[]
  /**
   * Group numbers, ascending
   */
  numbers: number[]
  /**
   * `[group][base]` → the column of that field, -1 when the group lacks the base
   */
  field: Int32Array[]
  /**
   * Ungrouped columns with a filled cell: the keys of the rows
   */
  keys: number[]
  /**
   * The `FIRSTROW` row (first column), -1 when there is none. Its first filled field of a group names the group.
   */
  headerRow: number
  /**
   * Name of each group from the header row, '' without one
   */
  headers: string[]
  /**
   * `[group, row]` pairs with a filled field, a group's entries together in row order. The header row is not one.
   */
  entries: Array<[number, number]>
  /**
   * Per base: filled in a row other than the header row. `LootBucket<n>` is only filled in FIRSTROW.
   */
  baseFilled: boolean[]
}

/**
 * Per column: whether any cell holds more than its type's default (empty cells are stored as defaults)
 */
export function filledColumns(sheet: Datasheet): boolean[] {
  return sheet.columns.map((_, col) => {
    for (let row = 0; row < sheet.rowCount; row++) {
      if (!sheet.isDefault(row, col)) {
        return true
      }
    }
    return false
  })
}

/**
 * A column name `<base><n>`: up to 6 trailing digits after a non-empty base
 */
export function splitNumber(name: string): { base: string; n: number } | null {
  let start = name.length
  while (start > 0 && name.charCodeAt(start - 1) >= 48 && name.charCodeAt(start - 1) <= 57) {
    start--
  }
  if (start === name.length || start === 0 || name.length - start > 6) {
    return null
  }
  return { base: name.slice(0, start), n: Number(name.slice(start)) }
}

/**
 * The numbered column groups, when they make the sheet wide; null otherwise
 */
export function findGroups(sheet: Datasheet, filled: readonly boolean[]): SheetGroups | null {
  const numbered: Array<{ col: number; base: string; n: number }> = []
  const counts = new Map<string, Set<number>>()
  const spelling = new Map<string, string>()
  sheet.columns.forEach((column, col) => {
    const split = splitNumber(column.name)
    if (!split) {
      return
    }
    const base = split.base.toLowerCase()
    if (!spelling.has(base)) {
      spelling.set(base, split.base)
    }
    numbered.push({ col, base, n: split.n })
    let set = counts.get(base)
    if (!set) {
      set = new Set()
      counts.set(base, set)
    }
    set.add(split.n)
  })

  const bases: string[] = []
  const numbers = new Set<number>()
  const grouped = new Array<boolean>(sheet.columns.length).fill(false)
  for (const e of numbered) {
    if (counts.get(e.base).size < MIN_GROUPS / 2) {
      continue
    }
    grouped[e.col] = true
    numbers.add(e.n)
    if (!bases.includes(e.base)) {
      bases.push(e.base)
    }
  }
  const groupedCount = grouped.filter(Boolean).length
  if (numbers.size < MIN_GROUPS || groupedCount * 2 < sheet.columns.length) {
    return null
  }

  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  const field = sortedNumbers.map(() => new Int32Array(bases.length).fill(-1))
  for (const e of numbered) {
    if (grouped[e.col]) {
      field[sortedNumbers.indexOf(e.n)][bases.indexOf(e.base)] = e.col
    }
  }
  const keys = sheet.columns.map((_, i) => i).filter((i) => !grouped[i] && filled[i])

  // the FIRSTROW row (in the first column) names the groups
  let headerRow = -1
  if (sheet.columns[0]?.type === ColumnType.String) {
    for (let row = 0; row < sheet.rowCount; row++) {
      if (sheet.cell(row, 0) === 'FIRSTROW') {
        headerRow = row
        break
      }
    }
  }
  const headers = field.map((cols) => {
    if (headerRow < 0) {
      return ''
    }
    for (const col of cols) {
      if (col >= 0 && !sheet.isDefault(headerRow, col)) {
        return cellText(sheet, headerRow, col)
      }
    }
    return ''
  })

  const entries: Array<[number, number]> = []
  const baseFilled = new Array<boolean>(bases.length).fill(false)
  field.forEach((cols, group) => {
    for (let row = 0; row < sheet.rowCount; row++) {
      if (row === headerRow) {
        continue
      }
      let entry = false
      cols.forEach((col, base) => {
        if (col >= 0 && !sheet.isDefault(row, col)) {
          entry = true
          baseFilled[base] = true
        }
      })
      if (entry) {
        entries.push([group, row])
      }
    }
  })

  return {
    bases: bases.map((base) => spelling.get(base)),
    numbers: sortedNumbers,
    field,
    keys,
    headerRow,
    headers,
    entries,
    baseFilled,
  }
}

/**
 * The shortest text that reads back as the same float32, e.g. 0.1 instead of 0.10000000149011612
 */
export function formatF32(value: number): string {
  if (!Number.isFinite(value) || Number.isInteger(value)) {
    return String(value)
  }
  for (let digits = 1; digits <= 9; digits++) {
    const text = value.toPrecision(digits)
    if (Math.fround(Number(text)) === value) {
      return String(Number(text))
    }
  }
  return String(value)
}

/**
 * The sheet as json: name, row type, column types and the rows with their filled fields only (empty cells are
 * left out). Numbers are their shortest float32 value.
 */
export function sheetToJson(sheet: Datasheet): string {
  const typeName = { [ColumnType.String]: 'string', [ColumnType.Number]: 'number', [ColumnType.Boolean]: 'boolean' }
  const rows: Array<Record<string, string | number | boolean>> = []
  for (let row = 0; row < sheet.rowCount; row++) {
    const fields: Record<string, string | number | boolean> = {}
    sheet.columns.forEach((column, col) => {
      if (!sheet.isDefault(row, col)) {
        const value = sheet.cell(row, col)
        fields[column.name] = typeof value === 'number' ? Number(formatF32(value)) : value
      }
    })
    rows.push(fields)
  }
  const columns = Object.fromEntries(sheet.columns.map((column) => [column.name, typeName[column.type]]))
  return JSON.stringify({ name: sheet.name, type: sheet.typeName, columns, rows }, null, 2)
}

/**
 * A cell as text: strings as they are, numbers as their shortest float32 text, booleans as true/false.
 * A cell with its type's default (an empty cell) is ''.
 */
export function cellText(sheet: Datasheet, row: number, col: number): string {
  if (sheet.isDefault(row, col)) {
    return ''
  }
  const value = sheet.cell(row, col)
  return typeof value === 'number' ? formatF32(value) : String(value)
}
