import { createEffect, createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { ViewerApp } from '../../../app/ViewerApp'
import { useApp } from '../../../app/ViewerApp'
import type { Tab } from '../../tabs'
import { ASSET_VIEWS, type AssetView, type ViewContext } from '../registry'
import { loadSheet } from '../sheet/sheet'
import type { TabViewState } from './types'

export type TabViewStore = ReturnType<typeof createTabViewStore>

/**
 * The state and actions of a tab: reads what the views need to know about the file, the modes that apply to it and
 * the shown one. A mode mounts when it is first shown and stays mounted.
 */
export function createTabViewStore(props: { tab: Tab }) {
  const app = useApp()
  const types = app.assetTypes.list()
  const [loaded] = createResource(
    () => props.tab.path,
    (path) => loadTabFile(app, path),
  )
  // reading a failed resource throws: guard every read
  const context = createMemo((): ViewContext | null => {
    const it = loaded.error ? undefined : loaded()
    if (!it) {
      return null
    }
    return { ...it, type: types()[it.stat.type] }
  })
  const views = createMemo(() => viewsFor(context()))
  const mode = createMemo(() => modeOf(views(), props.tab.mode))

  const [state, setState] = createStore<TabViewState>({
    get loadError() {
      return loaded.error ? String(loaded.error) : null
    },
    get ready() {
      return !!context()
    },
    get mode() {
      return mode()?.id
    },
    mounted: {},
  })

  createEffect(() => {
    const id = state.mode
    if (id && !state.mounted[id]) {
      setState('mounted', id, true)
    }
  })

  return {
    state,
    /**
     * What the views know about the file. Not part of the state: it holds the app.
     */
    context,
    /**
     * The modes that apply to the file. Not part of the state: they hold components.
     */
    views,
    /**
     * The modes for the mode bar: only when there is a choice
     */
    modes: () => (views().length > 1 ? views() : []),
    selectMode(id: string) {
      app.tabs.setMode(props.tab.id, id)
    },
    isMounted(view: AssetView) {
      return !!state.mounted[view.id]
    },
    /**
     * The view is the shown mode of the active tab
     */
    isShown(view: AssetView) {
      return view.id === state.mode && app.tabs.active() === props.tab.id
    },
  }
}

/**
 * What the views need to know about a file: its stat and content kind, the parsed datasheet (whether it is wide
 * decides its modes) and the converted slice (only one with models has a 3D view, user decision)
 */
export async function loadTabFile(app: ViewerApp, path: string): Promise<Omit<ViewContext, 'type'>> {
  const [stat, kind] = await Promise.all([app.nwbt.statFile(path), app.files.contentKind(path)])
  let sheet: ViewContext['sheet']
  if (path.endsWith('.datasheet')) {
    sheet = await loadSheet(app.files, path).catch(() => undefined)
  }
  let slice: ViewContext['slice']
  if (path.endsWith('.dynamicslice')) {
    slice = await app.nwbt.getSlice(path).catch(() => undefined)
  }
  return { app, path, stat, kind, sheet, slice }
}

/**
 * The modes that apply to a file, in the order of the registry
 */
export function viewsFor(ctx: ViewContext | null, views: AssetView[] = ASSET_VIEWS): AssetView[] {
  if (!ctx) {
    return []
  }
  return views.filter((view) => view.applies(ctx))
}

/**
 * The chosen mode, or the first one when it is not chosen or does not apply
 */
export function modeOf(views: AssetView[], chosen: string | undefined): AssetView | undefined {
  return views.find((view) => view.id === chosen) ?? views[0]
}
