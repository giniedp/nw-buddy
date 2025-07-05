import { computed, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { EquipSlotId } from '@nw-data/common'
import { combineLatest, map, Observable, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { ItemInstance, ItemsService } from '../items'
import { injectNwData } from '../nw-data'
import { tableIndexBy } from '../nw-data/dsl'
import { GearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'
import { GearsetRow, selectGearsetRow } from './utils'

@Injectable({ providedIn: 'root' })
export class GearsetsService {
  private nwdata = injectNwData()
  private table = inject(GearsetsDB)
  private backend = inject(BackendService)
  private userId = computed(() => this.backend.session()?.id)
  private userId$ = toObservable(this.userId)
  private itemsDb = inject(ItemsService)
  private ready = signal(false)

  public constructor() {
    this.connect()
  }

  private connect() {
    autoSync({
      userId: this.userId$,
      local: this.table,
      remote: this.backend.privateTables.skillSets,
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
        return of<GearsetRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }): Observable<GearsetRecord> {
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === 'local' || (userId || '') === (localUserId || '')) {
          return this.table.observeById(id)
        }
        if (this.backend.isEnabled()) {
          return this.backend.publicTables.gearsets.read({ user: userId, id })
        }
        return of(null)
      }),
    )
  }

  public observeRows(userId: string): Observable<GearsetRow[]> {
    return combineLatest({
      records: this.observeRecords(userId),
      items: this.nwdata.itemsByIdMap(),
      instances: tableIndexBy(() => this.itemsDb.observeRecords(userId), 'id'),
    }).pipe(
      map(({ records, items, instances }) => {
        return records.map((it) => selectGearsetRow(it, items, instances))
      }),
    )
  }

  public create(record: Partial<GearsetRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public dublicate(record: GearsetRecord) {
    return this.table.create({
      ...record,
      id: this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public update(id: string, record: Partial<GearsetRecord>) {
    return this.table.update(id, {
      ...record,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public delete(id: string) {
    return this.table.destroy(id)
  }

  public async patchSlot({
    gearset,
    slot,
    value,
  }: {
    gearset: GearsetRecord
    slot: EquipSlotId
    value: string | Partial<ItemInstance>
  }) {
    if (value == null) {
      // clear slot
      const record = makeCopy(gearset)
      record.slots = record.slots || {}
      delete record.slots[slot]
      await this.update(record.id, record)
      return
    }
    if (typeof value === 'string') {
      // set slot to item instance id
      const record = makeCopy(gearset)
      record.slots = record.slots || {}
      record.slots[slot] = value
      await this.update(record.id, record)
      return
    }

    const instance = gearset.slots?.[slot] || null
    if (typeof instance === 'string') {
      const instanceId = instance
      // patch the item instance
      const data = await this.itemsDb.read(instanceId)
      if (data) {
        await this.itemsDb.update(instanceId, {
          ...data,
          ...value,
          perks: {
            ...(data.perks || {}),
            ...(value.perks || {}),
          },
        })
        return
      }
      // instance not found, fall through to patch the slot
    }
    const previous = typeof instance === 'string' ? null : instance
    // patch data on the gearset
    const record = makeCopy(gearset)
    record.slots = record.slots || {}
    record.slots[slot] = {
      ...(previous || { itemId: null, gearScore: null }),
      ...(value || {}),
      perks: {
        ...(previous?.perks || {}),
        ...(value?.perks || {}),
      },
    }
    await this.update(record.id, record)
  }

  public async updateSlot({
    gearset,
    slot,
    value,
  }: {
    gearset: GearsetRecord
    slot: EquipSlotId
    value: string | Partial<ItemInstance>
  }) {
    if (value == null) {
      // clear slot
      const record = makeCopy(gearset)
      record.slots = record.slots || {}
      delete record.slots[slot]
      this.update(record.id, record)
      return
    }
    if (typeof value === 'string') {
      // set slot to item instance id
      const record = makeCopy(gearset)
      record.slots = record.slots || {}
      record.slots[slot] = value
      this.update(record.id, record)
      return
    }

    // patch data on the gearset
    const record = makeCopy(gearset)
    record.slots = record.slots || {}
    record.slots[slot] = {
      ...(record.slots[slot] || ({} as any)),
      ...value,
    }
    this.update(record.id, record)
  }
}

function makeCopy<T>(it: T) {
  return JSON.parse(JSON.stringify(it)) as T
}
