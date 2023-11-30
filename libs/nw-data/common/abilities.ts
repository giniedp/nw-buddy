import { AttackType, Statuseffect } from '@nw-data/generated'
import { Ability, Affixstats, Damagetable, Damagetypes } from '@nw-data/generated'
import { KeysWithPrefix } from './utils/ts-types'

const WEAPON_TAG_NAME = {
  Sword: 'ui_straightsword',
  Rapier: 'ui_rapier',
  Axe: 'ui_hatchet',
  Spear: 'ui_spear',
  GreatAxe: 'ui_greataxe',
  Warhammer: 'ui_warhammer',
  Greatsword: 'ui_greatsword',
  Rifle: 'ui_musket',
  Bow: 'ui_bow',
  Blunderbuss: 'ui_blunderbuss',
  Fire: 'ui_firestaff',
  Heal: 'ui_lifestaff',
  Ice: 'ui_icemagic',
  VoidGauntlet: 'ui_voidmagic',
}

export function getAbilityCategoryTag(ability: Ability) {
  return (
    (ability?.UICategory?.match(/(heal|melee|debuff|buff|range|magic|passive)/i)?.[0]?.toLowerCase() as any) || 'none'
  )
}

export function getWeaponTagLabel(value: string) {
  return WEAPON_TAG_NAME[value]
}

export function stripAbilityProperties(item: Ability): Partial<Ability> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'AbilityID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}

export function doesAbilityTriggerDamage(
  ability: Ability,
  damageRow: Damagetable,
  damageTypes: Map<string, Damagetypes>,
  gemDamageType: Affixstats
) {
  if (ability.DamageIsRanged && !damageRow.IsRanged) {
    return false
  }

  if (ability.DamageIsMelee && damageRow.IsRanged) {
    return false
  }

  if (ability.RequireReaction && damageRow.NoReaction) {
    return false
  }

  if (ability.DamageTableRow?.length > 0 && !ability.DamageTableRow.includes(damageRow.DamageID)) {
    return false
  }

  if (ability.RemoteDamageTableRow?.length > 0 && !ability.RemoteDamageTableRow.includes(damageRow.DamageID)) {
    return false
  }

  if (ability.AttackType?.length > 0 && !ability.AttackType.includes(damageRow.AttackType as AttackType)) {
    return false
  }

  const rowDamageType = gemDamageType.DamageType || damageRow.DamageType

  if (ability.DamageTypes.length > 0 && !ability.DamageTypes.includes(rowDamageType)) {
    return false
  }

  if (ability.DamageCategory && damageTypes.get(rowDamageType)?.Category !== ability.DamageCategory) {
    return false
  }

  return true
}

export function doesAbilityTriggerStatusEffect(
  ability: Ability,
  statusEffect: Statuseffect,
  damageTypes: Map<string, Damagetypes>,
  target?: boolean
) {
  if (ability.RequireReaction) {
    return false
  }
  if (!target) {
    if (ability.StatusEffect !== statusEffect.StatusID) {
      return false
    }
    if (!ability.StatusEffectCategories.some((cat) => statusEffect.EffectCategories.includes(cat))) {
      return false
    }
  } else {
    if (ability.TargetStatusEffect !== statusEffect.StatusID) {
      return false
    }
    if (!ability.TargetStatusEffectCategory.some((cat) => statusEffect.EffectCategories.includes(cat))) {
      return false
    }
  }

  if (ability.DamageTypes && !ability.DamageTypes.includes(statusEffect.DamageType)) {
    return false
  }
  if (ability.DamageCategory && ability.DamageCategory !== damageTypes.get(statusEffect.DamageType)?.Category) {
    return false
  }

  return true
}

export type AbilityActionKey = KeysWithPrefix<Ability, 'On'>

export function getAbilityActionKeys(ability: Ability) {
  const result: AbilityActionKey[]  = []
  for (const key in ability) {
    if (ability[key] && key.startsWith('On')) {
      result.push(key as AbilityActionKey)
    }
  }
  return result
}
