import { Show } from 'solid-js'
import { BoolInput } from 'tweak-ui'
import type { AssetViewProps } from '../registry'
import { SheetLayout } from './SheetLayout'
import { createSheetTableModeStore } from './SheetTableMode.store'

/**
 * A datasheet with its columns. Columns without a filled cell are hidden unless asked for. Loaded lazily, ag-grid
 * loads with it.
 */
export default function SheetTableMode(props: AssetViewProps) {
  const store = createSheetTableModeStore(props)
  const { state } = store

  return (
    <SheetLayout
      data={store.data}
      rows={store.data.sheet.rowCount}
      columns={store.columns()}
      sourceRow={(row) => row}
      ref={store.setGrid}
      count={state.count}
      options={
        <Show when={state.emptyColumns > 0}>
          <label class="nw-view-option" title="Columns without any value">
            <BoolInput value={state.showEmpty} onInput={store.setShowEmpty} />
            <span>{state.emptyColumns.toLocaleString()} empty columns</span>
          </label>
        </Show>
      }
    />
  )
}
