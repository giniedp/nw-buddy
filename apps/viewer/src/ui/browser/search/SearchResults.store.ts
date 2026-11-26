import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { ListFile, SearchResult } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import type { SearchResultsState } from './types'

export interface SearchResultsProps {
  query: string
  /**
   * Type ids to show, empty for every type that is not hidden
   */
  types: readonly number[]
  selected?: string | null
  onSelect?: (file: ListFile | null) => void
  onOpen?: (file: ListFile) => void
}

export type SearchResultsStore = ReturnType<typeof createSearchResultsStore>

/**
 * The state of the search: runs it for the query and the type filter, a new one cancels the running one
 */
export function createSearchResultsStore(props: SearchResultsProps) {
  const app = useApp()
  // the found files: not part of the state, the tree gets them
  const [result, setResult] = createSignal<SearchResult | null>(null)
  const [state, setState] = createStore<SearchResultsState>({
    failed: false,
    get summary() {
      return summary()
    },
  })
  const summary = createMemo(() => searchSummary(result(), state.failed))

  createEffect(
    on([() => props.query, () => props.types], ([query, filter]) => {
      const abort = new AbortController()
      onCleanup(() => abort.abort())
      setState('failed', false)
      app.nwbt.searchFiles(query, filter, abort.signal).then(setResult, () => {
        if (!abort.signal.aborted) {
          setState('failed', true)
        }
      })
    }),
  )

  return {
    state,
    files: () => result()?.files ?? [],
  }
}

/**
 * The outcome of a search as one line
 */
export function searchSummary(result: Pick<SearchResult, 'files' | 'total'> | null, failed: boolean): string {
  if (failed) {
    return 'The search failed'
  }
  if (!result) {
    return 'Searching…'
  }
  if (result.total === 0) {
    return 'No matches'
  }
  const total = result.total.toLocaleString()
  if (result.files.length < result.total) {
    return `${result.files.length.toLocaleString()} of ${total} matches`
  }
  return result.total === 1 ? '1 match' : `${total} matches`
}

/**
 * The folder of a path, empty for a file at the root
 */
export function folderOf(path: string) {
  const slash = path.lastIndexOf('/')
  if (slash < 0) {
    return ''
  }
  return path.slice(0, slash)
}
