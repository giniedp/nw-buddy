import type { GridApi } from 'ag-grid-community'
import { createMemo, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { rowFields } from './columns'
import type { SheetData } from './sheet'
import type { GridRow, SheetLayoutState } from './types'

/**
 * Typing filters after this pause
 */
const FILTER_DELAY = 250

export interface SheetLayoutProps {
  data: SheetData
  /**
   * The sheet row of a grid row
   */
  sourceRow: (gridRow: number) => number
  /**
   * The grid api, for the mode that owns the columns
   */
  ref?: (api: GridApi<GridRow>) => void
}

export type SheetLayoutStore = ReturnType<typeof createSheetLayoutStore>

/**
 * The state and actions of both datasheet modes: the filter of the grid, the selected row and its filled fields
 */
export function createSheetLayoutStore(props: SheetLayoutProps) {
  const [state, setState] = createStore<SheetLayoutState>({ selected: null })
  const fields = createMemo(() => {
    if (state.selected == null) {
      return []
    }
    return rowFields(props.data.sheet, state.selected)
  })

  let grid: GridApi<GridRow> | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  return {
    state,
    /**
     * The filled fields of the selected row
     */
    fields,
    setGrid(api: GridApi<GridRow>) {
      grid = api
      props.ref?.(api)
    },
    /**
     * Filters the rows after a pause in typing
     */
    filter(text: string) {
      clearTimeout(timer)
      timer = setTimeout(() => grid?.setGridOption('quickFilterText', text), FILTER_DELAY)
    },
    rowClicked(row: GridRow | undefined) {
      if (row) {
        setState('selected', props.sourceRow(row.i))
      }
    },
    close() {
      setState('selected', null)
    },
  }
}
