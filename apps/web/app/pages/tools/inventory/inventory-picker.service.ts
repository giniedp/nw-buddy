import { Injectable, Injector } from '@angular/core'
import {
  EQUIP_SLOTS,
  EquipSlotId,
  EquipSlotItemType,
  getEquipSlotForId,
  getItemPerkIds,
  getItemPerkSlots,
  getPerkBucketPerkIDs,
  isItemArmor,
  isItemArtifact,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkExcludedFromItem,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { ItemClass, ItemDefinitionMaster, Perks, Statuseffect } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { Observable, combineLatest, filter, from, map, switchMap, take } from 'rxjs'
import { ItemInstance, NwDataService } from '~/data'
import { DataViewPicker } from '~/ui/data/data-view'
import { ModalService } from '~/ui/layout'
import { eqCaseInsensitive, matchMapTo } from '~/utils'
import { openHousingItemsPicker } from '~/widgets/data/housing-table'
import { InventoryTableAdapter } from '~/widgets/data/inventory-table'
import { openItemsPicker } from '~/widgets/data/item-table'
import { PerkTableAdapter } from '~/widgets/data/perk-table'
import { StatusEffectTableAdapter } from '~/widgets/data/status-effect-table'

@Injectable({ providedIn: 'root' })
export class InventoryPickerService {
  public constructor(
    private db: NwDataService,
    private modal: ModalService,
    private injector: Injector,
  ) {
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
          injector: this.injector,
          selection: selection,
          title,
          multiple,
          category,
        }),
      })
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
          injector: this.injector,
          selection: selection,

          title,
          multiple,
          categories,
          noSkins,
        }),
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
        result: this.openGemsPickerForSlot(slots),
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
        result: this.openAttributePickerForItems(items),
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
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    category?: string
  }) {
    return (
      this.openInstancePicker({ selection, title, multiple, category })
        // cancelled selection
        .pipe(filter((it) => it !== undefined))
        // unchanged selection
        .pipe(filter((it) => !isEqual(it, selection)))
    )
  }

  public pickPerkForItem(record: ItemInstance, slotKey: string): Observable<Perks> {
    return combineLatest({
      items: this.db.itemsMap,
      perks: this.db.perksMap,
    }).pipe(
      switchMap(({ items, perks }) => {
        const item = items.get(record.itemId)
        const selection = record.perks?.[slotKey]
        const exclusiveLabels: string[] = []
        for (const slot of getItemPerkSlots(item)) {
          const key = slot.bucketKey || slot.perkKey
          if (key === slotKey || key === slotKey) {
            continue
          }
          const perkId = record.perks?.[key] || item[key]
          const perk = perks.get(perkId)
          exclusiveLabels.push(...(perk?.ExclusiveLabels || []))
        }

        return (
          this.openPerksPicker(item, {
            exclusiveLabels,
            selectedPerkid: selection,
            slotKey,
          })
            // cancelled selection
            .pipe(filter((it) => it !== undefined))
            // unchanged selection
            .pipe(filter((it) => !isEqual(it, [selection])))
            .pipe(map((it) => it?.[0]))
            .pipe(map((it: string) => perks.get(it)))
        )
      }),
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
        result: DataViewPicker.open({
          injector: this.injector,
          title: title || 'Pick effect',
          selection: selection,
          displayMode: ['grid'],
          dataView: {
            adapter: StatusEffectTableAdapter,
            filter: predicate,
          },
        }),
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

    return from(
      DataViewPicker.open({
        injector: this.injector,
        title: title || 'Pick from inventory',
        selection: selection,
        // multiselect: !!multiple,
        persistKey: 'inventory-picker-table',
        dataView: {
          adapter: InventoryTableAdapter,
          filter: (it) => it.item?.ItemClass?.some((e) => types.has(e)),
        },
      }),
    )
  }

  private openPerksPicker(
    item: ItemDefinitionMaster,
    options: {
      selectedPerkid: string
      slotKey: string
      exclusiveLabels: string[]
    },
  ) {
    return from(
      DataViewPicker.open({
        injector: this.injector,
        title: 'Choose Perk',
        selection: options.selectedPerkid ? [options.selectedPerkid] : null,
        displayMode: ['grid'],
        dataView: {
          adapter: PerkTableAdapter,
          source: this.getAplicablePerksSource(item, options),
        },
      }),
    )
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

    return from(
      DataViewPicker.open({
        injector: this.injector,
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
      }),
    )
  }

  private openAttributePickerForItems(items: ItemDefinitionMaster[]) {
    return from(
      DataViewPicker.open({
        injector: this.injector,
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
      }),
    )
  }

  public getAplicablePerksSource(
    item: ItemDefinitionMaster,
    {
      slotKey,
      exclusiveLabels,
    }: {
      slotKey: string
      exclusiveLabels: string[]
    },
  ) {
    return combineLatest({
      perks: this.db.perks,
      perksMap: this.db.perksMap,
      bucketsMap: this.db.perkBucketsMap,
    }).pipe(
      map(({ perks, perksMap, bucketsMap }) => {
        const perk = perksMap.get(item[slotKey])
        const perkIsGem = isPerkGem(perk)

        const bucketId = item[slotKey]
        const bucket = bucketsMap.get(bucketId)

        const bucketIsGem = isPerkGem(bucket)
        const bucketPerkIds = getPerkBucketPerkIDs(bucket)
        // const bucketPerks = bucketPerkIds.map((id) => perksMap.get(id))
        const hasGemSlot = getItemPerkIds(item).some((it) => isPerkGem(perksMap.get(it)))

        const isWeapon = isItemWeapon(item)
        const isArmor = isItemArmor(item)
        // const isJewelery = isItemJewelery(item)
        const isArtifact = isItemArtifact(item)

        return perks
          .filter((it) => {
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
            if (isArtifact && !hasGemSlot) {
              // artifacts only have one custom perk slot
              // user may choose either gem or perk (no attribute however)
              return isApplicable && !isPerkInherent(it)
            }

            if (bucketPerkIds.includes(it.PerkID)) {
              // always allow whatever is in the bucket
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
          .map((perk) => {
            return {
              ...perk,
              $excludeError: exclusiveLabels.filter((label) => {
                return perk.ExclusiveLabels?.some((it) => eqCaseInsensitive(it, label))
              }),
            }
          })
      }),
    )
  }
}
