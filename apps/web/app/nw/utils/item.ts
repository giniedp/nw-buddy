import {
  Crafting,
  Housingitems,
  ItemDefinitionMaster,
  ItemdefinitionsArmor,
  ItemdefinitionsWeapons,
  Perkbuckets,
  Perks,
} from '@nw-data/types'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE } from './constants'

export function isMasterItem(item: ItemDefinitionMaster | Housingitems): item is ItemDefinitionMaster {
  return item && 'ItemID' in item
}

export function isHousingItem(item: ItemDefinitionMaster | Housingitems): item is Housingitems {
  return item && 'HouseItemID' in item
}

export function isItemArmor(item: ItemDefinitionMaster) {
  return item?.ItemType === 'Armor'
}

export function isItemWeapon(item: ItemDefinitionMaster) {
  return item?.ItemType === 'Weapon'
}

export function isItemNamed(item: ItemDefinitionMaster) {
  return item?.ItemClass?.includes('Named')
}

export function hasItemIngredientCategory(item: ItemDefinitionMaster, categoryId: string) {
  return item.IngredientCategories?.some((it) => it.toLocaleLowerCase() === String(categoryId).toLocaleLowerCase())
}

export function getItemRarity(item: ItemDefinitionMaster | Housingitems, itemPerkIds?: string[]) {
  if (!item) {
    return 0
  }
  if (item.ForceRarity) {
    return item.ForceRarity
  }

  let rarity = 0
  if (isMasterItem(item)) {
    if (!itemPerkIds) {
      itemPerkIds = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5]
    }
    rarity += itemPerkIds.filter((it) => it && !it?.startsWith('PerkID_Stat_')).length
  }
  return Math.min(rarity, 4)
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
  const perks = (getItemPerkKeys(item) || []).map((key) => overrides[key] || item[key])
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

export function getItemPerkBucket(item: ItemDefinitionMaster, buckets: Map<string, Perkbuckets>) {
  return item && getItemPerkBucketIds(item).map((it) => buckets.get(it))
}

export function getItemMaxGearScore(item: ItemDefinitionMaster) {
  return item?.GearScoreOverride || item?.MaxGearScore || NW_MAX_GEAR_SCORE
}
export function getItemMinGearScore(item: ItemDefinitionMaster) {
  return item?.GearScoreOverride || item?.MinGearScore || NW_MIN_GEAR_SCORE
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

export function getItemIdFromRecipe(item: Crafting) {
  if (!item) {
    return null
  }
  if (item.ItemID) {
    return item.ItemID
  }
  if (item[`ProceduralTierID${item.BaseTier}`]) {
    return item[`ProceduralTierID${item.BaseTier}`]
  }
  return (
    item &&
    (item.ItemID ||
      item.ProceduralTierID5 ||
      item.ProceduralTierID4 ||
      item.ProceduralTierID3 ||
      item.ProceduralTierID2 ||
      item.ProceduralTierID1)
  )
}

export function getRecipeForItem(item: ItemDefinitionMaster | Housingitems, recipes: Crafting[]) {
  const id = getItemId(item)
  if (!id) {
    return null
  }
  return recipes.find((recipe) => {
    if (recipe.CraftingCategory === 'MaterialConversion' || !recipe.OutputQty) {
      return false
    }
    if (recipe.IsProcedural) {
      return recipe[`ProceduralTierID${recipe.BaseTier}`] === id
    }
    return recipe.RecipeID === item.CraftingRecipe || recipe.ItemID === id
  })
}

export function getItemIconPath(item: ItemDefinitionMaster | Housingitems, female: boolean = false) {
  if (!item) {
    return null
  }
  if (isMasterItem(item)) {
    if (female && item.ArmorAppearanceF) {
      return item.ArmorAppearanceF
    }
    if (item.ArmorAppearanceM) {
      return item.ArmorAppearanceM
    }
    if (item.WeaponAppearanceOverride) {
      return item.WeaponAppearanceOverride
    }
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

export function getWeightLabel(weight: number) {
  let label = 'light'
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
