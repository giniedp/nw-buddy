import { computed, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { catchError, combineLatest, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { GearsetRecord } from '../gearsets'
import { autoSync } from '../backend/auto-sync'
import { TransmogsDB } from './transmogs.db'
import { TransmogRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TransmogsService {
  private table = inject(TransmogsDB)
  private backend = inject(BackendService)
  private userId = computed(() => this.backend.session()?.id)
  private userId$ = toObservable(this.userId)
  private ready = signal(false)

  public constructor() {
    this.connect()
  }

  private connect() {
    // TODO: connect to backend for syncing
    // autoSync({
    //   userId: this.userId$,
    //   local: this.table,
    //   remote: this.backend.privateTables.transmogs,
    // })
    //   .pipe(takeUntilDestroyed())
    //   .subscribe((stage) => {
    //     this.ready.set(stage === 'offline' || stage === 'syncing')
    //   })
  }

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
        if (this.backend.isEnabled()) {
          // TODO:
          // return ...
        }
        return of<TransmogRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }) {
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === 'local' || (userId || '') === (localUserId || '')) {
          return this.table.observeById(id)
        }
        if (this.backend.isEnabled()) {
          return this.backend.publicTables.skillSets.read({ user: userId, id })
        }
        return of(null)
      }),
      catchError((error) => {
        console.error('Error observing skill build record:', error)
        return of(null)
      })
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
      ipnsKey: null,
      ipnsName: null,
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
    return this.table.destroy(id)
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
