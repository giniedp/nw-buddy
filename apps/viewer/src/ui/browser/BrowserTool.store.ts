import { useSearchParams } from '@solidjs/router'
import { batch, createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { AssetType, ListFile } from '../../api/browse'
import { useApp } from '../app/ViewerApp'
import type { TabMenuItem, TabStripItem } from '../common/tabs/types'
import { typeIcon } from './assetTypes'
import { loadFilter, saveFilter } from './filterStorage'
import type { Tab } from './tabs'
import type { BrowserToolState } from './types'

/**
 * Typing searches after this pause, Enter searches right away
 */
const SEARCH_DELAY = 250

export type BrowserToolStore = ReturnType<typeof createBrowserToolStore>

/**
 * The state and actions of the browser tool: the selection of the sidebar, the search and the type filter of the
 * session, the open files in tabs, and the active file in the url (`?file=`).
 */
export function createBrowserToolStore() {
  const app = useApp()
  const tabs = app.tabs
  const types = app.assetTypes.list()
  // kept for the browser session
  const stored = loadFilter()

  // a list file of the tree or the search: not part of the state, the lists own them
  const [file, setFile] = createSignal<ListFile | null>(null)
  const [state, setState] = createStore<BrowserToolState>({
    folder: null,
    query: stored.query,
    filterKeys: stored.types,
    get selectedPath() {
      return selectedPath()
    },
  })
  const selectedPath = createMemo(() => {
    const selected = file()
    if (selected) {
      return selected.path
    }
    if (state.folder != null) {
      return `${state.folder}/`
    }
    return null
  })
  // the filter as type indices of the current type list
  const filter = createMemo(() => typeIndices(types(), state.filterKeys))
  const filterTypes = createMemo(() => [...filter()])
  createEffect(() => saveFilter({ query: state.query, types: [...state.filterKeys] }))

  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  const search = (text: string, delay: number) => {
    clearTimeout(timer)
    timer = setTimeout(() => setState('query', text.trim()), delay)
  }

  syncActiveFileWithUrl()

  return {
    state,
    /**
     * The asset types of the server. Not part of the state: the app loads them.
     */
    types,
    /**
     * The type filter as indices, for the type filter popover
     */
    filter,
    /**
     * The type filter as a list of indices, for the tree and the search
     */
    filterTypes,
    /**
     * The search text the session started with, for the input
     */
    storedQuery: stored.query,
    tabs,
    /**
     * The open files as items of the tab strip
     */
    tabItems: createMemo(() => tabItems(tabs.tabs(), types())),
    /**
     * A click selects a file and opens it in the temporary tab, a double click keeps it
     */
    /**
     * The selected file of the tree or the search results, null when a folder or nothing is selected
     */
    file,
    select(selected: ListFile | null) {
      batch(() => {
        setFile(selected)
        setState('folder', null)
      })
      if (selected) {
        tabs.open(selected, { preview: true })
      }
    },
    selectFolder(folder: string) {
      batch(() => {
        setFile(null)
        setState('folder', folder)
      })
    },
    open(file: ListFile) {
      tabs.open(file)
    },
    /**
     * Searches after a pause in typing
     */
    typeQuery(text: string) {
      search(text, SEARCH_DELAY)
    },
    /**
     * Searches right away (Enter)
     */
    submitQuery(text: string) {
      search(text, 0)
    },
    setFilter(indices: ReadonlySet<number>) {
      setState(
        'filterKeys',
        [...indices].map((index) => types()[index].key),
      )
    },
    /**
     * The menu of a file tab: the close actions and the path to the clipboard
     */
    tabMenu(id: number): TabMenuItem[] {
      return tabMenu(tabs, id)
    },
    /**
     * Closes the active tab, false when there is none
     */
    closeActive(): boolean {
      const id = tabs.active()
      if (id == null) {
        return false
      }
      tabs.close(id)
      return true
    },
  }
}

/**
 * `?file=` and the active tab follow each other: a url with another file (a link, back and forward) opens or
 * activates its tab, activating a tab replaces the file in the url.
 *
 * @remarks
 * The url effect is created first, so a file of the url wins over the active tab restored from the last session.
 */
function syncActiveFileWithUrl() {
  const tabs = useApp().tabs
  const [params, setParams] = useSearchParams<{ file?: string }>()
  createEffect(
    on(
      () => params.file,
      (file) => {
        if (file && file !== untrack(() => tabs.activeTab()?.path)) {
          tabs.openPath(file)
        }
      },
    ),
  )
  createEffect(
    on(
      () => tabs.activeTab()?.path,
      (path) => {
        if (path !== untrack(() => params.file)) {
          setParams({ file: path }, { replace: true })
        }
      },
    ),
  )
}

/**
 * The indices of the types with the given keys in the type list of the server
 */
export function typeIndices(types: AssetType[], keys: readonly string[]): Set<number> {
  const wanted = new Set(keys)
  const result = new Set<number>()
  types.forEach((type, index) => {
    if (wanted.has(type.key)) {
      result.add(index)
    }
  })
  return result
}

export function tabItems(tabs: Tab[], types: AssetType[]): TabStripItem[] {
  return tabs.map((tab) => ({
    id: tab.id,
    title: fileName(tab.path),
    tooltip: tab.path,
    icon: typeIcon(types[tab.type]),
    preview: tab.preview,
  }))
}

function tabMenu(tabs: ReturnType<typeof useApp>['tabs'], id: number): TabMenuItem[] {
  const list = tabs.tabs()
  const index = list.findIndex((tab) => tab.id === id)
  const path = list[index]?.path ?? ''
  return [
    { label: 'Close', onSelect: () => tabs.close(id) },
    { label: 'Close others', disabled: list.length < 2, onSelect: () => tabs.closeOthers(id) },
    {
      label: 'Close to the right',
      disabled: index === list.length - 1,
      onSelect: () => tabs.closeToRight(id),
    },
    { label: 'Close all', onSelect: () => tabs.closeAll() },
    { label: 'Copy path', onSelect: () => void navigator.clipboard.writeText(path) },
  ]
}

export function fileName(path: string) {
  return path.slice(path.lastIndexOf('/') + 1)
}
