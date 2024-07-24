import { Signal, computed } from '@angular/core'
import { patchState, signalStoreFeature, type, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, pipe } from 'rxjs'

export interface TaggedRecord {
  tags?: string[]
}

export interface WithFilterByTagsState {
  activeFilterTags: string[]
}
export function withFilterByTags<T extends TaggedRecord>() {
  return signalStoreFeature(
    {
      state: type<{
        records: T[]
      }>(),
      computed: type<{
        filteredRecords: Signal<T[]>
      }>(),
    },
    withState<WithFilterByTagsState>({
      activeFilterTags: [],
    }),
    withMethods((state) => {
      return {
        toggleFilterTag: (tag: string) => {
          patchState(state, {
            activeFilterTags: toggleFilterTag(state.activeFilterTags(), tag),
          })
        },
        connectFilterTags: rxMethod<string[]>(
          pipe(
            map((value) => {
              patchState(state, { activeFilterTags: value })
            }),
          ),
        ),
      }
    }),
    withComputed(({ records, filteredRecords, activeFilterTags }) => {
      return {
        filterTags: computed(() => selectTags(records(), activeFilterTags())),
        filteredRecords: computed(() => filteredByTags(filteredRecords(), activeFilterTags())),
      }
    }),
  )
}

function selectTags<T extends TaggedRecord>(records: T[], activeTags: string[]) {
  const tags: string[] = []
  for (const record of records || []) {
    for (const tag of record.tags || []) {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }
  }
  return tags.sort().map((tag) => ({ tag, active: activeTags.includes(tag) }))
}

function filteredByTags<T extends TaggedRecord>(records: T[], tags: string[]) {
  if (!tags?.length || !records?.length) {
    return records
  }
  return records.filter((it) => it.tags?.some((tag) => tags.includes(tag)))
}

function toggleFilterTag(tags: string[], tag: string) {
  if (!tag) {
    return tags
  }
  tags = [...(tags || [])]
  const index = tags.indexOf(tag)
  if (index >= 0) {
    tags.splice(index, 1)
  } else {
    tags.push(tag)
  }
  return tags
}
