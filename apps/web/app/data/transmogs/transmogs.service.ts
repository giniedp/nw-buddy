import { computed, inject, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, distinctUntilChanged, map, NEVER, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { injectTransmogsDB } from './transmogs.db'
import { TransmogRecord } from './types'
import { LOCAL_USER_ID } from '../constants'

@Injectable({ providedIn: 'root' })
export class TransmogsService {
  public readonly table = injectTransmogsDB()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private ready = signal(false)
  public ready$ = toObservable(this.ready)

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
          remote: this.backend.privateTables.transmogs,
        })
      }),
      map((stage) => this.ready.set(stage === 'offline' || stage === 'syncing')),
    )
  })

  public read(id: string) {
    return this.table.read(id)
  }

  public observeCount(userId: string) {
    userId ||= LOCAL_USER_ID
    return this.table.observeWhereCount({ userId })
  }

  public observeRecords(userId: string) {
    userId ||= LOCAL_USER_ID
    if (userId === LOCAL_USER_ID) {
      return this.table.observeWhere({ userId })
    }
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId })
        }
        if (this.backend.isEnabled()) {
          // TODO:
          // return ...
        }
        return of<TransmogRecord[]>([])
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
        if (this.backend.isEnabled()) {
          return this.backend.publicTables.transmogs.read({ user: userId, id })
        }
        return of(null)
      }),
      catchError((error) => {
        console.error('Error transmog record:', error)
        return of(null)
      }),
    )
  }

  public create(record: Partial<TransmogRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public dublicate(record: TransmogRecord) {
    return this.create({
      ...record,
      id: null,
      status: 'private',
    })
  }

  public update(id: string, record: Partial<TransmogRecord>) {
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

  public publish(record: TransmogRecord) {
    return this.update(record.id, {
      ...record,
      status: 'public',
    })
  }

  public unpublish(record: TransmogRecord) {
    return this.update(record.id, {
      ...record,
      status: 'private',
    })
  }
}
