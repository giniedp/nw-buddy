/**
 * sessionStorage key of the search and the type filter of the browser, a convenience: the app works without it
 */
const STORAGE_KEY = 'nw-viewer.browser.filter'

export interface StoredFilter {
  /**
   * The search text
   */
  query: string
  /**
   * The `key` of each selected asset type: the type indices depend on the type list of the server
   */
  types: string[]
}

/**
 * The search and type filter of the browser session, empty when nothing is stored
 */
export function loadFilter(): StoredFilter {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    return {
      query: typeof stored?.query === 'string' ? stored.query : '',
      types: Array.isArray(stored?.types) ? stored.types.filter((it: unknown) => typeof it === 'string') : [],
    }
  } catch {
    return { query: '', types: [] }
  }
}

/**
 * Keeps the search and type filter for the browser session (survives a page reload)
 */
export function saveFilter(filter: StoredFilter) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filter))
  } catch {
    // storage blocked or full: the filter is not restored, nothing else breaks
  }
}
