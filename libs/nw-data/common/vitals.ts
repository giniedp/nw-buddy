import {
  DamageData,
  DamageType,
  GameModeData,
  GameModeMapData,
  MutationDifficultyStaticData,
  VitalsBaseData,
  VitalsCategoryData,
  VitalsBaseData as VitalsData,
  VitalsLevelData,
  VitalsModifierData,
  ScannedVital,
} from '@nw-data/generated'
import { getArmorRating } from './damage'
import { uniq } from 'lodash'

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

export interface VitalFamilyInfo {
  ID: string
  Icon: string
  IconBane: string
  IconWard: string
  Img: string
  Name: string
}
const VITAL_FAMILIES = {
  wildlife: {
    ID: 'Wildlife',
    Icon: 'assets/icons/families/bestialbane1.png',
    IconBane: 'assets/icons/families/bestialbane1.png',
    IconWard: 'assets/icons/families/bestialward1.png',
    Img: 'assets/images/missionimage_wolf.png',
    Name: 'VC_Beast',
  } satisfies VitalFamilyInfo,
  ancientguardian: {
    ID: 'Ancient',
    Icon: 'assets/icons/families/ancientbane1.png',
    IconBane: 'assets/icons/families/ancientbane1.png',
    IconWard: 'assets/icons/families/ancientward1.png',
    Img: 'assets/images/missionimage_ancient1.png',
    Name: 'VC_Ancient',
  } satisfies VitalFamilyInfo,
  corrupted: {
    ID: 'Corrupted',
    Icon: 'assets/icons/families/corruptedbane1.png',
    IconBane: 'assets/icons/families/corruptedbane1.png',
    IconWard: 'assets/icons/families/corruptedward1.png',
    Img: 'assets/images/missionimage_corrupted2.png',
    Name: 'VC_Corrupted',
  } satisfies VitalFamilyInfo,
  angryearth: {
    ID: 'AngryEarth',
    Icon: 'assets/icons/families/angryearthbane1.png',
    IconBane: 'assets/icons/families/angryearthbane1.png',
    IconWard: 'assets/icons/families/angryearthward.png',
    Img: 'assets/images/missionimage_angryearth1.png',
    Name: 'VC_Angryearth',
  } satisfies VitalFamilyInfo,
  lost: {
    ID: 'Lost',
    Icon: 'assets/icons/families/lostbane1.png',
    IconBane: 'assets/icons/families/lostbane1.png',
    IconWard: 'assets/icons/families/lostward1.png',
    Img: 'assets/images/missionimage_undead1.png',
    Name: 'VC_Lost',
  } satisfies VitalFamilyInfo,
  fae: {
    ID: 'Fae',
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    IconBane: null,
    IconWard: null,
    Img: '',
    Name: 'Fae',
  } satisfies VitalFamilyInfo,
  human: {
    ID: 'Human',
    Icon: 'assets/icons/families/humanbane1.png',
    IconBane: 'assets/icons/families/humanbane1.png',
    IconWard: 'assets/icons/families/humanward1.png',
    Img: 'assets/images/missionimage_human2.png',
    Name: 'VC_Human',
  } satisfies VitalFamilyInfo,
  varangian: {
    ID: 'Varangian',
    Icon: 'assets/icons/families/humanbane1.png',
    IconBane: 'assets/icons/families/humanbane1.png',
    IconWard: 'assets/icons/families/humanward1.png',
    Img: 'assets/images/missionimage_human2.png',
    Name: 'VC_Varangian',
  } satisfies VitalFamilyInfo,
  unknown: {
    ID: null,
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    IconBane: null,
    IconWard: null,
    Img: '',
    Name: '',
  } satisfies VitalFamilyInfo,
}

const VITAL_CATEGORIES = {
  lost: VITAL_FAMILIES.lost,
  beast: VITAL_FAMILIES.wildlife,
  ancient: VITAL_FAMILIES.ancientguardian,
  corrupted: VITAL_FAMILIES.corrupted,
  angryearth: VITAL_FAMILIES.angryearth,
  human: VITAL_FAMILIES.human,
  varangian: VITAL_FAMILIES.varangian,
} as const
const VITAL_CATEGORIES_KEYS = Object.keys(VITAL_CATEGORIES)

const ICON_STRONG_ATTACK = 'assets/icons/strongattack.png'
const ICON_WEAK_ATTACK = 'assets/icons/weakattack.png'

export type VitalDamageType = DamageType

export function getVitalTypeMarker(vitalOrcreatureType: string | VitalsData): string {
  if (typeof vitalOrcreatureType !== 'string') {
    vitalOrcreatureType = vitalOrcreatureType?.CreatureType
  }
  return CREATURE_TYPE_MARKER[vitalOrcreatureType] || CREATURE_TYPE_MARKER['Critter']
}

export function getVitalAliasName(categories: VitalsCategoryData[]) {
  if (categories.find((it) => it.IsNamed && it.VitalsCategoryID === 'Named')) {
    return categories.find((it) => it.IsNamed && it.VitalsCategoryID !== 'Named')?.DisplayName
  }
  return null
}

export function getVitalsCategories(vital: VitalsData, categories: Map<string, VitalsCategoryData>) {
  if (!vital?.VitalsCategories?.length) {
    return []
  }
  return vital.VitalsCategories.map((it) => {
    const category = categories.get(it)
    if (!category) {
      // console.warn(`category not found`, it)
    }
    return category
  }).filter((it) => !!it)
}

export function isVitalNamed(vital: VitalsData) {
  return NAMED_FAIMILY_TYPES.includes(vital.CreatureType)
}

export function getVitalFamilyInfo(vital: VitalsData): VitalFamilyInfo {
  return VITAL_FAMILIES[vital?.Family?.toLowerCase()] || VITAL_FAMILIES.unknown
}

export function getVitalCategoryInfo(vital: VitalsData): VitalFamilyInfo[] {
  const keys = vital?.VitalsCategories || []
  const categories = keys.map((key) => VITAL_CATEGORIES[key.toLowerCase()]).filter((it) => !!it)
  if (!categories.length) {
    return [VITAL_FAMILIES.unknown]
  }
  return categories
}

export function isVitalCombatCategory(value: string) {
  value = value.toLowerCase()
  return VITAL_CATEGORIES_KEYS.some((it) => it === value)
}

export function getVitalWKN(vital: VitalsData, damageType: VitalDamageType): number {
  return vital[`WKN${damageType}`] || 0
}

export function getVitalABS(vital: VitalsData, damageType: VitalDamageType): number {
  return vital[`ABS${damageType}`] || 0
}

export function getVitalDamageEffectiveness(vital: VitalsData, damageType: VitalDamageType) {
  return vital[`WKN${damageType}`] - vital[`ABS${damageType}`] || 0
}

export function getVitalDamageEffectivenessPercent(vital: VitalsData, damageType: VitalDamageType) {
  return Math.round(getVitalDamageEffectiveness(vital, damageType) * 100)
}

export function getVitalDamageEffectivenessIcon(vital: VitalsData, damageType: VitalDamageType) {
  const dmg = getVitalDamageEffectiveness(vital, damageType)
  if (dmg < 0) {
    return ICON_WEAK_ATTACK
  }
  if (dmg > 0) {
    return ICON_STRONG_ATTACK
  }
  return null
}

// export type DungeonTerritory =
//   | 'Windsward'
//   | 'Edengrove'
//   | 'Everfall'
//   | 'Restless'
//   | 'Reekwater'
//   | 'Ebonscale'
//   | 'ShatterMtn'
//   | 'Cutlass'
//   | 'BrimstoneSands'

// export function getVitalDungeonTerritory(vitalId: string): DungeonTerritory {
//   return vitalId?.match(/_DG_([a-zA-Z]+)_/)?.[1] as DungeonTerritory
// }
// export function getVitalDungeonTag(vitalId: string) {
//   switch (getVitalDungeonTerritory(vitalId)) {
//     case 'Windsward':
//       return 'Amrine'
//     case 'Edengrove':
//       return 'Edengrove00'
//     case 'Everfall':
//       return 'ShatteredObelisk'
//     case 'Restless':
//       return 'RestlessShores01'
//     case 'Reekwater':
//       return 'Reekwater00'
//     case 'Ebonscale':
//       return 'Ebonscale00'
//     case 'ShatterMtn':
//       return 'ShatterMtn00'
//     case 'Cutlass':
//       return 'CutlassKeys00'
//     case 'BrimstoneSands':
//       return 'BrimstoneSands00'
//     default:
//       return null
//   }
// }
// export function getVitalDungeonId(vitalId: string): string {
//   const tag = getVitalDungeonTag(vitalId)
//   return tag ? `Dungeon${tag}` : null
// }
// const MAP_DUNGEON_TO_VITALS_LOOT_TAGS: Record<string, string[]> = {
//   DungeonAmrine: ['Nakashima', 'Simon'],
//   DungeonEbonscale00: ['Dynasty', 'IsabellaDynasty'],
//   DungeonCutlassKeys00: ['DryadSiren'],
//   QuestApophis: ['Apophis']
// }

export function getVitalDungeons(
  vital: VitalsData,
  dungeons: GameModeMapData[],
  vitalsMeta: Map<string, ScannedVital>,
): GameModeMapData[] {
  if (!vital || !dungeons?.length) {
    return []
  }
  const meta = vitalsMeta?.get(vital.VitalsID)
  if (!meta) {
    return []
  }
  // "WorldBounds": "4480.0,4096.0,608.0,544.0"
  return dungeons.filter((it) => {
    if (!it.UIMapId || eqCaseInsensitive(it.UIMapId, 'newworld_vitaeeterna')) {
      // dynasty dungeon and trials are in the open world map
      // all mobs have mapId set to 'newworld_vitaeeterna'
      // we check for bounds
      const [x, y, w, h] = (it.WorldBounds?.split(',') || []).map(Number)
      const spawns = meta.spawns?.['newworld_vitaeeterna'] || []
      return spawns.some(({ p }) => {
        if (!p.length) {
          return false
        }
        return p[0] >= x && p[0] <= x + w && p[1] >= y && p[1] <= y + h
      })
    }
    return meta.mapIDs?.some((mapId) => eqCaseInsensitive(mapId, it.UIMapId))
  })
}

export function getVitalDungeon(vital: VitalsData, dungeons: GameModeMapData[], vitalsMeta: Map<string, ScannedVital>) {
  return getVitalDungeons(vital, dungeons, vitalsMeta)?.[0]
}

function eqCaseInsensitive(a: string, b: string) {
  return a?.toLowerCase() === b?.toLowerCase()
}

export function getVitalHealth({
  vital,
  level,
  modifier,
  difficulty,
}: {
  vital: VitalsData
  level: VitalsLevelData
  modifier: VitalsModifierData
  difficulty?: MutationDifficultyStaticData
}) {
  if (!vital || !level) {
    return 0
  }
  const baseMaxHealth = level.BaseMaxHealth
  const healthMod = vital.HealthMod
  const categoryHealthMod = modifier?.CategoryHealthMod || 1
  const potency = difficulty?.[`HealthPotency_${vital.CreatureType}`] || 0
  const result = Math.floor(Math.floor(baseMaxHealth) * healthMod * categoryHealthMod * (1 + potency * 0.01))
  // console.table({
  //   baseMaxHealth,
  //   healthMod,
  //   categoryHealthMod,
  //   potency,
  //   result,
  // })
  return result
}

export function getVitalGearScoreFromLevel(level: number) {
  return (level || 0) * 10
}

export function getVitalArmor(vital: VitalsData, level: VitalsLevelData) {
  if (!vital || !level) {
    return null
  }
  return {
    elementalMitigation: vital.ElementalMitigation,
    physicalMitigation: vital.PhysicalMitigation,
    elementalRating: getArmorRating({
      gearScore: level.GearScore,
      mitigation: vital.ElementalMitigation || 0,
    }),
    physicalRating: getArmorRating({
      gearScore: level.GearScore,
      mitigation: vital.PhysicalMitigation || 0,
    }),
  }
}

export function getVitalArmorFromGS(vital: VitalsData, gearScore: number) {
  if (!vital) {
    return null
  }
  return {
    elementalMitigation: vital.ElementalMitigation,
    physicalMitigation: vital.PhysicalMitigation,
    elementalRating: getArmorRating({
      gearScore: gearScore || 0,
      mitigation: vital.ElementalMitigation,
    }),
    physicalRating: getArmorRating({
      gearScore: gearScore || 0,
      mitigation: vital.PhysicalMitigation,
    }),
  }
}

export function getVitalDamage({
  vital,
  level,
  modifier,
  damageTable,
  difficulty,
}: {
  vital: VitalsData
  level: VitalsLevelData
  damageTable: Pick<DamageData, 'DmgCoef' | 'AddDmg'>
  modifier?: VitalsModifierData
  difficulty?: MutationDifficultyStaticData
}) {
  //
  const baseDamage = level?.BaseDamage || 0
  const dmgCoef = damageTable.DmgCoef
  const dmgMod = Number(vital?.DamageMod) || 1
  const categoryDamageMod = modifier?.CategoryDamageMod || 1
  const addDmg = damageTable.AddDmg || 0
  //const dmgIncMod = effectMap.get(difficulty?.DamageIncreaseMod)?.['DMG' + damageTable.DamageType] || 0
  const dmgPotency = 1 + (difficulty?.[`DamagePotency_${vital.CreatureType}`] || 0) / 100

  const result = baseDamage * dmgCoef * dmgMod * dmgPotency * categoryDamageMod + addDmg
  // console.debug('getVitalDamage', damageTable['DamageID'], {
  //   vital,
  //   level,
  //   modifier,
  //   damageTable,
  //   difficulty,
  // })
  // console.table({
  //   baseDamage,
  //   dmgCoef,
  //   dmgMod,
  //   categoryDamageMod,
  //   addDmg,
  //   dmgPotency,
  //   result
  // })
  return result
}
