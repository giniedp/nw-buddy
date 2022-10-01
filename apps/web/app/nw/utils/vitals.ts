import { Gamemodes, Vitals } from "@nw-data/types"

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

export type DungeonTerritory =
  | 'Windsward'
  | 'Edengrove'
  | 'Everfall'
  | 'Restless'
  | 'Reekwater'
  | 'Ebonscale'
  | 'ShatterMtn'
  | 'Cutlass'
  | 'BrimstoneSands'

export function getVitalDungeonTerritory(vitalId: string): DungeonTerritory {
  return vitalId?.match(/_DG_([a-zA-Z]+)_/)?.[1] as DungeonTerritory
}
export function getVitalDungeonTag(vitalId: string) {
  switch (getVitalDungeonTerritory(vitalId)) {
    case 'Windsward':
      return 'Amrine'
    case 'Edengrove':
      return 'Edengrove00'
    case 'Everfall':
      return 'ShatteredObelisk'
    case 'Restless':
      return 'RestlessShores01'
    case 'Reekwater':
      return 'Reekwater00'
    case 'Ebonscale':
      return 'Ebonscale00'
    case 'ShatterMtn':
      return 'ShatterMtn00'
    case 'Cutlass':
      return 'CutlassKeys00'
    case 'BrimstoneSands':
      return 'BrimstoneSands00'
    default:
      return null
  }
}
export function getVitalDungeonId(vitalId: string): string {
  const tag = getVitalDungeonTag(vitalId)
  return tag ? `Dungeon${tag}` : null
}
const MAP_DUNGEON_TO_VITALS_LOOT_TAGS: Record<string, string[]> = {
  DungeonEbonscale00: ['Dynasty', 'IsabellaDynasty'],
  DungeonCutlassKeys00: ['DryadSiren'],
  QuestApophis: ['Apophis']
}
export function getVitalDungeon(vital: Vitals, dungeons: Gamemodes[]) {
  const vitalDungeonId = getVitalDungeonId(vital.VitalsID)
  for (const dungeon of dungeons) {
    if (!dungeon.IsDungeon) {
      continue
    }
    // vital ID implicitly references dungeon ID
    if (vitalDungeonId && vitalDungeonId === dungeon.GameModeId) {
      return dungeon
    }
    if (!vital.LootTags?.length) {
      continue
    }
    // vital references dungeon via LootTags
    const dungeonTag = dungeon.GameModeId.replace(/^Dungeon/, '')
    if (vital.LootTags.some((tag) => tag === dungeonTag)) {
      return dungeon
    }
    // special case for
    // - Dynasty_Empress
    const tags = MAP_DUNGEON_TO_VITALS_LOOT_TAGS[dungeon.GameModeId]
    if (tags && vital.LootTags.some((tag) => tags.includes(tag))) {
      // console.debug('special case', {
      //   vitalDungeonId,
      //   vital,
      //   dungeon
      // })
      return dungeon
    }
  }
  return null
}
