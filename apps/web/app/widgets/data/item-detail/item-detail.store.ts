import { ChangeDetectorRef, EventEmitter, Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  AttributeRef,
  NW_MAX_GEAR_SCORE_BASE,
  PerkBucket,
  PerkExplanation,
  explainPerk,
  getItemGearScoreLabel,
  getItemGsBonus,
  getItemIconPath,
  getItemIdFromRecipe,
  getItemMaxGearScore,
  getItemPerkBucketIds,
  getItemPerkSlots,
  getItemRarity,
  getItemRarityLabel,
  getItemStatsArmor,
  getItemStatsWeapon,
  getItemTierAsRoman,
  getItemTypeName,
  getPerkBucketPerkIDs,
  getPerkBucketPerks,
  hasItemGearScore,
  isItemArtifact,
  isItemHeargem,
  isItemNamed,
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
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { humanize, mapProp, selectStream, shareReplayRefCount } from '~/utils'
import { ModelViewerService } from '../../model-viewer/model-viewer.service'

export interface PerkSlot {
  key: string
  perkId?: string
  perk?: Perks
  bucketId?: string
  bucket?: PerkBucket
  editable?: boolean
  explain: PerkExplanation[]
}

export interface ItemDetailState {
  entityId?: string
  gsOverride?: number
  gsEditable?: boolean
  perkOverride?: Record<string, string>
  perkEditable?: boolean
  attrValueSums?: Record<AttributeRef, number>
  playerLevel?: number
}

@Injectable()
export class ItemDetailStore extends ComponentStore<ItemDetailState> {
  public readonly entityId$ = this.select(({ entityId }) => entityId)
  public readonly gsOverride$ = this.select(({ gsOverride }) => gsOverride)
  public readonly gsEditable$ = this.select(({ gsEditable }) => gsEditable)
  public readonly perkOverride$ = this.select(({ perkOverride }) => perkOverride)
  public readonly perkEditable$ = this.select(({ perkEditable }) => perkEditable)
  public readonly attrValueSums$ = this.select(({ attrValueSums }) => attrValueSums)
  public readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)

  public readonly gsEdit$ = new EventEmitter<MouseEvent>()
  public readonly perkEdit$ = new EventEmitter<PerkSlot>()

  public readonly item$ = this.select(this.db.item(this.entityId$), (it) => it)
  public readonly housingItem$ = this.select(this.db.housingItem(this.entityId$), (it) => it)
  public readonly consumable$ = this.select(this.db.consumable(this.entityId$), (it) => it)
  public readonly resource$ = this.select(this.db.resource(this.entityId$), (it) => it)
  public readonly resourcePerkIds$ = this.select(this.db.perkBucketsMap, this.resource$, selectResourcePerkIds)
  public readonly perkBucketIds$ = this.select(this.item$, (item) => getItemPerkBucketIds(item))
  public readonly entity$ = this.select(this.item$, this.housingItem$, (item, housingItem) => item || housingItem)
  public readonly salvageAchievementId$ = this.select(this.item$, (it) => it?.SalvageAchievement)
  public readonly salvageAchievementRecipe$ = this.select(
    this.db.recipeByAchievementId(this.salvageAchievementId$),
    (it) => it
  )
  public readonly itemGS$ = this.select(this.item$, this.gsOverride$, selectItemGearscore)
  public readonly itemGSLabel$ = this.select(this.item$, this.gsOverride$, selectItemGearscoreLabel)
  public readonly craftableRecipes$ = this.select(this.db.recipesByIngredientId(this.entityId$), (it) => {
    if (!it) {
      return null
    }
    return Array.from(it.values())
      .map((recipe) => {
        return {
          recipe,
          itemId: getItemIdFromRecipe(recipe),
        }
      })
      .filter((it) => !!it.itemId)
  })
  public readonly recipes$ = this.select(this.db.recipesByItemId(this.entityId$), (it) => {
    if (!it) {
      return null
    }
    return Array.from(it.values())
      .map((recipe) => {
        return {
          recipe,
          itemId: getItemIdFromRecipe(recipe),
        }
      })
      .filter((it) => !!it.itemId)
  })

  public readonly perkSlots$ = selectStream(
    {
      item: this.item$,
      itemGS: this.itemGS$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
      affixes: this.db.affixstatsMap,
      abilities: this.db.abilitiesMap,
      perkOverride: this.perkOverride$,
    },
    (it) => {
      return selectPerkSlots({
        item: it.item,
        itemGS: it.itemGS,
        perks: it.perks,
        buckets: it.buckets,
        affixes: it.affixes,
        abilities: it.abilities,
        perkOverride: it.perkOverride,
      })
    }
  )

  public readonly itemModels$ = this.ms.byItemId(this.entityId$)
  public readonly itemStatsRef$ = this.select(this.item$, (it) => it?.ItemStatsRef)
  public readonly weaponStats$ = this.select(this.db.weapon(this.itemStatsRef$), (it) => it)
  public readonly armorStats$ = this.select(this.db.armor(this.itemStatsRef$), (it) => it)
  public readonly runeStats$ = this.select(this.db.rune(this.itemStatsRef$), (it) => it)

  public readonly name$ = this.select(this.entity$, (it) => it?.Name)
  public readonly namePrefix$ = this.select(this.item$, this.perkSlots$, selectNamePerfix)
  public readonly nameSuffix$ = this.select(this.item$, this.perkSlots$, selectNameSuffix)
  public readonly source$ = this.select(this.entity$, (it) => it?.['$source'] as string)
  public readonly sourceLabel$ = this.select(this.source$, humanize)
  public readonly description$ = this.select(this.entity$, selectDescription)
  public readonly icon$ = this.select(this.entity$, getItemIconPath)
  public readonly rarity$ = this.select(this.entity$, getItemRarity)
  public readonly rarityName$ = this.select(this.rarity$, getItemRarityLabel)
  public readonly typeName$ = this.select(this.entity$, getItemTypeName)
  public readonly tierLabel$ = this.select(this.entity$, (it) => getItemTierAsRoman(it?.Tier, true))
  public readonly isDeprecated$ = this.select(this.source$, (it) => /depricated/i.test(it || ''))
  public readonly isNamed$ = this.select(this.item$, isItemNamed)
  public readonly isArtifact$ = this.select(this.item$, isItemArtifact)
  public readonly isRune$ = this.select(this.item$, isItemHeargem)
  public readonly isBindOnEquip$ = this.select(this.item$, (it) => !!it?.BindOnEquip)
  public readonly isBindOnPickup$ = this.select(this.entity$, (it) => !!it?.BindOnPickup)
  public readonly canReplaceGem$ = this.select(this.item$, (it) => it && it.CanHavePerks && it.CanReplaceGem)
  public readonly cantReplaceGem$ = this.select(this.item$, (it) => it && it.CanHavePerks && !it.CanReplaceGem)
  public readonly salvageInfo$ = this.select(this.entity$, selectSalvageInfo)
  public readonly appearanceM$ = this.select(
    this.db.itemAppearance(this.item$.pipe(mapProp('ArmorAppearanceM'))),
    (it) => it
  )
  public readonly appearanceF$ = this.select(
    this.db.itemAppearance(this.item$.pipe(mapProp('ArmorAppearanceF'))),
    (it) => it
  )
  public readonly weaponAppearance$ = this.select(
    this.db.weaponAppearance(this.item$.pipe(mapProp('WeaponAppearanceOverride'))),
    (it) => it
  )
  public readonly instrumentAppearance$ = this.select(
    this.db.instrumentAppearance(this.item$.pipe(mapProp('WeaponAppearanceOverride'))),
    (it) => it
  )
  public readonly ingredientCategories$ = this.select(this.db.recipeCategoriesMap, this.item$, selectCraftingCategories)
  public readonly statusEffectsIds$ = this.select(this.consumable$, this.housingItem$, selectStatusEffectIds)
  public readonly gemDetail$ = this.select(this.perkSlots$, (list) => list?.find((it) => isPerkGem(it.perk)))
  public readonly finalRarity$ = this.select(
    combineLatest({
      item: this.entity$,
      perkDetails: this.perkSlots$,
      perkOverride: this.perkOverride$,
    }),
    selectFinalRarity
  )
  public readonly finalRarityName$ = this.select(this.finalRarity$, getItemRarityLabel)

  public readonly vmInfo$ = combineLatest({
    bindOnEquip: this.isBindOnEquip$,
    bindOnPickup: this.isBindOnPickup$,
    tier: this.tierLabel$,
    canReplaceGem: this.canReplaceGem$,
    cantReplaceGem: this.cantReplaceGem$,
    weight: combineLatest({
      weapon: this.weaponStats$,
      armor: this.armorStats$,
      item: this.item$,
    }).pipe(map(({ weapon, armor, item }) => (weapon?.WeightOverride || armor?.WeightOverride || item?.Weight) / 10)),
    durability: this.item$.pipe(mapProp('Durability')),
    maxStackSize: this.entity$.pipe(mapProp('MaxStackSize')),
    requiredLevel: this.item$.pipe(mapProp('RequiredLevel')),
    ingredientTypes: this.ingredientCategories$,
  }).pipe(shareReplayRefCount(1))

  public readonly vmStats$ = combineLatest({
    item: this.item$,
    weapon: this.weaponStats$,
    armor: this.armorStats$,
    rune: this.runeStats$,
    gs: this.itemGS$,
    gsEditable: this.gsEditable$,
    gsLabel: this.itemGSLabel$,
    attrValueSums: this.attrValueSums$,
    playerLevel: this.playerLevel$,
  }).pipe(
    map(({ item, weapon, rune, armor, gs, gsEditable, gsLabel, attrValueSums, playerLevel }) => {
      return {
        gsLabel: gsLabel,
        gsEditable: gsEditable,
        stats: [
          ...getItemStatsWeapon({
            item: item,
            stats: weapon || rune,
            gearScore: gs,
            attrValueSums: attrValueSums,
            playerLevel: playerLevel,
          }),
          ...getItemStatsArmor(item, armor, gs),
        ],
      }
    })
  )

  public readonly vmPerks$ = selectStream(
    {
      item: this.item$,
      gearScore: this.itemGS$,
      editable: this.perkEditable$,
      details: this.perkSlots$,
    },
    ({ item, gearScore, editable, details }) => {
      return details.map((detail) => {
        return {
          detail: detail,
          perk: detail?.perk,
          gs: gearScore + getItemGsBonus(detail?.perk, item),
          editable: editable && detail?.editable,
        }
      })
    }
  )

  public constructor(protected db: NwDbService, private ms: ModelViewerService, protected cdRef: ChangeDetectorRef) {
    super({})
  }

  public update(entityId: string) {
    this.patchState({ entityId })
  }
}

function selectItemGearscore(item: ItemDefinitionMaster, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemMaxGearScore(item, false) : null
}
function selectItemGearscoreLabel(item: ItemDefinitionMaster, gsOverride?: number) {
  return hasItemGearScore(item) ? gsOverride || getItemGearScoreLabel(item) : null
}

function selectFinalRarity({
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

function selectSalvageInfo(item: ItemDefinitionMaster | Housingitems) {
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

function selectPerkSlots({
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

function selectNamePerfix(item: ItemDefinitionMaster, perks: PerkSlot[]) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedPrefix)?.perk?.AppliedPrefix : null
}

function selectNameSuffix(item: ItemDefinitionMaster, perks: PerkSlot[]) {
  return !item?.IgnoreNameChanges ? perks?.find((it) => it?.perk?.AppliedSuffix)?.perk?.AppliedSuffix : null
}

function selectDescription(entity: ItemDefinitionMaster | Housingitems) {
  return {
    image: (entity as ItemDefinitionMaster)?.HeartgemTooltipBackgroundImage,
    title: (entity as ItemDefinitionMaster)?.HeartgemRuneTooltipTitle,
    description: entity?.Description,
  }
}

function selectCraftingCategories(categories: Map<string, Craftingcategories>, item: ItemDefinitionMaster) {
  return item?.IngredientCategories?.map((it) => {
    return (
      categories.get(it) || {
        CategoryID: it,
        DisplayText: it,
      }
    )
  })
}

function selectStatusEffectIds(consumable: ItemdefinitionsConsumables, housing: Housingitems) {
  return [...(consumable?.AddStatusEffects || []), housing?.HousingStatusEffect].filter((it) => !!it)
}

function selectResourcePerkIds(buckets: Map<string, PerkBucket>, resource: ItemdefinitionsResources) {
  if (!resource) {
    return null
  }
  const bucket = buckets.get(resource.PerkBucket)
  return getPerkBucketPerkIDs(bucket)
}
