import { Dexie, liveQuery, PromiseExtended, Table } from 'dexie'
import { customAlphabet } from 'nanoid/non-secure'
import { defer, isObservable, of, Observable as RxObservable, Subject, switchMap } from 'rxjs'

import { AppDb, AppDbRecord, AppDbTable, AppDbTableEvent } from './app-db'
import {
  DBT_CHARACTERS,
  DBT_GEARSETS,
  DBT_IMAGES,
  DBT_ITEMS,
  DBT_SKILL_BUILDS,
  DBT_TABLE_PRESETS,
  DBT_TABLE_STATES,
} from './constants'

export class AppDbDexie extends AppDb {
  private tables: Record<string, AppDbDexieTable<any>> = {}
  public readonly dexie: Dexie
  public constructor(name: string) {
    super()
    this.dexie = new Dexie(name)
    this.init(this.dexie)
  }

  public override table(name: string) {
    this.tables[name] = this.tables[name] || new AppDbDexieTable(this, name)
    return this.tables[name]
  }

  public async reset() {
    await this.dexie.open()
    await this.dexie.delete()
    await this.dexie.open()
  }

  private init(db: Dexie) {
    db.version(1).stores({
      [DBT_ITEMS]: 'id,itemId,gearScore',
      [DBT_GEARSETS]: 'id,*tags',
    })
    db.version(2).stores({
      [DBT_IMAGES]: 'id',
    })
    db.version(3).stores({
      [DBT_CHARACTERS]: 'id',
    })
    db.version(4).stores({
      [DBT_SKILL_BUILDS]: 'id',
    })
    db.version(5).stores({
      [DBT_TABLE_PRESETS]: 'id,key',
      [DBT_TABLE_STATES]: 'id',
    })
  }
}

// https://github.com/ai/nanoid
// https://zelark.github.io/nano-id-cc/
const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)

export class AppDbDexieTable<T extends AppDbRecord> extends AppDbTable<T> {
  public db: AppDbDexie
  public tableName: string
  private table: Table<T>

  public constructor(db: AppDbDexie, name: string) {
    super()
    this.db = db
    this.tableName = name
    this.table = db.dexie.table(name)
  }

  public async tx<R>(fn: () => Promise<R>): Promise<R> {
    return this.db.dexie.transaction('rw', this.table, fn)
  }

  public async count(): Promise<number> {
    return this.table.count()
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

  public async create(record: Partial<T>): Promise<T> {
    const now = new Date()
    record = {
      ...record,
      id: record.id || createId(),
      created_at: now,
      updated_at: now,
    }
    const id = await this.table.add(record as T, record.id)
    const row = await this.read(id as any)
    this.events.next({ type: 'create', payload: row })
    return row
  }

  public read(id: string): Promise<T> {
    return this.table.get(id)
  }

  public async update(id: string, record: Partial<T>): Promise<T> {
    const now = new Date()
    record['updated_at'] = now

    await this.table.update(id, record)
    const row = await this.read(id)
    this.events.next({ type: 'update', payload: row })
    return row
  }

  public async destroy(id: string | string[]): Promise<void> {
    await this.table.delete(id)
    const ids = typeof id === 'string' ? [id] : id

    for (const id of ids) {
      this.events.next({ type: 'delete', payload: { id } as T })
    }

    return
  }

  public async createOrUpdate(record: T): Promise<T> {
    if (record.id) {
      await this.table.put(record, record.id)
      return this.read(record.id)
    }
    return this.create(record)
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
  public observeByid(id: string | RxObservable<string>): RxObservable<T> {
    return (isObservable(id) ? id : of(id)).pipe(
      switchMap((id) => {
        return id ? this.live((t) => t.get(id)) : of(null)
      }),
    )
  }
}
