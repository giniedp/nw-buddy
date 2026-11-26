import { themeQuartz } from 'ag-grid-community'

/**
 * Horizontal padding of cells and headers, each side, in px. Column widths add it, see `columnWidth`.
 */
export const CELL_PADDING_PX = 10

/**
 * Height of the floating filter row (the column filters), the input plus a small margin
 */
export const FLOATING_FILTERS_HEIGHT = 24

/**
 * AG Grid in the page's colors: every parameter is one of our tokens (styles/tokens.css), so the grid follows
 * the tweak-ui theme without a stylesheet of its own
 */
export const gridTheme = themeQuartz.withParams({
  browserColorScheme: 'inherit',
  backgroundColor: 'var(--nw-bg)',
  foregroundColor: 'var(--nw-text)',
  textColor: 'var(--nw-text)',
  subtleTextColor: 'var(--nw-text-dim)',
  accentColor: 'var(--nw-accent)',
  invalidColor: 'var(--nw-error)',
  borderColor: 'var(--nw-line)',
  chromeBackgroundColor: 'var(--nw-bg-sunken)',
  headerBackgroundColor: 'var(--nw-bg-sunken)',
  headerTextColor: 'var(--nw-text-dim)',
  headerFontWeight: 'normal',
  headerCellHoverBackgroundColor: 'var(--nw-hover)',
  rowHoverColor: 'var(--nw-hover)',
  selectedRowBackgroundColor: 'var(--nw-line-strong)',
  oddRowBackgroundColor: 'transparent',
  fontFamily: 'var(--twk-font-mono)',
  fontSize: 'var(--nw-text-md)',
  headerFontSize: 'var(--nw-text-md)',
  spacing: 4,
  rowHeight: 20,
  headerHeight: 24,
  // room between a right aligned number header and the name of the next header
  cellHorizontalPadding: CELL_PADDING_PX,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  borderRadius: 2,
  columnBorder: { color: 'var(--nw-line)' },
  // right aligned number headers would run into the name of the next header
  headerColumnBorder: { color: 'var(--nw-line-strong)' },
  pinnedColumnBorder: { color: 'var(--nw-line-strong)' },
  // an active filter button is the accent icon, not a filled box
  iconButtonActiveBackgroundColor: 'transparent',
  iconButtonActiveColor: 'var(--nw-accent)',
  iconButtonActiveIndicatorColor: 'transparent',
  // fields (the column filters, the filter menus): small, on the page background, the accent marks the focused one
  // with a thin border, no glow
  inputBackgroundColor: 'var(--nw-bg)',
  inputBorder: { color: 'var(--nw-line)' },
  inputBorderRadius: 2,
  inputFocusBorder: { color: 'var(--nw-accent)' },
  inputFocusShadow: 'none',
  inputPlaceholderTextColor: 'var(--nw-text-dim)',
  focusShadow: 'none',
  pickerButtonBackgroundColor: 'var(--nw-bg)',
  pickerButtonBorder: { color: 'var(--nw-line)' },
  pickerButtonFocusBorder: { color: 'var(--nw-accent)' },
  pickerButtonFocusBackgroundColor: 'var(--nw-bg)',
  // the filter menus and the option lists: raised panels like the page's popups
  menuBackgroundColor: 'var(--nw-bg-raised)',
  menuBorder: { color: 'var(--nw-line-strong)' },
  pickerListBackgroundColor: 'var(--nw-bg-raised)',
  pickerListBorder: { color: 'var(--nw-line-strong)' },
  popupShadow: '0 4px 12px rgb(0 0 0 / 0.4)',
})

let styleContainer: HTMLElement | undefined

/**
 * Where AG Grid puts its styles: after the page styles. In the head (its default, first) the tweak-ui reset
 * (`.tweak-ui :where(*) { border: 0 solid; padding: 0 }`) wins over the grid's own rules of the same specificity, the
 * inputs, menus and lists of the grid lose their borders and paddings.
 */
export function gridStyleContainer() {
  if (!styleContainer) {
    styleContainer = document.createElement('div')
    styleContainer.className = 'nw-ag-styles'
    document.body.append(styleContainer)
  }
  return styleContainer
}
