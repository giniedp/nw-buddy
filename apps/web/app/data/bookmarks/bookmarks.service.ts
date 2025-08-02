import { inject, Injectable, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { distinctUntilChanged, map, NEVER, Observable, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { injectBookmarksDB } from './bookmarks.db'
import { BookmarkRecord } from './types'

@Injectable({
  providedIn: 'root',
})
export class BookmarksService {
  public readonly table = injectBookmarksDB()
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
          remote: this.backend.privateTables.bookmarks,
        })
      }),
      map((stage) => this.ready.set(stage === 'offline' || stage === 'syncing')),
    )
  })

  public observeCount(userId: string): Observable<number> {
    userId ||= 'local'
    return this.table.observeWhereCount({ userId })
  }

  public observeRecords({
    userId,
    characterId,
  }: {
    userId: string
    characterId: string
  }): Observable<BookmarkRecord[]> {
    if (!userId || !characterId) {
      return of([])
    }
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === 'local' || !userId) {
          return this.table.observeWhere({ userId: 'local', characterId })
        }
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId, characterId })
        }
        return of<BookmarkRecord[]>([])
      }),
    )
  }

  public create(record: Partial<BookmarkRecord>) {
    if (!record.itemId) {
      throw new Error('Cannot create bookmark without itemId')
    }
    return this.table.create({
      ...record,
      itemId: record.itemId.toLowerCase(),
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<BookmarkRecord>) {
    if (record.itemId) {
      record.itemId = record.itemId.toLowerCase()
    }
    return this.table.update(id, {
      ...record,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public async deleteUserData(userId: string) {
    const records = await this.table.where({ userId })
    return this.table.delete(records.map((it) => it.id))
  }

  public delete(id: string | string[]) {
    return this.table.delete(id)
  }
}
