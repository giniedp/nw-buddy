import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { SheetFamily } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import { familyKey } from '../tabs'
import type { FamilyListEntry } from '../types'

export interface FamilyListState {
  query: string
  /**
   * The row types that match the filter of all of them, e.g. `12 of 228 row types`
   */
  readonly count: string
}

export type FamilyListStore = ReturnType<typeof createFamilyListStore>

/**
 * The list of row types with a filter over row type and sheet names
 */
export function createFamilyListStore(props: { families: SheetFamily[] }) {
  const tabs = useApp().dataTabs
  const [state, setState] = createStore<FamilyListState>({
    query: '',
    get count() {
      return `${entries().length} of ${props.families.length} row types`
    },
  })
  const entries = createMemo(() => filterFamilies(props.families, state.query))

  return {
    state,
    /**
     * The row types that match the filter. Not part of the state: the schema owns the families.
     */
    entries,
    setQuery(query: string) {
      setState('query', query)
    },
    /**
     * A double click keeps the tab of the row type, a click opened it as the temporary tab
     */
    persist(family: string) {
      const tab = tabs.find(familyKey(family))
      if (tab) {
        tabs.persist(tab.id)
      }
    },
  }
}

/**
 * The row types whose name or a sheet name contains the query, with the matching sheet names
 */
export function filterFamilies(families: SheetFamily[], query: string): FamilyListEntry[] {
  const text = query.trim().toLowerCase()
  if (!text) {
    return families.map((family) => ({ family, sheets: [] }))
  }
  return families.flatMap((family) => {
    const sheets = family.sheets.map((it) => it.name).filter((name) => name.toLowerCase().includes(text))
    if (family.name.toLowerCase().includes(text) || sheets.length) {
      return [{ family, sheets }]
    }
    return []
  })
}
