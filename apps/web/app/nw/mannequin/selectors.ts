import { Ability, Damagetable, ItemdefinitionsAmmo } from '@nw-data/types'
import { groupBy, minBy, sum, sumBy } from 'lodash'
import { eqCaseInsensitive } from '~/utils'
import { AttributeRef } from '../attributes/nw-attributes'
import { NW_MIN_GEAR_SCORE } from '../utils/constants'
import { getAmmoTypeFromWeaponTag, getWeaponTagFromWeapon } from '../utils/damage'
import { EquipSlotId, getAverageGearScore } from '../utils/equip-slot'

import {
  getArmorRatingElemental,
  getArmorRatingPhysical,
  getItemPerkIdsWithOverride,
  isItemArmor,
  isItemConsumable,
  isItemJewelery,
  isItemShield,
  isItemTool,
  isItemWeapon,
} from '../utils/item'
import { getPerkMultiplier } from '../utils/perks'
import { NW_WEAPON_TYPES } from '../weapon-types/nw-weapon-types'
import {
  ActiveAttribute,
  ActiveAttributes,
  ActiveWeapon,
  ActiveAbility,
  ActiveEffect,
  AttributeModsSource,
  ActivePerk,
  DbSlice,
  EquippedItem,
  MannequinState,
  ActiveConsumable,
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
  const weapon = weapons.get(item?.ItemStatsRef) || weapons.get('Unarmed')
  const weaponTag = getWeaponTagFromWeapon(weapon)
  const ammoType = getAmmoTypeFromWeaponTag(weaponTag)

  let ammo: ItemdefinitionsAmmo
  if (weapon?.AmmoType === 'Arrow') {
    ammo = ammos.get(equippedItems.find((it) => it.slot === 'arrow')?.itemId)
  }
  if (weapon?.AmmoType === 'Shot') {
    ammo = ammos.get(equippedItems.find((it) => it.slot === 'cartridge')?.itemId)
  }
  return {
    item: item,
    weapon: weapon,
    weaponTag: getWeaponTagFromWeapon(weapon),
    gearScore: equpped?.gearScore,// || 0,
    slot: equpped?.slot,
    unsheathed: weaponUnsheathed,
    ammo: eqCaseInsensitive(ammo?.AmmoType, ammoType) ? ammo : null,
  }
}

export function selectWeaponAttacks(db: DbSlice, weapon: ActiveWeapon, state: MannequinState) {
  const weaponSpec = NW_WEAPON_TYPES.find((it) => it.WeaponTag === weapon.weaponTag)
  if (weapon.weaponTag && !weaponSpec) {
    return []
  }
  const tablePrefix = weaponSpec?.DamageTablePrefix || 'Unarmed_'
  return db.damagaTable.filter((it) => it.DamageID.startsWith(tablePrefix))
}

export function selectDamageTableRow(rows: Damagetable[], state: MannequinState) {
  return rows?.find((it) => it.DamageID === state.selectedAttack) || rows?.[0]
}

export function selectTotalWeight({ items, weapons, armors }: DbSlice, { equippedItems }: MannequinState) {
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
  { weaponTag }: ActiveWeapon,
  { equppedSkills1, equppedSkills2 }: MannequinState
) {
  return [equppedSkills1, equppedSkills2]
    .filter((it) => eqCaseInsensitive(it?.weapon, weaponTag))
    .map((it) => [it?.tree1 || [], it?.tree2 || []])
    .flat(2)
    .map((id) => abilities.get(id))
    .filter((ability) => !!ability)
}

export function selectPerkAbilities({ abilities, effects }: DbSlice, perks: ActivePerk[], state: MannequinState) {
  return perks
    .map((activePerk): ActiveAbility[] => {
      return (activePerk.perk.EquipAbility || []).map((id) => {
        const ability = abilities.get(id)
        return {
          ability: ability,
          selfEffects: ability?.SelfApplyStatusEffect?.map((id) => effects.get(id)),
          perk: activePerk,
          // scale: getAbilityScale(ability, state),
        }
      })
    })
    .flat(2)
    .filter(({ ability }) => !!ability)
}

export function selectActiveAbilities(
  db: DbSlice,
  attributes: ActiveAttributes,
  weapon: ActiveWeapon,
  attack: Damagetable,
  perks: ActivePerk[],
  state: MannequinState
) {
  return [
    //
    selectAttributeAbilities(db, attributes).map((it): ActiveAbility => {
      return {
        ability: it,
        selfEffects: it?.SelfApplyStatusEffect?.map((id) => db.effects.get(id)),
        attribute: true,
        // scale: getAbilityScale(it, state),
      }
    }),
    //
    selectWeaponAbilities(db, weapon, state).map((it): ActiveAbility => {
      return {
        ability: it,
        selfEffects: it?.SelfApplyStatusEffect?.map((id) => db.effects.get(id)),
        weapon: weapon,
        // scale: getAbilityScale(it, state),
      }
    }),
    //
    selectPerkAbilities(db, perks, state),
  ]
    .flat()
    .filter(({ ability }) => isActiveAbility(ability, attack, state))
}

export function selectActveEffects(db: DbSlice, perks: ActivePerk[], state: MannequinState) {
  return [
    // assume consumable as being consumed and active
    selectConsumableEffects(db, state),
    // housing effects are always active
    selectHousingEffects(db, state),
    //
    selectPerkEffects(db, perks),
    // enforced effects like town buffs
    selectEnforcedEffects(db, state)
  ]
    .flat()
    .filter((it) => !!it)
}

export function selectActiveConsumables({ items, consumables, effects }: DbSlice, { equippedItems }: MannequinState) {
  return equippedItems
    .map((it): ActiveConsumable => {
      const item = items.get(it.itemId)
      const consumable = consumables.get(it.itemId)
      return {
        item,
        consumable,
      }
    })
    .filter((it) => !!it?.consumable)
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

export function selectPerkEffects({ affixes, effects }: DbSlice, perks: ActivePerk[]) {
  return perks
    .map((active): ActiveEffect[] => {
      return [
        {
          item: null,
          consumable: null,
          perk: active,
          effect: effects.get(affixes.get(active.perk?.Affix)?.StatusEffect),
        },
      ]
    })
    .flat()
    .filter((it) => !!it?.effect)
}


export function selectEnforcedEffects({ effects }: DbSlice, { enforcedEffects }: MannequinState) {
  enforcedEffects = enforcedEffects || []
  return enforcedEffects.map(({ id, stack }) => {
    return new Array(stack).fill(null).map((): ActiveEffect => {
      return {
        effect: effects.get(id)
      }
    })
  })
  .flat()
  .filter((it) => !!it.effect)
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

function isPerkActive({ slot, perk, affix, item }: ActivePerk, weapon: ActiveWeapon) {
  let condition = perk?.ConditionEvent
  if (condition === 'OnEquip' && affix?.PreferHigherScaling) {
    condition = 'OnActive'
  }
  if (condition === 'OnEquip') {
    return true
  }
  if (!(isItemWeapon(item) || isItemShield(item))) {
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
  { perks }: AttributeModsSource
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
    result.con += Math.floor((affix.MODConstitution || 0) * scale)
    result.dex += Math.floor((affix.MODDexterity || 0) * scale)
    result.foc += Math.floor((affix.MODFocus || 0) * scale)
    result.int += Math.floor((affix.MODIntelligence || 0) * scale)
    result.str += Math.floor((affix.MODStrength || 0) * scale)
  }
  return result
}

export function selectBonusAttributes(db: DbSlice, { effects }: AttributeModsSource) {
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

export function selectAttributes(db: DbSlice, mods: AttributeModsSource, state: MannequinState): ActiveAttributes {
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
      health: levels[key].find((it) => it.Level === value)?.Health,
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

export function selectGearScore(items: EquippedItem[], level: number) {
  return getAverageGearScore(items.map((it) => ({ id: it.slot, gearScore: it.gearScore })), level)
}

const REJECT_ABILITIES_WITH_PROPS: Array<keyof Ability> = [
  // unsupported trigger
  'OnAttachedSpellTargetDied',
  'AttachedTargetSpellIds',
  'OnBlockBreak',
  'OnContributedKill',
  //'OnCrit',
  //'OnCritTaken',
  //'OnBlockedHit',
  'OnBlockedHitTaken',
  //'OnHit',
  'OnHitBehind',
  'OnHitTaken',
  'OnHitTakenWhileInvulnerable',
  //'OnHeadShot',
  'OnSelfDamage',
  'OnFatalDamageTaken',
  'OnDeath',
  'OnDeathsDoor',
  'OnEquipStatusEffect',
  'OnEventConditionalActivationChance',
  'OnEventPassiveConditionsPass',
  'OnExecuted',
  'OnGatheringComplete',
  'OnHasDied',
  //'OnHealed',
  'OnHealthChanged',
  'OnInActionLongEnough',
  'OnKill',
  'OnLegShot',
  'OnProjPassedThrough',
  'OnStatusEffectApplied',
  'StatusEffectBeingApplied',
  'OnTargetBlockBreak',
  'OnTargetSet',
  'OnTargetStatusEffectRemoved',
  'OnUsedConsumable',
  'OnWeaponSwap',
  'AfterAction',
  'AbilityTrigger',
  'AbilityList',
  'CheckStatusEffectsOnTargetOwned',
  // unsupported conditions
  'TargetCollisionFilters',
  'EquipLoadCategory',
  'ExcludeFromGameModes',
  'AbilityOnCooldownOptions',
  'AbilityCooldownComparisonType',
  'RequiredEquippedAbilityId',
  'DontHaveStatusEffect',
  'DamageTableRow',
  'DamageTableRowOverride',
  // 'DamageCategory',
  // 'DamageIsMelee',
  // 'DamageIsRanged',
  'InAction',
  'InActionTime',
  'TargetMarker',
  'MyMarker',
  'TargetHasGritActive',
  'StatusEffect',
  'StatusEffectComparison',
  'StatusEffectStackSize',
  'TargetStatusEffect',
  'TargetStatusEffectCategory',
  'TargetStatusEffectComparison',
  'TargetStatusEffectStackSize',
  'NumConsecutiveHits',
  'MaxConsecutiveHits',
  'ResetConsecutiveOnSuccess',
  'IgnoreResetConsecutiveOnDeath',
  'LoadedAmmoCount',
  'LoadedAmmoCountComparisonType',
  'PerStatusEffectOnTarget',
  'PerStatusEffectOnTargetMax',
  'PerStatusEffectOnSelf',
  'PerStatusEffectOnSelfMax',

  'RangedAttackName',
  'RangedAttackNameOverride',
  'ForceStatusEffectDamageTableRow',
  'StatusEffectDamageTableIdForRowOverride',
  'StatusEffectDamageTableRowOverride',

  'SetHealthOnFatalDamageTaken',
  'ResetTrackedOnSuccess',
  'RemoteDamageTableRow',
  'MaxTrackedHitCounts',
  'DisableApplyPerStatusEffectStack',
  'DisableCastSpellDurability',
  'DisableConsecutivePotency',
]

function isActiveAbility(ability: Ability, attack: Damagetable, state: MannequinState) {
  if (!ability) {
    return false
  }
  // filter by attack type: Light, Heavy, Ability, Magic
  if (ability.AttackType?.length) {
    if (!attack || !ability.AttackType.includes(attack.AttackType as any)) {
      return false
    }
  }
  if (ability.DamageIsMelee) {
    if (!ability.OnHit) {
      return false
    }
    if (attack.IsRanged) {
      return false
    }
  }
  if (ability.DamageIsRanged) {
    if (!ability.OnHit) {
      return false
    }
    if (!attack.IsRanged) {
      return false
    }
  }

  // TODO: filter by equip load: Fast, Medium
  // TODO: filter by health percent
  // TODO: filter by mana percent
  // TODO: filter by stamina percent
  // TODO: filter by target.health percent
  // TODO: filter by target.mana percent
  // TODO: filter by target.stamina percent

  // if (ability.NumAroundMe && !checkBumAroundMe(ability, state)) {
  //   return false
  // }

  if (REJECT_ABILITIES_WITH_PROPS.some((key) => !!ability[key])) {
    return false
  }
  return true
}

// function checkBumAroundMe(ability: Ability, state: MannequinState) {
//   const actual = state.numAroundMe
//   const limit = ability.NumAroundMe
//   switch (ability.NumAroundComparisonType) {
//     case 'Equal':
//       return actual === limit
//     case 'GreaterThan':
//       return actual > limit
//     case 'GreaterThanOrEqual':
//       return actual >= limit
//     case 'LessThan':
//       return actual < limit
//     case 'LessThanOrEqual':
//       return actual <= limit
//   }
//   return false
// }

// function getAbilityScale(ability: Ability, state: MannequinState) {
//   let scale = 1
//   if (ability.NumAroundMe && ability.MaxNumAroundMe) {
//     return Math.max(1, Math.min(state.numAroundMe, ability.MaxNumAroundMe))
//   }
//   if (ability.NumConsecutiveHits && ability.MaxConsecutiveHits) {
//     return Math.max(1, Math.min(state.numHits, ability.MaxConsecutiveHits))
//   }
//   return scale
// }
