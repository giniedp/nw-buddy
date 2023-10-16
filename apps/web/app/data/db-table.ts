import Dexie, { liveQuery, Observable, PromiseExtended, Table } from 'dexie'
import { customAlphabet } from 'nanoid/non-secure'
import { defer, from, isObservable, Observable as RxObservable, of, switchMap } from 'rxjs'

// https://github.com/ai/nanoid
// https://zelark.github.io/nano-id-cc/
const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)

export abstract class DBTable<T extends { id: string }> {
  public readonly db: Dexie
  public readonly table: Table<T>
  public constructor(db: Dexie, name: string) {
    this.db = db
    this.table = db.table(name)
  }

  public async resetDB() {
    await this.db.open()
    await this.db.delete()
    await this.db.open()
  }

  public async all() {
    return this.table.toArray()
  }

  public async create(record: Partial<T>) {
    record = {
      ...record,
      id: record.id || createId(),
    }
    const id = await this.table.add(record as T, record.id)
    return this.read(id as any)
  }

  public async read(id: string) {
    return this.table.get(id)
  }

  public async update(id: string, record: Partial<T>) {
    await this.table.update(id, record)
    return this.read(id)
  }

  public async destroy(id: string | string[]) {
    return this.table.delete(id)
  }

  public async createOrUpdate(record: T) {
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
        })
    )
  }

  public observeAll() {
    return this.live((t) => t.toArray())
  }

  public observeByid(id: string | RxObservable<string>) {
    return (isObservable(id) ? id : of(id)).pipe(
      switchMap((id) => {
        return id ? this.live((t) => t.get(id)) : of(null)
      })
    )
  }
}
