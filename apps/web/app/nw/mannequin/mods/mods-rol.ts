import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsROL(mods: ActiveMods) {
  return {
    Cooking: modifierSum('ROLCooking', mods),
    Fishing: modifierSum('ROLFishing', mods),
    Harvesting: modifierSum('ROLHarvesting', mods),
    Leatherworking: modifierSum('ROLLeatherworking', mods),
    Logging: modifierSum('ROLLogging', mods),
    Mining: modifierSum('ROLMining', mods),
    Skinning: modifierSum('ROLSkinning', mods),
    Smelting: modifierSum('ROLSmelting', mods),
    Stonecutting: modifierSum('ROLStonecutting', mods),
    Weaving: modifierSum('ROLWeaving', mods),
    Woodworking: modifierSum('ROLWoodworking', mods),
    Global: modifierSum('GlobalRollMod', mods),
  } as const
}
