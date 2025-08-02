import { inject, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, distinctUntilChanged, map, NEVER, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { injectTablePresetsDB } from './table-presets.db'
import { TablePresetRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TablePresetsService {
  public readonly table = injectTablePresetsDB()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private ready = signal(false)
  private ready$ = toObservable(this.ready)

  public constructor() {
    this.sync()
  }

  public sync = rxMethod<void>((source) => {
    return source.pipe(
      switchMap(() => {
        return autoSync({
          userId: this.userId$,
          online: this.online$,
          local: this.table,
          remote: this.backend.privateTables.grids,
        })
      }),
      map((stage) => this.ready.set(stage === 'offline' || stage === 'syncing')),
    )
  })

  public read(id: string) {
    return this.table.read(id)
  }

  public observeCount(userId: string) {
    userId ||= 'local'
    return this.table.observeWhereCount({ userId })
  }

  public observeRecords({ key }: { key: string }) {
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        return this.table.observeWhere({ userId: localUserId, key })
      }),
    )
  }

  public observeRecord({ id }: { id: string }) {
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
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

  public dublicate(record: TablePresetRecord) {
    return this.create({
      ...record,
      id: null,
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
    return this.table.delete(id)
  }

  public async deleteUserData(userId: string) {
    const records = await this.table.where({ userId })
    return this.table.delete(records.map((it) => it.id))
  }
}
