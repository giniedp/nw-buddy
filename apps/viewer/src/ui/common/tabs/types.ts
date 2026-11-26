export interface TabStripItem {
  id: number
  title: string
  /**
   * Shown on hover, e.g. the full path
   */
  tooltip?: string
  /**
   * Svg markup of the icon
   */
  icon?: string
  /**
   * A temporary tab, its title is italic
   */
  preview?: boolean
}

/**
 * An entry of the menu of a tab
 */
export interface TabMenuItem {
  label: string
  /**
   * Greyed out, e.g. "Close to the right" on the last tab
   */
  disabled?: boolean
  onSelect: () => void
}

/**
 * The fields every tab of a tab list has. A tool's tab adds its own (e.g. the file path of the Browser).
 */
export interface TabBase {
  id: number
  /**
   * A temporary tab, opened by a single click: the next single click on another item replaces it. A double click on
   * the item or the tab keeps it (see `TabList.persist`).
   */
  preview?: boolean
}

export interface TabListOptions<T extends TabBase> {
  /**
   * What a tab shows, e.g. the file path: one tab per key
   */
  key: (tab: T) => string
  /**
   * localStorage key of the open tabs, a convenience: the app works without it
   */
  storageKey: string
  /**
   * Called for every tab that is closed or replaced, e.g. to release its content
   */
  onRemoved?: (tab: T) => void
}

/**
 * The open tabs as they are stored: without their ids, the active one by its key
 */
export interface StoredTabs<T extends TabBase> {
  tabs: Array<Omit<T, 'id'>>
  active: string | null
}

export interface TabStripState {
  /**
   * The tab whose menu is open: its menu button stays shown
   */
  menuTab: number | null
}
