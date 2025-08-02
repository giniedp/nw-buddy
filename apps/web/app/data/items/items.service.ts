import { inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { EquipSlotId } from '@nw-data/common'
import { combineLatest, distinctUntilChanged, map, NEVER, Observable, of, switchMap } from 'rxjs'
import { combineLatestOrEmpty } from '~/utils'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { GearsetRecord } from '../gearsets/types'
import { injectNwData } from '../nw-data'
import { injectItemInstancesDB } from './items.db'
import { ItemInstance, ItemInstanceRecord } from './types'
import { buildItemInstanceRows } from './utils'
import { rxMethod } from '@ngrx/signals/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  public readonly table = injectItemInstancesDB()
  private backend = inject(BackendService)
  private nwdb = injectNwData()
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private ready = signal(false)
  public ready$ = toObservable(this.ready)

  private nwData$ = combineLatest({
    items: this.nwdb.itemsByIdMap(),
    perks: this.nwdb.perksByIdMap(),
    affixes: this.nwdb.affixStatsByIdMap(),
    buckets: this.nwdb.perkBucketsByIdMap(),
  })

  public isSignedIn = this.backend.isSignedIn

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
          remote: this.backend.privateTables.items,
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

  public observeRecords(userId: string) {
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
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
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === 'local' || (userId || '') === (localUserId || '')) {
          return this.table.observeById(id)
        }
        // if (this.backend.isEnabled()) {
        //   return this.backend.publicTables.items.read({ user: userId, id })
        // }
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
      userId: this.userId() || 'local',
    })
  }

  public dublicate(record: ItemInstanceRecord) {
    return this.table.create({
      ...record,
      id: this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<ItemInstanceRecord>) {
    return this.table.update(id, {
      ...record,
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

  public resolveGearsetSlots({ userId, slots }: { userId: string; slots: GearsetRecord['slots'] }) {
    return combineLatestOrEmpty(
      Object.entries(slots || {}).map(([slot, instance]): Observable<ResolvedGearsetSlot> => {
        return this.resolveGearsetSlot({
          userId,
          slotId: slot as EquipSlotId,
          instance,
        })
      }),
    )
  }

  public resolveGearsetSlot({
    userId,
    slotId,
    instance,
  }: {
    userId: string
    slotId: EquipSlotId
    instance: string | ItemInstance
  }) {
    if (typeof instance === 'string') {
      return combineLatest({
        slot: of(slotId),
        instanceId: of(instance),
        instance: this.observeRecord({ userId, id: instance }),
      })
    }
    return combineLatest({
      slot: of(slotId),
      instanceId: of<string>(null),
      instance: of(instance),
    })
  }
}

export interface ResolvedGearsetSlot {
  slot: EquipSlotId
  instanceId: string
  instance: ItemInstance
}
