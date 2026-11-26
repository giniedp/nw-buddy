import type { StoredTabs, TabBase } from './types'

/**
 * The tabs of a tab list from the local storage, null when none are stored or the storage is blocked
 */
export function loadTabs<T extends TabBase>(storageKey: string): StoredTabs<T> | null {
  try {
    return parseStoredTabs<T>(localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

/**
 * Keeps the tabs of a tab list in the local storage, a convenience: nothing breaks when the storage is blocked or full
 */
export function saveTabs<T extends TabBase>(storageKey: string, stored: StoredTabs<T>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(stored))
  } catch {
    // storage blocked or full: tabs are not restored, nothing else breaks
  }
}

/**
 * The tabs without their ids (they are given again when restored), and the key of the active tab
 */
export function toStoredTabs<T extends TabBase>(tabs: readonly T[], activeKey: string | null): StoredTabs<T> {
  return {
    tabs: tabs.map(({ id, ...rest }) => rest),
    active: activeKey,
  }
}

/**
 * The stored tabs, null without tabs. Throws for text that is not json.
 */
export function parseStoredTabs<T extends TabBase>(json: string | null): StoredTabs<T> | null {
  const stored = JSON.parse(json ?? 'null') as Partial<StoredTabs<T>> | null
  if (!stored || !Array.isArray(stored.tabs) || !stored.tabs.length) {
    return null
  }
  return { tabs: stored.tabs, active: stored.active ?? null }
}
