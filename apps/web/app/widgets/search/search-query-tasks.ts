import { InjectionToken } from '@angular/core'
import { wrap } from 'comlink'
import type { SearchQueryTasks } from './search-query.worker'
export type { SearchQueryTasks as ItemsTableTasks } from './search-query.worker'

export const SEARCH_QUERY_TASKS = new InjectionToken<SearchQueryTasks>('SEARCH_QUERY_TASKS', {
  providedIn: 'root',
  factory: () => {
    const worker = new Worker(new URL('./search-query.worker', import.meta.url))
    return wrap<SearchQueryTasks>(worker)
  },
})
