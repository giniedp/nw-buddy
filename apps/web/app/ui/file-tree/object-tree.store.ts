import { computed, effect } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'

export interface ObjectTreeState {
  search: string
  selection: number
  objects: any[]
  list: ObjectTreeNode[]
  adapter: ObjectTreeAdapter<any>
}

export interface ObjectTreeAdapter<T = any> {
  parentId(item: T): string
  id(item: T): string
  name(item: T): string
  match(item: T, search: string): boolean
}

export interface ObjectTreeNode<T = any> {
  id: string
  name: string
  isDir: boolean
  isOpen: boolean
  isOpenWeak: boolean
  isHidden: boolean
  isSelected: boolean
  children: ObjectTreeNode<T>[]
  depth: number
  object: any
}

export const ObjectTreeStore = signalStore(
  withState<ObjectTreeState>({
    search: null,
    selection: -1,
    objects: [],
    list: [],
    adapter: null,
  }),
  withComputed(({ objects, adapter }) => {
    const tree = computed(() => toTree(objects(), adapter()))
    return {
      lookup: computed(() => tree().lookup),
      tree: computed(() => tree().roots),
    }
  }),

  withMethods((state) => {
    return {
      update: () => {
        const list = flattenTree(state.tree())
        const selection = list.findIndex((it) => it.isSelected)
        patchState(state, {
          list,
          selection,
        })
      },
      load: <T>(items: T[], adapter: ObjectTreeAdapter<T>) => {
        patchState(state, { objects: items, adapter })
      },
      filter: (search: string) => {
        patchState(state, { search: query(search) })
      },
    }
  }),
  withHooks(({ tree, search, update, adapter }) => {
    return {
      onInit() {
        effect(() => {
          applySearch(tree(), search(), adapter())
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
      expandAll: (prefix?: string) => {
        for (const id in lookup()) {
          if (prefix && !id.startsWith(prefix)) {
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

function applySearch(items: ObjectTreeNode[], search: string, adapter: ObjectTreeAdapter): boolean {
  let didMatch = false
  for (const item of items) {
    item.isOpenWeak = false
    if (!item.children.length) {
      // apply search to leaf nodes
      item.isHidden = !!search && !matchQuery(item, search, adapter)
    } else {
      // propagate state up the tree
      item.isHidden = !applySearch(item.children, search, adapter)
    }
    didMatch = didMatch || !item.isHidden
  }
  return didMatch
}

function clearSelection(tree: ObjectTreeNode[]) {
  for (const item of tree) {
    item.isOpenWeak = false
    item.isSelected = false
    clearSelection(item.children)
  }
}

function applySelection(tree: ObjectTreeNode[], selection: string): boolean {
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

function query(search: string): string {
  if (!search) {
    return null
  }
  return search.toLowerCase()
}

function unfoldFirstVisible(tree: ObjectTreeNode[]): boolean {
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

function matchQuery(item: ObjectTreeNode, query: string, adapter: ObjectTreeAdapter): boolean {
  if (!query) {
    return true
  }
  if (adapter?.match) {
    return adapter.match(item, query)
  }
  return item.name.includes(query)
}

function flattenTree(items: ObjectTreeNode[]) {
  if (!items) {
    return []
  }
  const list: ObjectTreeNode[] = []
  for (const item of items) {
    if (item.isHidden) {
      continue
    }
    list.push(item)
    if (item.isOpen || item.isOpenWeak) {
      list.push(...flattenTree(item.children))
    }
  }
  return list
}

function sortTree(items: ObjectTreeNode[], deep: boolean) {
  items.sort((a, b) => {
    if (a.isDir === b.isDir) {
      return a.name.localeCompare(b.name)
    }
    return a.isDir ? -1 : 1
  })
  if (deep) {
    for (const item of items) {
      sortTree(item.children, deep)
    }
  }
  return items
}

function toTree(objects: any[], adapter: ObjectTreeAdapter) {
  if (!objects || !adapter) {
    return {
      lookup: {},
      roots: [],
    }
  }

  const lookup: Record<string, ObjectTreeNode> = {}
  const roots: ObjectTreeNode[] = []

  for (const item of objects) {
    const itemId = adapter.id(item)
    lookup[itemId] = lookup[itemId] || {
      id: itemId,
      name: itemId,
      object: null,
      isDir: false,
      isOpen: false,
      isOpenWeak: false,
      isHidden: false,
      isSelected: false,
      depth: 0,
      children: [],
    }
    lookup[itemId].name = adapter.name(item)
    lookup[itemId].object = item

    const parentId = adapter.parentId(item)
    if (parentId != null) {
      lookup[parentId] = lookup[parentId] || {
        id: parentId,
        name: parentId,
        object: null,
        isDir: false,
        isOpen: false,
        isOpenWeak: false,
        isHidden: false,
        isSelected: false,
        depth: 0,
        children: [],
      }
      lookup[itemId].depth = lookup[parentId].depth + 1
      lookup[parentId].isDir = true
      lookup[parentId].children.push(lookup[itemId])
    } else {
      roots.push(lookup[itemId])
    }
  }

  return {
    lookup,
    roots: roots,
  }
}
