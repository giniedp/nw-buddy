import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'
import { combineLatest, defer, map, Subject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw/nw-db.service'
import { EquipSlot, EQUIP_SLOTS, getItemPerkInfos, getItemRarity, totalGearScore } from '~/nw/utils'

import { GearsetRecord, GearsetsDB } from './gearsets.db'
import { ItemInstance, ItemInstancesDB } from './item-instances.db'

export interface GearsetsState {
  records: GearsetRecord[]
  items: Map<string, ItemDefinitionMaster>
  perks: Map<string, Perks>
  buckets: Map<string, Perkbuckets>
  instances: Map<string, ItemInstance>
}

export interface GearsetRowSlot {
  slot: EquipSlot
  instance: ItemInstance
  item: ItemDefinitionMaster
  rarity: number
}
export interface GearsetRow {
  /**
   * The gearset record in database
   */
  record: GearsetRecord
  /**
   * The total gearscore of this set
   */
  gearScore: number
  /**
   * The total weight of this set
   */
  weight: number
  /**
   *
   */
  slots: Record<string, GearsetRowSlot>
}

@Injectable()
export class GearsetsStore extends ComponentStore<GearsetsState> {
  public readonly records$ = this.select(({ records }) => records)
  public readonly rows$ = this.select(({ records }) => records?.map((it) => this.buildRow(it)))

  public rowCreated$ = defer(() => this.rowCreated)
  public rowUpdated$ = defer(() => this.rowUpdated)
  public rowDestroyed$ = defer(() => this.rowDestroyed)

  private rowCreated = new Subject<GearsetRow>()
  private rowUpdated = new Subject<GearsetRow>()
  private rowDestroyed = new Subject<string>()

  public constructor(private db: GearsetsDB, private itemsDb: ItemInstancesDB, private nwdb: NwDbService) {
    super({
      records: null,
      items: new Map(),
      perks: new Map(),
      buckets: new Map(),
      instances: new Map(),
    })
  }

  public loadAll() {
    this.loadItems(
      combineLatest({
        records: this.db.observeAll(),
        items: this.nwdb.itemsMap,
        perks: this.nwdb.perksMap,
        buckets: this.nwdb.perkBucketsMap,
        instances: this.itemsDb.observeAll().pipe(
          map((items) => {
            const result = new Map<string, ItemInstance>()
            for (const item of items) {
              result.set(item.id, item)
            }
            return result
          })
        ),
      })
    )
  }

  public readonly loadItems = this.updater((state, update: GearsetsState) => {
    return {
      ...state,
      ...update,
    }
  })

  public readonly createRecord = this.effect<{ record: GearsetRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db
          .create(record)
          .then((created) => this.rowCreated.next(this.buildRow(created)))
          .catch(console.error)
      })
    )
  })

  public readonly updateRecord = this.effect<{ record: GearsetRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db
          .update(record.id, record)
          .then((updated) => this.rowUpdated.next(this.buildRow(updated)))
          .catch(console.error)
      })
    )
  })

  public readonly destroyRecord = this.effect<{ recordId: string }>((value$) => {
    return value$.pipe(
      switchMap(async ({ recordId }) => {
        await this.db
          .destroy(recordId)
          .then(() => this.rowDestroyed.next(recordId))
          .catch(console.error)
      })
    )
  })

  public buildRow(record: GearsetRecord): GearsetRow {
    if (!record) {
      return null
    }
    const { items, instances } = this.get()
    const result = {
      record: record,
      gearScore: null,
      weight: null,
      slots: EQUIP_SLOTS.map((slot): GearsetRowSlot => {
        const ref = record.slots?.[slot.id]
        const instance = typeof ref === 'string' ? instances.get(ref) : ref
        const item = instance ? items.get(instance.itemId) : null
        const perkIds = instance ? getItemPerkInfos(item, instance.perks).map((it) => it.perkId) : []
        return {
          slot: slot,
          instance: instance,
          item: item,
          rarity: getItemRarity(item, perkIds),
        }
      }).reduce<Record<string, GearsetRowSlot>>((m, it) => {
        m[it.slot.id] = it
        return m
      }, {}),
    }
    result.gearScore = totalGearScore(Object.values(result.slots).map((it) => ({ id: it.slot.id, gearScore: it.instance?.gearScore || 0 })))
    result.gearScore = Math.round(result.gearScore)
    return result
  }
}
