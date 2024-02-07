import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsCraftingGS(mods: ActiveMods) {
  return {
    Arcana: {
      min: modifierSum('MGSArcana', mods),
      max: modifierSum('MaxGSArcana', mods),
    },
    Armoring: {
      min: modifierSum('MGSArmoring', mods),
      max: modifierSum('MaxGSArmoring', mods),
    },
    Engineering: {
      min: modifierSum('MGSEngineering', mods),
      max: modifierSum('MaxGSEngineering', mods),
    },
    Jewelcrafting: {
      min: modifierSum('MGSJewelcrafting', mods),
      max: modifierSum('MaxGSJewelcrafting', mods),
    },
    Weaponsmithing: {
      min: modifierSum('MGSWeaponsmithing', mods),
      max: modifierSum('MaxGSWeaponsmithing', mods),
    },
  } as const
}
