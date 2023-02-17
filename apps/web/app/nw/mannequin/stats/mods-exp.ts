import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsEXP(mods: ActiveMods) {
  return {
    Fishing: modifierSum('EXPFishing', mods),
    Harvesting: modifierSum('EXPHarvesting', mods),
    Leatherworking: modifierSum('EXPLeatherworking', mods),
    Logging: modifierSum('EXPLogging', mods),
    Mining: modifierSum('EXPMining', mods),
    Skinning: modifierSum('EXPSkinning', mods),
    Smelting: modifierSum('EXPSmelting', mods),
    Stonecutting: modifierSum('EXPStonecutting', mods),
    Weaving: modifierSum('EXPWeaving', mods),
  } as const
}
