import { createEffect, createMemo, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { ListFile, ListResult } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import type { AssetTreeState, TreeNode } from './types'

/**
 * How long a folder loads before it shows "loading…", shorter loads show nothing
 */
const LOADING_DELAY = 150

export interface AssetTreeProps {
  /**
   * Type ids to show, empty for every type that is not hidden. A change reloads the tree.
   */
  types?: readonly number[]
  /**
   * The selected file path, or folder path with a trailing `/`
   */
  selected?: string | null
  onSelect?: (file: ListFile | null) => void
  /**
   * A folder was selected (its path without a trailing `/`), instead of `onSelect`
   */
  onSelectFolder?: (dir: string) => void
  onOpen?: (file: ListFile) => void
}

export type AssetTreeStore = ReturnType<typeof createAssetTreeStore>

/**
 * The state and actions of the archive tree: folders load when they are expanded, all of them again when the type
 * filter changes
 */
export function createAssetTreeStore(props: AssetTreeProps) {
  const app = useApp()
  const [state, setState] = createStore<AssetTreeState>({ version: 0, expanded: [] })
  // folder path ('' is the root) -> rows, filled when the folder is expanded. Not part of the state: rows hold the
  // list files, the tree reads them by `version`
  const children = new Map<string, TreeNode[]>()
  const changed = () => setState('version', (it) => it + 1)
  // loads of an older filter are dropped
  let generation = 0
  let disposed = false
  onCleanup(() => {
    disposed = true
  })

  async function load(dir: string) {
    if (children.has(dir)) {
      return
    }
    const loadGeneration = generation
    const current = () => !disposed && loadGeneration === generation
    children.set(dir, [])
    const timer = setTimeout(() => {
      if (current() && children.get(dir)?.length === 0) {
        children.set(dir, [noteNode(dir, 'loading', 'loading…')])
        changed()
      }
    }, LOADING_DELAY)
    let nodes: TreeNode[]
    try {
      nodes = folderNodes(dir, await app.nwbt.listFolder(dir, props.types ?? []))
    } catch {
      nodes = [noteNode(dir, 'error', 'could not be loaded')]
    } finally {
      clearTimeout(timer)
    }
    if (current()) {
      children.set(dir, nodes)
      changed()
    }
  }

  // the root, again with every expanded folder when the filter changes
  createEffect(
    on(
      () => props.types,
      () => {
        generation++
        children.clear()
        load('')
        for (const id of state.expanded) {
          load(id.slice(0, -1))
        }
      },
    ),
  )

  const expanded = createMemo(() => new Set(state.expanded))

  return {
    state,
    /**
     * The expanded folders as one set until they change, for the tree
     */
    expanded,
    /**
     * The rows of the root
     */
    roots(): TreeNode[] {
      void state.version
      return children.get('') ?? []
    },
    /**
     * The rows of a folder, null for files and notes
     */
    childrenOf(node: TreeNode): TreeNode[] | null {
      if (node.kind !== 'dir') {
        return null
      }
      return children.get(node.id.slice(0, -1)) ?? []
    },
    /**
     * The expanded folders changed: the newly expanded ones load
     */
    setExpanded(next: ReadonlySet<string>) {
      for (const id of next) {
        if (!expanded().has(id)) {
          load(id.slice(0, -1))
        }
      }
      setState('expanded', [...next])
    },
    select(node: TreeNode | null) {
      if (node?.kind === 'dir' && props.onSelectFolder) {
        props.onSelectFolder(node.id.slice(0, -1))
        return
      }
      props.onSelect?.(node?.file ?? null)
    },
    activate(node: TreeNode) {
      if (node.file) {
        props.onOpen?.(node.file)
      }
    },
  }
}

/**
 * The rows of a listed folder: its folders, its files, and a note when the server cut the list
 */
export function folderNodes(dir: string, listing: ListResult): TreeNode[] {
  const prefix = dir ? `${dir}/` : ''
  const nodes: TreeNode[] = [
    ...listing.dirs.map((name): TreeNode => ({ id: `${prefix}${name}/`, name, kind: 'dir' })),
    ...listing.files.map((file): TreeNode => ({ id: file.path, name: file.name, kind: 'file', file })),
  ]
  if (listing.truncated) {
    const more = (listing.total - listing.files.length).toLocaleString()
    nodes.push(noteNode(dir, 'more', `… ${more} more, use the search`))
  }
  return nodes
}

export function noteNode(dir: string, kind: string, name: string): TreeNode {
  return { id: `${dir}/…${kind}`, name, kind: 'note' }
}
