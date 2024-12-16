import { of, Observable as RxObservable, Subject } from 'rxjs'

import { AppDb, AppDbTable, AppDbTableEvent } from './app-db'

export class AppDbNoop extends AppDb {
  private tables: Record<string, AppDbNoopTable<any>> = {}

  public constructor(name: string) {
    super()
  }

  public override table(name: string) {
    this.tables[name] = this.tables[name] || new AppDbNoopTable(this, name)
    return this.tables[name]
  }

  public async reset() {
    //
  }
}

export class AppDbNoopTable<T extends { id: string }> extends AppDbTable<T> {
  public db: AppDb
  public tableName: string

  public constructor(db: AppDb, name: string) {
    super()
    this.db = db
    this.tableName = name
  }

  public async tx<R>(fn: () => Promise<R>): Promise<R> {
    return null
  }

  public async count(): Promise<number> {
    return 0
  }

  public async keys(): Promise<string[]> {
    return []
  }

  public async list(): Promise<T[]> {
    return []
  }

  public async create(record: Partial<T>): Promise<T> {
    return null
  }

  public async read(id: string): Promise<T> {
    return null
  }

  public async update(id: string, record: Partial<T>): Promise<T> {
    return null
  }

  public async destroy(id: string | string[]): Promise<void> {
    //
  }

  public async createOrUpdate(record: T): Promise<T> {
    return null
  }

  public observeAll(): RxObservable<T[]> {
    return of([])
  }
  public observeByid(id: string | RxObservable<string>): RxObservable<T> {
    return of(null)
  }
}
