/**
 * A row of the grid: an index into the sheet rows (Table) or the group entries (Groups). An object, ag-grid
 * drops rows whose data is falsy: a plain `0` lost the first row.
 */
export interface GridRow {
  i: number
}

/**
 * A filled field of a sheet row
 */
export interface SheetField {
  name: string
  text: string
}

export interface SheetLayoutState {
  /**
   * The sheet row shown in the side panel, null for none
   */
  selected: number | null
}

export interface SheetTableModeState {
  /**
   * Columns without a filled cell are shown
   */
  showEmpty: boolean
  /**
   * The columns without a filled cell
   */
  readonly emptyColumns: number
  /**
   * Rows and shown columns, e.g. `1,234 rows × 56 columns`
   */
  readonly count: string
}
