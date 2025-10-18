import { inject, Injectable, Injector } from '@angular/core'
import {
  EQUIP_SLOTS,
  EquipSlotId,
  EquipSlotItemType,
  getEquipSlotForId,
  isItemArmor,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkGem,
  isPerkInherent,
} from '@nw-data/common'
import { ItemClass, MasterItemDefinitions, PerkData, StatusEffectData } from '@nw-data/generated'
import { isEqual } from 'lodash'
import { combineLatest, filter, from, map, Observable, take } from 'rxjs'
import { injectNwData, ItemInstance } from '~/data'
import { DataViewPicker } from '~/ui/data/data-view'
import { ModalService } from '~/ui/layout'
import { matchMapTo } from '~/utils'
import { openHousingItemsPicker } from '~/widgets/data/housing-table'
import { InventoryTableAdapter } from '~/widgets/data/inventory-table'
import { openItemsPicker } from '~/widgets/data/item-table'
import { PerkTableAdapter, pickPerkForItem } from '~/widgets/data/perk-table'
import { StatusEffectTableAdapter } from '~/widgets/data/status-effect-table'

@Injectable({ providedIn: 'root' })
export class InventoryPickerService {
  private db = injectNwData()
  private modal = inject(ModalService)
  private injector = inject(Injector)

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
        data: this.db.housingItemsByIdMap(),
        result: openHousingItemsPicker({
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
    categories2,
    categoriesOp,
    noSkins,
  }: {
    title?: string
    selection?: string[]
    multiple?: boolean
    categories?: ItemClass[]
    categories2?: ItemClass[]
    categoriesOp?: 'all' | 'any'
    noSkins?: boolean
  }) {
    return (
      combineLatest({
        data: this.db.itemsByIdMap(),
        result: openItemsPicker({
          injector: this.injector,
          selection: selection,

          title,
          multiple,
          categories,
          categories2,
          categoriesOp,
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
        data: this.db.perksByIdMap(),
        result: this.openGemsPickerForSlot(slots),
      })
        .pipe(take(1))
        // cancelled selection
        .pipe(filter(({ result }) => result !== undefined))
        .pipe(map(({ data, result }) => result.map((id: string) => data.get(id))))
    )
  }

  public pickAttributeForItems({ items }: { items: MasterItemDefinitions[] }) {
    return (
      combineLatest({
        data: this.db.perksByIdMap(),
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

  public pickPerkForItem(record: ItemInstance, slotKey: string): Observable<PerkData> {
    return pickPerkForItem({
      injector: this.injector,
      record,
      slotKey,
    })
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
    predicate?: (item: StatusEffectData) => boolean
  }) {
    return (
      combineLatest({
        data: this.db.statusEffectsByIdMap(),
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

  private openAttributePickerForItems(items: MasterItemDefinitions[]) {
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
}
