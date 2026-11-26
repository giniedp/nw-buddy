import type { LevelCategory, LevelEntry } from '../../../levels/catalog'

/**
 * A tab of the scenes dialog: the entries of one category
 */
export interface SceneGroup {
  id: LevelCategory
  label: string
  entries: LevelEntry[]
}

export interface ScenesButtonState {
  /**
   * The dialog is open
   */
  open: boolean
}

export interface SceneListState {
  /**
   * The text the entries are filtered by
   */
  filter: string
  /**
   * The level catalog is being read
   */
  readonly loading: boolean
  /**
   * The level catalog could not be read
   */
  readonly failed: boolean
  /**
   * The categories with the entries that match the filter, empty ones left out
   */
  readonly groups: SceneGroup[]
  /**
   * The id of the catalog entry that is shown, null for other content (a model, a level from a link)
   */
  readonly currentId: string | null
  /**
   * The tab the dialog opens with: the one of the shown scene
   */
  readonly initialTab: number
}
