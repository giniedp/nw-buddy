import { inject, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { catchError, distinctUntilChanged, NEVER, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { injectTableStatesDB } from './table-states.db'
import { TableStateRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TableStatesService {
  private table = injectTableStatesDB()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private ready = signal(true)
  private ready$ = toObservable(this.ready)

  public read(id: string) {
    return this.table.read(id)
  }

  public observeRecords(userId: string) {
    if (userId === 'local' || !userId) {
      return this.table.observeWhere({ userId: 'local' })
    }
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId })
        }
        return of<TableStateRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }) {
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === 'local' || (userId || '') === (localUserId || '')) {
          return this.table.observeById(id)
        }
        return of(null)
      }),
      catchError((error) => {
        console.error(error)
        return of(null)
      }),
    )
  }

  public async createOrUpdate(record: TableStateRecord) {
    if (!record.id) {
      return this.create(record)
    }
    const existing = await this.read(record.id).catch(() => null as TableStateRecord)
    if (!existing) {
      return this.create(record)
    }
    return this.update(record.id, record)
  }

  public create(record: Partial<TableStateRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<TableStateRecord>) {
    return this.table.update(id, {
      ...record,
      id,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public delete(id: string) {
    return this.table.delete(id)
  }

  public async deleteUserData(userId: string) {
    const records = await this.table.where({ userId })
    return this.table.delete(records.map((it) => it.id))
  }
}
