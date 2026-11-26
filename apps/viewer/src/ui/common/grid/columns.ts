import type { ColDef } from 'ag-grid-community'
import { CELL_PADDING_PX } from './theme'
// the probe of gridCharPx
import './Grid.css'

/**
 * Widest values (characters) shown in full, longer ones are cut and show in the tooltip
 */
const MAX_VALUE_CHARS = 60

/**
 * The column border and rounding, so that a value of exactly the counted characters is not cut
 */
const COLUMN_BORDER_PX = 2

let charPx: number | undefined

/**
 * Width of a mono character at the grid's font size, in px. Measured once with a probe styled by Grid.css.
 */
export function gridCharPx() {
  if (charPx === undefined) {
    const probe = document.createElement('span')
    // not `.tweak-ui`: its panel box (width, flex) would be measured instead of the text. The tokens are on :root.
    probe.className = 'nw-ag-probe'
    probe.textContent = '0000000000'
    document.body.append(probe)
    charPx = probe.getBoundingClientRect().width / 10 || 7
    probe.remove()
  }
  return charPx
}

/**
 * The width of a column in px: its widest value, capped, and at least the whole header with room for the menu
 * button and the sort icon
 */
export function columnWidth(name: string, valueChars: number, sortable = true) {
  return Math.ceil(columnChars(name, valueChars, sortable) * gridCharPx() + 2 * CELL_PADDING_PX + COLUMN_BORDER_PX)
}

/**
 * The characters a column is wide: its widest value up to the cap, at least its header with the menu button and the
 * sort icon
 */
export function columnChars(name: string, valueChars: number, sortable = true) {
  const header = name.length + 2 + (sortable ? 2 : 0)
  return Math.max(4, header, Math.min(MAX_VALUE_CHARS, valueChars))
}

/**
 * The filter of a column, typed into the floating filter row under the headers: numbers equal, the others contain
 * the text. The placeholder says which. The input is the whole filter, the button of the filter menu is hidden.
 *
 * Datasheet numbers are float32 (1.2 is 1.2000000476837158), the typed number is rounded to float32 the same way, so
 * the shown `1.2` equals what is typed.
 */
export function columnFilter(
  numeric: boolean,
): Pick<
  ColDef,
  'filter' | 'filterParams' | 'floatingFilter' | 'suppressFloatingFilterButton' | 'floatingFilterComponentParams'
> {
  return {
    filter: numeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
    filterParams: numeric ? { numberParser: parseFloat32 } : undefined,
    floatingFilter: true,
    suppressFloatingFilterButton: true,
    floatingFilterComponentParams: { filterPlaceholder: numeric ? 'equals' : 'contains' },
  }
}

/**
 * A typed number as float32, null for no number
 */
export function parseFloat32(text: string | null): number | null {
  if (text == null || text.trim() === '') {
    return null
  }
  const value = Number(text.trim().replace(',', '.'))
  return Number.isNaN(value) ? null : Math.fround(value)
}

/**
 * The column defaults of the data tables: sortable, resizable and a text filter per column, see {@link columnFilter}
 */
export const dataColumnDefaults: ColDef = {
  sortable: true,
  resizable: true,
  ...columnFilter(false),
}

/**
 * The row number, pinned at the left
 */
export function indexColumn<T>(total: number): ColDef<T> {
  const digits = Math.max(2, String(Math.max(total - 1, 0)).length)
  return {
    colId: '#',
    headerName: '#',
    valueGetter: (p) => p.node?.rowIndex,
    // digits plus the cell padding
    width: Math.ceil(digits * gridCharPx() + 2 * CELL_PADDING_PX + COLUMN_BORDER_PX),
    pinned: 'left',
    sortable: false,
    resizable: false,
    filter: false,
    suppressMovable: true,
    cellClass: 'nw-ag-index',
  }
}
