import { Dialog } from '@angular/cdk/dialog'
import { Injectable, Injector } from '@angular/core'
import {
  EQUIP_SLOTS,
  EquipSlot,
  EquipSlotId,
  EquipSlotItemType,
  PerkBucket,
  getEquipSlotForId,
  getItemClassForSlot,
  getPerkBucketPerkIDs,
  isItemArmor,
  isItemJewelery,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { ItemClass, ItemDefinitionMaster, Perks, Statuseffect } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { Observable, combineLatest, filter, map, of, switchMap, take } from 'rxjs'
import { ItemInstance, ItemInstancesStore } from '~/data'
import { NwDbService } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { matchMapTo, tapDebug } from '~/utils'
import { openHousingItemsPicker } from '~/widgets/data/housing-table'
import { InventoryTableAdapter } from '~/widgets/data/inventory-table'
import { openItemsPicker } from '~/widgets/data/item-table'
import { PerkTableAdapter } from '~/widgets/data/perk-table'
import { StatusEffectTableAdapter } from '~/widgets/data/status-effect-table'

@Injectable({ providedIn: 'root' })
export class InventoryPickerService {
  public constructor(private db: NwDbService, private dialog: Dialog, private injector: Injector) {
    //
  }

  public pickHousingItem({
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
    return (
      combineLatest({
        data: this.db.housingItemsMap,
        result: openHousingItemsPicker({
          db: this.db,
          dialog: this.dialog,
          injector: this.injector,
          selection: selection,
          title,
          multiple,
          category,
        }).closed,
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        // unchanged selection
        .pipe(filter(({ result }) => !isEqual(result, selection)))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
    )
  }

  public pickItem({
    title,
    selection,
    multiple,
    category,
    noSkins,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
    noSkins?: boolean
  }) {
    return (
      combineLatest({
        data: this.db.itemsMap,
        result: openItemsPicker({
          db: this.db,
          dialog: this.dialog,
          injector: this.injector,
          selection: selection,
          title,
          multiple,
          category,
          noSkins,
        }).closed,
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        // unchanged selection
        .pipe(filter(({ result }) => !isEqual(result, selection)))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
    )
  }

  public pickGemForSlot({ slots }: { slots: EquipSlotId[] }) {
    return (
      combineLatest({
        data: this.db.perksMap,
        result: this.openGemsPickerForSlot(slots).closed,
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
    )
  }

  public pickAttributeForItems({ items }: { items: ItemDefinitionMaster[] }) {
    return (
      combineLatest({
        data: this.db.perksMap,
        result: this.openAttributePickerForItems(items).closed,
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
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

  public pickPerkForItem(record: ItemInstance, perkSlot: string): Observable<Perks> {
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
    return (
      combineLatest({
        data: this.db.statusEffectsMap,
        result: this.openEffectsPicker({ selection, title, multiple, predicate }).closed,
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        // unchanged selection
        .pipe(filter(({ result }) => !isEqual(result, selection)))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
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

    return DataViewPicker.open(this.dialog, {
      title: title || 'Pick from inventory',
      selection: selection,
      // multiselect: !!multiple,
      persistKey: 'inventory-picker-table',
      dataView: {
        adapter: InventoryTableAdapter,
        source: store.rows$.pipe(map((items) => items.filter((it) => it.item?.ItemClass?.some((e) => types.has(e))))),
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'layout-pad', 'shadow'],
        injector: this.injector,
      },
    })
  }

  private openPerksPicker(item: ItemDefinitionMaster, perkOrBucket: Perks | PerkBucket) {
    return DataViewPicker.open(this.dialog, {
      title: 'Choose Perk',
      selection: [('PerkID' in perkOrBucket ? perkOrBucket : null)?.PerkID].filter((it) => !!it),
      displayMode: 'grid',
      dataView: {
        adapter: PerkTableAdapter,
        source: this.getAplicablePerks(item, perkOrBucket),
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  private openGemsPickerForSlot(slots: EquipSlotId[]) {
    const itemGroups = slots.map((slot) => {
      return matchMapTo<EquipSlotItemType, ItemClass[]>(getEquipSlotForId(slot).itemType, {
        EquippableChest: ['Armor', 'EquippableChest'],
        EquippableFeet: ['Armor', 'EquippableFeet'],
        EquippableHands: ['Armor', 'EquippableHands'],
        EquippableHead: ['Armor', 'EquippableHead'],
        EquippableLegs: ['Armor', 'EquippableLegs'],
        EquippableAmulet: ['EquippableAmulet'],
        EquippableRing: ['EquippableRing'],
        EquippableToken: ['EquippableToken'],
        Weapon: ['EquippableMainHand'],
      })
    })

    return DataViewPicker.open(this.dialog, {
      title: 'Pick Gem',
      displayMode: 'grid',
      dataView: {
        adapter: PerkTableAdapter,
        filter: (perk) => {
          if (!itemGroups?.length) {
            return false
          }
          if (!isPerkGem(perk)) {
            return false
          }
          if (!perk.ItemClass?.length) {
            return false
          }
          return itemGroups.every((group) => {
            return !!group?.length && perk.ItemClass?.some((cls) => group.includes(cls))
          })
        },
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  private openAttributePickerForItems(items: ItemDefinitionMaster[]) {
    console.log(items)
    return DataViewPicker.open(this.dialog, {
      title: 'Pick Attribute Mod',
      displayMode: 'grid',
      dataView: {
        adapter: PerkTableAdapter,
        filter: (perk) => {
          if (!isPerkInherent(perk)) {
            return false
          }
          return items.every((item) => {
            let isApplicable = isPerkApplicableToItem(perk, item)
            if (!isApplicable && isItemArmor(item)) {
              isApplicable = perk.ItemClass?.includes('Armor')
            }
            if (!isApplicable && isItemWeapon(item)) {
              isApplicable =
                perk.ItemClass?.includes('EquippableMainHand') || perk.ItemClass?.includes('EquippableTwoHand')
            }
            return isApplicable
          })
        },
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }

  public getAplicablePerks(item: ItemDefinitionMaster, perkOrBucket: Perks | PerkBucket) {
    return this.db.perks.pipe(
      map((perks) => {
        const isWeapon = isItemWeapon(item)
        const isArmor = isItemArmor(item) || isItemJewelery(item)

        const bucket = 'PerkBucketID' in perkOrBucket ? perkOrBucket : null
        const bucketIsGem = isPerkGem(bucket)
        const perk = 'PerkID' in perkOrBucket ? perkOrBucket : null
        const perkIsGem = isPerkGem(perk)
        const perkIds = getPerkBucketPerkIDs(bucket)

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

          if (perkIds.includes(it.PerkID)) {
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
    return DataViewPicker.open(this.dialog, {
      title: title || 'Pick effect',
      selection: selection,
      dataView: {
        adapter: StatusEffectTableAdapter,
        source: this.db.statusEffects.pipe(map((items) => items.filter(predicate || (() => true)))),
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
  }
}
