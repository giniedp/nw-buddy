import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsArmorPenetration(mods: ActiveMods) {
  return {
    Base: modifierSum('ArmorPenetration', mods),
    Headshot: modifierSum('HeadshotArmorPenetration', mods),
    HitFromBehind: modifierSum('HitFromBehindArmorPenetration', mods),
  }
}
