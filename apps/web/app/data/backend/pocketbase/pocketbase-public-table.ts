import PocketBase, { RecordModel, RecordService } from 'pocketbase'
import { AppDbRecord } from '../../app-db'
import { PublicTable } from '../backend-adapter'

export interface PocketRecord<T extends AppDbRecord> extends RecordModel {
  user: string
  data: T
}

export class PocketbasePublicTable<T extends AppDbRecord> implements PublicTable<T> {
  public readonly name: string
  public readonly collection: RecordService<PocketRecord<T>>

  private rowId(userId: string, id: string) {
    return `${userId}:${id}`
  }

  public constructor(
    protected readonly client: PocketBase,
    name: string,
  ) {
    this.name = name
    this.collection = client.collection(this.name)
  }

  private getRow(userId: string, id: string) {
    if (!userId || !id) {
      throw new Error('User ID and Record ID must be provided')
    }
    return this.collection.getOne(this.rowId(userId, id))
  }

  public async page(page: number, perPage: number): Promise<T[]> {
    return this.collection.getList(page, perPage).then((page) => {
      return page.items.map((row) => row.data)
    })
  }

  public async read({ user, id }: { user: string; id: string }): Promise<T> {
    return this.getRow(user, id).then((it) => it.data)
  }
}
