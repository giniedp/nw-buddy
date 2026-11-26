import type { GridOptions } from 'ag-grid-community'
import { Show } from 'solid-js'
import { BoolInput, Button, ButtonGroup, SelectInput, Split, TextInput } from 'tweak-ui'
import { SheetGroupsView } from '../../browser/views/sheet/SheetGroupsMode'
import { dataColumnDefaults, Grid } from '../../common/grid'
import { RowPanel } from '../row/RowPanel'
import { createFamilyViewStore, type FamilyViewProps, type FamilyViewStore } from './FamilyView.store'
import type { GridRow } from './types'
import './FamilyView.css'

/**
 * The rows of a family in a grid, the selected row on the side. A wide family of one sheet (LootBuckets) also has
 * the Groups view of the browser, without links.
 */
export function FamilyView(props: FamilyViewProps) {
  const store = createFamilyViewStore(props)
  const { state } = store

  return (
    <div class="nw-data-family">
      {/* the family name is the title of the tab */}
      <div class="nw-view-bar">
        <Show when={store.rows().groups}>
          <ButtonGroup>
            <Button
              ghost
              active={state.view === 'groups'}
              title="The numbered column groups as rows"
              onClick={() => store.setView('groups')}
            >
              Groups
            </Button>
            <Button ghost active={state.view === 'table'} onClick={() => store.setView('table')}>
              Table
            </Button>
          </ButtonGroup>
        </Show>
        <Show when={state.view === 'table'}>
          <TextInput class="nw-view-filter" placeholder="Filter rows" onInput={store.filter} />
          <Show when={store.rows().sheets.length > 1}>
            <SelectInput
              value={state.sheet}
              options={store.sheetOptions()}
              onChange={(value) => store.setSheet(Number(value))}
            />
          </Show>
          <Show when={state.emptyColumns > 0}>
            <label class="nw-view-option" title="Columns without any value">
              <BoolInput value={state.showEmpty} onInput={store.setShowEmpty} />
              <span>{state.emptyColumns.toLocaleString()} empty columns</span>
            </label>
          </Show>
        </Show>
        <span class="nw-muted nw-push-end">{state.count}</span>
      </div>
      <Show
        when={state.view === 'table'}
        fallback={
          <div class="nw-data-groups">
            <SheetGroupsView data={store.rows().groups!} />
          </div>
        }
      >
        {/* the grid takes the remaining space, the row panel keeps its width (drag the gutter to resize it) */}
        <Split row class="nw-sheet nw-data-split" fluid={0} minSize={200} defaultSizes={[undefined, '30rem']}>
          <Grid<GridRow> ref={store.setGrid} options={gridOptions(store)} />
          <Show when={state.selected != null}>
            <RowPanel rows={store.rows()} row={state.selected!} shown={props.shown} />
          </Show>
        </Split>
      </Show>
    </div>
  )
}

function gridOptions(store: FamilyViewStore): GridOptions<GridRow> {
  return {
    rowData: store.rowData(),
    columnDefs: store.columns(),
    defaultColDef: dataColumnDefaults,
    getRowId: (p) => String(p.data.i),
    rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
    onRowClicked: (e) => store.rowClicked(e.data),
    onFirstDataRendered: store.firstDataRendered,
  }
}
