import { inject, Injectable } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { catchError, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { TableStateDB } from './table-states.db'
import { TableStateRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TableStatesService {
  private table = inject(TableStateDB)
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)

  public read(id: string) {
    return this.table.read(id)
  }

  public observeRecords(userId: string) {
    if (userId === 'local' || !userId) {
      return this.table.observeWhere({ userId: 'local' })
    }
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId })
        }
        return of<TableStateRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }) {
    return this.userId$.pipe(
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
    return this.table.destroy(id)
  }
}
