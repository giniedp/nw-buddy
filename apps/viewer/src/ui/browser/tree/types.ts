import type { ListFile } from '../../../api/browse'

/**
 * A row of the tree: a folder, a file, or a note in place of files (loading, more, error)
 */
export interface TreeNode {
  /**
   * Folders end with `/`, files are their path, notes have their own suffix
   */
  id: string
  name: string
  kind: 'dir' | 'file' | 'note'
  file?: ListFile
}

export interface AssetTreeState {
  /**
   * Counts the changes of the loaded folders: the tree reads its rows again
   */
  version: number
  /**
   * The ids of the expanded folders (with a trailing `/`)
   */
  expanded: string[]
}
