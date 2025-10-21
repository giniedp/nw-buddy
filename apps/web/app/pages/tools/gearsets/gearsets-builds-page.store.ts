import { computed, inject, linkedSignal, resource } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { GearsetRecord } from '~/data'
import { BackendService } from '~/data/backend'
import { collectTagsFromRecords, toggleTagInList } from '~/data/tagging'

export type SortOption = 'likes' | 'date' | 'gearscore' | 'name'
export type SortDirection = 'asc' | 'desc'

export interface GearsetsBuildsPageState {
  activeTags: string[]
  tagsOperator: 'AND' | 'OR'
  search: string
  perPage: number
  currentPage: number
  sortBy: SortOption
  sortDirection: SortDirection
}

export const GearsetsBuildsPageStore = signalStore(
  withState<GearsetsBuildsPageState>({
    activeTags: [],
    search: '',
    tagsOperator: 'OR',
    perPage: 50,
    currentPage: 1,
    sortBy: 'likes',
    sortDirection: 'desc',
  }),
  withComputed((state) => {
    const backend = inject(BackendService)

    // Resource to fetch builds from the server
    const buildsResource = resource({
      params: () => {
        // Return undefined if backend is not available to keep resource idle
        if (!backend.isEnabled()) {
          return undefined
        }
        
        return {
          page: state.currentPage(),
          perPage: state.perPage(),
          search: state.search() || undefined,
          tags: state.activeTags().length > 0 ? state.activeTags() : undefined,
          tagsOperator: state.tagsOperator(),
          sortBy: state.sortBy(),
          sortDirection: state.sortDirection(),
        }
      },
      loader: async ({ params, abortSignal }) => {
        const publicTable = backend.publicTables.gearsets
        const records = await publicTable.page(params.page, params.perPage, {
          search: params.search,
          tags: params.tags,
          tagsOperator: params.tagsOperator,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
        })
        
        return {
          records,
          page: params.page,
        }
      },
    })

    // Accumulate records for pagination (page 1 replaces, page 2+ appends)
    const allRecords = linkedSignal<{ records: GearsetRecord[]; page: number } | undefined, GearsetRecord[]>({
      source: buildsResource.value,
      computation: (newValue, previous) => {
        if (!newValue) {
          return []
        }
        
        // Page 1 replaces all records (new search/filter)
        if (newValue.page === 1) {
          return newValue.records
        }
        
        // Page 2+ appends to existing records
        const existingRecords = previous?.value || []
        return [...existingRecords, ...newValue.records]
      },
    })

    // Server-side sorting - just return records as-is
    const displayRecords = computed(() => allRecords())
    const tags = computed(() => collectTagsFromRecords(allRecords(), state.activeTags()))

    return {
      displayRecords,
      tags,
      isLoading: computed(() => buildsResource.isLoading()),
      showLoadingSpinner: computed(() => buildsResource.isLoading()),
      isAvailable: computed(() => backend.isEnabled() && buildsResource.status() !== 'error'),
      hasMore: computed(() => {
        if (!buildsResource.hasValue()) return false
        return buildsResource.value().records.length >= state.perPage()
      }),
      totalCount: computed(() => allRecords().length),
      displayCount: computed(() => displayRecords().length),
      isEmpty: computed(() => {
        return !displayRecords().length && !state.search() && !state.activeTags().length
      }),
      reload: () => buildsResource.reload(),
    }
  }),
  withMethods((state) => {
    return {
      connectSearch: signalMethod<string>((search) => {
        // Reset page when search changes
        patchState(state, { search, currentPage: 1 })
      }),
      toggleTag: (tag: string) => {
        // Reset page when tags change
        patchState(state, {
          activeTags: toggleTagInList(state.activeTags(), tag),
          currentPage: 1,
        })
      },
      toggleTagsOperator: () => {
        // Reset page when operator changes
        patchState(state, {
          tagsOperator: state.tagsOperator() === 'OR' ? 'AND' : 'OR',
          currentPage: 1,
        })
      },
      setSortBy: (sortBy: SortOption) => {
        // If clicking the same sort option, toggle direction
        if (state.sortBy() === sortBy) {
          patchState(state, { sortDirection: state.sortDirection() === 'asc' ? 'desc' : 'asc' })
        } else {
          // New sort option: set default direction based on the option
          const defaultDirection: SortDirection = sortBy === 'name' ? 'asc' : 'desc'
          patchState(state, { sortBy, sortDirection: defaultDirection })
        }
      },
      loadMore() {
        // Increment page for pagination
        patchState(state, { currentPage: state.currentPage() + 1 })
      },
      refresh() {
        // Reset to page 1
        patchState(state, { currentPage: 1 })
      },
    }
  }),
)



