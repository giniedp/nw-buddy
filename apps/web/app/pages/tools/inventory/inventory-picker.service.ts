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
  getItemPerkIds,
  getItemPerkSlots,
  getPerkBucketPerkIDs,
  isItemArmor,
  isItemArtifact,
  isItemJewelery,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkExcludedFromItem,
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
    categories,
    noSkins,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    categories?: string[]
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
          categories,
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
        const selection = record.perks?.[perkSlot]

        return (
          this.openPerksPicker(item, selection, perkSlot)
            .closed.pipe(take(1))
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, [selection])))
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
        result: DataViewPicker.open(this.dialog, {
          title: title || 'Pick effect',
          selection: selection,
          displayMode: ['grid'],
          dataView: {
            adapter: StatusEffectTableAdapter,
            filter: predicate,
          },
          config: {
            maxWidth: 1400,
            maxHeight: 1200,
            panelClass: ['w-full', 'h-full', 'p-4'],
            injector: this.injector,
          },
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

  private openPerksPicker(item: ItemDefinitionMaster, selectedPerkId: string, slotKey: string) {
    return DataViewPicker.open(this.dialog, {
      title: 'Choose Perk',
      selection: selectedPerkId ? [selectedPerkId] : null,
      displayMode: ['grid'],
      dataView: {
        adapter: PerkTableAdapter,
        source: this.getAplicablePerks(item, slotKey),
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
      displayMode: ['grid'],
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
    return DataViewPicker.open(this.dialog, {
      title: 'Pick Attribute Mod',
      displayMode: ['grid'],
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

  public getAplicablePerks(item: ItemDefinitionMaster, slotKey: string) {
    return combineLatest({
      perks: this.db.perks,
      perksMap: this.db.perksMap,
      bucketsMap: this.db.perkBucketsMap
    }).pipe(
      map(({ perks, perksMap, bucketsMap }) => {

        const perk = perksMap.get(item[slotKey])
        const perkIsGem = isPerkGem(perk)

        const bucketId = item[slotKey]
        const bucket = bucketsMap.get(bucketId)

        const bucketIsGem = isPerkGem(bucket)
        const perkIds = getPerkBucketPerkIDs(bucket)
        const bucketPerks = perkIds.map((id) => perksMap.get(id))

        const isWeapon = isItemWeapon(item)
        const isArmor = isItemArmor(item)
        const isJewelery = isItemJewelery(item)
        const isArtifact = isItemArtifact(item)

        const canHaveGem = isArtifact || bucketPerks.some(isPerkGem) || isPerkGem(perksMap.get(bucketId))

        return perks.filter((it) => {
          if (isPerkExcludedFromItem(it, item)) {
            return false
          }

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
}
