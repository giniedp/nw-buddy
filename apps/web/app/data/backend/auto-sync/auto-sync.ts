import { catchError, combineLatest, isObservable, merge, NEVER, Observable, of, shareReplay, switchMap } from 'rxjs'
import { AppDbRecord, AppDbTable } from '../../app-db'
import { PrivateTable } from '../backend-adapter'
import { syncInitial } from './sync-initial'
import { syncToRemote } from './sync-to-remote'

export type SyncStage = 'initializing' | 'syncing' | 'offline'

export function autoSync<T extends AppDbRecord>(options: {
  userId: string | Observable<string>
  online: Observable<boolean>
  local: AppDbTable<T>
  remote: PrivateTable<T>
}): Observable<SyncStage> {
  const userId$ = isObservable(options.userId) ? options.userId : of(options.userId)
  const isOnline$ = options.online
  return new Observable<SyncStage>((subscriber) => {
    let stage: SyncStage = 'initializing'
    subscriber.next(stage)
    function updateStage(newStage: SyncStage) {
      stage = newStage
      subscriber.next(stage)
    }
    const subscription = combineLatest({
      userId: userId$,
      isOnline: isOnline$,
    })
      .pipe(
        switchMap(({ userId, isOnline }) => {
          if (!userId || !isOnline) {
            updateStage('offline')
            return NEVER
          }
          updateStage('initializing')
          return of(userId)
        }),
        switchMap((userId) => {
          return syncInitial({
            localTable: options.local,
            remoteTable: options.remote,
            userId: userId,
          })
        }),
        switchMap(() => {
          updateStage('syncing')
          return merge(
            //
            syncToRemote(options.local, options.remote),
            // listening for remote events is currently not needed
            // and is disabled to reduce load on server
            // syncToLocal(options.local, options.remote),
          )
        }),
        catchError(() => {
          updateStage('offline')
          return NEVER
        }),
      )
      .subscribe()
    return () => {
      subscription.unsubscribe()
      stage = 'offline'
      subscriber.next(stage)
    }
  }).pipe(shareReplay(1))
}
