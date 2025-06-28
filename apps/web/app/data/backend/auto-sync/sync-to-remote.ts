import { Observable, switchMap } from 'rxjs'
import { AppDbRecord, AppDbTable, AppDbTableEvent } from '../../app-db'
import { PrivateTable } from '../backend-adapter'
import { processSyncCommands, SyncCommand } from './sync-commands'

export function syncToRemote<T extends AppDbRecord>(
  localTable: AppDbTable<T>,
  remoteTable: PrivateTable<T>,
): Observable<void> {
  return localTable.events.pipe(
    switchMap(async ({ type, payload }) => {
      await processSyncCommands({
        localTable,
        remoteTable,
        commands: createSyncToRemoteCommands<T>({
          type,
          payload,
        }),
      }).catch(console.error)
    }),
  )
}

export function createSyncToRemoteCommands<T extends AppDbRecord>(event: AppDbTableEvent<T>): Array<SyncCommand<T>> {
  switch (event.type) {
    case 'create': {
      return [
        {
          action: 'create',
          resource: 'remote',
          data: event.payload,
        },
      ]
    }
    case 'update': {
      return [
        {
          action: 'createOrUpdate',
          resource: 'remote',
          data: event.payload,
        },
      ]
    }
    case 'delete': {
      return [
        {
          action: 'delete',
          resource: 'remote',
          data: event.payload,
        },
      ]
    }
    default:
      console.warn(`Unknown sync command type: ${event.type} for`, event.payload)
      return []
  }
}
