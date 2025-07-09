import { inject, Injectable } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { catchError, map, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { TablePresetDB } from './table-presets.db'
import { TablePresetRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TablePresetsService {
  private table = inject(TablePresetDB)
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)

  public constructor() {
    this.connect()
  }

  private connect() {
    // TODO: connect to backend for syncing
  }

  public read(id: string) {
    return this.table.read(id)
  }

  public observeRecords({ key }: { key: string }) {
    return this.userId$.pipe(
      switchMap((localUserId) => {
        return this.table.observeWhere({ userId: localUserId, key })
      }),
    )
  }

  public observeRecord({ id }: { id: string }) {
    return this.userId$.pipe(
      switchMap((localUserId) => {
        return this.table.observeWhere({ userId: localUserId, id })
      }),
      map((records) => records?.[0] || null),
      catchError((error) => {
        console.error(error)
        return of(null)
      }),
    )
  }

  public create(record: Partial<TablePresetRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<TablePresetRecord>) {
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
