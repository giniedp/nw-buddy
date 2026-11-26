import type { GridOptions } from 'ag-grid-community'
import { Match, Switch } from 'solid-js'
import { TextInput } from 'tweak-ui'
import type { LocString } from '../../../../formats/loc/loc'
import { columnWidth, Grid, indexColumn } from '../../../common/grid'
import type { AssetViewProps } from '../registry'
import { createLocModeStore, type LocModeStore } from './LocMode.store'

/**
 * A localization file as a key / value table with a filter. Default export for `lazy()`, ag-grid loads with it.
 */
export default function LocMode(props: AssetViewProps) {
  const store = createLocModeStore(props)
  const { state } = store

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">Could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.ready}>
        <div class="nw-view-bar">
          <TextInput class="nw-view-filter" placeholder="Filter keys and values" onInput={store.filter} />
          <span class="nw-muted">{state.count}</span>
        </div>
        <Grid<LocString> ref={store.setGrid} options={gridOptions(store)} />
      </Match>
    </Switch>
  )
}

function gridOptions(store: LocModeStore): GridOptions<LocString> {
  const rows = store.rows()
  return {
    rowData: rows,
    columnDefs: [
      indexColumn(rows.length),
      {
        field: 'key',
        headerName: 'Key',
        width: columnWidth('Key', store.state.keyChars),
        tooltipField: 'key',
      },
      { field: 'value', headerName: 'Value', flex: 1, tooltipField: 'value' },
    ],
    defaultColDef: { sortable: true, resizable: true },
  }
}
