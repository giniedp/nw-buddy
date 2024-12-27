import { inject, Injectable, InjectionToken } from '@angular/core'
import { RealtimeChannel } from '@supabase/supabase-js'
import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { Database, TablesInsert, TablesUpdate } from '~/data/supabase/types'
import { SupabaseService } from '~/data/supabase/supabase.service'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { filter, map, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { nanoid } from 'nanoid'

export type TableNames = keyof Database['public']['Tables']
export const SYNC_TABLE_NAME = new InjectionToken<TableNames>('SYNC_TABLE_NAME')
/**
 * Global SyncService
 *
 * We can make this abstract then make a Service per table but idk this seems fine for me for now
 */
@Injectable()
export class SyncService {
  private destroy$ = new Subject()
  protected readonly supabase = inject(SupabaseService)
  protected channel: RealtimeChannel | null
  protected db: AppDbTable<AppDbRecord>

  private get name() {
    return this.db.tableName as TableNames
  }

  protected getUser() {
    return this.supabase.session()?.user
  }

  public async connectTableSync<T extends AppDbRecord>(db: AppDbTable<T>) {
    this.db = db
    await this.clientSync()
    await this.realtimeSync()

    this.supabase.userId$
      .pipe(
        filter((id) => !!id),
        switchMap(() => db.events.pipe(tap((ev) => console.log(ev)))),
        takeUntil(this.destroy$),
      )
      .subscribe((ev) => {
        switch (ev.type) {
          case 'create': {
            this.onInsert(ev.payload)
            break
          }
          case 'delete': {
            this.onDelete(ev.payload.id)
            break
          }
          case 'update': {
            this.onUpdate(ev.payload)
            break
          }
        }
      })
  }

  async realtimeSync() {
    console.log(`${this.name.toUpperCase()} SYNC SYNC()`)

    this.channel = this.supabase.client.realtime
      .channel(`${this.name}-db-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: this.name }, async ({ eventType, ...payload }) => {
        console.log('SUPABASE REALTIME EVENT FIRED', payload)

        // const record = payload.new

        if (eventType === 'INSERT') {
          console.log('SUPABASE REALTIME ON INSERT EVENT')

          const keys = await this.db.keys()
          if (keys.includes(payload.new['id'])) {
            return
          }
          this.db.create(payload.new)

          return
        }

        if (eventType === 'UPDATE') {
          console.log('SUPABASE REALTIME ON UPDATE EVENT')

          const local = this.db.read(payload.new['id'])
          if (
            'updated_at' in local &&
            'updated_at' in payload.new &&
            new Date(local['updated_at'] as string) < new Date(payload.new['updated_at'])
          ) {
            console.log('SUPABASE REALTIME ON UPDATE EVENT -> REMOTE AHEAD OF LOCAL')
            this.db.update(payload.new['id'], payload.new)
          }
          return
        }

        if (eventType === 'DELETE') {
          console.log('SUPABASE REALTIME ON DELETE EVENT')

          const keys = await this.db.keys()
          if (!keys.includes(payload.new['id'])) {
            return
          }

          this.db.destroy(payload.new['id'])
        }
      })
      .subscribe((status, error) => {
        console.log(status, this.db.tableName)
        if (error) console.log(error)
      })
  }

  async clientSync() {
    this.supabase.userId$
      .pipe(
        filter((id) => !!id),
        takeUntil(this.destroy$),
      )
      .subscribe(async (userId) => {
        const { data: remoteRows, error } = await this.supabase.client.from(this.name).select().eq('user_id', userId)

        if (error) {
          console.error(error)
          return
        }

        const localRows = await this.db.list()

        const chunked: Array<[(typeof localRows)[number] | null, (typeof remoteRows)[number] | null]> = []

        for (const row of localRows) {
          const matchingRemoteRow = remoteRows.find(
            //@ts-expect-error
            (remoteRow) => remoteRow.id === row.id && remoteRow.user_id === this.getUser().id,
          )

          chunked.push([row, matchingRemoteRow ?? null])
        }

        for (const remoteRow of remoteRows) {
          const matchingLocalRow = localRows.find(
            //@ts-expect-error
            (localRow) => localRow.id === remoteRow.id && remoteRow.user_id === this.getUser().id,
          )

          if (!matchingLocalRow) {
            chunked.push([null, remoteRow])
          }
        }

        const promises = chunked.map(async ([local, remote]) => {
          if (local === null && remote !== null) {
            // Handle case where only remote row exists
            //@ts-expect-error
            const { user_id, id, ...rest } = remote
            return this.db.create({ ...rest, id })
          } else if (local !== null && remote === null) {
            // Handle case where only local row exists
            if (local.id.length != 21) {
              const id = nanoid()
              await this.db.update(local.id, { ...local, id })
              local.id = id
            }
            return this.supabase.client
              .from(this.name)
              .insert({ ...(local as any as TablesInsert<TableNames>), user_id: this.getUser().id })
          } else {
            // Handle case where both local and remote rows exist
            if (!('updated_at' in local)) return new Promise(() => {})

            const localDate = new Date(local.updated_at as string)
            const remoteDate = new Date(remote.updated_at)

            // Compare timestamps or perform sync logic
            if (remoteDate < localDate) {
              console.log('LOCAL IS AHEAD OF REMOTE')
              return this.supabase.client
                .from(this.name)
                .update(local as TablesUpdate<TableNames>)
                .eq('id', local.id)
            } else if (localDate < remoteDate) {
              console.log('REMOTE IS AHEAD OF LOCAL')
              console.log('local:', local)
              console.log('remote:', remote)
              return this.db.update(local.id, remote)
            } else {
              return new Promise(() => {})
            }
          }
        })

        await Promise.all(promises)
      })
  }

  async onUpdate<T extends AppDbRecord>(record: Partial<T>) {
    console.log(`${this.name.toUpperCase()} SUPABASE UPDATE CALL`)

    const user_id = this.getUser()?.id

    const { error, status, data } = await this.supabase.client
      .from(this.name)
      .upsert({ ...(record as any as TablesInsert<TableNames>), user_id })
      .select()

    if (error) {
      console.log(error, status)
      return
    }
    console.log(`${this.name.toUpperCase()} UPDATED:`, data)
  }

  async onDelete(id: string | string[]) {
    console.log(`${this.name.toUpperCase()} SUPABASE DELETE CALL`)
    const { error, count } = await this.supabase.client.from(this.name).delete({ count: 'estimated' }).eq('id', id)

    if (error) {
      console.log(error)
      return
    }
    console.log(`${this.name.toUpperCase()} DELETE COUNT:`, count)
  }

  async onInsert<T extends AppDbRecord>(record: Partial<T>) {
    const user_id = this.getUser()?.id

    const { data, error } = await this.supabase.client
      .from(this.name)
      .insert({ ...(record as any as TablesInsert<TableNames>), user_id })
      .select()

    if (error) {
      console.log(error)
      return
    }
    console.log(`${this.name.toUpperCase()} CREATED:`, data)
  }
}
