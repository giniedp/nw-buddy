import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { PrivateTable } from '../backend-adapter'
import { processSyncCommands, SyncCommand } from './sync-commands'

export async function syncInitial<T extends AppDbRecord>({
  userId,
  localTable,
  remoteTable,
}: {
  userId: string,
  localTable: AppDbTable<T>
  remoteTable: PrivateTable<T>
}) {
  const syncPairs = resolveInitialSyncPairs({
    localRows: await localTable.where({ userId }),
    remoteRows: await remoteTable.list(),
  })
  const syncQueue = syncPairs.map(({ local, remote }) => {
    return createInitialSyncCommands(local, remote)
  })

  const promises = syncQueue.map(async (commands): Promise<void> => {
    await processSyncCommands({
      localTable,
      remoteTable,
      commands,
    })
  })
  await Promise.all(promises)
}

export interface SyncPair<T extends AppDbRecord> {
  local: T | null
  remote: T | null
}

export interface ResolveSyncInitialPairsOptions<T extends AppDbRecord> {
  localRows: Array<T>
  remoteRows: Array<T>
}

export function resolveInitialSyncPairs<T extends AppDbRecord>({
  localRows,
  remoteRows,
}: ResolveSyncInitialPairsOptions<T>): Array<SyncPair<T>> {
  const pairs: Array<SyncPair<T>> = []

  for (const local of localRows) {
    pairs.push({
      local,
      remote: remoteRows.find((remote) => remote.id === local.id) || null,
    })
  }

  for (const remote of remoteRows) {
    const exists = !!localRows.some((local) => local.id === remote.id)
    if (!exists) {
      pairs.push({
        local: null,
        remote,
      })
    }
  }

  return pairs
}

export function createInitialSyncCommands<T extends AppDbRecord>(local: T, remote: T): Array<SyncCommand<T>> {
  if (local == null && remote != null) {
    // only remote row exists
    // we want to create it in the local tables
    return [
      {
        action: 'create',
        resource: 'local',
        data: { ...remote, syncState: 'synced' },
      },
    ]
  }

  if (local != null && remote == null) {
    if (local.syncState === 'synced') {
      return [
        {
          action: 'delete',
          resource: 'local',
          data: local.id,
        },
      ]
    }

    if (!local.syncState || local.syncState === 'pending') {
      // local row was never synced or is in pending state
      // remote row either never existed or was deleted
      // we should create the row in both cases
      return [
        {
          action: 'create',
          resource: 'remote',
          data: { ...local, syncState: 'synced' },
        },
        {
          action: 'update',
          resource: 'local',
          data: { ...local, syncState: 'synced' },
        },
      ]
    }

    // this should never happen, mark as conflict
    return [
      {
        action: 'update',
        resource: 'local',
        data: {
          ...local,
          syncState: 'conflict',
        },
      },
    ]
  }

  const localDate = local.updatedAt
  const remoteDate = remote.updatedAt
  const localIsAhead = localDate && remoteDate && localDate > remoteDate
  const remoteIsAhead = remoteDate && localDate && remoteDate > localDate

  // Compare timestamps or perform sync logic
  if (!remoteDate || localIsAhead) {
    // local is ahead, regardless of sync state
    // we can safely update the remote row
    return [
      {
        action: 'update',
        resource: 'remote',
        data: { ...local, syncState: 'synced' },
      },
      {
        action: 'update',
        resource: 'local',
        data: { ...local, syncState: 'synced' },
      },
    ]
  }

  if (!localDate || remoteIsAhead) {
    return [
      {
        action: 'update',
        resource: 'local',
        data: { ...remote, syncState: 'synced' },
      },
    ]
  }

  if (String(localDate) === String(remoteDate)) {
    return []
  }

  return [
    {
      action: 'update',
      resource: 'local',
      data: { ...local, syncState: 'conflict' },
    },
  ]
}
