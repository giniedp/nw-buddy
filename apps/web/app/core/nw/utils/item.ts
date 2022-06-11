import { Crafting, Housingitems, ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'

export function isMasterItem(item: ItemDefinitionMaster | Housingitems): item is ItemDefinitionMaster {
  return item && 'ItemID' in item
}

export function isHousingItem(item: ItemDefinitionMaster | Housingitems): item is Housingitems {
  return item && 'HouseItemID' in item
}

export function getItemRarity(item: ItemDefinitionMaster | Housingitems) {
  if (item.ForceRarity) {
    return item.ForceRarity
  }
  let rarity = 0
  if (isMasterItem(item)) {
    if (item.Perk1 && !item.Perk1?.startsWith('PerkID_Stat_')) {
      rarity += 1
    }
    if (item.Perk2 && !item.Perk2?.startsWith('PerkID_Stat_')) {
      rarity += 1
    }
    if (item.Perk3 && !item.Perk3?.startsWith('PerkID_Stat_')) {
      rarity += 1
    }
    if (item.Perk4 && !item.Perk4?.startsWith('PerkID_Stat_')) {
      rarity += 1
    }
    if (item.Perk5 && !item.Perk5?.startsWith('PerkID_Stat_')) {
      rarity += 1
    }
  }
  return Math.min(rarity, 4)
}

export function getItemRarityName(item: ItemDefinitionMaster | Housingitems | number) {
  item = typeof item === 'number' ? item : getItemRarity(item)
  return `RarityLevel${item}_DisplayName`
}

export function getItemPerkIds(item: ItemDefinitionMaster) {
  return item && [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)
}

export function getItemPerks(item: ItemDefinitionMaster, perks: Map<string, Perks>) {
  return item && getItemPerkIds(item).map((it) => perks.get(it))
}

export function getItemPerkBucketIds(item: ItemDefinitionMaster) {
  return [item.PerkBucket1, item.PerkBucket2, item.PerkBucket3, item.PerkBucket4, item.PerkBucket5].filter((it) => !!it)
}

export function getItemPerkBucket(item: ItemDefinitionMaster, buckets: Map<string, Perkbuckets>) {
  return item && getItemPerkBucketIds(item).map((it) => buckets.get(it))
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
