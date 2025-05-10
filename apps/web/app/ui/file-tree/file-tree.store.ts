import { computed, effect } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'

export interface FileTreeState {
  search: SearchQuery
  selection: number
  files: string[]
  list: FileTreeNode[]
}

export interface FileTreeNode {
  id: string
  name: string
  depth: number
  isDir: boolean
  isOpen: boolean
  isOpenWeak: boolean
  isHidden: boolean
  isSelected: boolean
  children: FileTreeNode[]
}

export const FileTreeStore = signalStore(
  withState<FileTreeState>({
    search: null,
    selection: -1,
    files: [],
    list: [],
  }),
  withComputed(({ files }) => {
    const tree = computed(() => toTree(files()))
    return {
      lookup: computed(() => tree().lookup),
      tree: computed(() => tree().roots),
    }
  }),

  withMethods((state) => {
    return {
      update: () => {
        const list = flatten(state.tree())
        const selection = list.findIndex((it) => it.isSelected)
        patchState(state, {
          list,
          selection,
        })
      },
      load: (files: string[]) => {
        patchState(state, { files })
      },
      filter: (search: string) => {
        patchState(state, { search: query(search) })
      },
    }
  }),
  withHooks(({ tree, search, update }) => {
    return {
      onInit() {
        effect(() => {
          applySearch(tree(), search(), true)
          if (search()) {
            unfoldFirstVisible(tree())
          }
          update()
        })
      },
    }
  }),
  withMethods(({ update, lookup, list, tree }) => {
    return {
      toggle: (id: string) => {
        const node = lookup()[id]
        if (node?.isDir) {
          node.isOpen = !node.isOpen
          if (!node.isOpen) {
            node.isOpenWeak = false
          }
          update()
        }
      },
      expand: (id: string) => {
        const node = lookup()[id]
        if (node?.isDir) {
          node.isOpen = true
          update()
        }
      },
      collapse: (id: string) => {
        const node = lookup()[id]
        if (node?.isDir) {
          node.isOpen = false
          node.isOpenWeak = false
          update()
        }
      },
      expandAll: (prefix: string) => {
        for (const id in lookup()) {
          if (!id.startsWith(prefix)) {
            continue
          }
          const node = lookup()[id]
          if (node.isDir) {
            node.isOpen = true
          }
        }
        update()
      },
      select: (id: string): number => {
        if (!id) {
          return -1
        }
        clearSelection(tree())
        applySelection(tree(), id)
        update()
        return list().findIndex((it) => it.id === id)
      },
    }
  }),
)

function applySearch(items: FileTreeNode[], search: SearchQuery, recursive: boolean): boolean {
  let didMatch = false
  for (const item of items) {
    item.isOpenWeak = false
    if (!item.children.length) {
      // apply search to leaf nodes
      item.isHidden = !!search && !fileMatch(item, search)
    } else {
      // propagate state up the tree
      item.isHidden = !applySearch(item.children, search, recursive)
    }
    didMatch = didMatch || !item.isHidden
  }
  return didMatch
}

function clearSelection(tree: FileTreeNode[]) {
  for (const item of tree) {
    item.isOpenWeak = false
    item.isSelected = false
    clearSelection(item.children)
  }
}

function applySelection(tree: FileTreeNode[], selection: string): boolean {
  for (const item of tree) {
    if (item.id === selection) {
      item.isOpen = true
      item.isSelected = true
      return true
    }
    if (applySelection(item.children, selection)) {
      item.isOpen = true
      return true
    }
  }
  return false
}

function query(search: string): SearchQuery {
  if (!search) {
    return null
  }
  search = search.toLowerCase()
  const tokens = search.split('/')
  return {
    value: search,
    tokens,
    isFile: tokens[tokens.length - 1].includes('.'),
  }
}

function unfoldFirstVisible(tree: FileTreeNode[]): boolean {
  for (const item of tree) {
    if (item.isHidden) {
      continue
    }
    if (!item.isDir) {
      return true
    }
    if (unfoldFirstVisible(item.children)) {
      item.isOpenWeak = true
      return true
    }
  }
  return false
}

interface SearchQuery {
  value: string
  tokens: string[]
  isFile: boolean
}

function fileMatch(item: FileTreeNode, query: SearchQuery) {
  if (!query) {
    return true
  }
  // if (query.isFile && item.isDir) {
  //   return false
  // }
  return item.id.includes(query.value)
}

function flatten(items: FileTreeNode[]) {
  if (!items) {
    return []
  }
  const list: FileTreeNode[] = []
  for (const item of items) {
    if (item.isHidden) {
      continue
    }
    list.push(item)
    if (item.isOpen || item.isOpenWeak) {
      list.push(...flatten(item.children))
    }
  }
  return list
}

function sort(items: FileTreeNode[], deep: boolean) {
  items.sort((a, b) => {
    if (a.isDir === b.isDir) {
      return a.name.localeCompare(b.name)
    }
    return a.isDir ? -1 : 1
  })
  if (deep) {
    for (const item of items) {
      sort(item.children, deep)
    }
  }
  return items
}

function toTree(files: string[]) {
  if (!files) {
    return {
      lookup: {},
      roots: [],
    }
  }
  files = files.map(normalize).sort()
  const lookup: Record<string, FileTreeNode> = {}
  const roots: FileTreeNode[] = []

  for (const file of files) {
    const tokens = file.split('/')
    const fileName = tokens.pop()

    let folder = []
    for (const dir of tokens) {
      const parentId = folder.join('/')
      folder.push(dir)
      const id = folder.join('/')
      if (lookup[id]) {
        continue
      }
      lookup[id] = {
        id,
        name: dir,
        depth: folder.length,
        isDir: true,
        isOpen: false,
        isOpenWeak: false,
        isHidden: false,
        isSelected: false,
        children: [],
      }
      const parent = lookup[parentId]
      if (parent) {
        parent.children.push(lookup[id])
      } else {
        roots.push(lookup[id])
      }
    }
    const parentId = folder.join('/')
    const parent = lookup[parentId]
    const node: FileTreeNode = {
      id: file,
      name: fileName,
      depth: folder.length + 1,
      isDir: false,
      isOpen: false,
      isOpenWeak: false,
      isHidden: false,
      isSelected: false,
      children: [],
    }
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return {
    lookup,
    roots: sort(roots, true),
  }
}

function normalize(file: string): string {
  return file
    .replace(/[\\/]+/g, '/')
    .toLowerCase()
    .replace(/(^\/)|(\/$)/, '')
}
