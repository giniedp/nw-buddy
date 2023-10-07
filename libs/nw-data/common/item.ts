import {
  Crafting,
  Housingitems,
  ItemClass,
  ItemDefinitionMaster,
  ItemdefinitionsArmor,
  ItemdefinitionsRunes,
  ItemdefinitionsWeapons,
  Perks,
} from '@nw-data/generated'
import type { AttributeRef } from './attributes'
import {
  NW_ITEM_RARITY_DATA,
  NW_MAX_GEAR_SCORE,
  NW_MAX_GEAR_SCORE_UPGRADABLE,
  NW_MIN_GEAR_SCORE,
  NW_ROLL_PERK_ON_UPGRADE_PERK_COUNT,
  NW_ROLL_PERK_ON_UPGRADE_TIER,
} from './constants'
import { damageForTooltip } from './damage'
import { CaseInsensitiveMap } from './utils/caseinsensitive-map'
import { eqCaseInsensitive } from './utils/caseinsensitive-compare'
import { flatten, groupBy } from 'lodash'

export function isMasterItem(item: unknown): item is ItemDefinitionMaster {
  return item != null && typeof item === 'object' && 'ItemID' in item
}

export function isHousingItem(item: unknown): item is Housingitems {
  return item != null && typeof item === 'object' && 'HouseItemID' in item
}

export function isItemArmor(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Armor')
}

export function isItemJewelery(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Jewelry')
}

export function isItemWeapon(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Weapon')
}

export function isItemShield(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('EquippableOffHand')
}

export function isItemTool(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('EquippableTool')
}

export function isItemConsumable(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Consumable')
}

export function isItemNamed(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Named')
}

export function isItemArtifact(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Artifact')
}

export function isItemSwordOrShield(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Sword') || item?.ItemClass?.includes('Shield')
}

export function isItemHeargem(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('HeartGem')
}

export function isPerkItemIngredient(item: ItemDefinitionMaster | null) {
  return hasItemIngredientCategory(item, 'Perkitem')
}

export function isItemOfAnyClass(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null, classes: ItemClass[]) {
  return classes.some((a) => item.ItemClass?.some((b) => eqCaseInsensitive(a, b)))
}

export function getFirstItemClassOf(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null, classes: ItemClass[]) {
  return classes.find((a) => item.ItemClass?.some((b) => eqCaseInsensitive(a, b)))
}

export function hasItemIngredientCategory(item: ItemDefinitionMaster, categoryId: string) {
  return item?.IngredientCategories?.some((it) => it.toLocaleLowerCase() === String(categoryId).toLocaleLowerCase())
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'artifact'
const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact']
const ITEM_RARITY_LABELS: Record<ItemRarity, string> = {
  common: `RarityLevel0_DisplayName`,
  uncommon: `RarityLevel1_DisplayName`,
  rare: `RarityLevel2_DisplayName`,
  epic: `RarityLevel3_DisplayName`,
  legendary: `RarityLevel4_DisplayName`,
  artifact: `ui_artifact`,
}
export function getItemRarityWeight(item: ItemDefinitionMaster | Housingitems | ItemRarity) {
  let rarity: ItemRarity
  if (typeof item !== 'string') {
    rarity = getItemRarity(item)
  } else {
    rarity = item
  }
  return ITEM_RARITIES.indexOf(rarity) ?? ITEM_RARITIES.length
}
export function getItemRarity(item: ItemDefinitionMaster | Housingitems, itemPerkIds?: string[]): ItemRarity {
  if (!item) {
    return ITEM_RARITIES[0]
  }
  if (item.ForceRarity) {
    return ITEM_RARITIES[item.ForceRarity]
  }
  if (!isMasterItem(item)) {
    return ITEM_RARITIES[0]
  }
  if (isItemArtifact(item)) {
    return 'artifact'
  }

  if (!itemPerkIds) {
    itemPerkIds = getItemPerkIds(item)
  }

  let rarity = 0
  let maxRarity = NW_ITEM_RARITY_DATA.length - 1
  let perkCount = itemPerkIds.length
  if (!isItemUpgradable(item)) {
    perkCount = Math.min(perkCount, NW_ROLL_PERK_ON_UPGRADE_PERK_COUNT)
  }
  for (let i = 0; i < NW_ITEM_RARITY_DATA.length; i++) {
    if (perkCount <= NW_ITEM_RARITY_DATA[i].maxPerkCount) {
      rarity = i
      break
    }
  }
  rarity = Math.min(rarity, maxRarity)
  return ITEM_RARITIES[rarity]
}

function isItemUpgradable(item: ItemDefinitionMaster) {
  if (item.Tier < NW_ROLL_PERK_ON_UPGRADE_TIER) {
    return false
  }
  if (getItemMaxGearScore(item, false) < NW_MAX_GEAR_SCORE_UPGRADABLE) {
    return false
  }
  return true
}

export function getItemRarityLabel(item: ItemDefinitionMaster | Housingitems | ItemRarity): string {
  if (typeof item === 'string') {
    return ITEM_RARITY_LABELS[item]
  }
  return ITEM_RARITY_LABELS[getItemRarity(item)]
}

export function getItemPerkIdsWithOverride(item: ItemDefinitionMaster, overrides: Record<string, string>) {
  const perks = (getItemPerkKeys(item) || []).map((key) => overrides[key] || (item[key] as string))
  const randoms = (getItemPerkBucketKeys(item) || []).map((key) => overrides[key])
  return [...perks, ...randoms].filter((it) => !!it)
}

export interface ItemPerkInfo {
  key: string
  perkId?: string
  bucketId?: string
}

export function getItemPerkInfos(item: ItemDefinitionMaster, overrides?: Record<string, string>): ItemPerkInfo[] {
  return [
    ...getItemPerkKeys(item)
      .map((key) => {
        return {
          key: key,
          perkId: overrides?.[key] || item[key],
        }
      })
      .filter((it) => !!it.perkId),
    ...getItemPerkBucketKeys(item)
      .map((key) => {
        return {
          key: key,
          perkId: overrides?.[key],
          bucketId: item[key],
        }
      })
      .filter((it) => !!it.bucketId),
  ]
}

export function getItemPerks(item: ItemDefinitionMaster, perks: Map<string, Perks>) {
  return (
    item &&
    getItemPerkIds(item)
      .map((it) => perks.get(it))
      .filter((it) => it != null)
  )
}

const PERK_KEYS = ['Perk1', 'Perk2', 'Perk3', 'Perk4', 'Perk5'] as const
export function getItemPerkKeys(item: ItemDefinitionMaster): string[] {
  return PERK_KEYS.filter((it) => item && it in item)
}

export function getItemPerkIds(item: ItemDefinitionMaster) {
  const result = []
  for (const key of PERK_KEYS) {
    if (item && item[key]) {
      result.push(item[key])
    }
  }
  return result
}

const PERK_SLOT_KEYS = ['PerkSlot1', 'PerkSlot2', 'PerkSlot3', 'PerkSlot4', 'PerkSlot5'] as const
const PERK_BUCKET_KEYS = ['PerkBucket1', 'PerkBucket2', 'PerkBucket3', 'PerkBucket4', 'PerkBucket5'] as const

export function getItemPerkBucketKeys(item: ItemDefinitionMaster): string[] {
  return PERK_BUCKET_KEYS.filter((it) => item && it in item)
}
export function getItemPerkBucketIds(item: ItemDefinitionMaster) {
  return [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5].filter((it) => !!it)
}

export interface ItemPerkSlot {
  slotKey: string
  slotId: string
  perkKey: string
  perkId?: string
  bucketKey: string
  bucketId?: string
}

export function getItemPerkSlots(item: ItemDefinitionMaster) {
  if (!item) {
    return []
  }
  const result: ItemPerkSlot[] = []
  for (let i = 0; i < PERK_SLOT_KEYS.length; i++) {
    const slotKey = PERK_SLOT_KEYS[i]
    const perkKey = PERK_KEYS[i]
    const bucketKey = PERK_BUCKET_KEYS[i]
    if (!(slotKey in item) && !(perkKey in item) && !(bucketKey in item)) {
      continue
    }
    result.push({
      slotKey: slotKey,
      slotId: item[slotKey],
      perkKey: perkKey,
      perkId: item[perkKey],
      bucketKey: bucketKey,
      bucketId: item[bucketKey],
    })
  }
  return result
}

export function getItemMaxGearScore(item: ItemDefinitionMaster, fallback = true) {
  return item?.GearScoreOverride || item?.MaxGearScore || (fallback ? NW_MAX_GEAR_SCORE : null)
}
export function getItemMinGearScore(item: ItemDefinitionMaster, fallback = true) {
  return item?.GearScoreOverride || item?.MinGearScore || (fallback ? NW_MIN_GEAR_SCORE : null)
}
export function getItemGearScoreLabel(item: ItemDefinitionMaster) {
  if (!item) {
    return ''
  }
  if (item.GearScoreOverride) {
    return String(item.GearScoreOverride)
  }
  if (item.MinGearScore && item.MaxGearScore) {
    return `${item.MinGearScore}-${item.MaxGearScore}`
  }
  return String(item.MaxGearScore || item.MinGearScore || '')
}

export function hasItemGearScore(item: ItemDefinitionMaster) {
  return item && (item.GearScoreOverride || item.MinGearScore || item.MaxGearScore)
}

const ITEM_TYPE_LABELS = {
  Armor: 'ui_armor',
  Ammo: 'inv_ammo',
  Currency: 'ui_currency',
  Blueprint: 'ui_blueprints',
  Consumable: 'ui_consumables',
  Weapon: 'ui_weapons',
  Dye: 'ui_dyes',
  Lore: 'inv_loreitems',
  Resource: 'inv_resources',
  ThrowableItem: 'ThrowableItem',
  MountDye: 'MountDye',
}

export function getItemTypeLabel(type: string) {
  return ITEM_TYPE_LABELS[type] || null
}

export function getItemTypeName(item: ItemDefinitionMaster | Housingitems) {
  if (isMasterItem(item)) {
    return item.ItemTypeDisplayName
  }
  if (isHousingItem(item)) {
    return item.ItemType
  }
  return null
}

export function getItemId(item: ItemDefinitionMaster | Housingitems) {
  if (isMasterItem(item)) {
    return item.ItemID
  }
  if (isHousingItem(item)) {
    return item.HouseItemID
  }
  return null
}

export function getItemIdFromRecipe(item: Crafting): string {
  if (!item) {
    return null
  }
  if (item[`ProceduralTierID${item.BaseTier}`]) {
    return item[`ProceduralTierID${item.BaseTier}`]
  }
  if (item.ItemID) {
    return item.ItemID
  }
  return (
    item &&
    (item.ProceduralTierID5 ||
      item.ProceduralTierID4 ||
      item.ProceduralTierID3 ||
      item.ProceduralTierID2 ||
      item.ProceduralTierID1)
  )
}

export function getRecipeForItem(item: ItemDefinitionMaster | Housingitems, recipes: Map<string, Set<Crafting>>) {
  const id = getItemId(item)
  if (!id) {
    return null
  }
  return Array.from(recipes.get(id) || []).find((recipe) => {
    if (recipe.CraftingCategory === 'MaterialConversion' || !recipe.OutputQty) {
      return false
    }
    return true
  })
  // TODO: review
  // return recipes.find((recipe) => {
  //   if (recipe.CraftingCategory === 'MaterialConversion' || !recipe.OutputQty) {
  //     return false
  //   }
  //   if (recipe.IsProcedural) {
  //     return recipe[`ProceduralTierID${recipe.BaseTier}`] === id
  //   }
  //   return recipe.RecipeID === item.CraftingRecipe || recipe.ItemID === id
  // })
}

export function getItemIconPath(item: ItemDefinitionMaster | Housingitems, female: boolean = false) {
  if (!item) {
    return null
  }
  return item.IconPath
}

export function getArmorRatingElemental(item: ItemdefinitionsArmor | ItemdefinitionsWeapons, gearScore: number) {
  if (!item?.ElementalArmorSetScaleFactor) {
    return 0
  }
  return Math.pow(gearScore, 1.2) * item.ElementalArmorSetScaleFactor * item.ArmorRatingScaleFactor
}

export function getArmorRatingPhysical(item: ItemdefinitionsArmor | ItemdefinitionsWeapons, gearScore: number) {
  if (!item?.PhysicalArmorSetScaleFactor) {
    return 0
  }
  return Math.pow(gearScore, 1.2) * item.PhysicalArmorSetScaleFactor * item.ArmorRatingScaleFactor
}

export function getWeightLabel(weight: number): 'light' | 'medium' | 'heavy' {
  let label: 'light' | 'medium' | 'heavy' = 'light'
  if (weight >= 13) {
    label = 'medium'
  }
  if (weight >= 23) {
    label = 'heavy'
  }
  return label
}

export function getItemTradingGroupLabel(value: string) {
  return value != null ? `${value}_GroupName` : null
}

export function getItemTradingFamilyLabel(value: string) {
  return value != null ? `CategoryData_${value}` : null
}
export function getTradingCategoryLabel(value: string) {
  return value != null ? `CategoryData_${value}` : null
}

export function getUIHousingCategoryLabel(value: string) {
  return value != null ? `ui_${value}` : null
}

export interface ItemStat {
  item: ItemDefinitionMaster
  label: string
  value: string | number
}

export function getItemStatsWeapon({
  item,
  stats,
  gearScore,
  playerLevel,
  attrValueSums,
}: {
  item: ItemDefinitionMaster
  stats: ItemdefinitionsWeapons | ItemdefinitionsRunes
  gearScore: number
  playerLevel: number
  attrValueSums?: Record<AttributeRef, number>
}) {
  const result: ItemStat[] = []
  if (!attrValueSums || !playerLevel) {
    if (stats?.BaseDamage) {
      result.push({
        item,
        label: 'ui_tooltip_basedamage',
        value: stats.BaseDamage,
      })
    }
  } else if (stats?.BaseDamage) {
    result.push({
      item,
      label: 'ui_tooltip_damage',
      value: damageForTooltip({
        playerLevel,
        attrSums: attrValueSums,
        gearScore: gearScore,
        weapon: stats as ItemdefinitionsWeapons,
      }),
    })
  }

  if (stats?.CritChance != null) {
    result.push({
      item,
      label: 'ui_tooltip_critical_hit_chance',
      value: toPercent(stats.CritChance),
    })
  }
  if (stats?.CritDamageMultiplier != null) {
    result.push({
      item,
      label: 'ui_tooltip_critical_damage_multiplier',
      value: stats.CritDamageMultiplier.toFixed(1),
    })
  }
  if (stats?.BlockStaminaDamage != null) {
    result.push({
      item,
      label: 'ui_tooltip_block_stamina_damage',
      value: stats.BlockStaminaDamage.toFixed(1),
    })
  }
  if (stats?.BaseStaggerDamage != null) {
    result.push({
      item,
      label: 'Base Stagger Damage',
      value: stats.BaseStaggerDamage.toFixed(1),
    })
  }
  if (stats && 'ElementalArmorSetScaleFactor' in stats) {
    if (stats?.ElementalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
      result.push({
        item,
        label: 'ui_elemental',
        value: getArmorRatingElemental(stats, gearScore).toFixed(1),
      })
    }
  }
  if (stats && 'PhysicalArmorSetScaleFactor' in stats) {
    if (stats?.PhysicalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
      result.push({
        item,
        label: 'ui_physical',
        value: getArmorRatingPhysical(stats, gearScore).toFixed(1),
      })
    }
  }
  if (stats?.BlockStability != null) {
    result.push({
      item,
      label: 'ui_tooltip_blockingstability',
      value: `${stats.BlockStability}%`,
    })
  }
  return result
}

export function getItemStatsArmor(item: ItemDefinitionMaster, stats: ItemdefinitionsArmor, score: number) {
  const result: ItemStat[] = []
  if (stats?.ElementalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
    result.push({
      item,
      label: 'ui_elemental',
      value: getArmorRatingElemental(stats, score).toFixed(1),
    })
  }
  if (stats?.PhysicalArmorSetScaleFactor != null && !!stats?.ArmorRatingScaleFactor) {
    result.push({
      item,
      label: 'ui_physical',
      value: getArmorRatingPhysical(stats, score).toFixed(1),
    })
  }
  return result
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

const ATTRIBUTION_ICONS = new CaseInsensitiveMap(
  Object.entries({
    WinterConvergence: 'assets/icons/attribution/winter_convergence.png',
    SummerMedleyfaire: 'assets/icons/attribution/summer_medleyfaire.png',
    SpringtideBloom: 'assets/icons/attribution/springtide_bloom.png',
    NightveilHallow: 'assets/icons/attribution/nightveil_hallow.png',
    TurkeyTerror: 'assets/icons/attribution/turkey_terror.png',
    RabbitSeason: 'assets/icons/attribution/rabbit_season.png',
    Season: 'assets/icons/attribution/season.png',
    Unknown: 'assets/icons/attribution/unknown.png',
  })
)

export function getItemAttribution(item: ItemDefinitionMaster | Housingitems) {
  if (!item?.AttributionId) {
    return null
  }
  const [attribution, year] = item.AttributionId.split('_')
  return {
    id: item.AttributionId,
    label: `attribution_${item.AttributionId}`,
    icon: ATTRIBUTION_ICONS.get(attribution) || ATTRIBUTION_ICONS.get('Unknown'),
    year: year,
  }
}

const EXPANSION_ICONS = new CaseInsensitiveMap(
  Object.entries({
    Expansion2023: 'assets/icons/attribution/expansion2023.png',
  })
)

export function getItemExpansion(expansionId: string) {
  if (!expansionId) {
    return null
  }
  return {
    id: expansionId,
    label: `ui_${expansionId}_title`,
    icon: EXPANSION_ICONS.get(expansionId) || ATTRIBUTION_ICONS.get('Unknown'),
  }
}

const ITEM_ID_SUFFIXES = [
  //
  'Heavy',
  'Light',
  'Medium',
  '_',
  //
  'Head',
  'Chestguard',
  'Chest',
  'Hands',
  'Legs',
  'Feet',
  'Feets',
  'Legguards',
  //
  'Shirt',
  'Hat',
  'Pants',
  'Shoes',
  'Gloves',
  //
  'Coat',
  'Hat',
  'Pants',
  'Boots',
  'Gloves',
  //
  'Breastplate',
  'Helm',
  'Greaves',
  'Boots',
  'Gauntlets',
  //
  'Sabatons',
  'Shoes',
  'Thighguards',
  'Handcovers',
  'Cowl',
  //
  'Masque',
]
const ITEM_ID_SUFFIXES_PATTERN = `(${ITEM_ID_SUFFIXES.join('|')})`

export function getItemGearsetID(item: Pick<ItemDefinitionMaster, 'ItemID'>) {
  if (!item || !item.ItemID) {
    return null
  }
  return item.ItemID.replace(new RegExp(ITEM_ID_SUFFIXES_PATTERN, 'i'), '')
}

const APPEARANCE_ID_SUFFIXES = [
  'head',
  'hat',
  'helm',

  'chest',
  'Shirt',
  'Chest',

  'hands',
  'gloves',
  'Gloves',
  'forearms',
  'Hands',

  'legs',
  'Pants',
  'thighs',
  'Legs',

  'feet',
  'Boots',
  'Feet',
  'calves',
]

const APPEARANCE_ID_SUFFIXES_PATTERN = `(${APPEARANCE_ID_SUFFIXES.join('|')})`

export function getAppearanceGearsetId(appearanceID: string) {
  if (!appearanceID) {
    return null
  }
  return appearanceID.replace(new RegExp(APPEARANCE_ID_SUFFIXES_PATTERN, 'i'), '')
}

export function getItemCostumeId(item: ItemDefinitionMaster) {
  if (item?.ItemID?.startsWith('NG_')) {
    return item.ItemID.replace('NG_', '')
  }
  return null
}

const ITEM_ID_TOKEN_LOAD = ['heavy', 'light', 'medium']
const ITEM_ID_TOKEN_TIER = ['t1', 't2', 't3', 't4', 't5', 't51', 't52', 't53', 't54']
const ITEM_ID_TOKEN_VERSION = ['v1', 'v2', 'v3', 'v4', 'v5', 'new', 'xpac']
const ITEM_ID_TOKEN_TRASH = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ITEM_ID_TOKEN_HEAD = ['cowl', 'hat', 'head', 'helm', 'masque', 'mask', 'crown', 'tiara']
const ITEM_ID_TOKEN_CHEST = ['breastplate', 'chestguard', 'chest', 'coat', 'shirt', 'robe']
const ITEM_ID_TOKEN_HANDS = ['gauntlets', 'gloves', 'handcovers', 'hands']
const ITEM_ID_TOKEN_LEGS = ['greaves', 'legguards', 'pants', 'thighguards', 'leggings']
const ITEM_ID_TOKEN_FEET = ['boots', 'feets', 'feet', 'gloves', 'legs', 'sabatons', 'shoes']
const ITEM_ID_TOKEN_JEWLERY = ['amulet', 'earring', 'ring']
const ITEM_ID_TOKEN_ATTR = ['con', 'dex', 'str', 'foc', 'int']
const ITEM_ID_TOKEN_WEAPON = [
  '1h',
  '2h',
  'blunderbuss',
  'bow',
  'elementalgauntletice',
  'elementalstafffire',
  'firestaff',
  'flail',
  'gauntletice',
  'gauntletvoid',
  'greataxe',
  'greatsword',
  'hatchet',
  'icegauntlet',
  'kite',
  'lifestaff',
  'longsword',
  'musket',
  'rapier',
  'round',
  'shield',
  'spear',
  'stafffire',
  'stafflife',
  'sword',
  'tower',
  'voidgauntlet',
  'warhammer',
]
const ITEM_ID_TOKEN_TOKENS = [
  ...ITEM_ID_TOKEN_LOAD,
  ...ITEM_ID_TOKEN_TIER,
  ...ITEM_ID_TOKEN_HEAD,
  ...ITEM_ID_TOKEN_CHEST,
  ...ITEM_ID_TOKEN_HANDS,
  ...ITEM_ID_TOKEN_LEGS,
  ...ITEM_ID_TOKEN_FEET,
  ...ITEM_ID_TOKEN_VERSION,
  ...ITEM_ID_TOKEN_JEWLERY,
  ...ITEM_ID_TOKEN_WEAPON,
  ...ITEM_ID_TOKEN_TRASH,
  //...ITEM_ID_TOKEN_ATTR,
]

export function tokenizeItemID(itemID: string): string[] {
  if (!itemID) {
    return null
  }
  return (
    itemID
      .replace(/^1H/, '1h ')
      .replace(/^2H/, '2h ')
      .replace(/([^A-Z])([A-Z])/g, '$1 $2')
      // separate gear score values
      .replace(/(\d\d\d)/g, ' $1 ')
      // separate trailing numbers (except tier and version)
      .replace(/([^VT\d])(\d)/g, '$1 $2')
      // collapse whitespaces
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      // join tokens that belong together
      .replace(/(Elemental) (Gauntlet) (Ice)/g, '$1$2$3')
      .replace(/(Elemental) (Staff) (Fire)/g, '$1$2$3')
      .replace(/(Void|Ice|Gauntlet) (Gauntlet|Void|Ice)/g, '$1$2')
      .replace(/(Fire|Life|Staff) (Fire|Life|Staff)/g, '$1$2')
      .replace(/(Great) (Axe|Sword)/g, '$1$2')
      .toLowerCase()
      .split(/\s/)
      .filter((it) => !!it)
  )
}

export function checkItemSet(items: ItemDefinitionMaster[]) {
  items = items.filter((it) => it.ItemType === 'Weapon')
  const tokens = flatten(items.map((it) => tokenizeItemID(it.ItemID)))
  const data = Array.from(Object.entries(groupBy(tokens, (it) => it)))
    .map(([key, value]) => [key, value.length] as const)
    .sort((a, b) => b[1] - a[1])
  console.log(data)
}
export function getItemSetFamilyName(item: Pick<ItemDefinitionMaster, 'ItemID'>) {
  const tokens = tokenizeItemID(item?.ItemID) || []
  const familyTokens = tokens.filter(
    (token) => !ITEM_ID_TOKEN_TOKENS.includes(token) && !token.match(/^\d\d\d$/) && !token.match(/^t\d+$/)
  )
  return familyTokens.join(' ')
}

export function getItemVersionString(item: Pick<ItemDefinitionMaster, 'ItemID'>) {
  const tokens = tokenizeItemID(item?.ItemID) || []
  const version = tokens.filter((token) => ITEM_ID_TOKEN_VERSION.includes(token)).join(' ')
  const tierVersion = tokens.filter((token) => ITEM_ID_TOKEN_TIER.includes(token)).find((it) => it.match(/^t\d\d+$/))
  const gs = tokens.find((token) => token.match(/^\d\d\d$/))
  return [version || '', gs ? `gs${gs}` : '', tierVersion || ''].filter((it) => !!it).join(' ')
}
