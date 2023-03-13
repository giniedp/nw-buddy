import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'
import { uniq } from 'lodash'
import { combineLatest, defer, map, Subject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw/nw-db.service'
import { EquipSlot, EQUIP_SLOTS, getItemPerkInfos, getItemRarity, getAverageGearScore } from '~/nw/utils'
import { eqCaseInsensitive, tapDebug } from '~/utils'

import { GearsetRecord, GearsetsDB } from './gearsets.db'
import { ItemInstance, ItemInstancesDB } from './item-instances.db'

export interface GearsetsState {
  records: GearsetRecord[]
  items: Map<string, ItemDefinitionMaster>
  perks: Map<string, Perks>
  buckets: Map<string, Perkbuckets>
  instances: Map<string, ItemInstance>
  selectedTags?: string[]
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
  public readonly recordsTags$ = this.select(this.records$, selectAllTags)

  public readonly selectedTags$ = this.select(({ selectedTags }) => selectedTags || [])
  public readonly selectedRecords$ = this.select(this.records$, this.selectedTags$, selectRecordsHavingTags)

  public readonly rows$ = this.select(({ records }) => records?.map((it) => this.buildRow(it)))
  public readonly selectedRows$ = this.select(this.selectedRecords$, (records) =>
    records?.map((it) => this.buildRow(it))
  )

  public readonly tags$ = this.select(this.recordsTags$, this.selectedTags$, selectTags)

  public rowCreated$ = defer(() => this.rowCreated)
  public rowUpdated$ = defer(() => this.rowUpdated)
  public rowDestroyed$ = defer(() => this.rowDestroyed)

  private rowCreated = new Subject<GearsetRow>()
  private rowUpdated = new Subject<GearsetRow>()
  private rowDestroyed = new Subject<string>()

  public constructor(private setsDB: GearsetsDB, private itemsDB: ItemInstancesDB, private nwDB: NwDbService) {
    super({
      records: [],
      items: new Map(),
      perks: new Map(),
      buckets: new Map(),
      instances: new Map(),
      selectedTags: [],
    })
  }

  public loadAll() {
    this.loadItems(
      combineLatest({
        records: this.setsDB.observeAll(),
        items: this.nwDB.itemsMap,
        perks: this.nwDB.perksMap,
        buckets: this.nwDB.perkBucketsMap,
        instances: this.itemsDB.observeAll().pipe(
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

  public async createRecord(record: GearsetRecord) {
    return await this.setsDB
      .create(record)
      .then((created) => {
        this.rowCreated.next(this.buildRow(created))
        return created
      })
      .catch(console.error)
  }

  public readonly updateRecord = this.effect<{ record: GearsetRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.setsDB
          .update(record.id, record)
          .then((updated) => this.rowUpdated.next(this.buildRow(updated)))
          .catch(console.error)
      })
    )
  })

  public readonly destroyRecord = this.effect<{ recordId: string }>((value$) => {
    return value$.pipe(
      switchMap(async ({ recordId }) => {
        await this.setsDB
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
    result.gearScore = getAverageGearScore(
      Object.values(result.slots).map((it) => ({ id: it.slot.id, gearScore: it.instance?.gearScore || 0 }))
    )
    result.gearScore = Math.round(result.gearScore)
    return result
  }

  public toggleTag(value: string) {
    const tags = [...(this.get().selectedTags || [])]
    const index = tags.findIndex((tag) => eqCaseInsensitive(tag, value))
    if (index >= 0) {
      tags.splice(index, 1)
    } else {
      tags.push(value)
    }
    this.patchState({ selectedTags: tags })
  }
}

function selectAllTags(records: GearsetRecord[]) {
  return uniq((records || []).map((it) => it.tags || []).flat())
}

function selectRecordsHavingTags(records: GearsetRecord[], selectedTags: string[]) {
  console.log('selectRecordsHavingTags', records, selectedTags)
  if (!selectedTags?.length) {
    return records
  }
  return (
    records?.filter(({ tags }) => {
      if (!tags?.length) {
        return false
      }
      return tags.some((tag) => {
        return tag && selectedTags.some((it) => eqCaseInsensitive(tag, it))
      })
    }) || []
  )
}

function selectTags(tags: string[], selectedTags: string[]) {
  return (tags || []).sort().map((tag) => {
    return {
      tag: tag,
      active: selectedTags?.some((it) => eqCaseInsensitive(it, tag)),
    }
  })
}
