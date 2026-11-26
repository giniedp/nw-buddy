import { colorSchemeDark, themeAlpine } from 'ag-grid-community'

/**
 * The grid theme of nw-buddy: Alpine dark with the colors of the former legacy CSS theme (ag-theme-alpine-dark and
 * the overrides in styles/vendor/ag-grid.css). Further rules, scoped to `.nwb-grid`, stay in that stylesheet.
 */
export const nwbGridTheme = themeAlpine.withPart(colorSchemeDark).withParams({
  backgroundColor: '#1a1a1a',
  foregroundColor: '#fff',
  borderColor: '#68686e',
  headerBackgroundColor: '#1a1a1a',
  oddRowBackgroundColor: '#181818',
  menuBackgroundColor: '#1a1a1a',
  cellHorizontalPadding: 8,
  // the legacy theme had `--ag-borders: solid 0px`: no wrapper and header borders, rows keep theirs
  wrapperBorder: false,
  headerRowBorder: false,
  rowBorder: { color: '#222222' },
  cardShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
  popupShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
})
