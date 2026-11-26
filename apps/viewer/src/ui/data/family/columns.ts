import type { ColDef } from 'ag-grid-community'
import { ColumnType } from '../../../formats/datasheet/datasheet'
import { columnFilter, columnWidth, indexColumn } from '../../common/grid'
import { familyCell, familyText, kindLabel, rowKey, type FamilyRows } from '../families'
import { locPlain } from '../locMarkup'
import type { GridRow } from './types'

/**
 * Rows read to size the columns
 */
const WIDTH_SAMPLE_ROWS = 300

/**
 * The columns of a family: the row number, the sheet (several sheets), the key (sheets that start with other columns)
 * and the family's columns, those without a filled cell only `withEmpty`. `locText` is the text of a loc key.
 */
export function familyColumns(
  data: FamilyRows,
  withEmpty: boolean,
  locText: (key: string) => string | undefined,
): ColDef<GridRow>[] {
  const result: ColDef<GridRow>[] = [{ ...indexColumn<GridRow>(data.count), valueGetter: (p) => p.data?.i }]
  if (data.sheets.length > 1) {
    let longest = 0
    for (const info of data.family.sheets) {
      longest = Math.max(longest, info.name.length)
    }
    result.push({
      colId: 'sheet',
      headerName: 'Sheet',
      valueGetter: (p) => data.family.sheets[data.sheetOf[p.data!.i]].name,
      width: columnWidth('Sheet', longest),
    })
  }
  // sheets that start with other columns (VariationData: VariantID, HouseItems: HouseItemID) get their keys here
  const firstColumn = data.family.columns[0]?.name.toLowerCase()
  if (data.sheets.some((sheet) => sheet.columns[0]?.name.toLowerCase() !== firstColumn)) {
    let chars = 0
    for (let i = 0; i < Math.min(data.count, WIDTH_SAMPLE_ROWS); i++) {
      chars = Math.max(chars, rowKey(data, i).length)
    }
    result.push({
      colId: 'key',
      headerName: 'Key',
      headerTooltip: 'The first cell of the row in its sheet, the key the row is found by',
      valueGetter: (p) => rowKey(data, p.data!.i),
      width: columnWidth('Key', Math.max(chars, 32)),
      pinned: 'left',
    })
  }
  data.family.columns.forEach((column, c) => {
    if (!withEmpty && !data.filled[c]) {
      return
    }
    const loc = column.kind === 'loc'
    let chars = 0
    for (let i = 0; i < Math.min(data.count, WIDTH_SAMPLE_ROWS); i++) {
      chars = Math.max(chars, familyText(data, i, c).length)
    }
    result.push({
      colId: String(c),
      headerName: column.name,
      headerTooltip: column.kind ? `${column.name} (${kindLabel(column.kind, column.refs)})` : column.name,
      valueGetter: (p) => {
        const value = familyCell(data, p.data!.i, c)
        if (loc && typeof value === 'string') {
          return locPlain(locText(value) ?? value)
        }
        return value
      },
      valueFormatter: (p) => {
        if (p.value == null) {
          return ''
        }
        if (typeof p.value === 'number') {
          return familyText(data, p.data!.i, c)
        }
        return String(p.value)
      },
      tooltipValueGetter: (p) => (p.value == null ? '' : String(p.value)),
      width: columnWidth(column.name, loc ? Math.max(chars, 24) : chars),
      type: column.type === ColumnType.Number ? 'rightAligned' : undefined,
      ...columnFilter(column.type === ColumnType.Number),
      cellClass: column.kind === 'ref' ? 'nw-cell-ref' : undefined,
    })
  })
  return result
}

/**
 * The rows of the grid: all rows of the family, or those of one sheet (`sheet` >= 0)
 */
export function familyRowData(data: Pick<FamilyRows, 'count' | 'sheetOf'>, sheet: number): GridRow[] {
  const result: GridRow[] = []
  for (let i = 0; i < data.count; i++) {
    if (sheet < 0 || data.sheetOf[i] === sheet) {
      result.push({ i })
    }
  }
  return result
}

/**
 * The selected row: by the key of the tab, else by its index when it is a row of the family
 */
export function selectedRow(
  data: Pick<FamilyRows, 'keys' | 'count'>,
  key: string | null,
  index: number | null,
): number | null {
  if (key != null) {
    return data.keys.get(key.toLowerCase()) ?? null
  }
  if (index != null && index >= 0 && index < data.count) {
    return index
  }
  return null
}
