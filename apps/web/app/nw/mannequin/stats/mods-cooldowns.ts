import { ModifierResult, ModifierValue, eachModifier, modifierAdd, modifierResult, modifierSum } from '../modifier'
import { ActiveMods, DbSlice } from '../types'

export function selectCooldownMods(db: DbSlice, mods: ActiveMods) {
  const result: Record<string, ModifierResult> = {}

  for (const mod of eachModifier<number>('CooldownTimer', mods)) {
    if (mod.source.ability?.CDRImmediatelyOptions !== 'ActiveWeapon') {
      continue
    }
    if (!mod.source.ability.AbilityID?.match(/^Global/i)) {
      continue
    }
    if (!mod.source.perk) {
      continue
    }
    if (mod.source.ability.OnKill) {
      addModifier(result, mod, 'OnKill')
      continue
    }
    if (mod.source.ability.OnHit) {
      addModifier(result, mod, 'OnHIt')
      continue
    }
    if (mod.source.ability.OnHitTaken) {
      addModifier(result, mod, 'OnHitTaken')
      continue
    }
    if (mod.source.ability.AfterAction) {
      addModifier(result, mod, `After ${mod.source.ability.AfterAction}`)
      continue
    }
    addModifier(result, mod, 'ActiveWeapon')
  }

  return result
}

function addModifier(result: Record<string, ModifierResult>, mod: ModifierValue<number>, key: string) {
  if (!result[key]) {
    result[key] = modifierResult()
  }
  modifierAdd(result[key], mod)
}
