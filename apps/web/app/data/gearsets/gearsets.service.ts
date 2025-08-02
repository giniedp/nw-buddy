import { computed, inject, Injectable, resource, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId, getItemPerkInfos, ItemPerkInfo, PerkBucket } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { combineLatest, distinctUntilChanged, map, NEVER, Observable, of, switchMap, tap } from 'rxjs'
import { combineLatestOrEmpty } from '~/utils'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { ItemInstance, ItemsService } from '../items'
import { injectNwData } from '../nw-data'
import { tableIndexBy } from '../nw-data/dsl'
import { injectGearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'
import { GearsetRow, selectGearsetRow } from './utils'

export interface TagSpec {
  value: string
  icon: string
  color: string
}

export const GEARSET_TAGS = [
  { value: 'PvP', icon: '', color: 'primary' },
  { value: 'PvE', icon: '', color: 'success' },
  { value: 'Tradeskill', icon: '', color: 'secondary' },
  { value: 'Heal', icon: '', color: 'success' },
  { value: 'Tank', icon: '', color: 'info' },
  { value: 'Damage', icon: '', color: 'error' },
]

@Injectable({ providedIn: 'root' })
export class GearsetsService {
  public readonly table = injectGearsetsDB()
  private nwdata = injectNwData()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private itemsDb = inject(ItemsService)
  private ready = signal(false)
  private ready$ = toObservable(this.ready)

  private tagsResource = resource({
    loader: async () => {
      const seasonIds = await this.nwdata.seasonIds(null).catch((): string[] => [])
      return [
        ...GEARSET_TAGS,
        ...seasonIds
          .map((value): TagSpec => {
            return { value, icon: '', color: 'secondary' }
          })
          .reverse(),
      ]
    },
  })

  public tags = computed(() => {
    if (this.tagsResource.hasValue()) {
      return this.tagsResource.value()
    }
    return []
  })

  public constructor() {
    this.sync()
  }

  public sync = rxMethod<void>((source) => {
    return source.pipe(
      switchMap(() =>
        autoSync({
          userId: this.userId$,
          online: this.online$,
          local: this.table,
          remote: this.backend.privateTables.gearsets,
        }),
      ),
      tap((stage) => {
        this.ready.set(stage === 'offline' || stage === 'syncing')
      }),
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
    if (userId === 'local' || !userId) {
      return this.table.observeWhere({ userId: 'local' })
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
        return of<GearsetRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }): Observable<GearsetRecord> {
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
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
      ipnsKey: null,
      ipnsName: null,
      syncState: 'pending',
      status: 'private',
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
    return this.table.delete(id)
  }

  public async deleteUserData(userId: string) {
    const records = await this.table.where({ userId })
    return this.table.delete(records.map((it) => it.id))
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

  public resolveGearsetSlotItems(record: GearsetRecord) {
    return resolveGearsetSlotItems(record, this.itemsDb, this.nwdata)
  }
}

function makeCopy<T>(it: T) {
  return JSON.parse(JSON.stringify(it)) as T
}

function decodeSlot(slot: string | ItemInstance) {
  const instanceId = typeof slot === 'string' ? slot : null
  const instance = typeof slot !== 'string' ? slot : null
  return {
    instanceId,
    instance,
  }
}

function resolveSlotItemInstance(
  userId: string,
  slot: string | ItemInstance,
  itemDB: ItemsService,
): Observable<ItemInstance> {
  const { instance, instanceId } = decodeSlot(slot)
  return instanceId ? itemDB.observeRecord({ userId, id: instanceId }) : of(instance)
}

function resolveGearsetSlotInstances(record: GearsetRecord, itemDB: ItemsService) {
  return combineLatestOrEmpty(
    Object.entries(record.slots).map(([slot, instance]) => {
      return combineLatest({
        slot: of(slot as EquipSlotId),
        instanceId: of(typeof instance === 'string' ? instance : null),
        instance: resolveSlotItemInstance(record.userId, instance, itemDB),
      })
    }),
  )
}

export interface ResolvedGersetSlotItem {
  slot: EquipSlotId
  instance: ItemInstance
  item: MasterItemDefinitions
  perks: ResolvedItemPerkInfo[]
}
export interface ResolvedItemPerkInfo extends ItemPerkInfo {
  bucket: PerkBucket
  perk: PerkData
}
function resolveGearsetSlotItems(record: GearsetRecord, itemDB: ItemsService, db: NwData) {
  return combineLatest({
    slots: resolveGearsetSlotInstances(record, itemDB),
    items: db.itemsByIdMap(),
    perks: db.perksByIdMap(),
    buckets: db.perkBucketsByIdMap(),
  }).pipe(
    map(({ slots, items, perks, buckets }): ResolvedGersetSlotItem[] => {
      return slots.map(({ slot, instance }): ResolvedGersetSlotItem => {
        const item = items.get(instance?.itemId)
        return {
          slot,
          instance,
          item,
          perks: getItemPerkInfos(item, instance.perks).map((it): ResolvedItemPerkInfo => {
            return {
              ...it,
              bucket: buckets.get(it.bucketId),
              perk: perks.get(it.perkId),
            }
          }),
        }
      })
    }),
  )
}
