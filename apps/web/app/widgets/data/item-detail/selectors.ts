import {
  NW_MAX_GEAR_SCORE_BASE,
  PerkBucket,
  PerkExplanation,
  explainPerk,
  getItemGearScoreLabel,
  getItemGsBonus,
  getItemMaxGearScore,
  getItemPerkSlots,
  getItemRarity,
  getItemRarityNumeric,
  getPerkBucketPerkIDs,
  getPerkBucketPerks,
  getPerkTypeWeight,
  hasItemGearScore,
  isMasterItem,
  isPerkApplicableToItem,
  isPerkGem,
  isPerkItemIngredient,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import {
  AbilityData,
  AffixStatData,
  ConsumableItemDefinitions,
  CraftingCategoryData,
  HouseItems,
  MasterItemDefinitions,
  PerkData,
  ResourceItemDefinitions,
} from '@nw-data/generated'

export interface ItemPerkSlot {
  key: string
  perkId?: string
  perk?: PerkData
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean
}

export interface PerkSlotExplained extends ItemPerkSlot {
  key: string
  perkId?: string
  perk?: PerkData
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean

  explain: PerkExplanation[]
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
    tags: ['GlobalMod', ...((item as MasterItemDefinitions)?.SalvageLootTags || [])],
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
  const slots = getItemPerkSlots(item)
  const result: ItemPerkSlot[] = []
  for (const slot of slots) {
    const key = slot.perkId ? slot.perkKey : slot.bucketKey
    const perkId = slot.perkId
    const perkIdOverride = perkOverride?.[key]
    const perk = await db.perksById(perkIdOverride || perkId)
    const bucket = await db.perkBucketsById(slot.bucketId)
    result.push({
      key: key,
      perkId: perkIdOverride || perkId,
      perk: perk,
      bucketId: slot.bucketId,
      bucket: bucket,
      editable: !!bucket || (item.CanReplaceGem && isPerkGem(perk)),
    })
  }
  return result
}

export function selectPerkSlots({
  item,
  itemGS,
  perks,
  buckets,
  affixes,
  abilities,
  perkOverride,
}: {
  item: MasterItemDefinitions
  itemGS: number
  perks: Map<string, PerkData>
  buckets: Map<string, PerkBucket>
  affixes: Map<string, AffixStatData>
  abilities: Map<string, AbilityData>
  perkOverride: Record<string, string>
}): PerkSlotExplained[] {
  if (isPerkItemIngredient(item)) {
    // case for perk carft mods
    const bucket = buckets.get(item?.ItemID)
    if (!bucket) {
      return []
    }
    return getPerkBucketPerks(bucket, perks)?.map((perk, i): PerkSlotExplained => {
      return {
        key: `${bucket.PerkBucketID}-${i}`,
        editable: false,
        perkId: perk?.PerkID,
        perk: perk,
        activationCooldown: null,
        violatesExclusivity: false,
        violatesItemClass: false,
        explain: explainPerk({
          perk: perk,
          affix: affixes.get(perk?.Affix),
          gearScore: itemGS || NW_MAX_GEAR_SCORE_BASE,
          forceDescription: true,
        }),
      }
    })
  }

  const slots = getItemPerkSlots(item)
  const result: PerkSlotExplained[] = []
  for (const slot of slots) {
    const key = slot.perkId ? slot.perkKey : slot.bucketKey
    const perkId = slot.perkId
    const perkIdOverride = perkOverride?.[key]
    const perk = perks.get(perkIdOverride || perkId)
    const bucket = buckets.get(slot.bucketId)
    const equippedAbilities = perk?.EquipAbility?.map((it) => abilities.get(it))
    const activationCooldown = equippedAbilities?.find((it) => it?.ActivationCooldown)?.ActivationCooldown
    result.push({
      key: key,
      perkId: perkIdOverride || perkId,
      perk: perk,
      bucketId: slot.bucketId,
      bucket: bucket,
      editable: !!bucket || (item.CanReplaceGem && isPerkGem(perk)),
      violatesExclusivity: false,
      violatesItemClass: !!perk && !isPerkApplicableToItem(perk, item),
      activationCooldown: activationCooldown,
      explain: explainPerk({
        perk: perk,
        affix: affixes.get(perk?.Affix),
        abilities: equippedAbilities,
        gearScore: itemGS + (getItemGsBonus(perk, item) || 0),
      }),
    })
  }
  result.sort((a, b) => {
    return getPerkTypeWeight(a.perk?.PerkType) - getPerkTypeWeight(b.perk?.PerkType)
  })
  for (const slot of result) {
    const labels = slot.perk?.ExclusiveLabels
    if (!labels?.length) {
      continue
    }
    for (const other of result) {
      if (other === slot) {
        continue
      }
      const otherLabels = other.perk?.ExclusiveLabels
      if (!otherLabels?.length) {
        continue
      }
      if (labels.some((it) => otherLabels.includes(it))) {
        slot.violatesExclusivity = true
        break
      }
    }
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
