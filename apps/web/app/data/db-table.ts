import { Observable, Subject } from 'rxjs'
import { AppDbRecord, AppDbTable, AppDbTableEvent } from './app-db'

export abstract class DBTable<T extends AppDbRecord> extends AppDbTable<T> {
  public abstract readonly table: AppDbTable<T>

  public get tableName() {
    return this.table.tableName
  }

  public tx<R>(fn: () => Promise<R>): Promise<R> {
    return this.table.tx(fn)
  }

  public async count() {
    return this.table.count()
  }

  public async keys() {
    return this.table.keys()
  }

  public async list() {
    return this.table.list()
  }

  public async create(record: Partial<T>) {
    return this.table.create(record)
  }

  public async read(id: string) {
    return this.table.read(id)
  }

  public async update(id: string, record: Partial<T>) {
    return this.table.update(id, record)
  }

  public async destroy(id: string | string[]) {
    return this.table.destroy(id)
  }

  public async createOrUpdate(record: T) {
    return this.table.createOrUpdate(record)
  }

  public observeAll() {
    return this.table.observeAll()
  }

  public observeByid(id: string | Observable<string>) {
    return this.table.observeByid(id)
  }
}
