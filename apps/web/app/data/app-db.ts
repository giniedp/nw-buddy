import { Observable } from "rxjs"

export type AppDbRecord = { id: string }

export abstract class AppDb {
  public abstract reset(): Promise<void>
  public abstract table<T extends AppDbRecord>(name: string): AppDbTable<T>
}

export abstract class AppDbTable<T extends AppDbRecord> {
  public readonly abstract db: AppDb


  public abstract tx<R>(fn: () => Promise<R>): Promise<R>
  public abstract count(): Promise<number>
  public abstract keys(): Promise<string[]>

  public abstract list(): Promise<T[]>
  public abstract create(record: Partial<T>): Promise<T>
  public abstract read(id: string) : Promise<T>
  public abstract update(id: string, record: Partial<T>) : Promise<T>
  public abstract destroy(id: string | string[]) : Promise<void>

  public abstract createOrUpdate(record: T): Promise<T>

  public abstract observeAll(): Observable<T[]>
  public abstract observeByid(id: string | Observable<string>): Observable<T>
}
