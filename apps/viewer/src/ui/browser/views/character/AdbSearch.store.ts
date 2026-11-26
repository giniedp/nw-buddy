import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { CharacterDatabase } from '../../../../api'
import type { AdbSearchState } from './types'

export type AdbSearchStore = ReturnType<typeof createAdbSearchStore>

/**
 * The search of the animation database dialog: the databases by path, the playable ones first
 */
export function createAdbSearchStore(props: { databases: CharacterDatabase[] | null }) {
  const [state, setState] = createStore<AdbSearchState>({ query: '' })
  const sorted = createMemo(() => [...(props.databases ?? [])].sort(compareDatabases))
  const results = createMemo(() => searchDatabases(sorted(), state.query))

  return {
    state,
    /**
     * The databases that match the query, the playable ones first. Not part of the state: the character's assets cache
     * them.
     */
    results,
    /**
     * The databases are read, the dialog may open before
     */
    ready: () => !!props.databases,
    setQuery(query: string) {
      setState('query', query)
    },
  }
}

/**
 * The databases whose path has every word of the query
 */
export function searchDatabases(databases: CharacterDatabase[], query: string): CharacterDatabase[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) {
    return databases
  }
  return databases.filter((it) => words.every((word) => it.file.toLowerCase().includes(word)))
}

/**
 * The databases the character can play first, the most playable fragments first, then by path
 */
export function compareDatabases(a: CharacterDatabase, b: CharacterDatabase): number {
  if (a.playable !== b.playable) {
    return b.playable - a.playable
  }
  return a.file.localeCompare(b.file)
}
