// https://github.com/ai/nanoid

import { liveQuery, PromiseExtended, Table } from 'dexie'
import { defer, of, Observable as RxObservable, Subject } from 'rxjs'
import { AppDbRecord, AppDbTable, AppDbTableEvent, createId, WhereConditions } from './app-db'
import type { AppDbDexie } from './app-db.dexie'

export class AppDbDexieTable<T extends AppDbRecord> extends AppDbTable<T> {
  public readonly db: AppDbDexie
  public readonly tableName: string
  public readonly events = new Subject<AppDbTableEvent<T>>()
  private readonly table: Table<T>

  public constructor(db: AppDbDexie, name: string) {
    super()
    this.db = db
    this.tableName = name
    this.table = db.dexie.table(name)
  }

  public createId = createId
  public async tx<R>(fn: () => Promise<R>): Promise<R> {
    return this.db.dexie.transaction('rw', this.table, fn)
  }

  public async count(): Promise<number> {
    return this.table.count()
  }

  public async countWhere(where: Partial<AppDbRecord>): Promise<number> {
    return this.table.where(where).count()
  }

  public async keys(): Promise<string[]> {
    return this.table
      .toCollection()
      .keys()
      .then((list) => list as string[])
  }

  public list(): Promise<T[]> {
    return this.table.toArray()
  }

  public where(where: Partial<T>): Promise<T[]> {
    return this.table.where(where).toArray()
  }

  public async create(record: Partial<T>, options?: { silent: boolean }): Promise<T> {
    const now = new Date()
    record = {
      ...record,
      id: record.id ?? createId(),
      createdAt: record.createdAt ?? now.toJSON(),
      updatedAt: record.updatedAt ?? now.toJSON(),
    }
    if (!record.userId) {
      console.warn(`Creating record in table "${this.tableName}" without userId.`)
    }

    const id = await this.table.add(record as T, record.id)
    const row = await this.read(id as any)
    if (!options?.silent) {
      this.events.next({ type: 'create', payload: row })
    }
    return row
  }

  public read(id: string): Promise<T> {
    return this.table.get(id)
  }

  public async update(id: string, record: Partial<T>, options?: { silent: boolean }): Promise<T> {
    await this.table.update(id, record)
    const row = await this.read(id)
    if (!options?.silent) {
      this.events.next({ type: 'update', payload: row })
    }
    return row
  }

  public async delete(id: string | string[], options?: { silent: boolean }): Promise<void> {

    const ids = typeof id === 'string' ? [id] : id
    await this.table.bulkDelete(ids)

    if (!options?.silent) {
      this.events.next({ type: 'delete', payload: ids })
    }

    return
  }

  public live<R>(fn: (tbale: Table<T>) => PromiseExtended<R>) {
    return defer(
      () =>
        new RxObservable<R>((sub) => {
          return liveQuery<R>(() => fn(this.table)).subscribe(sub)
        }),
    )
  }

  public observeAll(): RxObservable<T[]> {
    return this.live((t) => t.toArray())
  }

  public observeWhere(where: WhereConditions<T>): RxObservable<T[]> {
    return this.live((t) => t.where(where).toArray())
  }

  public observeWhereCount(where: WhereConditions<T>): RxObservable<number> {
    return this.live((t) => t.where(where).count())
  }

  public observeBy(where: WhereConditions<T>): RxObservable<T> {
    return this.live((t) => t.where(where).first())
  }

  public observeById(id: string): RxObservable<T> {
    return id ? this.live((t) => t.get(id)) : of(null)
  }
}
