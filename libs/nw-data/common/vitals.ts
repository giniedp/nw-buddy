import {
  DamageType,
  Damagetable,
  Gamemodes,
  Mutationdifficulty,
  Vitals,
  Vitalscategories,
  Vitalsleveldata,
  VitalsMetadata,
  Vitalsmodifierdata,
} from '@nw-data/generated'

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
  } as VitalFamilyInfo,
  ancientguardian: {
    ID: 'Ancient',
    Icon: 'assets/icons/families/ancientbane1.png',
    IconBane: 'assets/icons/families/ancientbane1.png',
    IconWard: 'assets/icons/families/ancientward1.png',
    Img: 'assets/images/missionimage_ancient1.png',
    Name: 'VC_Ancient',
  } as VitalFamilyInfo,
  corrupted: {
    ID: 'Corrupted',
    Icon: 'assets/icons/families/corruptedbane1.png',
    IconBane: 'assets/icons/families/corruptedbane1.png',
    IconWard: 'assets/icons/families/corruptedward1.png',
    Img: 'assets/images/missionimage_corrupted2.png',
    Name: 'VC_Corrupted',
  } as VitalFamilyInfo,
  angryearth: {
    ID: 'AngryEarth',
    Icon: 'assets/icons/families/angryearthbane1.png',
    IconBane: 'assets/icons/families/angryearthbane1.png',
    IconWard: 'assets/icons/families/angryearthward.png',
    Img: 'assets/images/missionimage_angryearth1.png',
    Name: 'VC_Angryearth',
  } as VitalFamilyInfo,
  lost: {
    ID: 'Lost',
    Icon: 'assets/icons/families/lostbane1.png',
    IconBane: 'assets/icons/families/lostbane1.png',
    IconWard: 'assets/icons/families/lostward1.png',
    Img: 'assets/images/missionimage_undead1.png',
    Name: 'VC_Lost',
  } as VitalFamilyInfo,
  fae: {
    ID: 'Fae',
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    IconBane: null,
    IconWard: null,
    Img: '',
    Name: 'Fae',
  } as VitalFamilyInfo,
  human: {
    ID: 'Human',
    Icon: 'assets/icons/families/humanbane1.png',
    IconBane: 'assets/icons/families/humanbane1.png',
    IconWard: 'assets/icons/families/humanward1.png',
    Img: 'assets/images/missionimage_human2.png',
    Name: 'VC_Human',
  } as VitalFamilyInfo,
  varangian: {
    ID: 'Varangian',
    Icon: 'assets/icons/families/humanbane1.png',
    IconBane: 'assets/icons/families/humanbane1.png',
    IconWard: 'assets/icons/families/humanward1.png',
    Img: 'assets/images/missionimage_human2.png',
    Name: 'VC_Human',
  } as VitalFamilyInfo,
  unknown: {
    ID: null,
    Icon: 'assets/icons/families/marker_icondeathdoor.png',
    IconBane: null,
    IconWard: null,
    Img: '',
    Name: '',
  } as VitalFamilyInfo,
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

export function getVitalTypeMarker(vitalOrcreatureType: string | Vitals): string {
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
  }).filter((it) => !!it)
}

export function isVitalNamed(vital: Vitals) {
  return NAMED_FAIMILY_TYPES.includes(vital.CreatureType)
}

export function getVitalFamilyInfo(vital: Vitals): VitalFamilyInfo {
  return VITAL_FAMILIES[vital?.Family?.toLowerCase()] || VITAL_FAMILIES.unknown
}

export function getVitalCategoryInfo(vital: Vitals): VitalFamilyInfo {
  const key = vital?.VitalsCategories?.find(isVitalCombatCategory)
  if (key) {
    return VITAL_CATEGORIES[key.toLowerCase()]
  }
  return VITAL_FAMILIES.unknown
}

export function isVitalCombatCategory(value: string) {
  value = value.toLowerCase()
  return VITAL_CATEGORIES_KEYS.some((it) => it === value)
}

export function getVitalDamageEffectiveness(vital: Vitals, damageType: VitalDamageType) {
  return vital[`WKN${damageType}`] - vital[`ABS${damageType}`] || 0
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
  vital: Vitals,
  dungeons: Gamemodes[],
  vitalsMeta: Map<string, VitalsMetadata>,
): Gamemodes[] {
  if (!vital || !dungeons?.length) {
    return []
  }
  const meta = vitalsMeta.get(vital.VitalsID)
  if (!meta) {
    return []
  }
  // "WorldBounds": "4480.0,4096.0,608.0,544.0"
  return dungeons.filter((it) => {
    if (!it.MapId || eqCaseInsensitive(it.MapId, 'newworld_vitaeeterna')) {
      // dynasty dungeon and trials are in the open world map
      // all mobs have mapId set to 'newworld_vitaeeterna'
      // we check for bounds
      const [x, y, w, h] = (it.WorldBounds?.split(',') || []).map(Number)
      return meta.spawns.some(({ position }) => {
        if (!position.length) {
          return false
        }
        return position[0] >= x && position[0] <= x + w && position[1] >= y && position[1] <= y + h
      })
    }
    return meta.mapIDs?.some((mapId) => eqCaseInsensitive(mapId, it.MapId))
  })
}

export function getVitalDungeon(vital: Vitals, dungeons: Gamemodes[], vitalsMeta: Map<string, VitalsMetadata>) {
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
  vital: Vitals
  level: Vitalsleveldata
  modifier: Vitalsmodifierdata
  difficulty?: Mutationdifficulty
}) {
  if (!vital || !level || !modifier) {
    return 0
  }
  const baseMaxHealth = level.BaseMaxHealth
  const healthMod = vital.HealthMod
  const categoryHealthMod = modifier.CategoryHealthMod
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

export function getVitalArmor(vital: Vitals, level: Vitalsleveldata) {
  if (!vital || !level) {
    return null
  }
  return {
    elementalMitigation: vital.ElementalMitigation,
    physicalMitigation: vital.PhysicalMitigation,
    elementalRating: Math.floor(Math.pow(level.GearScore, 1.2) * (1 / (1 - vital.ElementalMitigation) - 1)),
    physicalRating: Math.floor(Math.pow(level.GearScore, 1.2) * (1 / (1 - vital.PhysicalMitigation) - 1)),
  }
}

export function getVitalDamage({
  vital,
  level,
  modifier,
  damageTable,
  difficulty,
}: {
  vital: Vitals
  level: Vitalsleveldata
  damageTable: Pick<Damagetable, 'DmgCoef' | 'AddDmg'>
  modifier?: Vitalsmodifierdata
  difficulty?: Mutationdifficulty
}) {
  //
  const baseDamage = level.BaseDamage
  const dmgCoef = damageTable.DmgCoef
  const dmgMod = vital?.DamageMod || 1
  const categoryDamageMod = modifier?.CategoryDamageMod || 1
  const addDmg = damageTable.AddDmg || 0
  //const dmgIncMod = effectMap.get(difficulty?.DamageIncreaseMod)?.['DMG' + damageTable.DamageType] || 0
  const dmgPotency = 1 + (difficulty?.[`DamagePotency_${vital.CreatureType}`] || 0) / 100
  return baseDamage * dmgCoef * dmgMod * dmgPotency * categoryDamageMod + addDmg
}
