import { computed, effect, inject, signal } from '@angular/core'
import { signalStoreFeature, type, withComputed } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  EquipSlot,
  EquipSlotId,
  getEquipSlotForId,
  getItemPerkInfos,
  getItemRarity,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, map, of, pipe, switchMap } from 'rxjs'
import { ItemInstance, ItemInstancesDB } from '../items'
import { NwDataService } from '../nw-data'
import { GearsetRecord } from './types'
import { resolveGearsetSlot } from './utils'

export interface WithGearsetSlotState {
  gearset: GearsetRecord
  slotId: EquipSlotId
}
export function withGearsetSlot() {
  return signalStoreFeature(
    {
      state: type<WithGearsetSlotState>(),
    },
    withComputed((state) => {
      const db = inject(ItemInstancesDB)
      const data = inject(NwDataService)

      const instanceId = signal<string>(null)
      const instance = signal<ItemInstance>(null)
      const item = signal<ItemDefinitionMaster | Housingitems>(null)

      const connect = rxMethod<WithGearsetSlotState>(
        pipe(
          switchMap(({ gearset, slotId }) => {
            return resolveGearsetSlot(db, slotId, gearset?.slots?.[slotId])
          }),
          switchMap(({ instance, instanceId }) => {
            return combineLatest({
              instanceId: of(instanceId),
              instance: of(instance),
              item: data.itemOrHousingItem(instance?.itemId),
            })
          }),
          map((res) => {
            instanceId.set(res.instanceId)
            instance.set(res.instance)
            item.set(res.item)
          }),
        ),
      )
      connect(computed(() => {
        return {
          gearset: state.gearset(),
          slotId: state.slotId(),
        }
      }))

      return {
        instanceId: computed(() => instanceId()),
        instance: computed(() => instance()),
        item: computed(() => item()),
      }
    }),
    withComputed(({ item, instance, instanceId, slotId }) => {
      const slot = computed(() => getEquipSlotForId(slotId()))
      return {
        slot,
        hasItem: computed(() => !!item()),
        isNamed: computed(() => isNamed(item())),
        isArtifact: computed(() => isArtifact(item())),
        isLinked: computed(() => !!instanceId()),

        isRune: computed(() => slotId() === 'heartgem'),
        isConsumable: computed(() => isConsumable(slot())),
        isTrophy: computed(() => isTrophy(slot())),
        isAmmo: computed(() => isAmmo(slot())),

        isArmor: computed(() => isArmor(slot())),
        isWeapon: computed(() => isWeapon(slot())),
        isJewelry: computed(() => isJewelry(slot())),

        rarity: computed(() => {
          const it = item()
          if (!it || !isMasterItem(it)) {
            return getItemRarity(it)
          }
          const perks = getItemPerkInfos(it, instance()?.perks)
          const perkIds = perks.map((it) => it.perkId).filter((it) => !!it)
          return getItemRarity(it, perkIds)
        }),
      }
    }),
  )
}

function isNamed(item: ItemDefinitionMaster | Housingitems) {
  return isMasterItem(item) && isItemNamed(item)
}

function isArtifact(item: ItemDefinitionMaster | Housingitems) {
  return isMasterItem(item) && isItemArtifact(item)
}

function isConsumable(slot: EquipSlot) {
  return slot?.itemType === 'Consumable'
}

function isTrophy(slot: EquipSlot) {
  return slot?.itemType === 'Trophies'
}

function isAmmo(slot: EquipSlot) {
  return slot?.itemType === 'Ammo'
}

function isArmor(slot: EquipSlot) {
  const itemType = slot?.itemType
  return (
    itemType === 'EquippableChest' ||
    itemType === 'EquippableFeet' ||
    itemType === 'EquippableHands' ||
    itemType === 'EquippableHead' ||
    itemType === 'EquippableLegs'
  )
}

function isJewelry(slot: EquipSlot) {
  const itemType = slot?.itemType
  return itemType === 'EquippableToken' || itemType === 'EquippableRing' || itemType === 'EquippableAmulet'
}

function isWeapon(slot: EquipSlot) {
  const itemType = slot?.itemType
  return itemType === 'Weapon' || itemType === 'Shield'
}
