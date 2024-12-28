import { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import { defer, merge, Observable, of, switchMap, tap } from 'rxjs'
import { AppDbRecord, AppDbTable, AppDbTableEvent } from '../app-db'
import { Database, TablesInsert, TablesUpdate } from './types'

export type TableNames = keyof Database['public']['Tables']

export type TableNamesWithUserId = Exclude<TableNames, 'profiles'>
export interface SyncTableOptions {
  client: SupabaseClient<Database>
  table: AppDbTable<AppDbRecord>
  userId: string
}

export function tableSyncStream(options: SyncTableOptions): Observable<void> {
  // defer, so it doesn't run until subscribed to
  console.log(options)
  return defer(() => of(null)).pipe(
    switchMap(() => initialSync(options)),
    switchMap(() =>
      merge(
        //
        syncToRemote(options),
        syncToLocal(options),
      ),
    ),
  )
}

async function initialSync({ client, table, userId }: SyncTableOptions) {
  const tableName = table.tableName as TableNamesWithUserId
  const res = await client.from(tableName).select().eq('user_id', userId)
  if (res.error) {
    console.error(res.error)
    return
  }

  const remoteRows = res.data
  const localRows = await table.list()

  const chunked: Array<[(typeof localRows)[number] | null, (typeof remoteRows)[number] | null]> = []

  for (const row of localRows) {
    const matchingRemoteRow = remoteRows.find((remoteRow) => remoteRow.id === row.id && remoteRow.user_id === userId)

    chunked.push([row, matchingRemoteRow ?? null])
  }

  for (const remoteRow of remoteRows) {
    const matchingLocalRow = localRows.find((localRow) => localRow.id === remoteRow.id && remoteRow.user_id === userId)

    if (!matchingLocalRow) {
      chunked.push([null, remoteRow])
    }
  }

  const promises = chunked.map(async ([local, remote]): Promise<void> => {
    if (local === null && remote !== null) {
      // Handle case where only remote row exists
      const { user_id, id, ...rest } = remote
      await table.create({ ...rest, id })
      return
    }

    if (local !== null && remote === null) {
      // Handle case where only local row exists
      if (local.id.length != 21) {
        const id = nanoid()
        await table.update(local.id, { ...local, id })
        local.id = id
      }
      await client.from(tableName).insert({ ...(local as any as TablesInsert<TableNamesWithUserId>), user_id: userId })
      return
    }

    // Handle case where both local and remote rows exist
    if (!('updated_at' in local)) {
      return
    }

    const localDate = new Date(local.updated_at as string)
    const remoteDate = new Date(remote.updated_at)

    // Compare timestamps or perform sync logic
    if (remoteDate < localDate) {
      console.log('LOCAL IS AHEAD OF REMOTE')
      await client
        .from(tableName)
        .update(local as TablesUpdate<TableNames>)
        .eq('id', local.id)

      return
    }
    if (localDate < remoteDate) {
      console.log('REMOTE IS AHEAD OF LOCAL')
      console.log('local:', local)
      console.log('remote:', remote)
      await table.update(local.id, remote)
      return
    }
  })

  await Promise.all(promises)
}

function syncToLocal({ client, table }: SyncTableOptions): Observable<void> {
  const tag = `[${table.tableName.toUpperCase()}][syncToLocal]`
  return new Observable<void>(() => {
    // this happens on subscribe
    console.debug(tag, 'START')
    const channel = client.realtime
      .channel(`${table.tableName}-db-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table.tableName,
        },
        handleEvent,
      )
      .subscribe((status, error) => {
        console.debug(tag, 'status:', status)
        if (error) {
          console.error(tag, error)
        }
      })

    return () => {
      // this happens on unsubscribe
      console.debug(tag, 'END')
      channel.unsubscribe().then((status) => {
        console.debug(tag, 'UNSUBSCRIBED', status)
      })
    }
  })

  async function handleEvent(event: RealtimePostgresChangesPayload<AppDbRecord>) {
    console.debug(tag, 'EVENT:', event.eventType)
    switch (event.eventType) {
      case 'INSERT': {
        await onInsert(event.new)
        break
      }
      case 'DELETE': {
        await onDelete(event.old.id)
        break
      }
      case 'UPDATE': {
        await onUpdate(event.new)
        break
      }
    }
  }

  async function onInsert(record: AppDbRecord) {
    console.debug(tag, 'INSERT', record.id)
    const local = await table.read(record.id)
    if (!local) {
      await table.create(record)
    }
  }

  async function onUpdate(remote: AppDbRecord) {
    console.debug(tag, 'UPDATE', remote.id)
    const local = await table.read(remote.id)
    if (!local) {
      // TODO: handle this case
      console.error(tag, 'LOCAL RECORD NOT FOUND')
      return
    }

    const localTime = new Date(local['updated_at'] || 0).toJSON()
    const remoteTime = new Date(remote['updated_at']).toJSON()
    console.debug(tag, 'LOCAL:', localTime, 'REMOTE:', remoteTime)
    if (localTime < remoteTime) {
      console.log('SUPABASE REALTIME ON UPDATE EVENT -> REMOTE AHEAD OF LOCAL')
      table.update(remote.id, remote)
    }
  }

  async function onDelete(id: string) {
    console.debug(tag, 'DELETE', id)
    const local = await table.read(id)
    if (local) {
      await table.destroy(id)
    }
  }
}

function syncToRemote({ client, userId, table }: SyncTableOptions): Observable<void> {
  const tableName = table.tableName as TableNames
  const tag = `[${table.tableName.toUpperCase()}][syncToRemote]`

  return table.events.pipe(
    tap({
      subscribe: () => console.debug(tag, 'START'),
      next: ({ type, payload }) => console.debug(tag, 'EVENT:', type, payload),
      finalize: () => console.debug(tag, 'END'),
    }),
    switchMap(async ({ type, payload }) => {
      await handleEvent({ type, payload }).catch(console.error)
    }),
  )

  async function handleEvent(event: AppDbTableEvent<AppDbRecord>) {
    switch (event.type) {
      case 'create': {
        await onInsert(event.payload)
        break
      }
      case 'delete': {
        await onDelete(event.payload.id)
        break
      }
      case 'update': {
        await onUpdate(event.payload)
        break
      }
    }
  }

  async function onUpdate(record: AppDbRecord) {
    console.debug(tag, 'UPDATE', record.id)
    const local = await table.read(record.id)
    const localTime = new Date(local['updated_at'] || 0).toJSON()
    const { error, status, data } = await client
      .from(tableName)
      .upsert({
        user_id: userId,
        ...(record as any),
      })
      .neq('updated_at', localTime)
      .select()

    if (error) {
      console.error(tag, error, status)
      return
    }
    console.debug(tag, 'UPDATED', data)
  }

  async function onDelete(id: string | string[]) {
    console.debug(tag, 'DELETE', id)
    const { error, count } = await client.from(tableName).delete({ count: 'estimated' }).eq('id', id)

    if (error) {
      console.error(tag, error)
      return
    }
    console.debug(tag, 'DELETED', count)
  }

  async function onInsert(record: AppDbRecord) {
    console.debug(tag, 'INSERT', record.id)
    const { data, error } = await client
      .from(tableName)
      .insert({ ...(record as any as TablesInsert<TableNames>), user_id: userId })
      .select()

    if (error) {
      console.error(tag, error)
      return
    }
    console.debug(tag, 'CREATED', data)
  }
}
