/**
 * A byte range to mark and scroll to
 */
export interface HexRange {
  offset: number
  length: number
}

/**
 * Where the rows of a hex view are: the scroll spacer, the window of rendered rows and its first row
 */
export interface HexLayout {
  /**
   * Rows of the whole file
   */
  rows: number
  /**
   * Height of the scroll content: the rows, capped (Chromium caps element heights)
   */
  spacerPx: number
  /**
   * The content is capped: the scroll position maps onto the rows proportionally
   */
  scaled: boolean
  firstRow: number
  /**
   * Top of the window of rendered rows in the scroll content
   */
  windowTop: number
  /**
   * The rows of the window
   */
  visible: number[]
}

export interface HexViewState {
  /**
   * Height of a row, measured
   */
  rowPx: number
  /**
   * Height of the scroll view, 0 while hidden
   */
  viewPx: number
  scrollTop: number
  readonly layout: HexLayout
  /**
   * Hex digits of the offsets, at least 8
   */
  readonly offsetDigits: number
}
