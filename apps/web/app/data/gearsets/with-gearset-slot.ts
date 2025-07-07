import { computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { signalStoreFeature, type, withComputed } from '@ngrx/signals'
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
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { catchError, combineLatest, map, of, switchMap } from 'rxjs'
import { ItemsService } from '../items'
import { injectNwData } from '../nw-data'
import { GearsetRecord } from './types'

export interface WithGearsetSlotState {
  gearset: GearsetRecord
  slotId: EquipSlotId
}
export function withGearsetSlot() {
  return signalStoreFeature(
    {
      state: type<WithGearsetSlotState>(),
    },
    withComputed(({ gearset, slotId }) => {
      const items = inject(ItemsService)
      const data = injectNwData()

      const resource$ = combineLatest({
        gearset: toObservable(gearset),
        slotId: toObservable(slotId),
      }).pipe(
        map(({ gearset, slotId }) => {
          return {
            slotId,
            instance: gearset?.slots?.[slotId],
            userId: gearset?.userId,
          }
        }),
        switchMap(({ slotId, instance, userId }) => {
          return items.resolveGearsetSlot({ slotId, instance, userId }).pipe(
            switchMap(({ instance, instanceId }) => {
              return combineLatest({
                instanceId: of(instanceId),
                instance: of(instance),
                item: data.itemOrHousingItem(instance?.itemId),
              })
            }),
          )
        }),
        catchError((err) => {
          console.error(err)
          return of({
            instanceId: null,
            instance: null,
            item: null,
          })
        }),
      )
      const resource = toSignal(resource$, {
        initialValue: {
          instanceId: null,
          instance: null,
          item: null,
        },
      })

      return {
        instanceId: computed(() => resource()?.instanceId),
        instance: computed(() => resource()?.instance),
        item: computed(() => resource()?.item),
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

function isNamed(item: MasterItemDefinitions | HouseItems) {
  return isMasterItem(item) && isItemNamed(item)
}

function isArtifact(item: MasterItemDefinitions | HouseItems) {
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
