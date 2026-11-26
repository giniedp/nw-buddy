import type { ColDef, GridOptions } from 'ag-grid-community'
import { Match, Show, Switch } from 'solid-js'
import { Button } from 'tweak-ui'
import { hex, type ChunkEntry } from '../../../../formats/cgf/chunks'
import { columnWidth, Grid, indexColumn } from '../../../common/grid'
import type { AssetViewProps } from '../registry'
import { ChunkPane } from './ChunkPane'
import { createInspectModeStore, type InspectModeStore } from './InspectMode.store'
import './InspectMode.css'

/**
 * The chunks of a CryEngine chunk file (`.cgf`, `.skin`, `.chr`, `.caf`): the chunk table, the fields and lists of the
 * selected chunk, links to the chunks it refers to, and "bytes" links that show a range in the Hex mode of the file or
 * of its `.cgfheap`, decoded in the frontend.
 */
export default function InspectMode(props: AssetViewProps) {
  const store = createInspectModeStore(props)
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
          <p class="nw-note">The chunks could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.ready}>
        <div class="nw-inspect">
          <div class="nw-view-bar">
            <span class="nw-view-info">{state.summary}</span>
            <Show when={state.heapPath}>
              <Button
                ghost
                title={`Show ${state.heapPath} in Hex`}
                onClick={() => store.openBytes({ heap: true, offset: 0, length: 0 })}
              >
                Heap
              </Button>
            </Show>
          </div>
          <div class="nw-inspect-body">
            <Grid<ChunkEntry> class="nw-inspect-chunks" ref={store.setGrid} options={gridOptions(store)} />
            <div class="nw-inspect-detail">
              <Show when={store.selected()} keyed fallback={<p class="nw-note">Select a chunk.</p>}>
                {(chunk) => <ChunkPane chunk={chunk} inspect={store} />}
              </Show>
            </div>
          </div>
        </div>
      </Match>
    </Switch>
  )
}

function gridOptions(store: InspectModeStore): GridOptions<ChunkEntry> {
  return {
    rowData: store.chunks(),
    getRowId: (p) => String(p.data.index),
    rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
    onRowClicked: (e) => store.rowClicked(e.data),
    columnDefs: columns(store),
  }
}

function columns(store: InspectModeStore): ColDef<ChunkEntry>[] {
  return [
    indexColumn(store.chunks().length),
    { field: 'id', headerName: 'Id', width: columnWidth('Id', 5) },
    { field: 'typeName', headerName: 'Type', width: columnWidth('Type', store.longestType()) },
    {
      colId: 'version',
      headerName: 'Version',
      valueGetter: (p) => (p.data ? hex(p.data.version) : ''),
      width: columnWidth('Version', 6),
    },
    { field: 'offset', headerName: 'Offset', width: columnWidth('Offset', 8), type: 'rightAligned' },
    { field: 'size', headerName: 'Size', width: columnWidth('Size', 8), type: 'rightAligned' },
  ]
}
