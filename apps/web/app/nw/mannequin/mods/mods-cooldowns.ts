import { getAbilityActionKeys } from '@nw-data/common'
import { eqCaseInsensitive } from '~/utils'
import { longestCommonSubstringOfList } from '~/utils/longest-common-substring'
import { ModifierResult, ModifierValue, eachModifier, modifierAdd, modifierResult } from '../modifier'
import { ActiveConsumable, ActiveMods } from '../types'

export interface CooldownMods {
  Consumable: Record<string, ModifierResult>
  Weapon: Record<string, ModifierResult>
  Ability: Record<string, Record<string, ModifierResult>>
}

export function selectModsCooldown(consumables: ActiveConsumable[], mods: ActiveMods): CooldownMods {
  const result: CooldownMods = {
    // cooldown reduction for each consumable ID
    Consumable: {},
    // cooldown reduction for all abilities by action type
    Weapon: {
      Active: null,
      OnHit: null,
      OnHitTaken: null,
    },
    // cooldown by used abilty, affecting other abilities
    Ability: {},
  }

  for (const mod of eachModifier<number>('CooldownTimer', mods)) {
    const ability = mod.source.ability
    const perk = mod.source.perk
    // if (!ability?.AbilityID?.match(/^Global/i)) {
    //   continue
    // }

    if (ability.OnUsedConsumable) {
      for (const { consumable } of consumables) {
        if (!ability.CooldownId || eqCaseInsensitive(consumable.CooldownId, ability.CooldownId)) {
          addModifier(result.Consumable, mod, consumable.ConsumableID)
        }
      }
      continue
    }

    if (ability.CDRImmediatelyOptions === 'ActiveWeapon') {
      let bucket: string = null
      const onAction = getAbilityActionKeys(ability)
      if (onAction.length) {
        bucket = onAction[0]
      } else if (ability.AfterAction) {
        bucket = 'After' + ability.AfterAction
      } else {
        bucket = 'Active'
      }
      addModifier(result.Weapon, mod, bucket)
      continue
    }

    if (ability.CDRImmediatelyOptions === 'All') {
      let bucket: string = null
      if (ability.AbilityTrigger) {
        let name = longestCommonSubstringOfList(ability.AbilityList || [])
        if (name) {
          bucket = ability.AbilityTrigger + ' ' + name
        }
      }
      if (bucket) {
        addModifier(result.Weapon, mod, bucket)
      }
      continue
    }

    if (ability.CDRImmediatelyOptions === 'AbilitySpecific') {
      //
      continue
    }

    if (ability.CDRImmediatelyOptions === 'AllExcept') {
      //
      continue
    }

    if (!ability.CDRImmediatelyOptions) {
      if (!ability.AfterAction && !getAbilityActionKeys(ability).length) {
        addModifier(result.Weapon, mod, 'Active')
      }
      continue
    }
  }

  for (const key in result.Weapon) {
    if (!result.Weapon[key]) {
      delete result.Weapon[key]
    }
  }
  return result
}

function addModifier(result: Record<string, ModifierResult>, mod: ModifierValue<number>, key: string) {
  if (!result[key]) {
    result[key] = modifierResult()
  }
  modifierAdd(result[key], mod)
}
