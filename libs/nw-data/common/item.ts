import {
  Crafting,
  Housingitems,
  ItemDefinitionMaster,
  ItemdefinitionsArmor,
  ItemdefinitionsRunes,
  ItemdefinitionsWeapons,
  Perks,
} from '@nw-data/generated'
import type { AttributeRef } from './attributes'
import { NW_MAX_GEAR_SCORE, NW_MAX_GEAR_SCORE_UPGRADABLE, NW_MIN_GEAR_SCORE } from './constants'
import { damageForTooltip } from './damage'
import { Observable, map, of } from 'rxjs'

export function isMasterItem(item: ItemDefinitionMaster | Housingitems): item is ItemDefinitionMaster {
  return item && 'ItemID' in item
}

export function isHousingItem(item: ItemDefinitionMaster | Housingitems): item is Housingitems {
  return item && 'HouseItemID' in item
}

export function isItemArmor(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Armor')
}

export function isItemJewelery(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Jewelery')
}

export function isItemWeapon(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('Weapon')
}

export function isItemShield(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('EquppableOffHand')
}

export function isItemTool(item: Pick<ItemDefinitionMaster, 'ItemClass'> | null) {
  return item?.ItemClass?.includes('EquppableTool')
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

export function hasItemIngredientCategory(item: ItemDefinitionMaster, categoryId: string) {
  return item?.IngredientCategories?.some((it) => it.toLocaleLowerCase() === String(categoryId).toLocaleLowerCase())
}

export function getItemRarity(item: ItemDefinitionMaster | Housingitems, itemPerkIds?: string[]) {
  if (!item) {
    return 0
  }
  if (item.ForceRarity) {
    return item.ForceRarity
  }

  let rarity = 0
  let maxRarity = 4
  if (isMasterItem(item)) {
    if (!itemPerkIds) {
      itemPerkIds = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
    }
    rarity = itemPerkIds.filter((it) => it && !it?.startsWith('PerkID_Stat_')).length
    if (!rarity && itemPerkIds.some((it) => it?.startsWith('PerkID_Stat_'))) {
      rarity = 1
    }
    const maxScore = getItemMaxGearScore(item, false)
    if (maxScore) {
      maxRarity = maxRarityFromScore(maxScore)
    }
  }
  return Math.min(rarity, maxRarity)
}

function maxRarityFromScore(score: number) {
  if (score >= NW_MAX_GEAR_SCORE_UPGRADABLE) {
    return 4
  }
  return 3
}

export function getItemRarityLabel(item: ItemDefinitionMaster | Housingitems | number | string) {
  if (typeof item === 'number' || typeof item === 'string') {
    //
  } else {
    item = getItemRarity(item)
  }
  return `RarityLevel${item}_DisplayName`
}

export function getItemPerkKeys(item: ItemDefinitionMaster) {
  return ['Perk1', 'Perk2', 'Perk3', 'Perk4', 'Perk5'].filter((it) => item && it in item)
}

export function getItemPerkIds(item: ItemDefinitionMaster) {
  return item && [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)
}

export function getItemPerkIdsWithOverride(item: ItemDefinitionMaster, overrides: Record<string, string>) {
  const perks = (getItemPerkKeys(item) || []).map((key) => overrides[key] || (item[key] as string))
  const randoms = (getItemPerkBucketKeys(item) || []).map((key) => overrides[key])
  return [...perks, ...randoms].filter((it) => !!it)
}

export function getItemPerkInfos(
  item: ItemDefinitionMaster,
  overrides?: Record<string, string>
): Array<{ key: string; perkId?: string; bucketId?: string }> {
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
  return item && getItemPerkIds(item).map((it) => perks.get(it))
}

export function getItemPerkBucketKeys(item: ItemDefinitionMaster) {
  return ['PerkBucket1', 'PerkBucket2', 'PerkBucket3', 'PerkBucket4', 'PerkBucket5'].filter((it) => item && it in item)
}

export function getItemPerkBucketIds(item: ItemDefinitionMaster) {
  return [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5].filter((it) => !!it)
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
  // if (isMasterItem(item)) {
  //   if (female && item.ArmorAppearanceF) {
  //     return item.ArmorAppearanceF
  //   }
  //   if (item.ArmorAppearanceM) {
  //     return item.ArmorAppearanceM
  //   }
  //   if (item.WeaponAppearanceOverride) {
  //     return item.WeaponAppearanceOverride
  //   }
  // }
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
