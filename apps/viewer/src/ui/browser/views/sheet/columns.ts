import type { ColDef } from 'ag-grid-community'
import { cellText, formatF32 } from '../../../../formats/datasheet/analysis'
import { ColumnType, type Datasheet } from '../../../../formats/datasheet/datasheet'
import { columnFilter, columnWidth, indexColumn } from '../../../common/grid'
import type { SheetData } from './sheet'
import type { GridRow, SheetField } from './types'

/**
 * Rows read to size the columns; the widths of a large sheet come from its start
 */
const WIDTH_SAMPLE_ROWS = 300

/**
 * A cell for the grid: null when empty (sorts first, shows blank), else the value
 */
export function cellValue(sheet: Datasheet, row: number, col: number) {
  if (sheet.isDefault(row, col)) {
    return null
  }
  return sheet.cell(row, col)
}

export function formatValue(value: unknown) {
  if (value == null) {
    return ''
  }
  if (typeof value === 'number') {
    return formatF32(value)
  }
  return String(value)
}

/**
 * The widest text of a column in the first rows, in characters
 */
export function sampleWidth(sheet: Datasheet, col: number, rows = WIDTH_SAMPLE_ROWS) {
  let chars = 0
  for (let row = 0; row < Math.min(sheet.rowCount, rows); row++) {
    chars = Math.max(chars, cellText(sheet, row, col).length)
  }
  return chars
}

/**
 * A column that shows a cell of the sheet; `source` maps a grid row to the sheet row and column (-1: empty)
 */
export function sheetColumn(
  data: SheetData,
  id: string,
  name: string,
  col: number,
  source: (gridRow: number) => [row: number, col: number],
): ColDef<GridRow> {
  const sheet = data.sheet
  const numeric = col >= 0 && sheet.columns[col].type === ColumnType.Number
  return {
    colId: id,
    headerName: name,
    headerTooltip: name,
    valueGetter: (p) => {
      const [row, c] = source(p.data.i)
      if (c < 0) {
        return null
      }
      return cellValue(sheet, row, c)
    },
    valueFormatter: (p) => formatValue(p.value),
    tooltipValueGetter: (p) => formatValue(p.value),
    width: columnWidth(name, col >= 0 ? sampleWidth(sheet, col) : 0),
    type: numeric ? 'rightAligned' : undefined,
    ...columnFilter(numeric),
  }
}

/**
 * The number of a grid row as the `#` column. Unlike ag-grid's display index it stays with the row when
 * sorting or filtering, it names the row in the sheet (Table) or the entry (Groups).
 */
export function rowColumn(total: number): ColDef<GridRow> {
  return { ...indexColumn<GridRow>(total), valueGetter: (p) => p.data?.i }
}

/**
 * The columns of the Table mode: the sheet's columns, those without a filled cell only `withEmpty`
 */
export function tableColumns(data: SheetData, withEmpty: boolean): ColDef<GridRow>[] {
  return data.sheet.columns.flatMap((column, col) => {
    if (!withEmpty && !data.filled[col]) {
      return []
    }
    return [sheetColumn(data, String(col), column.name, col, (row) => [row, col])]
  })
}

/**
 * The columns of the Groups mode: the keys of the sheet row, the group number and name, then one column per field
 * of the group
 */
export function groupColumns(data: SheetData): ColDef<GridRow>[] {
  const sheet = data.sheet
  const groups = data.groups
  const entries = groups.entries
  const entryRow = (i: number) => entries[i][1]
  let longestHeader = 0
  for (const header of groups.headers) {
    longestHeader = Math.max(longestHeader, header.length)
  }

  const columns: ColDef<GridRow>[] = groups.keys.map((col) =>
    sheetColumn(data, `key${col}`, sheet.columns[col].name, col, (i) => [entryRow(i), col]),
  )
  columns.push({
    colId: 'group',
    headerName: 'Group',
    valueGetter: (p) => groups.numbers[entries[p.data.i][0]],
    width: columnWidth('Group', String(groups.numbers.at(-1) ?? '').length),
    type: 'rightAligned',
    ...columnFilter(true),
  })
  if (groups.headerRow >= 0) {
    columns.push({
      colId: 'name',
      headerName: 'Name',
      headerTooltip: 'The name of the group, from the FIRSTROW row',
      valueGetter: (p) => groups.headers[entries[p.data.i][0]],
      width: columnWidth('Name', longestHeader),
    })
  }
  groups.bases.forEach((base, b) => {
    if (groups.baseFilled[b]) {
      columns.push(
        sheetColumn(data, `base${b}`, base, firstColumnOf(groups.field, b), (i) => [
          entryRow(i),
          groups.field[entries[i][0]][b],
        ]),
      )
    }
  })
  return columns
}

/**
 * A column of a base in some group, to size and align the base's column
 */
export function firstColumnOf(field: Int32Array[], base: number) {
  for (const cols of field) {
    if (cols[base] >= 0) {
      return cols[base]
    }
  }
  return -1
}

/**
 * The filled fields of one row of the sheet
 */
export function rowFields(sheet: Datasheet, row: number): SheetField[] {
  return sheet.columns
    .map((column, col) => ({ name: column.name, text: cellText(sheet, row, col) }))
    .filter((field) => field.text !== '')
}
