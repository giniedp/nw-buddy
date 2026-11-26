import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { HexLayout, HexRange, HexViewState } from './types'

export const ROW_BYTES = 16
// Chromium caps element heights near 33M px; longer files scroll proportionally instead
const MAX_SCROLL_PX = 8_000_000

export interface HexViewProps {
  bytes: Uint8Array
  highlight?: HexRange
}

export type HexViewStore = ReturnType<typeof createHexViewStore>

/**
 * The layout of a hex view: only the rows in view are rendered, a file too long for the page height scrolls
 * proportionally
 */
export function createHexViewStore(props: HexViewProps) {
  const [state, setState] = createStore<HexViewState>({
    rowPx: 16,
    viewPx: 0,
    scrollTop: 0,
    get layout() {
      return layout()
    },
    get offsetDigits() {
      return offsetDigits(props.bytes.length)
    },
  })
  const layout = createMemo(() =>
    hexLayout({ size: props.bytes.length, rowPx: state.rowPx, viewPx: state.viewPx, scrollTop: state.scrollTop }),
  )

  return {
    state,
    setRowPx(px: number) {
      setState('rowPx', px || 16)
    },
    setViewPx(px: number) {
      setState('viewPx', px)
    },
    setScrollTop(px: number) {
      setState('scrollTop', px)
    },
    /**
     * The scroll position that shows the row of an offset, with a few rows of context above it
     */
    scrollTopFor(offset: number) {
      return scrollTopOf(layout(), { size: props.bytes.length, rowPx: state.rowPx, viewPx: state.viewPx }, offset)
    },
    /**
     * The bytes of a row
     */
    rowBytes(row: number) {
      return props.bytes.subarray(row * ROW_BYTES, row * ROW_BYTES + ROW_BYTES)
    },
  }
}

interface HexMetrics {
  size: number
  rowPx: number
  viewPx: number
}

/**
 * The rows, the scroll spacer and the window of rendered rows for a scroll position
 */
export function hexLayout(it: HexMetrics & { scrollTop: number }): HexLayout {
  const rows = Math.ceil(it.size / ROW_BYTES)
  const contentPx = rows * it.rowPx
  const spacerPx = Math.min(contentPx, MAX_SCROLL_PX)
  const scaled = contentPx > spacerPx
  const visibleRows = Math.ceil(it.viewPx / it.rowPx) + 1
  let firstRow = Math.floor(it.scrollTop / it.rowPx)
  if (scaled) {
    firstRow = Math.round((it.scrollTop / scrollRange(spacerPx, it.viewPx)) * rowRange(rows, it))
  }
  const last = Math.min(rows, firstRow + visibleRows)
  return {
    rows,
    spacerPx,
    scaled,
    firstRow,
    windowTop: scaled ? it.scrollTop : firstRow * it.rowPx,
    visible: Array.from({ length: Math.max(0, last - firstRow) }, (_, i) => firstRow + i),
  }
}

/**
 * The scroll position that shows the row of an offset, a few rows of context above it
 */
export function scrollTopOf(layout: HexLayout, it: HexMetrics, offset: number): number {
  const row = Math.floor(Math.min(offset, Math.max(0, it.size - 1)) / ROW_BYTES)
  const target = Math.max(0, row - 2)
  if (!layout.scaled) {
    return target * it.rowPx
  }
  const range = rowRange(layout.rows, it)
  return (Math.min(target, range) / Math.max(1, range)) * scrollRange(layout.spacerPx, it.viewPx)
}

// scaled: the scroll range maps onto the rows up to the one that shows the end of the file
function scrollRange(spacerPx: number, viewPx: number) {
  return Math.max(1, spacerPx - viewPx)
}

function rowRange(rows: number, it: Pick<HexMetrics, 'rowPx' | 'viewPx'>) {
  return Math.max(0, rows - Math.floor(it.viewPx / it.rowPx))
}

export function offsetDigits(size: number) {
  return Math.max(8, Math.max(0, size - 1).toString(16).length)
}

/**
 * The byte at the offset is in the range
 */
export function isMarked(range: HexRange | undefined, at: number) {
  return !!range && at >= range.offset && at < range.offset + range.length
}

/**
 * The bytes as text, `.` for bytes that are not printable ascii
 */
export function ascii(bytes: Uint8Array) {
  let s = ''
  for (const b of bytes) {
    s += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'
  }
  return s
}

/**
 * `0x1f0`, `1f0h` or `496`; undefined when it is neither
 */
export function parseOffset(text: string): number | undefined {
  const t = text.trim().toLowerCase()
  const hex = /^0x([0-9a-f]+)$/.exec(t) ?? /^([0-9a-f]+)h$/.exec(t)
  if (hex) {
    return parseInt(hex[1], 16)
  }
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10)
  }
  return undefined
}
