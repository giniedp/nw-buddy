import { Dialog } from '@angular/cdk/dialog'
import { Injectable, Injector } from '@angular/core'
import { ItemDefinitionMaster, Perkbuckets, Perks, Statuseffect } from '@nw-data/types'
import { isEqual } from 'lodash'
import { combineLatest, filter, map, Observable, switchMap, take } from 'rxjs'
import { ItemInstance, ItemInstancesStore } from '~/data'
import { NwDbService } from '~/nw'
import {
  collectPerkbucketPerkIds,
  EQUIP_SLOTS,
  isItemArmor,
  isItemJewelery,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkGem,
} from '~/nw/utils'
import { DataTablePickerDialog } from '~/ui/data-table'
import { HousingTableAdapter, ItemsTableAdapter, PerksTableAdapter, StatusEffectsTableAdapter } from '~/widgets/adapter'
import { PlayerItemsTableAdapter } from './inventory-table.adapter'

@Injectable({ providedIn: 'root' })
export class InventoryPickerService {
  public constructor(private db: NwDbService, private dialog: Dialog, private injector: Injector) {
    //
  }

  public pickHousingItem({
    title,
    itemId,
    multiple,
    category,
  }: {
    title?: string
    itemId?: string[]
    multiple?: boolean
    category?: string
  }) {
    return this.db.housingItemsMap.pipe(
      switchMap((items) => {
        return (
          this.openHousingItemsPicker({ selection: itemId, title, multiple, category })
            .closed.pipe(take(1))
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, itemId)))
            .pipe(
              map((it: string[]) => {
                return it.map((id) => items.get(id))
              })
            )
        )
      })
    )
  }

  public pickItem({
    title,
    itemId,
    multiple,
    category,
  }: {
    title?: string
    itemId?: string[]
    multiple?: boolean
    category?: string
  }) {
    return this.db.itemsMap.pipe(
      switchMap((items) => {
        return (
          this.openItemsPicker({ selection: itemId, title, multiple, category })
            .closed.pipe(take(1))
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, itemId)))
            .pipe(
              map((it: string[]) => {
                return it.map((id) => items.get(id))
              })
            )
        )
      })
    )
  }

  public pickInstance({
    title,
    selection,
    multiple,
    category,
    store,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
    store: ItemInstancesStore
  }) {
    return (
      this.openInstancePicker({ selection, title, multiple, category, store })
        .closed.pipe(take(1))
        // cancelled selection
        .pipe(filter((it) => it !== undefined))
        // unchanged selection
        .pipe(filter((it) => !isEqual(it, selection)))
    )
  }

  public choosePerk(record: ItemInstance, perkSlot: string): Observable<Perks> {
    return combineLatest({
      items: this.db.itemsMap,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
    }).pipe(
      switchMap(({ items, perks, buckets }) => {
        const item = items.get(record.itemId)
        const perkId: string = record.perks?.[perkSlot] || item?.[perkSlot]
        const perkOrBucket = perks.get(perkId) || buckets.get(perkId)
        return (
          this.openPerksPicker(item, perkOrBucket)
            .closed.pipe(take(1))
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, [perkId])))
            .pipe(map((it) => it?.[0]))
            .pipe(map((it: string) => perks.get(it)))
        )
      })
    )
  }

  public pickEffect({
    title,
    selection,
    multiple,
    predicate,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    predicate?: (item: Statuseffect) => boolean
  }) {
    return this.db.statusEffectsMap.pipe(
      switchMap((items) => {
        return (
          this.openEffectsPicker({ selection, title, multiple, predicate })
            .closed.pipe(take(1))
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, selection)))
            .pipe(
              map((it: string[]) => {
                return it.map((id) => items.get(id))
              })
            )
        )
      })
    )
  }

  protected openInstancePicker({
    title,
    selection,
    multiple,
    category,
    store,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
    store: ItemInstancesStore
  }) {
    let types: Set<string>
    if (category) {
      types = new Set([category])
    } else {
      types = new Set<string>(EQUIP_SLOTS.map((it) => it.itemType))
    }

    return DataTablePickerDialog.open(this.dialog, {
      title: title || 'Pick from inventory',
      selection: selection,
      multiselect: !!multiple,
      adapter: PlayerItemsTableAdapter.provider({
        source: store.rows$.pipe(map((items) => items.filter((it) => it.item?.ItemClass?.some((e) => types.has(e))))),
        persistStateId: 'inventory-picker-table',
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'layout-pad', 'shadow'],
        injector: this.injector,
      },
    })
  }

  protected openItemsPicker({
    title,
    selection,
    multiple,
    category,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
  }) {
    let types: Set<string>
    if (category) {
      types = new Set([category])
    } else {
      types = new Set<string>(EQUIP_SLOTS.map((it) => it.itemType))
    }

    return DataTablePickerDialog.open(this.dialog, {
      title: title || 'Pick item',
      selection: selection,
      multiselect: !!multiple,
      adapter: ItemsTableAdapter.provider({
        source: this.db.items.pipe(map((items) => items.filter((it) => it.ItemClass?.some((e) => types.has(e))))),
        hideUserData: true,
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  protected openHousingItemsPicker({
    title,
    selection,
    multiple,
    category,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
  }) {
    let types: Set<string>
    if (category) {
      types = new Set([category])
    } else {
      types = null
    }
    console.log('openHousingItemsPicker', { title, selection, multiple, category })
    return DataTablePickerDialog.open(this.dialog, {
      title: title || 'Pick item',
      selection: selection,
      multiselect: !!multiple,
      adapter: HousingTableAdapter.provider({
        source: this.db.housingItems.pipe(
          map((items) => {
            if (!types) {
              return items
            }
            return items.filter((it) => types.has(it.UIHousingCategory))
          })
        ),
        hideUserData: true,
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  private openPerksPicker(item: ItemDefinitionMaster, perkOrBucket: Perks | Perkbuckets) {
    return DataTablePickerDialog.open(this.dialog, {
      title: 'Choose Perk',
      selection: ('PerkID' in perkOrBucket ? perkOrBucket : null)?.PerkID,
      adapter: PerksTableAdapter.provider({
        source: this.getAplicablePerks(item, perkOrBucket),
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  public getAplicablePerks(item: ItemDefinitionMaster, perkOrBucket: Perks | Perkbuckets) {
    return combineLatest({
      perks: this.db.perks,
      buckets: this.db.perkBucketsMap,
    }).pipe(
      map(({ perks, buckets }) => {
        const isWeapon = isItemWeapon(item)
        const isArmor = isItemArmor(item) || isItemJewelery(item)

        const bucket = 'PerkBucketID' in perkOrBucket ? perkOrBucket : null
        const bucketIsGem = isPerkGem(bucket)
        const perk = 'PerkID' in perkOrBucket ? perkOrBucket : null
        const perkIsGem = isPerkGem(perk)
        const perkIds = collectPerkbucketPerkIds(bucket, buckets)

        return perks.filter((it) => {
          let isApplicable = isPerkApplicableToItem(it, item)
          if (isArmor && !isApplicable) {
            isApplicable = it.ItemClass?.includes('Armor')
          }
          if (isWeapon && !isApplicable) {
            isApplicable = it.ItemClass?.includes('EquippableMainHand') || it.ItemClass?.includes('EquippableTwoHand')
          }
          if (!isApplicable) {
            return false
          }

          if (perkIds.has(it.PerkID)) {
            return true
          }
          if (bucketIsGem) {
            return bucket.PerkType === it.PerkType
          }
          if (perkIsGem) {
            return perk.PerkType === it.PerkType
          }
          if (bucket) {
            return bucket.PerkType === it.PerkType
          }
          if (perk) {
            return perk.PerkType === it.PerkType
          }
          return false
        })
      })
    )
  }

  protected openEffectsPicker({
    title,
    selection,
    multiple,
    predicate,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    predicate?: (item: Statuseffect) => boolean
  }) {
    let types: Set<string>

    return DataTablePickerDialog.open(this.dialog, {
      title: title || 'Pick effect',
      selection: selection,
      multiselect: !!multiple,
      adapter: StatusEffectsTableAdapter.provider({
        source: this.db.statusEffects.pipe(map((items) => items.filter(predicate || (() => true)))),
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }
}
