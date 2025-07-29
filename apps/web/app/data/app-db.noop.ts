import { of, Observable as RxObservable, Subject } from 'rxjs'

import { customAlphabet } from 'nanoid/non-secure'
import { AppDb, AppDbRecord, AppDbTable, AppDbTableEvent, WhereConditions } from './app-db'
const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)

export class AppDbNoop extends AppDb {
  private tables: Record<string, AppDbNoopTable<any>> = {}

  public constructor(name: string) {
    super()
  }

  public override table(name: string) {
    this.tables[name] = this.tables[name] || new AppDbNoopTable(this, name)
    return this.tables[name]
  }

  public async dropTables() {
    for (const table of Object.values(this.tables)) {
      // No-op, as this is a noop implementation
    }
  }
}

export class AppDbNoopTable<T extends AppDbRecord> extends AppDbTable<T> {
  public db: AppDb
  public tableName: string
  public events = new Subject<AppDbTableEvent<T>>()

  public constructor(db: AppDb, name: string) {
    super()
    this.db = db
    this.tableName = name
  }

  public createId = createId
  public async tx<R>(fn: () => Promise<R>): Promise<R> {
    return null
  }

  public async count(): Promise<number> {
    return 0
  }

  public async countWhere(where: Partial<AppDbRecord>): Promise<number>{
    return 0
  }

  public async keys(): Promise<string[]> {
    return []
  }

  public async list(): Promise<T[]> {
    return []
  }

  public async where(where: Partial<T>): Promise<T[]> {
    return []
  }

  public async create(record: Partial<T>, options?: { silent: boolean }): Promise<T> {
    return null
  }

  public async read(id: string): Promise<T> {
    return null
  }

  public async update(id: string, record: Partial<T>, options?: { silent: boolean }): Promise<T> {
    return null
  }

  public async delete(id: string | string[], options?: { silent: boolean }): Promise<void> {
    //
  }

  public observeAll(): RxObservable<T[]> {
    return of([])
  }

  public observeWhere(where: WhereConditions<T>): RxObservable<T[]> {
    return of([])
  }

  public observeWhereCount(where: WhereConditions<T>): RxObservable<number> {
    return of(0)
  }

  public observeBy(where: WhereConditions<T>): RxObservable<T> {
    return of(null)
  }

  public observeById(id: string): RxObservable<T> {
    return of(null)
  }
}
