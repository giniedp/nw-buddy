import type { GridApi } from 'ag-grid-community'
import { createEffect, createMemo, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useApp } from '../../app/ViewerApp'
import { rowKey, type FamilyRows } from '../families'
import { familyColumns, familyRowData, selectedRow } from './columns'
import type { FamilyViewState, GridRow } from './types'

const FILTER_DELAY = 250

export interface FamilyViewProps {
  rows: FamilyRows
  rowKey: string | null
  rowIndex: number | null
  onSelect: (key: string | null, row: number) => void
  /**
   * The view is visible (the active tab): a hidden view's 3D preview releases the engine canvas
   */
  shown: boolean
}

export type FamilyViewStore = ReturnType<typeof createFamilyViewStore>

/**
 * The state and actions of a family: the table or the groups, the sheet and empty columns of the table, the filter,
 * and the selected row, which follows the url (back / forward, links)
 */
export function createFamilyViewStore(props: FamilyViewProps) {
  const app = useApp()
  const rows = () => props.rows
  const [state, setState] = createStore<FamilyViewState>({
    view: props.rows.groups ? 'groups' : 'table',
    showEmpty: false,
    sheet: -1,
    get selected() {
      return selected()
    },
    get emptyColumns() {
      return emptyColumns()
    },
    get count() {
      return `${rows().count.toLocaleString()} rows · ${rows().family.sheets.length} sheets`
    },
  })
  const selected = createMemo(() => selectedRow(rows(), props.rowKey, props.rowIndex))
  const emptyColumns = createMemo(() => rows().filled.filter((it) => !it).length)
  const columns = (withEmpty: boolean) => familyColumns(rows(), withEmpty, (key) => app.loc.text(key))

  let grid: GridApi<GridRow> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  /**
   * Selects the row in the grid and scrolls to it
   */
  const showSelected = () => {
    const row = selected()
    if (!grid || row == null) {
      return
    }
    const node = grid.getRowNode(String(row))
    if (node && !node.isSelected()) {
      node.setSelected(true, true)
      grid.ensureNodeVisible(node, 'middle')
    }
  }

  // loc texts arrive after the grid
  createEffect(
    on(
      () => app.loc.ready(),
      () => grid?.refreshCells({ force: true }),
      { defer: true },
    ),
  )
  // the selection follows the url (back / forward, links)
  createEffect(showSelected)

  return {
    state,
    /**
     * The rows of the family. Not part of the state: the datasheets service owns them.
     */
    rows,
    /**
     * The columns the grid starts with
     */
    columns: () => columns(false),
    /**
     * The rows the grid starts with
     */
    rowData: () => familyRowData(rows(), state.sheet),
    /**
     * The sheets of the family for the sheet select, all of them first
     */
    sheetOptions: () => [
      { label: `All ${rows().sheets.length} sheets`, value: -1 },
      ...rows().family.sheets.map((info, s) => ({ label: `${info.name} (${info.rows})`, value: s })),
    ],
    setGrid(api: GridApi<GridRow>) {
      grid = api
    },
    /**
     * The grid shows its rows: the selected one is selected
     */
    firstDataRendered() {
      showSelected()
    },
    setView(view: FamilyViewState['view']) {
      setState('view', view)
    },
    /**
     * Filters the rows after a pause in typing
     */
    filter(text: string) {
      clearTimeout(timer)
      timer = setTimeout(() => grid?.setGridOption('quickFilterText', text), FILTER_DELAY)
    },
    setSheet(sheet: number) {
      setState('sheet', sheet)
      grid?.setGridOption('rowData', familyRowData(rows(), sheet))
    },
    setShowEmpty(on: boolean) {
      setState('showEmpty', on)
      grid?.setGridOption('columnDefs', columns(on))
    },
    rowClicked(row: GridRow | undefined) {
      if (row) {
        props.onSelect(rowKey(rows(), row.i) || null, row.i)
      }
    },
  }
}
