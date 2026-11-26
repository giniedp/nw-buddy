import type { ColDef, GridOptions } from 'ag-grid-community'
import { Show, type JSX } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { dataColumnDefaults, Grid } from '../../../common/grid'
import { rowColumn } from './columns'
import { createSheetLayoutStore, type SheetLayoutProps, type SheetLayoutStore } from './SheetLayout.store'
import { SheetRowPanel } from './SheetRowPanel'
import type { GridRow } from './types'

/**
 * The layout of both datasheet modes: a bar (filter, count, options), the grid and the panel of the selected row
 */
export function SheetLayout(
  props: SheetLayoutProps & {
    /**
     * Number of grid rows
     */
    rows: number
    columns: ColDef<GridRow>[]
    count: string
    options?: JSX.Element
  },
) {
  const store = createSheetLayoutStore(props)
  const { state } = store

  return (
    <>
      <div class="nw-view-bar">
        <TextInput class="nw-view-filter" placeholder="Filter rows" onInput={store.filter} />
        {props.options}
        <span class="nw-muted">{props.count}</span>
      </div>
      <div class="nw-sheet">
        <Grid<GridRow> ref={store.setGrid} options={gridOptions(store, props.rows, props.columns)} />
        <Show when={state.selected != null}>
          <SheetRowPanel row={state.selected} fields={store.fields()} onClose={store.close} />
        </Show>
      </div>
    </>
  )
}

function gridOptions(store: SheetLayoutStore, rows: number, columns: ColDef<GridRow>[]): GridOptions<GridRow> {
  return {
    rowData: Array.from({ length: rows }, (_, i) => ({ i })),
    columnDefs: [rowColumn(rows), ...columns],
    defaultColDef: dataColumnDefaults,
    rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
    onRowClicked: (e) => store.rowClicked(e.data),
  }
}
