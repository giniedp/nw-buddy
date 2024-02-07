import { modifierSum } from '../modifier'
import { ActiveMods } from '../types'

export function selectModsThreat(mods: ActiveMods) {
  return modifierSum('ThreatDamage', mods)
}
