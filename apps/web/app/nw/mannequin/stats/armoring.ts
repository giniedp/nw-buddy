import { getArmorRatingElemental, getArmorRatingPhysical } from '~/nw/utils/item'
import { eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice, MannequinState } from '../types'

export function selectPhysicalRatingBase(
  { items, weapons, armors }: DbSlice,
  { abilities }: ActiveMods,
  { equippedItems }: MannequinState
) {
  let armorRating = 0
  let weaponRating = 0
  for (const { itemId, gearScore } of equippedItems) {
    const item = items.get(itemId)
    const equipment = armors.get(item?.ItemStatsRef)
    const armor = armors.get(item?.ItemStatsRef)
    const weapon = weapons.get(item?.ItemStatsRef)
    armorRating += getArmorRatingPhysical(armor, gearScore)
    weaponRating += getArmorRatingPhysical(weapon, gearScore)
  }
  return {
    armorRating,
    weaponRating,
    value: armorRating + weaponRating,
  }
}

export function selectPhysicalRating(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  const result = modifierResult()
  const base = selectPhysicalRatingBase(db, mods, state)
  modifierAdd(result, {
    scale: 1,
    value: base.value,
    source: { label: 'Base' }
  })
  for (const { value, scale, source } of eachModifier<number>('PhysicalArmor', mods)) {
    modifierAdd(result, {
      scale: scale,
      value: base.armorRating * value,
      source: source
    })
  }
  return result
}

export function selectElementalRatingBase(
  { items, weapons, armors }: DbSlice,
  { abilities }: ActiveMods,
  { equippedItems }: MannequinState
) {
  let armorRating = 0
  let weaponRating = 0
  for (const { itemId, gearScore } of equippedItems) {
    const item = items.get(itemId)
    const armor = armors.get(item?.ItemStatsRef)
    const weapon = weapons.get(item?.ItemStatsRef)
    armorRating += getArmorRatingElemental(armor, gearScore)
    weaponRating += getArmorRatingElemental(weapon, gearScore)
  }
  return {
    armorRating,
    weaponRating,
    value: armorRating + weaponRating,
  }
}

export function selectElementalRating(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  const result = modifierResult()

  const base = selectElementalRatingBase(db, mods, state)
  modifierAdd(result, {
    scale: 1,
    value: base.value,
    source: { label: 'Base' }
  })
  for (const { value, scale, source } of eachModifier<number>('ElementalArmor', mods)) {
    modifierAdd(result, {
      scale: scale,
      value: base.armorRating * value,
      source: source
    })
  }
  return result

}
