import { customAlphabet } from 'nanoid/non-secure'
import { Observable, Subject } from 'rxjs'

export type AppDbRecord = {
  /**
   * Unique identifier for the record
   */
  id: string

  /**
   * Indicates if the record is synced with the backend.
   */
  syncState?: 'synced' | 'pending' | 'conflict'

  /**
   * Creation timestamp of the record
   */
  createdAt?: string

  /**
   * Last updated timestamp of the record
   */
  updatedAt?: string

  /**
   * User ID associated with the record.
   */
  userId?: string
}

// https://zelark.github.io/nano-id-cc/
export const createId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz-_', 16)

export abstract class AppDb {
  public abstract table<T extends AppDbRecord>(name: string): AppDbTable<T>
  public abstract dropTables(): Promise<void>
}

export type AppDbTableEvent<T> =
  | { type: 'delete'; payload: string | string[] }
  | { type: 'create' | 'update'; payload: T }

export abstract class AppDbTable<T extends AppDbRecord> {
  public abstract readonly db: AppDb

  public abstract readonly tableName: string
  public abstract readonly events: Subject<AppDbTableEvent<T>>

  public abstract createId(): string
  public abstract tx<R>(fn: () => Promise<R>): Promise<R>
  public abstract count(): Promise<number>
  public abstract countWhere(where: Partial<AppDbRecord>): Promise<number>
  public abstract keys(): Promise<string[]>

  public abstract list(): Promise<T[]>
  public abstract where(where: Partial<AppDbRecord>): Promise<T[]>
  public abstract create(record: Partial<T>, options?: { silent: boolean }): Promise<T>
  public abstract read(id: string): Promise<T>
  public abstract update(id: string, record: Partial<T>, options?: { silent: boolean }): Promise<T>
  public abstract delete(id: string | string[], options?: { silent: boolean }): Promise<void>

  public abstract observeAll(): Observable<T[]>
  public abstract observeWhere(where: WhereConditions<T>): Observable<T[]>
  public abstract observeWhereCount(where: WhereConditions<T>): Observable<number>
  public abstract observeBy(where: WhereConditions<T>): Observable<T>
  public abstract observeById(id: string): Observable<T>
}

export type WhereConditions<T> = FieldConditionMap<T>

export type FieldConditionMap<T> = Partial<{
  [K in keyof T]: FieldCondition | Primitive
}>

export type FieldCondition = Primitive
// | {
//     eq?: Primitive
//     neq?: Primitive
//     gt?: Primitive
//     gte?: Primitive
//     lt?: Primitive
//     lte?: Primitive
//     in?: Primitive[]
//     nin?: Primitive[]
//     like?: string
//     ilike?: string
//     isNull?: boolean
//   }

export type Primitive = string | number | boolean | null
