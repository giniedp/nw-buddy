import { Subject } from 'rxjs'
import { AppDbRecord, AppDbTable } from '../../app-db'
import { BackendAdapter, BackendTableEvent, PrivateTable } from '../backend-adapter'

export interface TestRecord<T extends AppDbRecord> {
  id: string
  user: string
  data: T
}

export class TestPrivateTable<T extends AppDbRecord> implements PrivateTable<T> {
  public readonly name: string
  public rows: Record<string, TestRecord<T>> = {}

  public readonly events$ = new Subject<BackendTableEvent<T>>()

  private get userId(): string {
    const userId = this.adapter.session()?.id
    if (!userId) {
      throw new Error('User is not authenticated')
    }
    return userId
  }
  private rowId(id: string) {
    return `${this.userId}:${id}`
  }

  public constructor(
    protected readonly adapter: BackendAdapter,
    protected readonly table: AppDbTable<T>,
  ) {
    this.name = table.tableName
    this.rows = {}
  }

  private async getRow(id: string) {
    return this.rows[id]
  }

  public async list(): Promise<T[]> {
    return Array.from(Object.values(this.rows)).map((record) => record.data)
  }

  public async create(data: T): Promise<T> {
    const id = data.id
    if (!id) {
      throw new Error('Cannot create a record without an id')
    }
    const params = {
      id: this.rowId(id),
      user: this.userId,
      data,
    }
    if (data && 'status' in data) {
      params['status'] = data.status
    }
    this.rows[id] = params as TestRecord<T>
    this.events$.next({
      type: 'create',
      record: params.data,
    })
    return Promise.resolve(params.data)
  }

  public async read(id: string): Promise<T> {
    return this.getRow(id).then((it) => it.data)
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    const params: TestRecord<T> = {
      id: this.rowId(id),
      user: this.userId,
      data: data as T,
    }
    if (data && 'status' in data) {
      params['status'] = data.status
    }
    this.rows[id] = params as TestRecord<T>
    this.events$.next({
      type: 'update',
      record: params.data,
    })
    return Promise.resolve(params.data)
  }

  public async delete(id: string | string[]): Promise<number> {
    const ids = Array.isArray(id) ? id : [id]
    if (!ids.length) {
      return 0
    }
    let count = 0
    for (const id of ids) {
      if (this.rows[id]) {
        delete this.rows[id]
        count++
        this.events$.next({
          type: 'delete',
          record: { id } as T,
        })
      }
    }

    return ids.length
  }
}
