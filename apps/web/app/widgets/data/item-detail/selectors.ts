import {
  NW_LOOT_GlobalMod,
  PerkBucket,
  PerkExplanation,
  getItemGearScoreLabel,
  getItemMaxGearScore,
  getItemPerkSlots,
  getItemPerkSwap,
  getItemRarity,
  getItemRarityNumeric,
  getPerkBucketPerkIDs,
  hasItemGearScore,
  isMasterItem,
  isPerkCharm,
  isPerkGem,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import {
  ConsumableItemDefinitions,
  CraftingCategoryData,
  HouseItems,
  MasterItemDefinitions,
  PerkData,
  ResourceItemDefinitions,
} from '@nw-data/generated'

export interface ItemPerkSlot {
  key: string
  perkIdOld?: string
  perkOld?: PerkData
  perkId?: string
  perk?: PerkData
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean
}

export interface PerkSlotExplained extends ItemPerkSlot {
  key: string
  perkIdOld?: string
  perkOld?: PerkData
  perkId?: string
  perk?: PerkData
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean

  explain: PerkExplanation[]
  explainOld: PerkExplanation[]
  activationCooldown: number
  violatesItemClass: boolean
  violatesExclusivity: boolean
}

export function selectItemGearscore(item: MasterItemDefinitions, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemMaxGearScore(item, false) : null
}
export function selectItemGearscoreLabel(item: MasterItemDefinitions, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemGearScoreLabel(item) : null
}

export function selectItemRarity({
  item,
  perkDetails,
  perkOverride,
}: {
  item: MasterItemDefinitions | HouseItems
  perkDetails: Array<PerkSlotExplained | ItemPerkSlot>
  perkOverride: Record<string, string>
}) {
  if (!perkOverride) {
    return getItemRarity(item)
  }
  const perkIds = perkDetails
    .map((it) => it.perk)
    .filter((it) => !!it)
    .map((it) => it.PerkID)
  return getItemRarity(item, perkIds)
}

export function selectItemSalvageInfo(item: MasterItemDefinitions | HouseItems, playerLevel: number) {
  if (!item || (isMasterItem(item) && !item.IsSalvageable)) {
    return null
  }
  const recipe = item.RepairRecipe
  if (!recipe?.startsWith('[LTID]')) {
    return null
  }
  return {
    tableId: recipe.replace('[LTID]', ''),
    tags: [NW_LOOT_GlobalMod, ...((item as MasterItemDefinitions)?.SalvageLootTags || [])],
    tagValues: {
      Level: playerLevel - 1,
      MinContLevel: (item as MasterItemDefinitions)?.ContainerLevel,
      SalvageItemRarity: getItemRarityNumeric(item),
      SalvageItemTier: item.Tier,
    },
  }
}

export async function fetchItemPerkSlots(
  db: NwData,
  {
    item,
    perkOverride,
  }: {
    item: MasterItemDefinitions
    perkOverride: Record<string, string>
  },
) {
  const swaps = await db.itemPerkSwapDataAll()
  const slots = getItemPerkSlots(item)
  const result: ItemPerkSlot[] = []
  for (const slot of slots) {
    const key = slot.perkId ? slot.perkKey : slot.bucketKey
    let perkId = slot.perkId
    let perkIdOld: string = null
    if (perkId) {
      const swap = getItemPerkSwap(item, perkId, swaps)
      if (swap) {
        perkIdOld = swap.OldPerk
        perkId = swap.NewPerk
      }
    }

    const perkIdOverride = perkOverride?.[key]
    const perk = await db.perksById(perkIdOverride || perkId)
    const perkOld = perkIdOld ? await db.perksById(perkIdOld) : null
    const bucket = await db.perkBucketsById(slot.bucketId)
    result.push({
      key: key,
      perkIdOld: perkIdOverride ? null : perkIdOld,
      perkOld: perkOld,
      perkId: perkIdOverride || perkId,
      perk: perk,
      bucketId: slot.bucketId,
      bucket: bucket,
      editable: !!bucket || (item.CanReplaceGem && isPerkGem(perk)) || isPerkCharm(perk),
    })
  }
  return result
}

export function selectNamePrefix(item: MasterItemDefinitions, perks: Array<{ perk?: PerkData }>) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedPrefix)?.perk?.AppliedPrefix : null
}

export function selectNameSuffix(item: MasterItemDefinitions, perks: Array<{ perk?: PerkData }>) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedSuffix)?.perk?.AppliedSuffix : null
}

export function selectDescription(entity: MasterItemDefinitions | HouseItems) {
  return {
    image: (entity as MasterItemDefinitions)?.HeartgemTooltipBackgroundImage,
    title: (entity as MasterItemDefinitions)?.HeartgemRuneTooltipTitle,
    description: entity?.Description,
  }
}

export function selectCraftingCategories(categories: Map<string, CraftingCategoryData>, item: MasterItemDefinitions) {
  return item?.IngredientCategories?.map((it) => {
    return (
      categories.get(it) || {
        CategoryID: it,
        DisplayText: it,
      }
    )
  })
}

export function selectStatusEffectIds(consumable: ConsumableItemDefinitions, housing: HouseItems) {
  return [...(consumable?.AddStatusEffects || []), housing?.HousingStatusEffect].filter((it) => !!it)
}

export function selectResourcePerkIds(buckets: Map<string, PerkBucket>, resource: ResourceItemDefinitions) {
  if (!resource) {
    return null
  }
  const bucket = buckets.get(resource.PerkBucket)
  return getPerkBucketPerkIDs(bucket)
}
