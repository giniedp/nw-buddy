import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { LootBucketRow, LootTable, NW_FALLBACK_ICON } from '@nw-data/common'
import { combineLatest, Observable, of } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'

export interface LootBucketDetailState {
  bucketId: string
  rows: LootBucketRow[]
  tables: LootTable[]
}

export const LootBucketDetailStore = signalStore(
  withState<LootBucketDetailState>({
    bucketId: null,
    rows: [],
    tables: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: ({ bucketId }: Pick<LootBucketDetailState, 'bucketId'>): Observable<LootBucketDetailState> =>
        combineLatest({
          bucketId: of(bucketId),
          rows: db.lootBucketsById(bucketId),
          tables: db.lootTablesByLootBucketId(bucketId),
        }),
    }
  }),
  withState({
    selectedRow: null as number,
  }),
  withMethods((state) => {
    return {
      selectRow: (row: number) => patchState(state, { selectedRow: row }),
    }
  }),
  withComputed(({ rows, selectedRow, tables }) => {
    return {
      row: computed(() => rows()?.find((it) => it.Row === selectedRow())),
      icon: computed(() => NW_FALLBACK_ICON),
      rowCount: computed(() => rows()?.length || 0),
      tablesCount: computed(() => tables()?.length || 0),
    }
  }),
)
