import { inject, Injectable, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, distinctUntilChanged, map, NEVER, Observable, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'

import { autoSync } from '../backend/auto-sync'
import { LOCAL_USER_ID } from '../constants'
import { injectCharactersDB } from './characters.db'
import { CharacterRecord } from './types'

@Injectable({ providedIn: 'root' })
export class CharactersService {
  public readonly table = injectCharactersDB()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private ready = signal(false)
  public ready$ = toObservable(this.ready)

  public count = toSignal(this.userId$.pipe(switchMap((id) => this.observeCount(id))))

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
          remote: this.backend.privateTables.characters,
        })
      }),
      map((stage) => this.ready.set(stage === 'offline' || stage === 'syncing')),
    )
  })

  public read(id: string) {
    return this.table.read(id)
  }

  public observeCount(userId: string): Observable<number> {
    userId ||= LOCAL_USER_ID
    return this.table.observeWhereCount({ userId })
  }

  public observeRecords(userId: string): Observable<CharacterRecord[]> {
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
        return of<CharacterRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }): Observable<CharacterRecord> {
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
        console.error('Error observing character record:', error)
        return of(null)
      }),
    )
  }

  public create(record: Partial<CharacterRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || LOCAL_USER_ID,
    })
  }

  public dublicate(record: CharacterRecord) {
    return this.create({
      ...record,
      id: null,
    })
  }

  public update(id: string, record: Partial<CharacterRecord>) {
    return this.table.update(id, {
      ...record,
      id,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: this.userId() || LOCAL_USER_ID,
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
