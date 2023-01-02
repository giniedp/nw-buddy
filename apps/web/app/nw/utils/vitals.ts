import { Gamemodes, Vitals, Vitalscategories } from "@nw-data/types"

const NAMED_FAIMILY_TYPES = ['DungeonBoss', 'Dungeon+', 'DungeonMiniBoss', 'Elite+', 'EliteMiniBoss']
const CREATURE_TYPE_MARKER = {
  Boss: 'assets/icons/marker/marker_ai_level_bg_boss.png',
  Critter: 'assets/icons/marker/marker_ai_level_bg_critter.png',
  Dungeon: 'assets/icons/marker/marker_ai_level_bg_dungeon.png',
  'Dungeon+': 'assets/icons/marker/marker_ai_level_bg_groupplus.png', // TODO
  'Dungeon-': 'assets/icons/marker/marker_ai_level_bg_dungeonminus.png',
  DungeonBoss: 'assets/icons/marker/marker_ai_level_bg_boss.png',
  DungeonMiniBoss: 'assets/icons/marker/marker_ai_level_bg_groupplus.png',
  Elite: 'assets/icons/marker/marker_ai_level_bg_group.png',
  'Elite+': 'assets/icons/marker/marker_ai_level_bg_groupplus.png',
  'Elite-': 'assets/icons/marker/marker_ai_level_bg_groupminus.png',
  EliteBoss: 'assets/icons/marker/marker_ai_level_bg_boss.png',
  EliteMiniBoss: 'assets/icons/marker/marker_ai_level_bg_groupplus.png',
  Player: 'assets/icons/marker/marker_ai_level_bg_groupplus_ally.png',
  'Named_Solo+': 'assets/icons/marker/marker_ai_level_bg_soloplus.png', // TODO
  Solo: 'assets/icons/marker/marker_ai_level_bg_solo.png',
  'Solo+': 'assets/icons/marker/marker_ai_level_bg_soloplus.png',
  'Solo-': 'assets/icons/marker/marker_ai_level_bg_solominus.png',
}

const VITAL_FAMILIES: Record<string, { Icon: string, Img: string, Name: string }> = {
  wildlife: {
    Icon: 'assets/icons/families/bestialbane1.png',
    Img: 'assets/images/missionimage_wolf.png',
    Name: 'VC_Beast',
  },
  ancientguardian: {
    Icon: 'assets/icons/families/ancientbane1.png',
    Img: 'assets/images/missionimage_ancient1.png',
    Name: 'VC_Ancient',
  },
  corrupted: {
    Icon: 'assets/icons/families/corruptedbane1.png',
    Img: 'assets/images/missionimage_corrupted2.png',
    Name: 'VC_Corrupted',
  },
  angryearth: {
    Icon: 'assets/icons/families/angryearthbane1.png',
    Img: 'assets/images/missionimage_angryearth1.png',
    Name: 'VC_Angryearth',
  },
  lost: {
    Icon: 'assets/icons/families/lostbane1.png',
    Img: 'assets/images/missionimage_undead1.png',
    Name: 'VC_Lost',
  },
  fae: {
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    Img: '',
    Name: 'Fae',
  },
  unknown: {
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    Img: '',
    Name: '',
  },
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
  return CREATURE_TYPE_MARKER[vitalOrcreatureType] || CREATURE_TYPE_MARKER['Critter']
}

export function getVitalAliasName(categories: Vitalscategories[]) {
  if (categories.find((it) => it.IsNamed && it.VitalsCategoryID === 'Named')) {
    return categories.find((it) => it.IsNamed && it.VitalsCategoryID !== 'Named')?.DisplayName
  }
  return null
}


export function getVitalsCategories(vital: Vitals, categories: Map<string, Vitalscategories>) {
  if (!vital?.VitalsCategories?.length) {
    return []
  }
  return vital.VitalsCategories.map((it) => {
      const category = categories.get(it)
      if (!category) {
        // console.warn(`category not found`, it)
      }
      return category
    })
    .filter((it) => !!it)
}


export function isVitalNamed(vital: Vitals) {
  return NAMED_FAIMILY_TYPES.includes(vital.CreatureType)
}

export function getVitalFamilyInfo(vital: Vitals) {
  return VITAL_FAMILIES[vital?.Family?.toLowerCase()] || VITAL_FAMILIES['unknown']
}

export function getVitalDamageEffectiveness(vital: Vitals, damageType: VitalDamageType) {
  return (vital[`WKN${damageType}`] - vital[`ABS${damageType}`]) || 0
}

export function getVitalDamageEffectivenessPercent(vital: Vitals, damageType: VitalDamageType) {
  return Math.round(getVitalDamageEffectiveness(vital, damageType) * 100)
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
  DungeonAmrine: ['Nakashima', 'Simon'],
  DungeonEbonscale00: ['Dynasty', 'IsabellaDynasty'],
  DungeonCutlassKeys00: ['DryadSiren'],
  QuestApophis: ['Apophis']
}
export function getVitalDungeon(vital: Vitals, dungeons: Gamemodes[]) {
  const vitalDungeonId = getVitalDungeonId(vital.VitalsID)
  if (vitalDungeonId) {
    return dungeons.find((it) => it.GameModeId === vitalDungeonId)
  }
  if (!vital.LootTags?.length) {
    return null
  }
  for (const dungeon of dungeons) {
    if (!dungeon.IsDungeon) {
      continue
    }
    // vital references dungeon via LootTags
    const dungeonTag = dungeon.GameModeId.replace(/^Dungeon/, '')
    if (vital.LootTags.some((tag) => tag === dungeonTag)) {
      return dungeon
    }
    if (vital.CreatureType === 'DungeonBoss') {
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
  }
  return null
}
