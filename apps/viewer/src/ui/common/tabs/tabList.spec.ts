import { afterEach, describe, expect, it } from 'vitest'
import { createTabList, neighborAfterClose } from './tabList'
import { parseStoredTabs, toStoredTabs } from './tabStorage'
import type { TabBase } from './types'

interface FileTab extends TabBase {
  path: string
}

const keys: string[] = []

/**
 * A tab list by path with its own storage key, and the paths it removed
 */
function fileTabs() {
  const storageKey = `test.tabs.${keys.length}.${Math.random()}`
  keys.push(storageKey)
  const removed: string[] = []
  const list = createTabList<FileTab>({
    key: (tab) => tab.path,
    storageKey,
    onRemoved: (tab) => removed.push(tab.path),
  })
  const paths = () => list.tabs().map((tab) => tab.path + (tab.preview ? '*' : ''))
  const activePath = () => list.activeTab()?.path ?? null
  return { list, removed, paths, activePath, storageKey }
}

afterEach(() => {
  for (const key of keys.splice(0)) {
    localStorage.removeItem(key)
  }
})

describe('createTabList', () => {
  it('opens one tab per key and activates it', () => {
    const { list, paths, activePath } = fileTabs()
    expect(list.open({ path: 'a' }).created).toBe(true)
    list.open({ path: 'b' })
    expect(list.open({ path: 'a' }).created).toBe(false)
    expect(paths()).toEqual(['a', 'b'])
    expect(activePath()).toBe('a')
  })

  it('replaces the temporary tab in place, the next open keeps it', () => {
    const { list, removed, paths } = fileTabs()
    list.open({ path: 'a' })
    list.open({ path: 'b' }, { preview: true })
    list.open({ path: 'c' }, { preview: true })
    expect(paths()).toEqual(['a', 'c*'])
    expect(removed).toEqual(['b'])
    list.open({ path: 'c' })
    expect(paths()).toEqual(['a', 'c'])
  })

  it('keeps a temporary tab on persist', () => {
    const { list, paths } = fileTabs()
    const { tab } = list.open({ path: 'a' }, { preview: true })
    list.persist(tab.id)
    list.open({ path: 'b' }, { preview: true })
    expect(paths()).toEqual(['a', 'b*'])
  })

  it('activates the right neighbor of a closed active tab, else the left one', () => {
    const { list, paths, activePath, removed } = fileTabs()
    const a = list.open({ path: 'a' }).tab
    const b = list.open({ path: 'b' }).tab
    const c = list.open({ path: 'c' }).tab
    list.activate(b.id)
    list.close(b.id)
    expect(activePath()).toBe('c')
    list.close(c.id)
    expect(activePath()).toBe('a')
    list.close(a.id)
    expect(activePath()).toBeNull()
    expect(paths()).toEqual([])
    expect(removed).toEqual(['b', 'c', 'a'])
  })

  it('closes the others, those to the right and all', () => {
    const { list, paths, activePath } = fileTabs()
    const [a, b] = ['a', 'b', 'c', 'd'].map((path) => list.open({ path }).tab)
    list.closeToRight(b.id)
    expect(paths()).toEqual(['a', 'b'])
    // the active tab was closed: the tab of the menu becomes active
    expect(activePath()).toBe('b')
    list.closeOthers(a.id)
    expect(paths()).toEqual(['a'])
    expect(activePath()).toBe('a')
    list.closeAll()
    expect(paths()).toEqual([])
  })

  it('restores the tabs and the active one of the last session', () => {
    const first = fileTabs()
    first.list.open({ path: 'a' })
    first.list.open({ path: 'b' })
    first.list.open({ path: 'a' })
    const again = createTabList<FileTab>({ key: (tab) => tab.path, storageKey: first.storageKey })
    expect(again.tabs().map((tab) => tab.path)).toEqual(['a', 'b'])
    expect(again.activeTab()?.path).toBe('a')
  })
})

describe('tab storage', () => {
  it('stores the tabs without ids, the active one by key', () => {
    const stored = toStoredTabs<FileTab>([{ id: 3, path: 'a', preview: true }], 'a')
    expect(stored).toEqual({ tabs: [{ path: 'a', preview: true }], active: 'a' })
  })

  it('has nothing to restore without tabs', () => {
    expect(parseStoredTabs(null)).toBeNull()
    expect(parseStoredTabs('{"tabs":[]}')).toBeNull()
    expect(parseStoredTabs('{"tabs":[{"path":"a"}]}')).toEqual({ tabs: [{ path: 'a' }], active: null })
  })

  it('picks the neighbor after a close', () => {
    expect(neighborAfterClose([{ id: 1 }, { id: 2 }], 1)).toBe(2)
    expect(neighborAfterClose([{ id: 1 }], 1)).toBe(1)
    expect(neighborAfterClose([], 0)).toBeNull()
  })
})
