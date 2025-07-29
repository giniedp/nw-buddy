import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { PrivateTable } from '../backend-adapter'

export type SyncCommand<T extends AppDbRecord> =
  | {
      action: 'create' | 'update' | 'createOrUpdate'
      resource: 'local' | 'remote'
      data: T
    }
  | {
      action: 'delete'
      resource: 'local' | 'remote'
      data: string | string[]
    }
export interface ProcessSyncCommandsOptions<T extends AppDbRecord> {
  localTable: AppDbTable<T>
  remoteTable: PrivateTable<T>
  commands: Array<SyncCommand<T>>
}

export async function processSyncCommands<T extends AppDbRecord>({
  localTable,
  remoteTable,
  commands,
}: ProcessSyncCommandsOptions<T>) {
  for (const { action, data, resource } of commands) {
    if (resource === 'local') {
      switch (action) {
        case 'create': {
          await localTable.create(data, { silent: true })
          continue
        }
        case 'delete': {
          await localTable.delete(data, { silent: true })
          continue
        }
        case 'update': {
          await localTable.update(data.id, data, { silent: true })
          continue
        }
        case 'createOrUpdate': {
          const existing = await localTable.read(data.id).catch(() => null)
          if (existing) {
            await localTable.update(data.id, data, { silent: true })
          } else {
            await localTable.create(data, { silent: true })
          }
          continue
        }
      }
    }
    if (resource === 'remote') {
      switch (action) {
        case 'create': {
          await remoteTable.create(data)
          continue
        }
        case 'delete': {
          await remoteTable.delete(data)
          continue
        }
        case 'update': {
          await remoteTable.update(data.id, data)
          continue
        }
        case 'createOrUpdate': {
          const existing = await remoteTable.read(data.id).catch(() => null)
          if (existing) {
            await remoteTable.update(data.id, data)
          } else {
            await remoteTable.create(data)
          }
          continue
        }
      }
    }
    console.warn(`Unknown sync command: ${action} on ${resource} for`, data)
  }
}
