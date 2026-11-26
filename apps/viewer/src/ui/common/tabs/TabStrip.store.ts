import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { TabMenuItem, TabStripItem, TabStripState } from './types'

export interface TabStripProps {
  items: TabStripItem[]
  active: number | null
  onActivate: (id: number) => void
  onClose: (id: number) => void
  onPersist?: (id: number) => void
  menu?: (id: number) => TabMenuItem[]
}

export type TabStripStore = ReturnType<typeof createTabStripStore>

/**
 * The menu of a tab strip: the entries of the tab whose menu is open
 */
export function createTabStripStore(props: TabStripProps) {
  const [state, setState] = createStore<TabStripState>({ menuTab: null })
  // the entries hold their callbacks: not part of the state
  const [menuItems, setMenuItems] = createSignal<TabMenuItem[]>([])

  return {
    state,
    menuItems,
    hasMenu: () => !!props.menu,
    /**
     * Fills the menu with the entries of a tab, false when the strip has no menu
     */
    openMenu(id: number): boolean {
      if (!props.menu) {
        return false
      }
      setMenuItems(props.menu(id))
      setState('menuTab', id)
      return true
    },
    menuClosed() {
      setState('menuTab', null)
    },
    isActive(item: TabStripItem) {
      return item.id === props.active
    },
    isMenuOpen(item: TabStripItem) {
      return item.id === state.menuTab
    },
  }
}

/**
 * The left of a popover below its anchor, inside the window
 */
export function popoverLeft(anchorLeft: number, width: number, windowWidth: number) {
  return Math.max(4, Math.min(anchorLeft, windowWidth - width - 4))
}
