import { isEqual, isMatch } from 'lodash'
import { Observable, switchMap } from 'rxjs'
import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { BackendTableEvent, PrivateTable } from '../backend-adapter'
import { processSyncCommands, SyncCommand } from './sync-commands'

export function syncToLocal<T extends AppDbRecord>(
  localTable: AppDbTable<T>,
  remoteTable: PrivateTable<T>,
): Observable<void> {
  return new Observable<void>(() => {
    const sub = remoteTable.events$
      .pipe(
        switchMap(async (event) => {
          return handleSyncToLocalEvent({
            localTable,
            remoteTable,
            event,
          }).catch(console.error)
        }),
      )
      .subscribe()
    return () => {
      sub.unsubscribe()
    }
  })
}

export interface HandleSyncToLocalEventOptions<T extends AppDbRecord> {
  localTable: AppDbTable<T>
  remoteTable: PrivateTable<T>
  event: BackendTableEvent<T>
}

export async function handleSyncToLocalEvent<T extends AppDbRecord>(
  options: HandleSyncToLocalEventOptions<T>,
): Promise<void> {
  const { localTable, remoteTable, event } = options
  const local = await localTable.read(event.record.id)
  const commands = createSyncToLocalCommands(event, local)
  await processSyncCommands({
    localTable,
    remoteTable,
    commands,
  })
}

export function createSyncToLocalCommands<T extends AppDbRecord>(
  remote: BackendTableEvent<T>,
  local: T,
): Array<SyncCommand<T>> {
  if (remote.type === 'delete') {
    if (!local) {
      return [] // already gone
    }
    return [
      {
        action: 'delete',
        resource: 'local',
        data: local.id,
      },
    ]
  }

  {
    const localSynced = { ...local, syncState: 'synced' }
    const remoteSynced = { ...remote.record, syncState: 'synced' }
    if (isEqual(localSynced, remoteSynced)) {
      return [
        {
          action: 'update',
          resource: 'local',
          data: { ...local, syncState: 'synced' },
        },
      ]
    }
  }

  if (remote.type === 'create') {
    if (!local) {
      return [
        {
          action: 'create',
          resource: 'local',
          data: { ...remote.record, syncState: 'synced' },
        },
      ]
    }

    // we already have a local record, but remote is new
    // conflict must be solved by the user
    return [
      {
        action: 'update',
        resource: 'local',
        data: { ...local, syncState: 'conflict' },
      },
    ]
  }

  if (remote.type === 'update') {
    if (!local) {
      return [
        {
          action: 'create',
          resource: 'local',
          data: { ...remote.record, syncState: 'synced' },
        },
      ]
    }

    const localTime = local.updatedAt
    const remoteTime = remote.record.updatedAt
    const localIsAhead = !remoteTime || (localTime && localTime > remoteTime)
    const remoteIsAhead = !localTime || (remoteTime && remoteTime > localTime)
    if (remoteIsAhead) {
      return [
        {
          action: 'update',
          resource: 'local',
          data: { ...remote.record, syncState: 'synced' },
        },
      ]
    }
    if (localIsAhead) {
      // updated remotely but local seems to be ahead
      // conflict must be solved by the user
      return [
        {
          action: 'update',
          resource: 'local',
          data: { ...local, syncState: 'conflict' },
        },
      ]
    }

    if (
      isMatch(
        {
          ...local,
          syncState: 'synced',
        },
        {
          ...remote.record,
          syncState: 'synced',
        },
      )
    ) {
      return [
        {
          action: 'update',
          resource: 'local',
          data: { ...local, syncState: 'synced' },
        },
      ]
    }

    // we don't know which one is ahead
    // conflict must be solved by the user
    return [
      {
        action: 'update',
        resource: 'local',
        data: { ...local, syncState: 'conflict' },
      },
    ]
  }

  console.warn('Unknown event type:', remote.type)
  return []
}
