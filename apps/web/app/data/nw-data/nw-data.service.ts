import { Injectable } from '@angular/core'
import {
  convertBuffBuckets,
  convertGatherableVariations,
  convertLootbuckets,
  convertLoottables,
  convertPerkBuckets,
  convertPvoStore,
  getCraftingIngredients,
  getItemIdFromRecipe,
  getItemSetFamilyName,
  getQuestRequiredAchuevmentIds,
  getSeasonPassDataId,
} from '@nw-data/common'
import { Housingitems, Vitals } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, shareReplay } from 'rxjs'
import { NwDataLoaderService } from './nw-data-loader.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './views'

import { annotate, table, tableGroupBy, tableIndexBy, tableLookup } from './dsl'
import { apiMethods, apiMethodsByPrefix } from './utils'

@Injectable({ providedIn: 'root' })
export class NwDataService {
  public items = table(() => {
    const backsort = ['Ai', 'Playtest', 'Omega']
    const methods = sortBy(
      [
        ...apiMethodsByPrefix<'itemdefinitionsMasterCommon'>(this.data, 'itemdefinitionsMaster'),
        ...apiMethodsByPrefix<'itemdefinitionsMasterCommon'>(this.data, 'mtxItemdefinitionsMtx'),
      ],
      (it) => (backsort.includes(it.suffix) ? `x${it.suffix}` : it.suffix),
    )
    return methods.map((it) => it.load().pipe(annotate('$source', it.suffix || '_')))
  })

  public itemsMap = tableIndexBy(() => this.items, 'ItemID')
  public item = tableLookup(() => this.itemsMap)
  public itemsBySalvageAchievement = tableGroupBy(() => this.items, 'SalvageAchievement')
  public itemsByIngredientCategoryMap = tableGroupBy(() => this.items, 'IngredientCategories')
  public itemsByIngredientCategory = tableLookup(() => this.itemsByIngredientCategoryMap)
  public itemsByAppearanceId = tableGroupBy(
    () => this.items,
    (it) => [it.ArmorAppearanceM, it.ArmorAppearanceF, it.WeaponAppearanceOverride],
  )
  public itemsByItemTypeMap = tableGroupBy(() => this.items, 'ItemType')
  public itemsBySetFamilyName = tableGroupBy(
    () => this.items,
    (it) => getItemSetFamilyName(it),
  )
  public itemSet = tableLookup(() => this.itemsBySetFamilyName)

  public housingItems = table(() => [
    this.data.housingitems(),
    this.data.mtxHousingitemsMtx() as any as Observable<Housingitems[]>,
  ])
  public housingItemsMap = tableIndexBy(() => this.housingItems, 'HouseItemID')
  public housingItem = tableLookup(() => this.housingItemsMap)
  public housingItemsByStatusEffectMap = tableGroupBy(() => this.housingItems, 'HousingStatusEffect')
  public housingItemsByStatusEffect = tableLookup(() => this.housingItemsByStatusEffectMap)

  public itemOrHousingItem = (id: string | Observable<string>) =>
    combineLatest({
      item: this.item(id),
      housing: this.housingItem(id),
    }).pipe(map(({ item, housing }) => item || housing))

  public itemTransforms = table(() => this.data.itemtransformdata())
  public itemTransformsMap = tableIndexBy(() => this.itemTransforms, 'FromItemId')
  public itemTransform = tableLookup(() => this.itemTransformsMap)
  public itemTransformsByToItemIdMap = tableGroupBy(() => this.itemTransforms, 'ToItemId')
  public itemTransformsByToItemId = tableLookup(() => this.itemTransformsByToItemIdMap)

  public abilities = table(() =>
    apiMethodsByPrefix<'weaponabilitiesAbilityAi'>(this.data, 'weaponabilitiesAbility').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public abilitiesMap = tableIndexBy(() => this.abilities, 'AbilityID')
  public ability = tableLookup(() => this.abilitiesMap)
  public abilitiesByStatusEffectMap = tableGroupBy(() => this.abilities, 'StatusEffect')
  public abilitiesByStatusEffect = tableLookup(() => this.abilitiesByStatusEffectMap)
  public abilitiesBySelfApplyStatusEffectMap = tableGroupBy(() => this.abilities, 'SelfApplyStatusEffect')
  public abilitiesBySelfApplyStatusEffect = tableLookup(() => this.abilitiesBySelfApplyStatusEffectMap)
  public abilitiesByOtherApplyStatusEffectMap = tableGroupBy(() => this.abilities, 'OtherApplyStatusEffect')
  public abilitiesByOtherApplyStatusEffect = tableLookup(() => this.abilitiesByOtherApplyStatusEffectMap)

  public statusEffects = table(() =>
    apiMethodsByPrefix<'statuseffectsAi'>(this.data, 'statuseffects').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public statusEffectsMap = tableIndexBy(() => this.statusEffects, 'StatusID')
  public statusEffect = tableLookup(() => this.statusEffectsMap)

  public statusEffectCategories = table(() => this.data.statuseffectcategories())
  public statusEffectCategoriesMap = tableIndexBy(() => this.statusEffectCategories, 'StatusEffectCategoryID')
  public statusEffectCategory = tableLookup(() => this.statusEffectCategoriesMap)

  public perks = table(() => [this.data.perks()])
  public perksMap = tableIndexBy(() => this.perks, 'PerkID')
  public perk = tableLookup(() => this.perksMap)
  public perksByEquipAbilityMap = tableGroupBy(() => this.perks, 'EquipAbility')
  public perksByEquipAbility = tableLookup(() => this.perksByEquipAbilityMap)
  public perksByAffixMap = tableGroupBy(() => this.perks, 'Affix')
  public perksByAffix = tableLookup(() => this.perksByAffixMap)

  public perkBuckets = table(() => [this.data.perkbuckets().pipe(map(convertPerkBuckets))])
  public perkBucketsMap = tableIndexBy(() => this.perkBuckets, 'PerkBucketID')
  public perkBucket = tableLookup(() => this.perkBucketsMap)

  public affixStats = table(() => [this.data.affixstats()])
  public affixStatsMap = tableIndexBy(() => this.affixStats, 'StatusID')
  public affixStat = tableLookup(() => this.affixStatsMap)
  public affixByStatusEffectMap = tableGroupBy(() => this.affixStats, 'StatusEffect')
  public affixByStatusEffect = tableLookup(() => this.affixByStatusEffectMap)

  public damageTable0 = table(() => [this.data.damagetable()])

  public damageTables = table(() =>
    apiMethodsByPrefix<'damagetable'>(this.data, 'damagetable').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public damageTableMap = tableIndexBy(() => this.damageTables, 'DamageID')
  public damageTable = tableLookup(() => this.damageTableMap)
  public damageTablesByStatusEffectMap = tableGroupBy(() => this.damageTables, 'StatusEffect')
  public damageTablesByStatusEffect = tableLookup(() => this.damageTablesByStatusEffectMap)

  public dmgTableEliteAffix = table(() => [this.data.charactertablesEliteaffixDatatablesDamagetableEliteAffix()])
  public dmgTableEliteAffixMap = tableIndexBy(() => this.dmgTableEliteAffix, 'DamageID')

  public gatherables = table(() => [this.data.gatherables()])
  public gatherablesMap = tableIndexBy(() => this.gatherables, 'GatherableID')
  public gatherable = tableLookup(() => this.gatherablesMap)

  public gatherablesMetadata = table(() => [this.data.generatedGatherablesMetadata()])
  public gatherablesMetadataMap = tableIndexBy(() => this.gatherablesMetadata, 'gatherableID')
  public gatherablesMeta = tableLookup(() => this.gatherablesMetadataMap)

  public gatherableVariations = table(() => {
    return apiMethodsByPrefix<'variationsGatherablesAlchemy'>(this.data, 'variationsGatherables').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    })
  }, convertGatherableVariations)
  public gatherableVariationsMap = tableIndexBy(() => this.gatherableVariations, 'VariantID')
  public gatherableVariation = tableLookup(() => this.gatherableVariationsMap)
  public gatherableVariationsByGatherableIdMap = tableGroupBy(() => this.gatherableVariations, 'GatherableID')
  public gatherableVariationsByGatherableId = tableLookup(() => this.gatherableVariationsByGatherableIdMap)

  public npcs = table(() =>
    apiMethods<'quests01Starterbeach01Npcs'>(this.data, (it) => {
      return it.endsWith('Npcs') && !it.includes('variations')
    }).map((it) => {
      return it.load().pipe(annotate('$source', it.name))
    }),
  )
  public npcsMap = tableIndexBy(() => this.npcs, 'NPCId')
  public npc = tableLookup(() => this.npcsMap)

  public npcsVariations = table(() => this.data.variationsNpcs())
  public npcsVariationsMap = tableIndexBy(() => this.npcsVariations, 'VariantID')
  public npcsVariation = tableLookup(() => this.npcsVariationsMap)
  public npcsVariationsByNpcIdMap = tableGroupBy(() => this.npcsVariations, 'NPCId')
  public npcsVariationsByNpcId = tableLookup(() => this.npcsVariationsByNpcIdMap)

  public variationsMetadata = table(() => [this.data.generatedVariationsMetadata()])
  public variationsMetadataMap = tableIndexBy(() => this.variationsMetadata, 'variantID')
  public variationsMeta = tableLookup(() => this.variationsMetadataMap)
  public variationsChunk(id: number) {
    return this.data.load(`generated_variations_metadata.${id}.chunk`, 'arrayBuffer').pipe(
      map((data) => new Float32Array(data)),
      map((data) => {
        const points: [number, number][] = []
        for (let i = 0; i < data.length; i += 2) {
          points.push([data[i], data[i + 1]])
        }
        return points
      }),
    )
  }

  public mounts = table(() => [this.data.mountsMounts()])
  public mountsMap = tableIndexBy(() => this.mounts, 'MountId')
  public mount = tableLookup(() => this.mountsMap)

  public armors = table(() => [this.data.itemdefinitionsArmor()])
  public armorsMap = tableIndexBy(() => this.armors, 'WeaponID')
  public armor = tableLookup(() => this.armorsMap)

  public weapons = table(() => [this.data.itemdefinitionsWeapons()])
  public weaponsMap = tableIndexBy(() => this.weapons, 'WeaponID')
  public weapon = tableLookup(() => this.weaponsMap)

  public ammos = table(() => [this.data.itemdefinitionsAmmo()])
  public ammosMap = tableIndexBy(() => this.ammos, 'AmmoID')
  public ammo = tableLookup(() => this.ammosMap)

  public consumables = table(() => [this.data.itemdefinitionsConsumables()])
  public consumablesMap = tableIndexBy(() => this.consumables, 'ConsumableID')
  public consumable = tableLookup(() => this.consumablesMap)
  public consumablesByAddStatusEffectsMap = tableGroupBy(() => this.consumables, 'AddStatusEffects')
  public consumablesByAddStatusEffects = tableLookup(() => this.consumablesByAddStatusEffectsMap)

  public runes = table(() => [this.data.itemdefinitionsRunes()])
  public runesMap = tableIndexBy(() => this.runes, 'WeaponID')
  public rune = tableLookup(() => this.runesMap)

  public spells = table(() =>
    apiMethodsByPrefix<'spelltable'>(this.data, 'spelltable').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public spellsMap = tableIndexBy(() => this.spells, 'SpellID')
  public spell = tableLookup(() => this.spellsMap)
  public spellsByDamageTable = tableGroupBy(() => this.spells, 'DamageTable')

  public spellsMetadata = table(() => [this.data.generatedSpellsMetadata()])
  public spellsMetadataMap = tableIndexBy(() => this.spellsMetadata, 'PrefabPath')
  public spellsMeta = tableLookup(() => this.spellsMetadataMap)

  public gameModes = table(() => [this.data.gamemodes()])
  public gameModesMap = tableIndexBy(() => this.gameModes, 'GameModeId')
  public gameMode = tableLookup(() => this.gameModesMap)

  public loreItems = table(() => [this.data.loreitems()])
  public loreItemsMap = tableIndexBy(() => this.loreItems, 'LoreID')
  public loreItem = tableLookup(() => this.loreItemsMap)
  public loreItemsByParentIdMap = tableGroupBy(() => this.loreItems, 'ParentID')
  public loreItemsByParentId = tableLookup(() => this.loreItemsByParentIdMap)

  public loreItemsMeta = table(() => [this.data.generatedLoreMetadata()])
  public loreItemsMetaMap = tableIndexBy(() => this.loreItemsMeta, 'loreID')

  public quests = table(() =>
    apiMethodsByPrefix<'quests01Starterbeach01Objectives'>(this.data, 'quests').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public questsMap = tableIndexBy(() => this.quests, 'ObjectiveID')
  public quest = tableLookup(() => this.questsMap)
  public questsByAchievementIdMap = tableGroupBy(() => this.quests, 'AchievementId')
  public questsByRequiredAchievementIdMap = tableGroupBy(
    () => this.quests,
    (it) => getQuestRequiredAchuevmentIds(it),
  )
  public questsByNpcIdMap = tableGroupBy(() => this.quests, 'NpcDestinationId')
  public questsByNpcId = tableLookup(() => this.questsByNpcIdMap)

  public recipes = table(() =>
    apiMethodsByPrefix<'crafting'>(this.data, 'crafting').map((it) => {
      return it.load().pipe(annotate('$source', it.suffix || '_'))
    }),
  )
  public recipesMap = tableIndexBy(() => this.recipes, 'RecipeID')
  public recipesMapByItemId = tableGroupBy(
    () => this.recipes,
    (it) => getItemIdFromRecipe(it),
  )
  public recipesMapByRequiredAchievementId = tableIndexBy(() => this.recipes, 'RequiredAchievementID')
  public recipesMapByIngredients = tableGroupBy(
    () => this.recipes,
    (it) =>
      getCraftingIngredients(it)
        .map((it) => it.ingredient)
        .filter((it) => !!it),
  )
  public recipe = tableLookup(() => this.recipesMap)
  public recipeByAchievementId = tableLookup(() => this.recipesMapByRequiredAchievementId)
  public recipesByIngredientId = tableLookup(() => this.recipesMapByIngredients)
  public recipesByItemId = tableLookup(() => this.recipesMapByItemId)

  public recipeCategories = table(() => [this.data.craftingcategories()])
  public recipeCategoriesMap = tableIndexBy(() => this.recipeCategories, 'CategoryID')
  public recipeCategory = tableLookup(() => this.recipeCategoriesMap)

  public resources = table(() => [this.data.itemdefinitionsResources()])
  public resourcesMap = tableIndexBy(() => this.resources, 'ResourceID')
  public resource = tableLookup(() => this.resourcesMap)

  public affixDefinitions = table(() => [this.data.affixdefinitions()])
  public affixDefinitionsMap = tableIndexBy(() => this.affixDefinitions, 'AffixID')
  public affixDefinition = tableLookup(() => this.affixDefinitionsMap)

  public afflictions = table(() => [this.data.afflictions()])
  public afflictionsMap = tableIndexBy(() => this.afflictions, 'AfflictionID')
  public affliction = tableLookup(() => this.afflictionsMap)

  public costumes = table(() => [this.data.costumechangesCostumechanges()])
  public costumesMap = tableIndexBy(() => this.costumes, 'CostumeChangeId')
  public costume = tableLookup(() => this.costumesMap)

  public manacosts = table(() => [this.data.manacostsPlayer()])
  public manacostsMap = tableIndexBy(() => this.manacosts, 'CostID')

  public staminacostsPlayer = table(() => [this.data.staminacostsPlayer()])
  public staminacostsPlayerMap = tableIndexBy(() => this.staminacostsPlayer, 'CostID')

  public arenas = table(() => [this.data.arenasArenadefinitions()])
  public arenasMap = tableIndexBy(() => this.arenas, 'TerritoryID')
  public arena = tableLookup(() => this.arenasMap)

  public itemsConsumables = table(() => [this.data.itemdefinitionsConsumables()])
  public itemsConsumablesMap = tableIndexBy(() => this.itemsConsumables, 'ConsumableID')

  public gameEvents = table(() => {
    return [
      this.data.gameevents(),
      apiMethodsByPrefix<'gameevents'>(this.data, 'questgameevents').map((it) => {
        return it.load().pipe(annotate('$source', it.suffix || '_'))
      }),
    ].flat()
  })
  public gameEventsMap = tableIndexBy(() => this.gameEvents, 'EventID')
  public gameEvent = tableLookup(() => this.gameEventsMap)
  public gameEventsByLootLimitIdMap = tableGroupBy(() => this.gameEvents, 'LootLimitId')
  public gameEventsByLootLimitId = tableLookup(() => this.gameEventsByLootLimitIdMap)

  public categoriesProgression = table(() => [this.data.categoricalprogression()])
  public categoriesProgressionMap = tableIndexBy(() => this.categoriesProgression, 'CategoricalProgressionId')

  public achievements = table(() => [this.data.achievements()])
  public achievementsMap = tableIndexBy(() => this.achievements, 'AchievementID')
  public achievement = tableLookup(() => this.achievementsMap)

  public metaAchievements = table(() => [this.data.metaachievements()])
  public metaAchievementsMap = tableIndexBy(() => this.metaAchievements, 'MetaAchievementId')
  public metaAchievement = tableLookup(() => this.metaAchievementsMap)

  public tradeskillPostcap = table(() => [this.data.tradeskillpostcap()])

  public vitalsMetadata = table(() => [this.data.generatedVitalsMetadata()])
  public vitalsMetadataMap = tableIndexBy(() => this.vitalsMetadata, 'vitalsID')
  public vitalsMeta = tableLookup(() => this.vitalsMetadataMap)

  public vitals = table(() => [
    this.data.vitals(),
    this.data.vitalstablesVitalsFirstlight() as unknown as Observable<Vitals[]>,
    this.data.vitalsPlayer() as unknown as Observable<Vitals[]>,
  ])
  public vitalsMap = tableIndexBy(() => this.vitals, 'VitalsID')
  public vital = tableLookup(() => this.vitalsMap)

  public vitalsPlayer = table(() => [this.data.vitalsPlayer()])
  public vitalsPlayerMap = tableIndexBy(() => this.vitals, 'VitalsID')
  public vitalPlayer = tableLookup(() => this.vitalsPlayerMap)

  public vitalsByFamily = tableGroupBy(() => this.vitals, 'Family')
  public vitalsOfFamily = tableLookup(() => this.vitalsByFamily)

  public vitalsByCreatureType = tableGroupBy(() => this.vitals, 'CreatureType')
  public vitalsOfCreatureType = tableLookup(() => this.vitalsByCreatureType)

  public vitalsFamilies = table(() =>
    this.vitalsByFamily.pipe(map((it) => Array.from(it.keys()) as Array<Vitals['Family']>)),
  )

  public vitalsCategories = table(() => [this.data.vitalscategories()])
  public vitalsCategoriesMap = tableIndexBy(() => this.vitalsCategories, 'VitalsCategoryID')
  public vitalsCategory = tableLookup(() => this.vitalsCategoriesMap)
  public vitalsCategoriesMapByGroup = tableGroupBy(() => this.vitalsCategories, 'GroupVitalsCategoryId')

  public vitalsModifiers = table(() => [this.data.vitalsmodifierdata()])
  public vitalsModifiersMap = tableIndexBy(() => this.vitalsModifiers, 'CategoryId')
  public vitalsModifier = tableLookup(() => this.vitalsModifiersMap)

  public vitalsLevels = table(() => [this.data.vitalsleveldata()])
  public vitalsLevelsMap = tableIndexBy(() => this.vitalsLevels, 'Level')
  public vitalsLevel = tableLookup(() => this.vitalsLevelsMap)

  public damagetypes = table(() => this.data.damagetypes())
  public damagetypesMap = tableIndexBy(() => this.damagetypes, 'TypeID')
  public damagetype = tableLookup(() => this.damagetypesMap)

  public territories = table(() => this.data.territorydefinitions())
  public territoriesMap = tableIndexBy(() => this.territories, 'TerritoryID')
  public territory = tableLookup(() => this.territoriesMap)

  public areas = table(() => this.data.areadefinitions())
  public areasMap = tableIndexBy(() => this.areas, 'TerritoryID')
  public area = tableLookup(() => this.areasMap)

  public territoriesMetadata = table(() => this.data.generatedTerritoriesMetadata())
  public territoriesMetadataMap = tableIndexBy(() => this.territoriesMetadata, 'territoryID')
  public territoryMetadata = tableLookup(() => this.territoriesMetadataMap)

  public pois = table(() =>
    apiMethodsByPrefix<'pointofinterestdefinitionsPoidefinitions0202'>(this.data, 'pointofinterestdefinitions').map(
      (it) => {
        return it.load().pipe(annotate('$source', it.suffix || '_'))
      },
    ),
  )
  public poisMap = tableIndexBy(() => this.pois, 'TerritoryID')
  public poi = tableLookup(() => this.poisMap)
  public poiByPoiTag = tableGroupBy(
    () => this.pois,
    (it) => it.POITag?.split(','),
  )

  public pvpRanks = table(() => this.data.pvpRank())
  public pvpRanksMap = tableIndexBy(() => this.pvpRanks, 'Level')
  public pvpRank = tableLookup(() => this.pvpRanksMap)

  public pvpStoreBuckets = table(() => this.data.pvpRewardstrackPvpStoreV2().pipe(map(convertPvoStore)))
  public pvpStoreBucketsMap = tableGroupBy(() => this.pvpStoreBuckets, 'Bucket')
  public pvpStoreBucket = tableLookup(() => this.pvpStoreBucketsMap)

  public pvpRewards = table(() => this.data.pvpRewardstrackPvpRewardsV2())
  public pvpRewardsMap = tableIndexBy(() => this.pvpRewards, 'RewardId')
  public pvpReward = tableLookup(() => this.pvpRewardsMap)

  public milestoneRewards = table(() => this.data.milestonerewards())

  public mutatorDifficulties = table(() => this.data.gamemodemutatorsMutationdifficulty())
  public mutatorDifficultiesMap = tableIndexBy(() => this.mutatorDifficulties, 'MutationDifficulty')
  public mutatorDifficulty = tableLookup(() => this.mutatorDifficultiesMap)

  public mutatorElements = table(() => this.data.gamemodemutatorsElementalmutations())
  public mutatorElementsMap = tableIndexBy(() => this.mutatorElements, 'ElementalMutationId')
  public mutatorElement = tableLookup(() => this.mutatorElementsMap)

  public mutatorElementsPerks = table(() => this.data.gamemodemutatorsElementalmutationperks())
  public mutatorElementsPerksMap = tableIndexBy(() => this.mutatorElementsPerks, 'ElementalMutationTypeId')
  public mutatorElementPerk = tableLookup(() => this.mutatorElementsPerksMap)

  public mutatorPromotions = table(() => this.data.gamemodemutatorsPromotionmutations())
  public mutatorPromotionsMap = tableIndexBy(() => this.mutatorPromotions, 'PromotionMutationId')
  public mutatorPromotion = tableLookup(() => this.mutatorPromotionsMap)

  public mutatorCurses = table(() => this.data.gamemodemutatorsCursemutations())
  public mutatorCursesMap = tableIndexBy(() => this.mutatorCurses, 'CurseMutationId')
  public mutatorCurse = tableLookup(() => this.mutatorCursesMap)

  public viewGemPerksWithAffix = table(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = table(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = table(() =>
    apiMethods<'loottables'>(this.data, (it) => {
      return it.split(/([A-Z][a-z]+)/g).some((token) => {
        return token.toLowerCase() === 'loottables'
      })
    }).map((it) => {
      return it.load().pipe(map(convertLoottables)).pipe(annotate('$source', it.name))
    }),
  )
  public lootTablesMap = tableIndexBy(() => this.lootTables, 'LootTableID')
  public lootTable = tableLookup(() => this.lootTablesMap)
  public lootTablesByLootBucketIdMap = tableGroupBy(
    () => this.lootTables,
    (row) => {
      return row.Items.map((it) => it.LootBucketID)
    },
  )
  public lootTablesByLootBucketId = tableLookup(() => this.lootTablesByLootBucketIdMap)
  public lootTablesByLootTableIdMap = tableGroupBy(
    () => this.lootTables,
    (row) => row.Items.map((it) => it.LootTableID),
  )
  public lootTablesByLootTableId = tableLookup(() => this.lootTablesByLootTableIdMap)
  public lootTablesByLootItemIdMap = tableGroupBy(
    () => this.lootTables,
    (row) => row.Items.map((it) => it.ItemID),
  )
  public lootTablesByLootItemId = tableLookup(() => this.lootTablesByLootItemIdMap)

  public lootBuckets = table(() => [
    this.data.lootbuckets().pipe(map(convertLootbuckets)),
    this.data.lootbucketsPvp().pipe(map(convertLootbuckets)),
  ])
  public lootBucketsMap = tableGroupBy(() => this.lootBuckets, 'LootBucket')
  public lootBucket = tableLookup(() => this.lootBucketsMap)

  public lootLimits = table(() => [this.data.lootlimits()])
  public lootLimitsMap = tableIndexBy(() => this.lootLimits, 'LootLimitID')
  public lootLimit = tableLookup(() => this.lootLimitsMap)

  public buffBuckets = table(() => this.data.buffbuckets().pipe(map(convertBuffBuckets)))
  public buffBucketsMap = tableIndexBy(() => this.buffBuckets, 'BuffBucketId')
  public buffBucket = tableLookup(() => this.buffBucketsMap)

  public xpAmounts = this.data.xpamountsbylevel().pipe(shareReplay(1))
  public weaponMastery = this.data.weaponmastery().pipe(shareReplay(1))

  public attrCon = this.data.attributeconstitution().pipe(shareReplay(1))
  public attrStr = this.data.attributestrength().pipe(shareReplay(1))
  public attrDex = this.data.attributedexterity().pipe(shareReplay(1))
  public attrFoc = this.data.attributefocus().pipe(shareReplay(1))
  public attrInt = this.data.attributeintelligence().pipe(shareReplay(1))

  public itemAppearances = table(() => this.data.itemappearancedefinitions())
  public itemAppearancesMap = tableIndexBy(() => this.itemAppearances, 'ItemID')
  public itemAppearance = tableLookup(() => this.itemAppearancesMap)
  public itemAppearancesByNameMap = tableGroupBy(() => this.itemAppearances, 'AppearanceName')
  public itemAppearancesByName = tableLookup(() => this.itemAppearancesByNameMap)

  public weaponAppearances = table(() => this.data.itemdefinitionsWeaponappearances())
  public weaponAppearancesMap = tableIndexBy(() => this.weaponAppearances, 'WeaponAppearanceID')
  public weaponAppearance = tableLookup(() => this.weaponAppearancesMap)

  public instrumentAppearances = table(() => this.data.itemdefinitionsInstrumentsappearances())
  public instrumentAppearancesMap = tableIndexBy(() => this.instrumentAppearances, 'WeaponAppearanceID')
  public instrumentAppearance = tableLookup(() => this.instrumentAppearancesMap)

  public mountAttachmentsAppearances = table(() => this.data.itemdefinitionsWeaponappearancesMountattachments())
  public mountAttachmentsAppearancesMap = tableIndexBy(() => this.mountAttachmentsAppearances, 'WeaponAppearanceID')
  public mountAttachmentsAppearance = tableLookup(() => this.mountAttachmentsAppearancesMap)

  public dyeColors = table(() => this.data.dyecolors())
  public dyeColorsMap = tableIndexBy(() => this.dyeColors, 'Index')
  public dyeColor = tableLookup(() => this.dyeColorsMap)

  public objectives = table(() => [this.data.objectives()])
  public objectivesMap = tableIndexBy(() => this.objectives, 'ObjectiveID')
  public objective = tableLookup(() => this.objectivesMap)

  public objectiveTasks = table(() => [this.data.objectivetasks()])
  public objectiveTasksMap = tableIndexBy(() => this.objectiveTasks, 'TaskID')
  public objectiveTask = tableLookup(() => this.objectiveTasksMap)

  public cooldownsPlayer = table(() => this.data.cooldownsPlayer())
  public cooldownsPlayerMap = tableIndexBy(() => this.cooldownsPlayer, 'AbilityID')
  public cooldownPlayer = tableLookup(() => this.cooldownsPlayerMap)

  public emotes = table(() => this.data.emotedefinitions())
  public emotesMap = tableIndexBy(() => this.emotes, 'UniqueTagID')
  public emote = tableLookup(() => this.emotesMap)

  public playerTitles = table(() => this.data.playertitles())
  public playerTitlesMap = tableIndexBy(() => this.playerTitles, 'TitleID')
  public playerTitle = tableLookup(() => this.playerTitlesMap)

  public entitlements = table(() => this.data.entitlements())
  public entitlementsMap = tableIndexBy(() => this.entitlements, 'UniqueTagID')
  public entitlement = tableLookup(() => this.entitlementsMap)

  public backstories = table(() => this.data.backstorydata())
  public backstoriesMap = tableIndexBy(() => this.backstories, 'BackstoryID')
  public backstory = tableLookup(() => this.backstoriesMap)

  public seasonPassData = table(() =>
    apiMethods<'seasonsrewardsSeason1SeasonpassdataSeason1'>(this.data, (it) => {
      return !!it.match(/seasonsrewardsSeason\d+SeasonpassdataSeason\d+/i)
    }).map((it) => {
      return it.load().pipe(annotate('$source', it.name.match(/Season\d+/i)?.[0]))
    }),
  )
  public seasonPassDataMap = tableIndexBy(() => this.seasonPassData, getSeasonPassDataId)
  public seasonPassRow = tableLookup(() => this.seasonPassDataMap)

  public seasonPassRewards = table(() =>
    apiMethods<'seasonsrewardsSeason1RewarddataSeason1'>(this.data, (it) => {
      return !!it.match(/seasonsrewardsSeason\d+RewarddataSeason\d+/i)
    }).map((it) => {
      return it.load().pipe(annotate('$source', it.name.match(/Season\d+/i)?.[0]))
    }),
  )
  public seasonPassRewardsMap = tableIndexBy(() => this.seasonPassRewards, 'RewardId')
  public seasonPassReward = tableLookup(() => this.seasonPassRewardsMap)

  public constructor(public readonly data: NwDataLoaderService) {
    //
  }
}
