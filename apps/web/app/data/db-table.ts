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

  public async create(record: Partial<T>, options?: { silent: boolean }) {
    return this.table.create(record, options)
  }

  public async read(id: string) {
    return this.table.read(id)
  }

  public async update(id: string, record: Partial<T>, options?: { silent: boolean }) {
    return this.table.update(id, record, options)
  }

  public async destroy(id: string | string[], options?: { silent: boolean }) {
    return this.table.destroy(id, options)
  }

  public async createOrUpdate(record: T, options?: { silent: boolean }) {
    return this.table.createOrUpdate(record, options)
  }

  public observeAll() {
    return this.table.observeAll()
  }

  public observeByid(id: string | Observable<string>) {
    return this.table.observeByid(id)
  }
}
