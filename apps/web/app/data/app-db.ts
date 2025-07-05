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

export abstract class AppDb {
  public abstract reset(): Promise<void>
  public abstract table<T extends AppDbRecord>(name: string): AppDbTable<T>
  public abstract dropTables(): Promise<void>
}

export interface AppDbTableEvent<T> {
  type: 'delete' | 'create' | 'update'
  payload: T
}
export abstract class AppDbTable<T extends AppDbRecord> {
  public abstract readonly db: AppDb

  public abstract readonly tableName: string
  public abstract readonly events: Subject<AppDbTableEvent<T>>

  public abstract createId(): string
  public abstract tx<R>(fn: () => Promise<R>): Promise<R>
  public abstract count(): Promise<number>
  public abstract keys(): Promise<string[]>

  public abstract list(): Promise<T[]>
  public abstract where(where: Partial<AppDbRecord>): Promise<T[]>
  public abstract create(record: Partial<T>, options?: { silent: boolean }): Promise<T>
  public abstract read(id: string): Promise<T>
  public abstract update(id: string, record: Partial<T>, options?: { silent: boolean }): Promise<T>
  public abstract destroy(id: string | string[], options?: { silent: boolean }): Promise<void>

  public abstract createOrUpdate(record: T, options?: { silent: boolean }): Promise<T>

  public abstract observeAll(): Observable<T[]>
  public abstract observeWhere(where: Partial<AppDbRecord>): Observable<T[]>
  public abstract observeById(id: string | Observable<string>): Observable<T>
}
