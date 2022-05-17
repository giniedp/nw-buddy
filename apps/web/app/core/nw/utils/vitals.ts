import { Vitals } from "@nw-data/types"

const CREATURE_TYPE_MARKER = {
  Boss: 'boss',
  // Critter
  Dungeon: 'dungeon',
  'Dungeon+': 'dungeon', // TODO
  'Dungeon-': 'dungeonminus',
  DungeonBoss: 'boss',
  DungeonMiniBoss: 'groupplus',
  Elite: 'group',
  'Elite+': 'groupplus',
  'Elite-': 'groupminus',
  EliteBoss: 'boss',
  EliteMiniBoss: 'groupplus',
  // Player: '',
  'Named_Solo+': 'soloplus', // TODO
  Solo: 'solo',
  'Solo+': 'soloplus',
  'Solo-': 'solominus'
}
const ICON_STRONG_ATTACK = 'assets/icons/strongattack.png'
const ICON_WEAK_ATTACK = 'assets/icons/weakattack.png'

export type VitalDamageType =
  | 'Arcane'
  | 'Corruption'
  | 'Fire'
  | 'Ice'
  | 'Lightning'
  | 'Nature'
  | 'Siege'
  | 'Slash'
  | 'Standard'
  | 'Strike'
  | 'Thrust'

export function getVitalTypeMarker(vitalOrcreatureType: string | Vitals) {
  if (typeof vitalOrcreatureType !== 'string') {
    vitalOrcreatureType = vitalOrcreatureType?.CreatureType
  }
  const marker = CREATURE_TYPE_MARKER[vitalOrcreatureType]
  return marker && `assets/icons/marker/marker_ai_level_bg_${marker}.png`
}

export function getVitalDamageEffectiveness(vital: Vitals, damageType: VitalDamageType) {
  return (vital[`WKN${damageType}`] - vital[`ABS${damageType}`]) || 0
}

export function getVitalDamageEffectivenessPercent(vital: Vitals, damageType: VitalDamageType) {
  return Math.round(this.damageEffectiveness(vital, damageType) * 100)
}

export function getVitalDamageEffectivenessIcon(vital: Vitals, damageType: VitalDamageType) {
  const dmg = getVitalDamageEffectiveness(vital, damageType)
  if (dmg < 0) {
    return ICON_WEAK_ATTACK
  }
  if (dmg > 0) {
    return ICON_STRONG_ATTACK
  }
  return null
}
