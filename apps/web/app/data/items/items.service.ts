import { inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { injectNwData } from '../nw-data'
import { ItemInstancesDB } from './items.db'
import { ItemInstanceRecord } from './types'
import { buildItemInstanceRows } from './utils'

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private backend = inject(BackendService)
  private nwdb = injectNwData()
  private table = inject(ItemInstancesDB)
  private userId$ = toObservable(this.backend.session).pipe(map((it) => it?.id))
  private userId = toSignal(this.userId$)
  private ready = signal(false)

  private nwData$ = combineLatest({
    items: this.nwdb.itemsByIdMap(),
    perks: this.nwdb.perksByIdMap(),
    affixes: this.nwdb.affixStatsByIdMap(),
    buckets: this.nwdb.perkBucketsByIdMap(),
  })

  public constructor() {
    this.connect()
  }

  private connect() {
    autoSync({
      userId: this.userId$,
      local: this.table,
      remote: this.backend.privateTables.items,
    })
      .pipe(takeUntilDestroyed())
      .subscribe((stage) => {
        this.ready.set(stage === 'offline' || stage === 'syncing')
      })
  }

  public read(id: string) {
    return this.table.read(id)
  }

  public observeRecords(userId: string) {
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === 'local' || !userId) {
          return this.table.observeWhere({ userId: 'local' })
        }
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId })
        }
        return of([])
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
          return this.backend.publicTables.items.read({ user: userId, id })
        }
        return of(null)
      }),
    )
  }

  public observeRows() {
    return combineLatest({
      data: this.nwData$,
      records: this.userId$.pipe(switchMap((userId) => this.observeRecords(userId))),
    }).pipe(
      map(({ data, records }) => {
        return buildItemInstanceRows(records, data)
      }),
    )
  }

  public create(record: Partial<ItemInstanceRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: record.userId || this.userId() || 'local',
    })
  }

  public dublicate(record: ItemInstanceRecord) {
    return this.table.create({
      ...record,
      id: this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: record.userId || this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<ItemInstanceRecord>) {
    return this.table.update(id, {
      ...record,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: record.userId || this.userId() || 'local',
    })
  }

  public delete(id: string) {
    return this.table.destroy(id)
  }
}
