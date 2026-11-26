import type { GridApi } from 'ag-grid-community'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { AssetViewProps } from '../registry'
import { rowColumn, tableColumns } from './columns'
import type { GridRow, SheetTableModeState } from './types'

export type SheetTableModeStore = ReturnType<typeof createSheetTableModeStore>

/**
 * The state and actions of the Table mode: shows or hides the columns without a filled cell
 */
export function createSheetTableModeStore(props: AssetViewProps) {
  // the sheet of a tab does not change, the mode reads it once
  const data = props.ctx.sheet
  const sheet = data.sheet
  const emptyColumns = data.filled.filter((filled) => !filled).length

  const [state, setState] = createStore<SheetTableModeState>({
    showEmpty: false,
    emptyColumns,
    get count() {
      return count()
    },
  })
  const count = createMemo(() => {
    const hidden = state.showEmpty ? 0 : emptyColumns
    return tableCount(sheet.rowCount, sheet.columns.length - hidden)
  })

  let grid: GridApi<GridRow> | undefined

  return {
    state,
    data,
    /**
     * The columns the grid starts with
     */
    columns: () => tableColumns(data, false),
    setGrid(api: GridApi<GridRow>) {
      grid = api
    },
    setShowEmpty(on: boolean) {
      setState('showEmpty', on)
      grid?.setGridOption('columnDefs', [rowColumn(sheet.rowCount), ...tableColumns(data, on)])
    },
  }
}

export function tableCount(rows: number, columns: number) {
  return `${rows.toLocaleString()} rows × ${columns.toLocaleString()} columns`
}
