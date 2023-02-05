import { Ability } from '@nw-data/types'
import { minBy, sum } from 'lodash'
import { eqCaseInsensitive } from '~/utils'
import { AttributeRef } from '../attributes/nw-attributes'
import { getAmmoTypeFromWeaponTag, getWeaponTagFromWeapon } from '../utils/damage'
import { EquipSlotId } from '../utils/equip-slot'

import {
  getItemPerkIdsWithOverride,
  isItemArmor,
  isItemConsumable,
  isItemJewelery,
  isItemShield,
  isItemTool,
  isItemWeapon,
} from '../utils/item'
import { getPerkMultiplier } from '../utils/perks'
import {
  ActiveAttribute,
  ActiveAttributes,
  ActiveWeapon,
  AplicableAbility,
  ActiveEffect,
  ActiveMods,
  ActivePerk,
  DbSlice,
  EquppedItem,
  MannequinState,
} from './types'

export function selectLevel({ level }: MannequinState) {
  return level
}

export function selectActiveWeapon(
  { items, weapons, ammos }: DbSlice,
  { weaponActive, weaponUnsheathed, equippedItems }: MannequinState
): ActiveWeapon {
  const equpped = equippedItems.find((it) => isWeaponActive(weaponActive, it.slot))
  const item = items.get(equpped?.itemId)
  const weapon = weapons.get(item?.ItemStatsRef)
  const weaponTag = getWeaponTagFromWeapon(weapon)
  const ammoType = getAmmoTypeFromWeaponTag(weaponTag)
  const ammo = ammos.get(equippedItems.find((it) => it.slot === 'cartridge')?.itemId)
  return {
    item: item,
    weapon: weapon,
    weaponTag: getWeaponTagFromWeapon(weapon),
    gearScore: equpped?.gearScore,
    slot: equpped.slot,
    unsheathed: weaponUnsheathed,
    ammo: eqCaseInsensitive(ammo?.AmmoType, ammoType) ? ammo : null,
  }
}

export function selectActiveEncumbrance({ items, weapons, armors }: DbSlice, { equippedItems }: MannequinState) {
  const weights = equippedItems
    .map((it) => items.get(it.itemId))
    .filter((it) => it && (isItemArmor(it) || isItemJewelery(it) || isItemWeapon(it) || isItemShield(it)))
    .map((it) => {
      const weapon = weapons.get(it.ItemStatsRef)
      const armor = armors.get(it.ItemStatsRef)
      return weapon?.WeightOverride || armor?.WeightOverride || it.Weight || 0
    })
  return sum(weights)
}

export function selectEquppedArmor({ items }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems.filter((it) => {
    const item = items.get(it.itemId)
    return isItemArmor(item) || isItemJewelery(item)
  })
}

export function selectEquppedWeapons({ items }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems.filter((it) => {
    const item = items.get(it.itemId)
    return isItemWeapon(item) || isItemShield(item)
  })
}

export function selectEquppedTools({ items }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems.filter((it) => {
    const item = items.get(it.itemId)
    return isItemTool(item)
  })
}

export function selectEquppedConsumables({ items }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems.filter((it) => {
    const item = items.get(it.itemId)
    return isItemConsumable(item)
  })
}

export function selectPlacedHousings({ housings }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems.filter((it) => !!housings.get(it.itemId)?.HousingStatusEffect)
}

export function selectEquippedPerks(
  { items, perks, affixes, weapons, armors, runes }: DbSlice,
  { equippedItems }: MannequinState
) {
  return equippedItems
    .map((it) => {
      const item = items.get(it.itemId)
      return getItemPerkIdsWithOverride(item, it.perks)
        .map((id) => perks.get(id))
        .filter((it) => !!it)
        .map((perk): ActivePerk => {
          return {
            slot: it.slot,
            item,
            gearScore: it.gearScore,
            perk,
            affix: affixes.get(perk.Affix),
            weapon: weapons.get(item.ItemStatsRef),
            armor: armors.get(item.ItemStatsRef),
            rune: runes.get(item.ItemStatsRef),
          }
        })
    })
    .flat()
    .filter((it) => !!it?.perk)
}

export function selectActivePerks(db: DbSlice, state: MannequinState) {
  const weapon = selectActiveWeapon(db, state)
  return selectEquippedPerks(db, state).filter((it) => isPerkActive(it, weapon))
}

export function selectAttributeAbilities({ abilities }: DbSlice, attributes: ActiveAttributes) {
  return Object.values(attributes)
    .map((it) => it.abilities)
    .flat()
    .map((it) => abilities.get(it))
}

export function selectActivatedAbilities({ abilities }: DbSlice, { activatedAbilities }: MannequinState) {
  return activatedAbilities.map((it) => abilities.get(it))
}

export function selectWeaponAbilities(
  { abilities }: DbSlice,
  { item, weapon, weaponTag }: ActiveWeapon,
  { equppedSkills1, equppedSkills2 }: MannequinState
) {
  return [equppedSkills1, equppedSkills2]
    .filter((it) => eqCaseInsensitive(it?.weapon, weaponTag))
    .map((it) => [it.tree1 || [], it.tree2 || []])
    .flat(2)
    .map((id): AplicableAbility => {
      return {
        item: item,
        weapon: weapon,
        ability: abilities.get(id),
      }
    })
    .filter(({ ability }) => !!ability)
}

export function selectActiveAbilities(db: DbSlice, attributes: ActiveAttributes, state: MannequinState) {
  return [
    //
    selectAttributeAbilities(db, attributes),
    //
    selectActivatedAbilities(db, state),
  ]
    .flat()
    .filter((it) => !!it)
}

export function selectActveEffects(db: DbSlice, abilities: Ability[], state: MannequinState) {
  return [
    // assume consumable as being consumed and active
    selectConsumableEffects(db, state),
    // housing effects are always active
    selectHousingEffects(db, state),
    //
    selectEquppedEffects(db, abilities),
  ]
    .flat()
    .filter((it) => !!it)
}

export function selectEquppedEffects({ effects }: DbSlice, abilities: Ability[]): ActiveEffect[] {
  return abilities
    .map((it): ActiveEffect => {
      if (it.OnEquipStatusEffect) {
        return {
          effect: effects.get(it.OnEquipStatusEffect),
          ability: it,
        }
      }
      return null
    })
    .filter((it) => !!it)
}

export function selectConsumableEffects({ items, consumables, effects }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems
    .map((it): ActiveEffect[] => {
      const consumable = consumables.get(it.itemId)
      return (
        consumable?.AddStatusEffects?.map((id) => {
          return {
            item: items.get(it.itemId),
            consumable: consumable,
            effect: effects.get(id),
          }
        }) || []
      )
    })
    .flat()
    .filter((it) => !!it?.effect)
}

export function selectHousingEffects({ housings, effects }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems
    .map((it): ActiveEffect[] => {
      const housing = housings.get(it.itemId)
      return [
        {
          item: housing,
          consumable: null,
          effect: effects.get(housing?.HousingStatusEffect),
        },
      ]
    })
    .flat()
    .filter((it) => !!it?.effect)
}

function isWeaponActive(weapon: 'primary' | 'secondary', slot: EquipSlotId) {
  if (weapon === 'primary' && slot === 'weapon1') {
    return true
  }
  if (weapon === 'secondary' && slot === 'weapon2') {
    return true
  }
  return false
}

function isPerkActive({ slot, perk, affix }: ActivePerk, weapon: ActiveWeapon) {
  let condition = perk?.ConditionEvent
  if (condition === 'OnEquip' && affix?.PreferHigherScaling) {
    condition = 'OnActive'
  }
  if (condition === 'OnEquip') {
    return true
  }
  const isActiveWeapon = weapon.slot === slot || (slot === 'weapon3' && weapon.weaponTag === 'Sword')
  if (!isActiveWeapon) {
    return false
  }
  if (condition === 'OnActive') {
    return true
  }
  if (condition === 'OnUnsheathed') {
    return weapon.unsheathed
  }
  return false
}

export function selectEquppedAttributes(
  { attrCon, attrDex, attrFoc, attrInt, attrStr }: DbSlice,
  { perks }: ActiveMods
) {
  const result: Record<AttributeRef, number> = {
    con: minBy(attrCon, (it) => it.Level).Level,
    dex: minBy(attrDex, (it) => it.Level).Level,
    foc: minBy(attrFoc, (it) => it.Level).Level,
    int: minBy(attrInt, (it) => it.Level).Level,
    str: minBy(attrStr, (it) => it.Level).Level,
  }

  for (const { perk, gearScore, affix } of perks) {
    if (!affix || !perk.ScalingPerGearScore) {
      continue
    }
    const scale = getPerkMultiplier(perk, gearScore)
    result.con += (affix.MODConstitution || 0) * scale
    result.dex += (affix.MODDexterity || 0) * scale
    result.foc += (affix.MODFocus || 0) * scale
    result.int += (affix.MODIntelligence || 0) * scale
    result.str += (affix.MODStrength || 0) * scale
  }
  return result
}

export function selectBonusAttributes(db: DbSlice, { effects }: ActiveMods) {
  const result: Record<AttributeRef, number> = {
    con: 0,
    dex: 0,
    foc: 0,
    int: 0,
    str: 0,
  }

  for (const { effect, consumable } of effects) {
    if (!effect || !consumable) {
      continue
    }
    result.con += effect.MODConstitution || 0
    result.dex += effect.MODDexterity || 0
    result.foc += effect.MODFocus || 0
    result.int += effect.MODIntelligence || 0
    result.str += effect.MODStrength || 0
  }
  return result
}

export function selectAttributes(db: DbSlice, mods: ActiveMods, state: MannequinState): ActiveAttributes {
  const attrsBase = selectEquppedAttributes(db, mods)
  const attrsBonus = selectBonusAttributes(db, mods)
  const attrsAssigned = state.assignedAttributes
  const levels = {
    con: db.attrCon,
    dex: db.attrDex,
    foc: db.attrFoc,
    int: db.attrInt,
    str: db.attrStr,
  } as const
  function buildAttribute(key: AttributeRef): ActiveAttribute {
    const base = attrsBase?.[key] || 0
    const bonus = attrsBonus?.[key] || 0
    const assigned = attrsAssigned?.[key] || 0
    const value = base + bonus + assigned
    return {
      base: base,
      bonus: bonus,
      assigned: assigned,
      total: value,
      scale: levels[key].find((it) => it.Level === value)?.ModifierValueSum,
      abilities: levels[key]
        .filter((it) => it.Level <= value && it.EquipAbilities?.length)
        .map((it) => it.EquipAbilities)
        .flat(),
    }
  }
  return {
    con: buildAttribute('con'),
    dex: buildAttribute('dex'),
    foc: buildAttribute('foc'),
    int: buildAttribute('int'),
    str: buildAttribute('str'),
  }
}
