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

const ITEM_TYPE_LABELS = {
  Resource: 'ui_itemtypedescription_resource',
  Consumable: 'ui_itemtypedescription_consumable',
  Weapon: 'ui_itemtypedescription_weapon',
  Ammo: 'ui_itemtypedescription_ammo',
  Armor: 'ui_armor',
  Dye: 'ui_itemtypedescription_dye',
  Blueprint: 'ui_blueprints',
  Currency: 'ui_currency_type',
  // lore
  // throwableitem
}
export function getItemTypeLabel(tag: string) {
  return ITEM_TYPE_LABELS[tag]
}

const HOUSING_CATEGORY_LABELS = {
  Chairs: 'ui_chairs',
  Lighting: 'ui_lighting',
  Pets: 'ui_pets',
  Misc: 'ui_misc',
  Decorations: 'ui_decorations',
  Vegetation: 'ui_vegetation',
  Beds: 'ui_beds',
  Tables: 'ui_tables',
  Shelves: 'ui_shelves',
  Trophies: 'ui_trophies',
}
export function getHousingCategoryLabel(tag: string) {
  return HOUSING_CATEGORY_LABELS[tag]
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

export function getItemRarityName(item: ItemDefinitionMaster | Housingitems | number | string) {
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
export function getItemType(item: ItemDefinitionMaster | Housingitems) {
  return item?.ItemType
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
