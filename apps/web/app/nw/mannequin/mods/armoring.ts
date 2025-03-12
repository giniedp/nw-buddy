import { getArmorRatingElemental, getArmorRatingPhysical } from '@nw-data/common'
import { modifierAdd, modifierResult } from '../modifier'
import { ActiveMods, DbSlice, MannequinState } from '../types'
import { categorySum } from './category-sum'

export function selectPhysicalRatingBase({ items, weapons, armors }: DbSlice, { equippedItems }: MannequinState) {
  let armorRating = 0
  let weaponRating = 0
  for (const { itemId, gearScore } of equippedItems) {
    const item = items.get(itemId)
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

export function selectElementalRatingBase({ items, weapons, armors }: DbSlice, { equippedItems }: MannequinState) {
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

export function selectModsArmor(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  return {
    PhysicalBase: selectPhysicalRatingBase(db, state),
    Physical: selectModPhysicalArmor(db, mods, state),
    ElementalBase: selectElementalRatingBase(db, state),
    Elemental: selectModElementalArmor(db, mods, state),
  }
}

export function selectModPhysicalArmor(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  return categorySum({
    categories: db.effectCategories,
    key: 'PhysicalArmor',
    mods: mods,
    base: 0,
  })
}

export function selectModElementalArmor(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  return categorySum({
    categories: db.effectCategories,
    key: 'ElementalArmor',
    mods: mods,
    base: 0,
  })
}

export function selectPhysicalArmor(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  const result = modifierResult()
  const base = selectPhysicalRatingBase(db, state)
  modifierAdd(result, {
    scale: 1,
    value: base.armorRating,
    source: { label: 'Armor' },
  })
  modifierAdd(result, {
    scale: 1,
    value: base.weaponRating,
    source: { label: 'Weapon' },
  })
  for (const { scale, value, source } of selectModPhysicalArmor(db, mods, state).source) {
    modifierAdd(result, {
      scale: scale,
      value: base.armorRating * value,
      source: source,
    })
  }
  return result
}

export function selectElementalArmor(db: DbSlice, mods: ActiveMods, state: MannequinState) {
  const result = modifierResult()
  const base = selectElementalRatingBase(db, state)
  modifierAdd(result, {
    scale: 1,
    value: base.armorRating,
    source: { label: 'Armor' },
  })
  modifierAdd(result, {
    scale: 1,
    value: base.weaponRating,
    source: { label: 'Weapon' },
  })
  for (const { scale, value, source } of selectModElementalArmor(db, mods, state).source) {
    modifierAdd(result, {
      scale: scale,
      value: base.armorRating * value,
      source: source,
    })
  }
  return result
}
