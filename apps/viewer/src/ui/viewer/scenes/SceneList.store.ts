import { createMemo, createResource, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'
import { LEVEL_CATEGORIES, type LevelCategory, type LevelEntry } from '../../../levels/catalog'
import { useApp } from '../../app/ViewerApp'
import type { SceneGroup, SceneListState } from './types'

/**
 * Thumbnail width in pixels requested from nwbt: 2x the 4rem of the row, for high dpi screens
 */
const THUMBNAIL_SIZE = 128

export type SceneListStore = ReturnType<typeof createSceneListStore>

/**
 * The levels and game mode maps of the level catalog (levels/catalog.ts), grouped like the game modes of nw-buddy and
 * filtered by text
 */
export function createSceneListStore() {
  const app = useApp()
  const [catalog] = createResource(() => app.levels.load())
  const entries = createMemo(() => (catalog.error ? [] : (catalog()?.entries ?? [])))
  const current = () => app.viewerContent.currentSceneId()

  const [state, setState] = createStore<SceneListState>({
    filter: '',
    get loading() {
      return catalog.loading
    },
    get failed() {
      return !!catalog.error
    },
    get groups() {
      return groups()
    },
    get currentId() {
      return current()
    },
    get initialTab() {
      return initialTab()
    },
  })
  const groups = createMemo(() => groupScenes(entries(), state.filter))
  // read once the catalog is there: the tabs keep their own state afterwards
  const initialTab = createMemo(() => {
    const id = untrack(current)
    const shown = entries().find((it) => it.id === id)
    return tabOf(untrack(groups), shown?.category)
  })

  return {
    state,
    setFilter(text: string) {
      setState('filter', text)
    },
    /**
     * The url of the entry's picture: the game mode image, or the icon. Null for entries without one.
     */
    thumbnail(entry: LevelEntry): string | null {
      const picture = entry.image ?? entry.icon
      return picture ? app.nwbt.thumbnailUrl(picture, THUMBNAIL_SIZE) : null
    },
  }
}

/**
 * The entries by category, in the order of {@link LEVEL_CATEGORIES}, with the entries that match the query in their
 * title, subtitle or coatlicue (case insensitive). Categories without entries are left out.
 */
export function groupScenes(entries: readonly LevelEntry[], query: string): SceneGroup[] {
  const text = query.trim().toLowerCase()
  const matches = text
    ? entries.filter((it) => `${it.title} ${it.subtitle} ${it.coatlicue}`.toLowerCase().includes(text))
    : entries
  return LEVEL_CATEGORIES.map((category) => ({
    ...category,
    entries: matches.filter((it) => it.category === category.id),
  })).filter((it) => it.entries.length)
}

/**
 * The index of the category's tab, the first tab for other categories
 */
export function tabOf(groups: readonly SceneGroup[], category: LevelCategory | undefined): number {
  return Math.max(
    0,
    groups.findIndex((it) => it.id === category),
  )
}

/**
 * The tooltip of an entry: its title, the coatlicue and the mission
 */
export function sceneTooltip(entry: Pick<LevelEntry, 'title' | 'coatlicue' | 'mission'>): string {
  const where = entry.mission ? `${entry.coatlicue}, ${entry.mission}` : entry.coatlicue
  return `${entry.title} (${where})`
}
