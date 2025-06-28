import PocketBase, { RecordModel, RecordService } from 'pocketbase'
import { defer, distinctUntilChanged, EMPTY, filter, map, switchMap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { AppDbRecord, AppDbTable } from '../../app-db'
import { autoSync } from '../auto-sync'
import { PrivateTable } from '../backend-adapter'
import { authState } from './auth-state'
import { collectionEvents } from './collection-events'

export interface PocketRecord<T extends AppDbRecord> extends RecordModel {
  user: string
  data: T
}

export class PocketbasePrivateTable<T extends AppDbRecord> implements PrivateTable<T> {
  public readonly name: string
  public readonly collection: RecordService<PocketRecord<T>>

  public readonly userId$ = defer(() => authState(this.client)).pipe(
    map(({ record }) => record?.id || null),
    distinctUntilChanged(),
    shareReplayRefCount(1),
  )
  public readonly events$ = defer(() => this.userId$).pipe(
    switchMap((userId) => {
      if (!userId) {
        return EMPTY
      }
      return collectionEvents<PocketRecord<T>>(this.collection).pipe(filter(({ record }) => record.user === userId))
    }),
    map(({ action, record }) => {
      return {
        type: action as any,
        record: record.data,
      }
    }),
    shareReplayRefCount(0),
  )
  public readonly autoSync$ = defer(() => this.userId$).pipe(
    switchMap((userId) => {
      if (!userId) {
        return EMPTY
      }
      return autoSync({ local: this.table, remote: this })
    }),
    shareReplayRefCount(1),
  )

  private userId: string
  private rowId(id: string) {
    return `${this.userId}:${id}`
  }

  public constructor(
    protected readonly client: PocketBase,
    protected readonly table: AppDbTable<T>,
  ) {
    this.name = table.tableName
    this.collection = client.collection(this.name)
    this.userId$.subscribe((id) => (this.userId = id))
  }

  private getRow(id: string) {
    return this.collection.getOne(this.rowId(id))
  }

  public async list(): Promise<T[]> {
    return this.collection.getFullList().then((rows) => rows.map((row) => row.data))
  }

  public async create(data: T): Promise<T> {
    const id = data.id
    if (!id) {
      throw new Error('Cannot create a record without an id')
    }
    return this.collection
      .create({
        id: this.rowId(id),
        user: this.userId,
        data,
      })
      .then((it) => it.data)
  }

  public async read(id: string): Promise<T> {
    return this.getRow(id).then((it) => it.data)
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    return this.collection
      .update(this.rowId(id), {
        user: this.userId,
        data,
      })
      .then((it) => it.data)
  }

  public async delete(id: string | string[]): Promise<number> {
    const ids = Array.isArray(id) ? id : [id]
    if (!ids.length) {
      return 0
    }
    const promises = ids.map(async (id) => {
      return this.collection.delete(this.rowId(id)).catch(console.error)
    })
    await Promise.all(promises).catch(console.error)

    // const batch = this.client.createBatch()
    // const collection = batch.collection(this.collection.collectionIdOrName)
    // for (const id of ids) {
    //   collection.delete(this.rowId(id))
    // }
    // await batch.send()
    return ids.length
  }
}
