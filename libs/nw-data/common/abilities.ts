import { AttackType, StatusEffectData, UICategory } from '@nw-data/generated'
import { AbilityData, AffixStatData, DamageData, DamageTypeData } from '@nw-data/generated'
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

export function getAbilityCategoryTag(ability: AbilityData): Lowercase<UICategory> | 'none' {
  return ability?.UICategory?.toLowerCase() as any || 'none'
}

export function getWeaponTagLabel(value: string) {
  return WEAPON_TAG_NAME[value]
}

export function stripAbilityProperties(item: AbilityData): Partial<AbilityData> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'AbilityID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}

export function doesAbilityTriggerDamage(
  ability: AbilityData,
  damageRow: DamageData,
  damageTypes: Map<string, DamageTypeData>,
  gemDamageType: AffixStatData
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
  ability: AbilityData,
  statusEffect: StatusEffectData,
  damageTypes: Map<string, DamageTypeData>,
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

export type AbilityActionKey = KeysWithPrefix<AbilityData, 'On'>

export function getAbilityActionKeys(ability: AbilityData) {
  const result: AbilityActionKey[]  = []
  for (const key in ability) {
    if (ability[key] && key.startsWith('On')) {
      result.push(key as AbilityActionKey)
    }
  }
  return result
}
