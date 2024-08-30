import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { LoreData } from '@nw-data/generated'
import { ScannedLore } from '@nw-data/scanner'
import { sortBy } from 'lodash'
import { EMPTY, catchError, combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive } from '~/utils'

export interface LoreDetailState {
  grandParent: LoreData
  parent: LoreData
  record: LoreData
  meta: ScannedLore

  siblings: Array<{
    record: LoreData
    meta: ScannedLore
  }>
  children: Array<{
    record: LoreData
    meta: ScannedLore
  }>
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
}

export const LoreDetailStore = signalStore(
  withState<LoreDetailState>({
    grandParent: null,
    parent: null,
    record: null,
    meta: null,
    children: [],
    siblings: [],
    isLoading: false,
    isLoaded: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ id: string }>(),
      },
      private: {
        loaded: payload<Pick<LoreDetailState, 'grandParent' | 'parent' | 'record' | 'meta' | 'children'>>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          isLoaded: true,
          isLoading: false,
          hasError: false,
        })
      })
      on(actions.loadError, (state, { error }) => {
        console.log(error)
        patchState(state, {
          isLoaded: true,
          isLoading: false,
          hasError: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ id }) => loadData({ db, id })),
          map((data) => {
            actions.loaded(data)
            return null
          }),
          catchError((error) => {
            actions.loadError({ error })
            return EMPTY
          }),
        ),
      }
    },
  }),
  withComputed(({ record, children, siblings }) => {
    return {
      title: computed(() => record()?.Title),
      subtitle: computed(() => record()?.Subtitle),
      body: computed(() => record()?.Body),
      type: computed(() => record()?.Type),
      image: computed(() => record()?.ImagePath),
      isTopic: computed(() => eqCaseInsensitive(record()?.Type, 'Topic')),
      isChapter: computed(() => eqCaseInsensitive(record()?.Type, 'Chapter')),
      isPage: computed(() => eqCaseInsensitive(record()?.Type, 'Default')),
      pageCount: computed(() => siblings().length),
      pageNumber: computed(() => {
        if (!siblings().length || !record()) {
          return null
        }
        return siblings().findIndex((it) => eqCaseInsensitive(it.record.LoreID, record().LoreID)) + 1
      }),
      nextId: computed(() => {
        if (!siblings().length || !record()) {
          return null
        }
        const index = siblings().findIndex((it) => eqCaseInsensitive(it.record.LoreID, record().LoreID))
        return siblings()[index + 1]?.record.LoreID
      }),
      prevId: computed(() => {
        if (!siblings().length || !record()) {
          return null
        }
        const index = siblings().findIndex((it) => eqCaseInsensitive(it.record.LoreID, record().LoreID))
        return siblings()[index - 1]?.record?.LoreID
      }),
    }
  }),
)

function loadData({ db, id }: { db: NwDataService; id: string }) {
  const record = db.loreItem(id)
  const parent = record.pipe(switchMap((it) => db.loreItem(it?.ParentID)))
  const grandParent = parent.pipe(switchMap((it) => db.loreItem(it?.ParentID)))
  const siblings = record.pipe(switchMap((it) => db.loreItemsByParentId(it?.ParentID)))
  const children = record.pipe(switchMap((it) => db.loreItemsByParentId(it?.LoreID)))

  return combineLatest({
    record,
    meta: db.loreItemMeta(id),
    parent,
    grandParent,
    siblings,
    children,
    metaMap: db.loreItemsMetaMap,
  }).pipe(
    map((data) => {
      return {
        ...data,
        siblings: sortBy(data.siblings || [], (it) => it.Order).map((it) => {
          return {
            record: it,
            meta: data.metaMap.get(it.LoreID),
          }
        }),
        children: sortBy(data.children || [], (it) => it.Order).map((it) => {
          return {
            record: it,
            meta: data.metaMap.get(it.LoreID),
          }
        }),
      }
    }),
  )
}
