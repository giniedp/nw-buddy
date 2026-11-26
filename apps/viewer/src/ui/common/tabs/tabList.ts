import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { loadTabs, saveTabs, toStoredTabs } from './tabStorage'
import type { TabBase, TabListOptions } from './types'

export type { TabBase, TabListOptions } from './types'

/**
 * The open tabs of a tool (the files of the Browser, the row types of the Data tool). App state: the tabs stay while
 * another tool is shown. They are restored from the local storage when the app starts.
 */
export type TabList<T extends TabBase> = ReturnType<typeof createTabList<T>>

export function createTabList<T extends TabBase>(options: TabListOptions<T>) {
  let nextId = 1
  // a store: changing a field of a tab keeps the tab object, so the `For` over the tabs does not remount
  // its content (the views of a tab keep their state)
  const [state, setState] = createStore<{ tabs: T[] }>({ tabs: [] })
  const tabs = () => state.tabs
  const [active, setActive] = createSignal<number | null>(null)
  const activeTab = () => tabs().find((tab) => tab.id === active()) ?? null
  const find = (key: string) => tabs().find((tab) => options.key(tab) === key) ?? null

  const save = () => {
    const current = activeTab()
    saveTabs(options.storageKey, toStoredTabs(tabs(), current ? options.key(current) : null))
  }

  const activate = (id: number | null) => {
    setActive(id)
    save()
  }

  /**
   * Changes fields of a tab, the tab object stays
   */
  const update = (id: number, values: Partial<T>) => {
    // the store's path setter can not infer a generic tab type
    ;(setState as (key: 'tabs', match: (tab: T) => boolean, values: Partial<T>) => void)(
      'tabs',
      (tab) => tab.id === id,
      values,
    )
    save()
  }

  /**
   * Closes the tabs that are not kept and activates `next`
   */
  const closeAllBut = (keep: (tab: T) => boolean, next: number | null) => {
    for (const tab of tabs()) {
      if (!keep(tab)) {
        options.onRemoved?.(tab)
      }
    }
    setState('tabs', (list) => list.filter(keep))
    activate(next)
  }

  // the tabs of the last session, with new ids
  const stored = loadTabs<T>(options.storageKey)
  if (stored) {
    const list = stored.tabs.map((it) => ({ ...it, id: nextId++ }) as T)
    setState('tabs', list)
    setActive(list.find((tab) => options.key(tab) === stored.active)?.id ?? list[0].id)
  }

  return {
    tabs,
    active,
    activeTab,
    /**
     * The open tab of a key, null for none
     */
    find,
    activate,
    update,

    /**
     * Opens a tab, or activates the open tab of its key. With `preview` the tab is the temporary tab, which replaces
     * the previous temporary tab. Without it, an open temporary tab of the key is kept.
     *
     * @returns the tab, and whether it is new
     */
    open(values: Omit<T, 'id' | 'preview'>, open?: { preview?: boolean }): { tab: T; created: boolean } {
      const preview = !!open?.preview
      const existing = find(options.key(values as T))
      if (existing) {
        if (!preview && existing.preview) {
          update(existing.id, { preview: false } as Partial<T>)
        }
        activate(existing.id)
        return { tab: existing, created: false }
      }
      const tab = { ...values, id: nextId++, preview } as T
      // the temporary tab is replaced in place, a new tab object: its views mount again for the new item
      const replaced = preview ? tabs().findIndex((it) => it.preview) : -1
      if (replaced >= 0) {
        options.onRemoved?.(tabs()[replaced])
        setState('tabs', (list) => list.map((it, i) => (i === replaced ? tab : it)))
      } else {
        setState('tabs', (list) => [...list, tab])
      }
      activate(tab.id)
      return { tab, created: true }
    },

    /**
     * Closes a tab. The tab to its right becomes active, or the one to its left.
     */
    close(id: number) {
      const list = tabs()
      const index = list.findIndex((tab) => tab.id === id)
      if (index < 0) {
        return
      }
      options.onRemoved?.(list[index])
      setState('tabs', (all) => all.filter((tab) => tab.id !== id))
      if (active() === id) {
        activate(neighborAfterClose(tabs(), index))
      } else {
        save()
      }
    },

    /**
     * Closes every tab but this one, which becomes active
     */
    closeOthers(id: number) {
      closeAllBut((tab) => tab.id === id, id)
    },

    /**
     * Closes the tabs to the right of this one. It becomes active when the active tab was closed.
     */
    closeToRight(id: number) {
      const index = tabs().findIndex((tab) => tab.id === id)
      if (index < 0) {
        return
      }
      const kept = new Set(
        tabs()
          .slice(0, index + 1)
          .map((tab) => tab.id),
      )
      const current = active()
      closeAllBut((tab) => kept.has(tab.id), current != null && kept.has(current) ? current : id)
    },

    /**
     * Closes every tab
     */
    closeAll() {
      closeAllBut(() => false, null)
    },

    /**
     * Keeps a temporary tab: it is no longer replaced by the next single click
     */
    persist(id: number) {
      if (tabs().find((tab) => tab.id === id)?.preview) {
        update(id, { preview: false } as Partial<T>)
      }
    },
  }
}

/**
 * The tab that becomes active when the tab at `index` was closed: the one now at its place (to its right), else the
 * last one; null when no tab is left
 */
export function neighborAfterClose(tabs: readonly TabBase[], index: number): number | null {
  return tabs[Math.min(index, tabs.length - 1)]?.id ?? null
}
