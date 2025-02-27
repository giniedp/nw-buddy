import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { LoreData } from '@nw-data/generated'
import { ScannedLore } from '@nw-data/generated'
import { NwDataSheets } from 'libs/nw-data/db/nw-data-sheets'
import { sortBy } from 'lodash'
import { Observable, combineLatest, from, map, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
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
}

export const LoreDetailStore = signalStore(
  withState<LoreDetailState>({
    grandParent: null,
    parent: null,
    record: null,
    meta: null,
    children: [],
    siblings: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: ({ id }: { id: string }): Observable<LoreDetailState> => {
        return loadData({ id, db })
      },
    }
  }),
  withComputed(({ record, siblings }) => {
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

function loadData({ db, id }: { db: NwDataSheets; id: string }) {
  const record = from(db.loreItemsById(id))
  const parent = record.pipe(switchMap((it) => db.loreItemsById(it?.ParentID)))
  const grandParent = parent.pipe(switchMap((it) => db.loreItemsById(it?.ParentID)))
  const siblings = record.pipe(switchMap((it) => db.loreItemsByParentId(it?.ParentID)))
  const children = record.pipe(switchMap((it) => db.loreItemsByParentId(it?.LoreID)))

  return combineLatest({
    record,
    meta: db.loreItemsMetadataById(id),
    parent,
    grandParent,
    siblings,
    children,
    metaMap: db.loreItemsMetadataByIdMap(),
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
