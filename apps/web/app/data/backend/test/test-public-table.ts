import { AppDbRecord } from '../../app-db'
import { PublicTable } from '../backend-adapter'
import { TestRecord } from './test-private-table'

export class TestPublicTable<T extends AppDbRecord> implements PublicTable<T> {
  public readonly name: string
  public readonly collection: Record<string, TestRecord<T>> = {}

  private rowId(userId: string, id: string) {
    return `${userId}:${id}`
  }

  public constructor(name: string) {
    this.name = name
  }

  private async getRow(userId: string, id: string) {
    if (!userId || !id) {
      throw new Error('User ID and Record ID must be provided')
    }
    const rowId = this.rowId(userId, id)
    const result = this.collection[rowId]
    if (!result) {
      throw new Error(`Record with ID ${id} not found for user ${userId}`)
    }
    return result
  }

  public async page(page: number, perPage: number): Promise<T[]> {
    return Object.values(this.collection)
      .slice((page - 1) * perPage, page * perPage)
      .map((record) => record.data)
  }

  public async read({ user, id }: { user: string; id: string }): Promise<T> {
    return this.getRow(user, id).then((it) => it.data)
  }
}
