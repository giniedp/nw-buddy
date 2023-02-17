import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsEFF(mods: ActiveMods) {
  return {
    Harvesting: modifierSum('EFFHarvesting', mods),
    Logging: modifierSum('EFFLogging', mods),
    Mining: modifierSum('EFFMining', mods),
    Skinning: modifierSum('EFFSkinning', mods),
  } as const
}

export function selectModsMULT(mods: ActiveMods) {
  return {
    Harvesting: modifierSum('MULTHarvesting', mods),
    Logging: modifierSum('MULTLogging', mods),
    Mining: modifierSum('MULTMining', mods),
    Skinning: modifierSum('MULTSkinning', mods),
    Fishing: modifierSum('MULTFishing', mods),
  } as const
}
