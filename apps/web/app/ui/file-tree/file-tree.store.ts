import { computed, effect } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { listRecordVersions } from 'libs/nw-data/db/diff/list-versions'

export interface FileTreeState {
  files: string[]
  flatlist: FileTreeNode[]
}

export interface FileTreeNode {
  id: string
  name: string
  depth: number
  isDir: boolean
  isOpen: boolean
  children: FileTreeNode[]
}

export const FileTreeStore = signalStore(
  withState<FileTreeState>({
    files: [],
    flatlist: [],
  }),
  withComputed(({ files }) => {
    const tree = computed(() => toTree(files()))
    return {
      lookup: computed(() => tree().lookup),
      roots: computed(() => tree().roots),
    }
  }),

  withMethods((state) => {
    return {
      update: () => {
        patchState(state, { flatlist: toList(state.roots()) })
      },
      load: (files: string[]) => {
        patchState(state, { files })
      },
    }
  }),
  withHooks(({ files, update }) => {
    return {
      onInit() {
        effect(() => {
          if (files()) {
            update()
          }
        })
      },
    }
  }),
  withMethods(({ update, lookup, flatlist }) => {
    return {
      toggle: (id: string) => {
        const node = lookup()[id]
        if (node?.isDir) {
          node.isOpen = !node.isOpen
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
        const tokens = id.split('/')
        while (tokens.length) {
          const parentId = tokens.join('/')
          const parent = lookup()[parentId]
          if (parent?.isDir) {
            parent.isOpen = true
          }
          tokens.pop()
        }
        update()
        return flatlist().findIndex((it) => it.id === id)
      },
    }
  }),
)

function toList(items: FileTreeNode[]) {
  if (!items) {
    return []
  }
  const list: FileTreeNode[] = []
  items.sort((a, b) => {
    if (a.isDir === b.isDir) {
      return a.name.localeCompare(b.name)
    }
    return a.isDir ? -1 : 1
  })
  for (const item of items) {
    list.push(item)
    if (item.isOpen) {
      list.push(...toList(item.children))
    }
  }
  return list
}

function toTree(files: string[]) {
  if (!files) {
    return {
      lookup: {},
      roots: [],
    }
  }
  files = files.sort().map(normalize)
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
    roots,
  }
}

function normalize(file: string): string {
  return file
    .replace(/[\\/]+/g, '/')
    .toLowerCase()
    .replace(/(^\/)|(\/$)/, '')
}
