import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsWKN(mods: ActiveMods) {
  return {
    Arcane: modifierSum('WKNArcane', mods),
    Corruption: modifierSum('WKNCorruption', mods),
    Fire: modifierSum('WKNFire', mods),
    Ice: modifierSum('WKNIce', mods),
    Lightning: modifierSum('WKNLightning', mods),
    Nature: modifierSum('WKNNature', mods),
    Siege: modifierSum('WKNSiege', mods),
    Slash: modifierSum('WKNSlash', mods),
    Standard: modifierSum('WKNStandard', mods),
    Strike: modifierSum('WKNStrike', mods),
    Thrust: modifierSum('WKNThrust', mods),
  }
}
