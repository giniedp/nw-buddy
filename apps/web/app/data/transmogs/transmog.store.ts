import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, map, of, pipe, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { TransmogsService } from './transmogs.service'
import { TransmogRecord } from './types'

export interface TransmogStoreState {
  record: TransmogRecord
  isLoaded: boolean
  isLoading: boolean
}

export const TransmogStore = signalStore(
  withState<TransmogStoreState>({
    record: null,
    isLoaded: false,
    isLoading: false,
  }),
  withComputed(({ record }) => {
    const backend = inject(BackendService)
    const recordUserId = computed(() => backend.sessionUserId() || 'local')
    return {
      isPersistable: computed(() => !!record()?.id),
      isSyncable: computed(() => recordUserId() !== 'local'),
      isSyncComplete: computed(() => record()?.syncState === 'synced'),
      isSyncPending: computed(() => record()?.syncState === 'pending' || !record()?.syncState),
      isSyncConflict: computed(() => record()?.syncState === 'conflict'),
      isOwned: computed(() => record()?.userId === recordUserId()),
      isPublished: computed(() => record()?.status === 'public'),
      isPrivate: computed(() => record()?.status !== 'public'),
    }
  }),
  withMethods((state) => {
    const service = inject(TransmogsService)
    return {
      connectById: rxMethod<{ userId: string; id: string }>(
        pipe(
          switchMap((source) => {
            return service.observeRecord(source)
          }),
          catchError((err) => {
            console.error(err)
            return of(null)
          }),
          map((record) => {
            patchState(state, { record, isLoaded: true })
          }),
        ),
      ),
      connectRecord: rxMethod<TransmogRecord>(
        pipe(
          map((record) => {
            patchState(state, { record, isLoaded: true })
          }),
        ),
      ),
      connectIsLoading: rxMethod<boolean>(
        pipe(
          map((value) => {
            patchState(state, { isLoading: value })
          }),
        ),
      ),
    }
  }),
)
