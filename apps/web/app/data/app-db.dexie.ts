import { Dexie, liveQuery, PromiseExtended, Table } from 'dexie'
import { customAlphabet } from 'nanoid/non-secure'
import { defer, of, Observable as RxObservable, Subject } from 'rxjs'

import { AppDb, AppDbRecord, AppDbTable, AppDbTableEvent, WhereConditions } from './app-db'
import {
  DBT_CHARACTERS,
  DBT_GEARSETS,
  DBT_ITEMS,
  DBT_SKILL_TREES,
  DBT_TABLE_PRESETS,
  DBT_TABLE_STATES,
} from './constants'
import { DBT_TRANSMOGS } from './transmogs'

export class AppDbDexie extends AppDb {
  private tables: Record<string, AppDbDexieTable<any>> = {}
  public readonly dexie: Dexie
  public constructor(name: string) {
    super()
    this.dexie = new Dexie(name)
    this.createSchema(this.dexie)
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

  public async dropTables() {
    for (const table of Object.values(this.tables)) {
      await this.dexie.table(table.tableName).clear()
    }
  }

  public async clearUserData(userId: string) {
    await this.dexie.open()
    const tables = [
      DBT_CHARACTERS,
      DBT_GEARSETS,
      DBT_ITEMS,
      DBT_SKILL_TREES,
      DBT_TABLE_PRESETS,
      DBT_TABLE_STATES,
      DBT_TRANSMOGS,
    ]
    for (const table of tables) {
      await this.dexie.table(table).where({ userId }).delete()
    }
  }

  public async transferOwnershipOfData({ sourceUserId, targetUserid }: { sourceUserId: string; targetUserid: string }) {
    await this.dexie.open()
    const tables = [
      DBT_CHARACTERS,
      DBT_GEARSETS,
      DBT_ITEMS,
      DBT_SKILL_TREES,
      DBT_TABLE_PRESETS,
      DBT_TABLE_STATES,
      DBT_TRANSMOGS,
    ]
    for (const table of tables) {
      await this.dexie
        .table(table)
        .where({ userId: sourceUserId })
        .modify((item) => {
          item.userId = targetUserid
        })
    }
  }

  private createSchema(db: Dexie) {
    db.version(1).stores({
      items: 'id,itemId,gearScore',
      gearsets: 'id,*tags',
    })
    db.version(2).stores({
      images: 'id',
    })
    db.version(3).stores({
      characters: 'id',
    })
    db.version(4).stores({
      skillbuilds: 'id',
    })
    db.version(5).stores({
      ['table-presets']: 'id,key',
      ['table-states']: 'id',
    })

    db.version(6)
      .stores({
        items: 'id,itemId,gearScore,userId',
        gearsets: 'id,*tags,userId,characterId',
        images: null, // deleted
        characters: 'id,userId',
        skillbuilds: 'id,userId',
        'table-presets': 'id,key,userId',
        'table-states': 'id,userId',
        transmogs: 'id,userId',
      })
      .upgrade((trans) => {
        const tables = [
          DBT_CHARACTERS,
          DBT_GEARSETS,
          DBT_ITEMS,
          DBT_SKILL_TREES,
          DBT_TABLE_PRESETS,
          DBT_TABLE_STATES,
          DBT_TRANSMOGS,
        ]
        for (const table of tables) {
          trans
            .table(table)
            .toCollection()
            .modify((item) => {
              item.userId ||= 'local'
            })
        }
      })
  }
}

// https://github.com/ai/nanoid
// https://zelark.github.io/nano-id-cc/
const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)

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

  public async destroy(id: string | string[], options?: { silent: boolean }): Promise<void> {
    await this.table.delete(id)
    const ids = typeof id === 'string' ? [id] : id

    if (!options?.silent) {
      for (const id of ids) {
        this.events.next({ type: 'delete', payload: { id } as T })
      }
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
