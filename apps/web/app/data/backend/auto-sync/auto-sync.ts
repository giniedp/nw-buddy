import { defer, merge, Observable, of, switchMap } from 'rxjs'
import { AppDbRecord, AppDbTable } from '../../app-db'
import { PrivateTable } from '../backend-adapter'
import { syncInitial } from './sync-initial'
import { syncToLocal } from './sync-to-local'
import { syncToRemote } from './sync-to-remote'

export function autoSync<T extends AppDbRecord>(options: {
  local: AppDbTable<T>
  remote: PrivateTable<T>
}): Observable<void> {
  return defer(() => of(null)).pipe(
    switchMap(() => syncInitial(options.local, options.remote)),
    switchMap(() =>
      merge(
        //
        syncToRemote(options.local, options.remote),
        syncToLocal(options.local, options.remote),
      ),
    ),
  )
}
