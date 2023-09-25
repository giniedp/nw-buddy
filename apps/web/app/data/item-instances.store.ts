import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Affixstats, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { combineLatest, defer, Subject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw/nw-db.service'

import { getItemPerkInfos, getItemRarity, getPerkTypeWeight, ItemRarity, PerkBucket } from '@nw-data/common'
import { ItemInstanceRecord, ItemInstancesDB } from './item-instances.db'

export interface ItemInstancesState {
  records: ItemInstanceRecord[]
  items: Map<string, ItemDefinitionMaster>
  perks: Map<string, Perks>
  affixes: Map<string, Affixstats>
  buckets: Map<string, PerkBucket>
}

export interface ItemInstanceRow {
  /**
   * The player item stored in database
   */
  record: ItemInstanceRecord
  /**
   * The game item referenced by the record
   */
  item: ItemDefinitionMaster
  /**
   * The game perks referenced by the record
   */
  perks?: Array<{ key: string; perk?: Perks; affix?: Affixstats; bucket?: PerkBucket }>
  /**
   * The items current rarity
   */
  rarity?: ItemRarity
}

@Injectable()
export class ItemInstancesStore extends ComponentStore<ItemInstancesState> {
  public readonly records$ = this.select(({ records }) => records)
  public readonly rows$ = this.select(({ records }) => records?.map((it) => this.buildRow(it)))

  public rowCreated$ = defer(() => this.rowCreated)
  public rowUpdated$ = defer(() => this.rowUpdated)
  public rowDestroyed$ = defer(() => this.rowDestroyed)

  private rowCreated = new Subject<ItemInstanceRow>()
  private rowUpdated = new Subject<ItemInstanceRow>()
  private rowDestroyed = new Subject<string>()

  public constructor(public readonly db: ItemInstancesDB, private nwdb: NwDbService) {
    super({ records: null, items: null, perks: null, affixes: null, buckets: null })
  }

  public loadAll() {
    this.loadItems(
      combineLatest({
        records: this.db.observeAll(),
        items: this.nwdb.itemsMap,
        perks: this.nwdb.perksMap,
        affixes: this.nwdb.affixStatsMap,
        buckets: this.nwdb.perkBucketsMap,
      })
    )
  }

  public readonly loadItems = this.updater((state, update: ItemInstancesState) => {
    return {
      ...state,
      ...update,
    }
  })

  public readonly createRecord = this.effect<{ record: ItemInstanceRecord }>((value$) => {
    return value$.pipe(
      switchMap(async ({ record }) => {
        await this.db
          .create(record)
          .then((created) => this.rowCreated.next(this.buildRow(created)))
          .catch(console.error)
      })
    )
  })

  public readonly updateRecord = this.effect<{ record: ItemInstanceRecord }>((value$) => {
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

  public buildRow(record: ItemInstanceRecord): ItemInstanceRow {
    if (!record) {
      return null
    }
    const { items, perks, buckets, affixes } = this.get()
    const item = items.get(record.itemId)
    const perkInfos = getItemPerkInfos(item, record.perks)
    const itemPerks = perkInfos.map((it) => {
      const perk = perks.get(it.perkId)
      const affix = affixes.get(perk?.Affix)
      const bucket = buckets.get(it.bucketId)
      return {
        key: it.key,
        perk: perk,
        affix: affix,
        bucket: bucket,
        type: (perk || bucket)?.PerkType,
      }
    })
    return {
      record: record,
      item: item,
      perks: sortBy(itemPerks, (it) => getPerkTypeWeight(it.type)),
      rarity: getItemRarity(
        item,
        itemPerks.map((it) => it.perk?.PerkID).filter((it) => !!it)
      ),
    }
  }
}
