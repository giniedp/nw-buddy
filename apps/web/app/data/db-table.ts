import { Observable } from 'rxjs'
import { AppDbRecord, AppDbTable } from './app-db'
import { customAlphabet } from 'nanoid/non-secure'

// https://github.com/ai/nanoid
// https://zelark.github.io/nano-id-cc/
const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)


export abstract class DBTable<T extends AppDbRecord> extends AppDbTable<T> {
  public abstract readonly table: AppDbTable<T>

  public get tableName() {
    return this.table.tableName
  }

  public createId(): string {
    return createId()
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

  public async where(where: Partial<T>) {
    return this.table.where(where)
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

  public observeWhere(where: Partial<T>): Observable<T[]> {
    return this.table.observeWhere(where)
  }

  public observeById(id: string | Observable<string>) {
    return this.table.observeById(id)
  }
}
