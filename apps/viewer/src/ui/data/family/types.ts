/**
 * A row of the grid: an index into the family rows. An object, ag-grid drops rows whose data is falsy.
 */
export interface GridRow {
  i: number
}

export interface FamilyViewState {
  /**
   * The numbered column groups as rows (a wide family of one sheet), or the table
   */
  view: 'table' | 'groups'
  /**
   * Columns without a filled cell are shown
   */
  showEmpty: boolean
  /**
   * The sheet the table shows, -1 for all of them
   */
  sheet: number
  /**
   * The selected row by its index, null for none: from the key or the index of the tab
   */
  readonly selected: number | null
  /**
   * The columns without a filled cell
   */
  readonly emptyColumns: number
  /**
   * Rows and sheets of the family, e.g. `2,415 rows · 5 sheets`
   */
  readonly count: string
}
