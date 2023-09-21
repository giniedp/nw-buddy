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
  getPerkBucketPerkIDs,
  getPerkBucketPerks,
  hasItemGearScore,
  isPerkGem,
  isPerkItemIngredient,
} from '@nw-data/common'
import {
  Ability,
  Affixstats,
  Craftingcategories,
  Housingitems,
  ItemDefinitionMaster,
  ItemdefinitionsConsumables,
  ItemdefinitionsResources,
  Perks,
} from '@nw-data/generated'

export interface PerkSlot {
  key: string
  perkId?: string
  perk?: Perks
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean
  explain: PerkExplanation[]
}

export function selectItemGearscore(item: ItemDefinitionMaster, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemMaxGearScore(item, false) : null
}
export function selectItemGearscoreLabel(item: ItemDefinitionMaster, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemGearScoreLabel(item) : null
}

export function selectFinalRarity({
  item,
  perkDetails,
  perkOverride,
}: {
  item: ItemDefinitionMaster
  perkDetails: PerkSlot[]
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

export function selectSalvageInfo(item: ItemDefinitionMaster | Housingitems) {
  const recipe = item?.RepairRecipe
  if (!recipe?.startsWith('[LTID]')) {
    return null
  }
  return {
    tableId: recipe.replace('[LTID]', ''),
    tags: ((item as ItemDefinitionMaster)?.SalvageLootTags || '').split(/[+,]/),
    tagValues: {
      MinContLevel: (item as ItemDefinitionMaster)?.ContainerLevel,
      SalvageItemRarity: getItemRarity(item),
      SalvageItemTier: item.Tier,
    },
  }
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
  item: ItemDefinitionMaster
  itemGS: number
  perks: Map<string, Perks>
  buckets: Map<string, PerkBucket>
  affixes: Map<string, Affixstats>
  abilities: Map<string, Ability>
  perkOverride: Record<string, string>
}): PerkSlot[] {
  if (isPerkItemIngredient(item)) {
    // case for perk carft mods
    const bucket = buckets.get(item?.ItemID)
    if (!bucket) {
      return []
    }
    return getPerkBucketPerks(bucket, perks)?.map((perk, i): PerkSlot => {
      return {
        key: `${bucket.PerkBucketID}-${i}`,
        editable: false,
        perkId: perk?.PerkID,
        perk: perk,
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
  const result: PerkSlot[] = []
  for (const slot of slots) {
    const key = slot.perkId ? slot.perkKey : slot.bucketKey
    const perkId = slot.perkId
    const perkIdOverride = perkOverride?.[key]
    const perk = perks.get(perkIdOverride || perkId)
    const bucket = buckets.get(slot.bucketId)
    result.push({
      key: key,
      perkId: perkIdOverride || perkId,
      perk: perk,
      bucketId: slot.bucketId,
      bucket: bucket,
      editable: !!bucket || (item.CanReplaceGem && isPerkGem(perk)),
      explain: explainPerk({
        perk: perk,
        affix: affixes.get(perk?.Affix),
        abilities: perk?.EquipAbility?.map((it) => abilities.get(it)),
        gearScore: itemGS + (getItemGsBonus(perk, item) || 0),
      }),
    })
  }
  return result
}

export function selectNamePerfix(item: ItemDefinitionMaster, perks: PerkSlot[]) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedPrefix)?.perk?.AppliedPrefix : null
}

export function selectNameSuffix(item: ItemDefinitionMaster, perks: PerkSlot[]) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedSuffix)?.perk?.AppliedSuffix : null
}

export function selectDescription(entity: ItemDefinitionMaster | Housingitems) {
  return {
    image: (entity as ItemDefinitionMaster)?.HeartgemTooltipBackgroundImage,
    title: (entity as ItemDefinitionMaster)?.HeartgemRuneTooltipTitle,
    description: entity?.Description,
  }
}

export function selectCraftingCategories(categories: Map<string, Craftingcategories>, item: ItemDefinitionMaster) {
  return item?.IngredientCategories?.map((it) => {
    return (
      categories.get(it) || {
        CategoryID: it,
        DisplayText: it,
      }
    )
  })
}

export function selectStatusEffectIds(consumable: ItemdefinitionsConsumables, housing: Housingitems) {
  return [...(consumable?.AddStatusEffects || []), housing?.HousingStatusEffect].filter((it) => !!it)
}

export function selectResourcePerkIds(buckets: Map<string, PerkBucket>, resource: ItemdefinitionsResources) {
  if (!resource) {
    return null
  }
  const bucket = buckets.get(resource.PerkBucket)
  return getPerkBucketPerkIDs(bucket)
}
