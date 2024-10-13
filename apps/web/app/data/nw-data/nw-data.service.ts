import { Injectable, Signal, inject } from '@angular/core'
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
  getQuestRequiredAchievmentIds,
  getSeasonPassDataId,
} from '@nw-data/common'

import {
  DATASHEETS,
  DataSheetUri,
  VariationDataGatherable,
  VitalsBaseData,
  VitalsLevelVariantData,
} from '@nw-data/generated'

import {
  ScannedGatherable,
  ScannedHouseType,
  ScannedLore,
  ScannedNpc,
  ScannedSpell,
  ScannedStationType,
  ScannedStructureType,
  ScannedTerritory,
  ScannedVariation,
  ScannedVital,
  ScannedVitalModel,
} from '@nw-data/scanner'

import { Observable, combineLatest, map } from 'rxjs'
import { NwDataLoaderService } from './nw-data-loader.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './views'

import { annotate, table, tableGroupBy, tableIndexBy, tableLookup } from './dsl'

type DatasheetIndex = typeof DATASHEETS

@Injectable({ providedIn: 'root' })
export class NwDataService {
  public readonly data = inject(NwDataLoaderService)
  private readonly sheets: DatasheetIndex = DATASHEETS

  public load<T>(uri: DataSheetUri<T>) {
    return this.data.load<T[]>(uri.uri)
  }
  private loadEntries<T>(tables: Record<string, DataSheetUri<T>>, keys?: string[]) {
    keys = keys || Object.keys(tables)
    return keys.map((type) => {
      const uri = tables[type]
      return this.load(uri).pipe(annotate('$source', type))
    })
  }

  public loadSheets(name: keyof typeof DATASHEETS) {
    return this.loadEntries(this.sheets[name])
  }

  public useTable<T>(accessor: (sheets: DatasheetIndex) => DataSheetUri<T>) {
    return this.load(accessor(this.sheets))
  }

  public useSheets<T>(accessor: (sheets: DatasheetIndex) => Record<string, DataSheetUri<T>>) {
    return this.loadEntries(accessor(this.sheets))
  }

  public items = table(() => {
    const source = DATASHEETS.MasterItemDefinitions
    const keys = Object.keys(source)
    keys.sort((a, b) => {
      if (b === 'MasterItemDefinitions_AI') {
        return -1
      }
      return a.localeCompare(b)
    })
    return this.loadEntries(source, keys)
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
    this.load(DATASHEETS.VariationData.HouseItems),
    this.load(DATASHEETS.VariationData.HouseItemsMTX),
  ])
  public housingItemsMap = tableIndexBy(() => this.housingItems, 'HouseItemID')
  public housingItem = tableLookup(() => this.housingItemsMap)
  public housingItemsByStatusEffectMap = tableGroupBy(() => this.housingItems, 'HousingStatusEffect')
  public housingItemsByStatusEffect = tableLookup(() => this.housingItemsByStatusEffectMap)

  public houseTypes = table(() => this.loadEntries(DATASHEETS.HouseTypeData))
  public houseTypesMap = tableIndexBy(() => this.houseTypes, 'HouseTypeID')
  public houseType = tableLookup(() => this.houseTypesMap)

  public houseTypesMeta = table(() => this.load<ScannedHouseType>({ uri: 'nw-data/generated/houses_metadata.json' }))
  public houseTypesMetaMap = tableIndexBy(() => this.houseTypesMeta, 'houseTypeID')
  public houseTypeMeta = tableLookup(() => this.houseTypesMetaMap)

  public structureTypesMeta = table(() =>
    this.load<ScannedStructureType>({ uri: 'nw-data/generated/structures_metadata.json' }),
  )
  public structureTypesMetaMap = tableIndexBy(() => this.structureTypesMeta, 'type')
  public structureTypeMeta = tableLookup(() => this.structureTypesMetaMap)

  public stationTypesMeta = table(() =>
    this.load<ScannedStationType>({ uri: 'nw-data/generated/stations_metadata.json' }),
  )
  public stationTypesMetaMap = tableIndexBy(() => this.stationTypesMeta, 'stationID')
  public stationTypeMeta = tableLookup(() => this.stationTypesMetaMap)

  public itemOrHousingItem = (id: string | Observable<string> | Signal<string>) =>
    combineLatest({
      item: this.item(id),
      housing: this.housingItem(id),
    }).pipe(map(({ item, housing }) => item || housing))

  public itemTransforms = table(() => this.loadEntries(DATASHEETS.ItemTransform))
  public itemTransformsMap = tableIndexBy(() => this.itemTransforms, 'FromItemId')
  public itemTransform = tableLookup(() => this.itemTransformsMap)
  public itemTransformsByToItemIdMap = tableGroupBy(() => this.itemTransforms, 'ToItemId')
  public itemTransformsByToItemId = tableLookup(() => this.itemTransformsByToItemIdMap)

  public abilities = table(() => this.loadEntries(DATASHEETS.AbilityData))
  public abilitiesMap = tableIndexBy(() => this.abilities, 'AbilityID')
  public ability = tableLookup(() => this.abilitiesMap)
  public abilitiesByStatusEffectMap = tableGroupBy(() => this.abilities, 'StatusEffect')
  public abilitiesByStatusEffect = tableLookup(() => this.abilitiesByStatusEffectMap)
  public abilitiesBySelfApplyStatusEffectMap = tableGroupBy(() => this.abilities, 'SelfApplyStatusEffect')
  public abilitiesBySelfApplyStatusEffect = tableLookup(() => this.abilitiesBySelfApplyStatusEffectMap)
  public abilitiesByOtherApplyStatusEffectMap = tableGroupBy(() => this.abilities, 'OtherApplyStatusEffect')
  public abilitiesByOtherApplyStatusEffect = tableLookup(() => this.abilitiesByOtherApplyStatusEffectMap)
  public abilitiesByRequiredAbilityIdMap = tableGroupBy(() => this.abilities, 'RequiredAbilityId')
  public abilitiesByRequiredAbilityId = tableLookup(() => this.abilitiesByRequiredAbilityIdMap)
  public abilitiesByRequiredEquippedAbilityIdMap = tableGroupBy(() => this.abilities, 'RequiredEquippedAbilityId')
  public abilitiesByRequiredEquippedAbilityId = tableLookup(() => this.abilitiesByRequiredEquippedAbilityIdMap)
  public abilitiesByAbilityListMap = tableGroupBy(() => this.abilities, 'AbilityList')
  public abilitiesByAbilityList = tableLookup(() => this.abilitiesByAbilityListMap)


  public statusEffects = table(() => this.loadEntries(DATASHEETS.StatusEffectData))
  public statusEffectsMap = tableIndexBy(() => this.statusEffects, 'StatusID')
  public statusEffect = tableLookup(() => this.statusEffectsMap)

  public statusEffectCategories = table(() => this.loadEntries(DATASHEETS.StatusEffectCategoryData))
  public statusEffectCategoriesMap = tableIndexBy(() => this.statusEffectCategories, 'StatusEffectCategoryID')
  public statusEffectCategory = tableLookup(() => this.statusEffectCategoriesMap)

  public perks = table(() => this.loadEntries(DATASHEETS.PerkData))
  public perksMap = tableIndexBy(() => this.perks, 'PerkID')
  public perk = tableLookup(() => this.perksMap)
  public perksByEquipAbilityMap = tableGroupBy(() => this.perks, 'EquipAbility')
  public perksByEquipAbility = tableLookup(() => this.perksByEquipAbilityMap)
  public perksByAffixMap = tableGroupBy(() => this.perks, 'Affix')
  public perksByAffix = tableLookup(() => this.perksByAffixMap)

  public perkBuckets = table(() => {
    return this.loadEntries(DATASHEETS.PerkBucketData).map((it) => it.pipe(map(convertPerkBuckets)))
  })
  public perkBucketsMap = tableIndexBy(() => this.perkBuckets, 'PerkBucketID')
  public perkBucket = tableLookup(() => this.perkBucketsMap)
  public perkBucketsByPerkIdMap = tableGroupBy(
    () => this.perkBuckets,
    (it) => {
      return it.Entries.map((it) => 'PerkID' in it && it.PerkID)
    },
  )
  public perkBucketsByPerkId = tableLookup(() => this.perkBucketsByPerkIdMap)

  public affixStats = table(() => this.loadEntries(DATASHEETS.AffixStatData))
  public affixStatsMap = tableIndexBy(() => this.affixStats, 'StatusID')
  public affixStat = tableLookup(() => this.affixStatsMap)
  public affixByStatusEffectMap = tableGroupBy(() => this.affixStats, 'StatusEffect')
  public affixByStatusEffect = tableLookup(() => this.affixByStatusEffectMap)

  public cooldowns = table(() => this.loadEntries(DATASHEETS.CooldownData))
  public cooldownsMap = tableIndexBy(() => this.cooldowns, 'ID')
  public cooldown = tableLookup(() => this.cooldownsMap)
  public cooldownsByAbilityIdMap = tableGroupBy(() => this.cooldowns, 'AbilityID')
  public cooldownsByAbilityId = tableLookup(() => this.cooldownsByAbilityIdMap)

  public damageTables0 = table(() => this.load(DATASHEETS.DamageData.DamageTable))
  public damageTables0Map = tableIndexBy(() => this.damageTables0, 'DamageID')
  public damageTable0 = tableLookup(() => this.damageTables0Map)

  public damageTables = table(() => this.loadEntries(DATASHEETS.DamageData))
  public damageTableMap = tableIndexBy(() => this.damageTables, 'DamageID')
  public damageTable = tableLookup(() => this.damageTableMap)
  public damageTablesByStatusEffectMap = tableGroupBy(() => this.damageTables, 'StatusEffect')
  public damageTablesByStatusEffect = tableLookup(() => this.damageTablesByStatusEffectMap)

  public gatherables = table(() => this.loadEntries(DATASHEETS.GatherableData))
  public gatherablesMap = tableIndexBy(() => this.gatherables, 'GatherableID')
  public gatherable = tableLookup(() => this.gatherablesMap)

  public gatherablesMetadata = table(() =>
    this.load<ScannedGatherable>({ uri: 'nw-data/generated/gatherables_metadata.json' }),
  )
  public gatherablesMetadataMap = tableIndexBy(() => this.gatherablesMetadata, 'gatherableID')
  public gatherablesMeta = tableLookup(() => this.gatherablesMetadataMap)

  public gatherableVariations = table(
    () =>
      this.loadEntries<VariationDataGatherable>({
        Gatherable_Alchemy: DATASHEETS.VariationData.Gatherable_Alchemy,
        Gatherable_Bushes: DATASHEETS.VariationData.Gatherable_Bushes,
        Gatherable_Cinematic: DATASHEETS.VariationData.Gatherable_Cinematic,
        Gatherable_Cyclic: DATASHEETS.VariationData.Gatherable_Cyclic,
        Gatherable_Darkness: DATASHEETS.VariationData.Gatherable_Darkness,
        Gatherable_Essences: DATASHEETS.VariationData.Gatherable_Essences,
        Gatherable_Holiday: DATASHEETS.VariationData.Gatherable_Holiday,
        Gatherable_Holiday_Proximity: DATASHEETS.VariationData.Gatherable_Holiday_Proximity,
        Gatherable_Items: DATASHEETS.VariationData.Gatherable_Items,
        Gatherable_LockedGates: DATASHEETS.VariationData.Gatherable_LockedGates,
        Gatherable_Logs: DATASHEETS.VariationData.Gatherable_Logs,
        Gatherable_LootContainers: DATASHEETS.VariationData.Gatherable_LootContainers,
        Gatherable_Minerals: DATASHEETS.VariationData.Gatherable_Minerals,
        Gatherable_Plants: DATASHEETS.VariationData.Gatherable_Plants,
        Gatherable_POIObjects: DATASHEETS.VariationData.Gatherable_POIObjects,
        Gatherable_Quest: DATASHEETS.VariationData.Gatherable_Quest,
        Gatherable_Quest_AncientGlyph: DATASHEETS.VariationData.Gatherable_Quest_AncientGlyph,
        Gatherable_Quest_Damageable: DATASHEETS.VariationData.Gatherable_Quest_Damageable,
        Gatherable_Quest_Proximity: DATASHEETS.VariationData.Gatherable_Quest_Proximity,
        Gatherable_Stones: DATASHEETS.VariationData.Gatherable_Stones,
        Gatherable_Trees: DATASHEETS.VariationData.Gatherable_Trees,
      }),
    convertGatherableVariations,
  )

  public gatherableVariationsMap = tableIndexBy(() => this.gatherableVariations, 'VariantID')
  public gatherableVariation = tableLookup(() => this.gatherableVariationsMap)
  public gatherableVariationsByGatherableIdMap = tableGroupBy(
    () => this.gatherableVariations,
    (it) => it.Gatherables.map((it) => it.GatherableID),
  )
  public gatherableVariationsByGatherableId = tableLookup(() => this.gatherableVariationsByGatherableIdMap)

  public npcs = table(() => this.loadEntries(DATASHEETS.NPCData))
  public npcsMap = tableIndexBy(() => this.npcs, 'NPCId')
  public npc = tableLookup(() => this.npcsMap)
  public npcsByConversationStateIdMap = tableGroupBy(
    () => this.npcs,
    (it) => {
      const index: string[] = []
      for (const key in it) {
        if (key.startsWith('ConversationStateId')) {
          index.push(it[key])
        }
      }
      return index
    },
  )
  public npcsByConversationStateId = tableLookup(() => this.npcsByConversationStateIdMap)

  public npcsVariations = table(() => this.load(DATASHEETS.VariationData.NPC))
  public npcsVariationsMap = tableIndexBy(() => this.npcsVariations, 'VariantID')
  public npcsVariation = tableLookup(() => this.npcsVariationsMap)
  public npcsVariationsByNpcIdMap = tableGroupBy(() => this.npcsVariations, 'NPCId')
  public npcsVariationsByNpcId = tableLookup(() => this.npcsVariationsByNpcIdMap)

  public npcsMetadata = table(() => this.load<ScannedNpc>({ uri: 'nw-data/generated/npcs_metadata.json' }))
  public npcsMetadataMap = tableIndexBy(() => this.npcsMetadata, 'npcID')
  public npcsMeta = tableLookup(() => this.npcsMetadataMap)

  public variationsMetadata = table(() =>
    this.load<ScannedVariation>({ uri: 'nw-data/generated/variations_metadata.json' }),
  )
  public variationsMetadataMap = tableIndexBy(() => this.variationsMetadata, 'variantID')
  public variationsMeta = tableLookup(() => this.variationsMetadataMap)
  public variationsChunk(id: number) {
    return this.data.load(`nw-data/generated/variations_metadata.${id}.chunk`, 'arrayBuffer').pipe(
      map((data, i) => new Float32Array(data)),
      map((data) => {
        const points: [number, number][] = []
        for (let i = 0; i < data.length; i += 2) {
          points.push([data[i], data[i + 1]])
        }
        return points
      }),
    )
  }

  public mounts = table(() => this.loadEntries(DATASHEETS.MountData))
  public mountsMap = tableIndexBy(() => this.mounts, 'MountId')
  public mount = tableLookup(() => this.mountsMap)

  public armors = table(() => this.loadEntries(DATASHEETS.ArmorItemDefinitions))
  public armorsMap = tableIndexBy(() => this.armors, 'WeaponID')
  public armor = tableLookup(() => this.armorsMap)

  public weapons = table(() => this.loadEntries(DATASHEETS.WeaponItemDefinitions))
  public weaponsMap = tableIndexBy(() => this.weapons, 'WeaponID')
  public weapon = tableLookup(() => this.weaponsMap)

  public ammos = table(() => this.loadEntries(DATASHEETS.AmmoItemDefinitions))
  public ammosMap = tableIndexBy(() => this.ammos, 'AmmoID')
  public ammo = tableLookup(() => this.ammosMap)

  public consumables = table(() => this.loadEntries(DATASHEETS.ConsumableItemDefinitions))
  public consumablesMap = tableIndexBy(() => this.consumables, 'ConsumableID')
  public consumable = tableLookup(() => this.consumablesMap)
  public consumablesByAddStatusEffectsMap = tableGroupBy(() => this.consumables, 'AddStatusEffects')
  public consumablesByAddStatusEffects = tableLookup(() => this.consumablesByAddStatusEffectsMap)

  public runes = table(() => this.load(DATASHEETS.WeaponItemDefinitions.RuneItemDefinitions))
  public runesMap = tableIndexBy(() => this.runes, 'WeaponID')
  public rune = tableLookup(() => this.runesMap)

  public spells = table(() => this.loadEntries(DATASHEETS.SpellData))
  public spellsMap = tableIndexBy(() => this.spells, 'SpellID')
  public spell = tableLookup(() => this.spellsMap)
  public spellsByDamageTable = tableGroupBy(() => this.spells, 'DamageTable')
  public spellsByAbilityIdMap = tableGroupBy(() => this.spells, 'AbilityId')
  public spellsByAbilityId = tableLookup(() => this.spellsByAbilityIdMap)
  public spellsByStatusEffectIdMap = tableGroupBy(() => this.spells, 'StatusEffects')
  public spellsByStatusEffectId = tableLookup(() => this.spellsByStatusEffectIdMap)

  public spellsMetadata = table(() => this.load<ScannedSpell>({ uri: 'nw-data/generated/spells_metadata.json' }))
  public spellsMetadataMap = tableIndexBy(() => this.spellsMetadata, 'PrefabPath')
  public spellsMeta = tableLookup(() => this.spellsMetadataMap)

  public gameModes = table(() => this.loadEntries(DATASHEETS.GameModeData))
  public gameModesMap = tableIndexBy(() => this.gameModes, 'GameModeId')
  public gameMode = tableLookup(() => this.gameModesMap)

  public loreItems = table(() => this.loadEntries(DATASHEETS.LoreData))
  public loreItemsMap = tableIndexBy(() => this.loreItems, 'LoreID')
  public loreItem = tableLookup(() => this.loreItemsMap)
  public loreItemsByParentIdMap = tableGroupBy(() => this.loreItems, 'ParentID')
  public loreItemsByParentId = tableLookup(() => this.loreItemsByParentIdMap)

  public loreItemsMeta = table(() => this.load<ScannedLore>({ uri: 'nw-data/generated/lore_metadata.json' }))
  public loreItemsMetaMap = tableIndexBy(() => this.loreItemsMeta, 'loreID')
  public loreItemMeta = tableLookup(() => this.loreItemsMetaMap)

  public recipes = table(() => this.loadEntries(DATASHEETS.CraftingRecipeData))
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

  public recipesByFirstCraftAchievementIdMap = tableGroupBy(() => this.recipes, 'FirstCraftAchievementId')
  public recipesByFirstCraftAchievementId = tableLookup(() => this.recipesByFirstCraftAchievementIdMap)

  public recipesUnlockedAchievementBlocksRecraftingMap = tableGroupBy(
    () => this.recipes,
    'UnlockedAchievementBlocksRecrafting',
  )
  public recipesUnlockedAchievementBlocksRecrafting = tableLookup(() => this.recipesByFirstCraftAchievementIdMap)

  public recipeCategories = table(() => this.loadEntries(DATASHEETS.CraftingCategoryData))
  public recipeCategoriesMap = tableIndexBy(() => this.recipeCategories, 'CategoryID')
  public recipeCategory = tableLookup(() => this.recipeCategoriesMap)

  public resources = table(() => this.loadEntries(DATASHEETS.ResourceItemDefinitions))
  public resourcesMap = tableIndexBy(() => this.resources, 'ResourceID')
  public resource = tableLookup(() => this.resourcesMap)
  public resourcesByPerkBucketIdMap = tableGroupBy(() => this.resources, 'PerkBucket')
  public resourcesByPerkBucketId = tableLookup(() => this.resourcesByPerkBucketIdMap)

  public affixDefinitions = table(() => this.loadEntries(DATASHEETS.AffixData))
  public affixDefinitionsMap = tableIndexBy(() => this.affixDefinitions, 'AffixID')
  public affixDefinition = tableLookup(() => this.affixDefinitionsMap)

  public afflictions = table(() => this.loadEntries(DATASHEETS.AfflictionData))
  public afflictionsMap = tableIndexBy(() => this.afflictions, 'AfflictionID')
  public affliction = tableLookup(() => this.afflictionsMap)

  public costumes = table(() => this.loadEntries(DATASHEETS.CostumeChangeData))
  public costumesMap = tableIndexBy(() => this.costumes, 'CostumeChangeId')
  public costume = tableLookup(() => this.costumesMap)

  public manacosts = table(() => this.loadEntries(DATASHEETS.ManaData))
  public manacostsMap = tableIndexBy(() => this.manacosts, 'CostID')

  public staminacostsPlayer = table(() => this.loadEntries(DATASHEETS.StaminaData))
  public staminacostsPlayerMap = tableIndexBy(() => this.staminacostsPlayer, 'CostID')

  public itemsConsumables = table(() => this.loadEntries(DATASHEETS.ConsumableItemDefinitions))
  public itemsConsumablesMap = tableIndexBy(() => this.itemsConsumables, 'ConsumableID')

  public gameEvents = table(() => this.loadEntries(DATASHEETS.GameEventData))
  public gameEventsMap = tableIndexBy(() => this.gameEvents, 'EventID')
  public gameEvent = tableLookup(() => this.gameEventsMap)
  public gameEventsByLootLimitIdMap = tableGroupBy(() => this.gameEvents, 'LootLimitId')
  public gameEventsByLootLimitId = tableLookup(() => this.gameEventsByLootLimitIdMap)

  public categoriesProgression = table(() => this.loadEntries(DATASHEETS.CategoricalProgressionData))
  public categoriesProgressionMap = tableIndexBy(() => this.categoriesProgression, 'CategoricalProgressionId')

  public achievements = table(() => this.loadEntries(DATASHEETS.AchievementData))
  public achievementsMap = tableIndexBy(() => this.achievements, 'AchievementID')
  public achievement = tableLookup(() => this.achievementsMap)

  public metaAchievements = table(() => this.loadEntries(DATASHEETS.MetaAchievementData))
  public metaAchievementsMap = tableIndexBy(() => this.metaAchievements, 'MetaAchievementId')
  public metaAchievement = tableLookup(() => this.metaAchievementsMap)

  public tradeskillPostcap = table(() => this.loadEntries(DATASHEETS.TradeSkillPostCapData))

  public vitalsMetadata = table(() => {
    return [
      this.load<ScannedVital>({ uri: 'nw-data/generated/vitals_metadata1.json' }),
      this.load<ScannedVital>({ uri: 'nw-data/generated/vitals_metadata2.json' })
    ]
  })
  public vitalsMetadataMap = tableIndexBy(() => this.vitalsMetadata, 'vitalsID')
  public vitalsMeta = tableLookup(() => this.vitalsMetadataMap)

  public vitalsModelsMetadata = table(() =>
    this.load<ScannedVitalModel>({ uri: 'nw-data/generated/vitals_models_metadata.json' }),
  )
  public vitalsModelsMetadataMap = tableIndexBy(() => this.vitalsModelsMetadata, 'id')
  public vitalsModelMeta = tableLookup(() => this.vitalsModelsMetadataMap)

  public vitalsBase = table(() => this.loadEntries(DATASHEETS.VitalsBaseData))
  public vitalsBaseMap = tableIndexBy(() => this.vitalsBase, 'VitalsID')
  public vitalsVariants = table(() => this.loadEntries(DATASHEETS.VitalsLevelVariantData))

  public vitals = table<VitalsBaseData & VitalsLevelVariantData>(() => {
    return combineLatest({
      baseMap: this.vitalsBaseMap,
      variants: this.vitalsVariants,
    }).pipe(
      map(({ baseMap, variants }) => {
        return variants.map((it) => {
          const base = baseMap.get(it.VitalsID)
          return {
            ...base,
            ...it,
          }
        })
      }),
    )
  })
  public vitalsMap = tableIndexBy(() => this.vitals, 'VitalsID')
  public vital = tableLookup(() => this.vitalsMap)

  public vitalsByFamily = tableGroupBy(() => this.vitals, 'Family')
  public vitalsOfFamily = tableLookup(() => this.vitalsByFamily)

  public vitalsByCreatureType = tableGroupBy(() => this.vitals, 'CreatureType')
  public vitalsOfCreatureType = tableLookup(() => this.vitalsByCreatureType)

  public vitalsFamilies = table(() =>
    this.vitalsByFamily.pipe(map((it) => Array.from(it.keys()) as Array<VitalsBaseData['Family']>)),
  )

  public vitalsCategories = table(() => this.loadEntries(DATASHEETS.VitalsCategoryData))
  public vitalsCategoriesMap = tableIndexBy(() => this.vitalsCategories, 'VitalsCategoryID')
  public vitalsCategory = tableLookup(() => this.vitalsCategoriesMap)
  public vitalsCategoriesMapByGroup = tableGroupBy(() => this.vitalsCategories, 'GroupVitalsCategoryId')

  public vitalsModifiers = table(() => this.loadEntries(DATASHEETS.VitalsModifierData))
  public vitalsModifiersMap = tableIndexBy(() => this.vitalsModifiers, 'CategoryId')
  public vitalsModifier = tableLookup(() => this.vitalsModifiersMap)

  public vitalsLevels = table(() => this.loadEntries(DATASHEETS.VitalsLevelData))
  public vitalsLevelsMap = tableIndexBy(() => this.vitalsLevels, 'Level')
  public vitalsLevel = tableLookup(() => this.vitalsLevelsMap)

  public damagetypes = table(() => this.loadEntries(DATASHEETS.DamageTypeData))
  public damagetypesMap = tableIndexBy(() => this.damagetypes, 'TypeID')
  public damagetype = tableLookup(() => this.damagetypesMap)

  public territoriesMetadata = table(() =>
    this.load<ScannedTerritory>({ uri: 'nw-data/generated/territories_metadata.json' }),
  )
  public territoriesMetadataMap = tableIndexBy(() => this.territoriesMetadata, 'territoryID')
  public territoryMetadata = tableLookup(() => this.territoriesMetadataMap)

  public territories = table(() => this.loadEntries(DATASHEETS.TerritoryDefinition))
  public territoriesMap = tableIndexBy(() => this.territories, 'TerritoryID')
  public territory = tableLookup(() => this.territoriesMap)

  public territoriesByDiscoveredAchievementMap = tableGroupBy(() => this.territories, 'DiscoveredAchievement')
  public territoriesByDiscoveredAchievement = tableLookup(() => this.territoriesByDiscoveredAchievementMap)
  public territoriesByPoiTag = tableGroupBy(
    () => this.territories,
    (it) => it.POITag,
  )

  public pvpRanks = table(() => this.loadEntries(DATASHEETS.PvPRankData))
  public pvpRanksMap = tableIndexBy(() => this.pvpRanks, 'Level')
  public pvpRank = tableLookup(() => this.pvpRanksMap)

  public pvpStoreBuckets = table(() => {
    return this.loadEntries(DATASHEETS.PvPStoreData).map((it) => it.pipe(map(convertPvoStore)))
  })
  public pvpStoreBucketsMap = tableGroupBy(() => this.pvpStoreBuckets, 'Bucket')
  public pvpStoreBucket = tableLookup(() => this.pvpStoreBucketsMap)

  public pvpRewards = table(() => this.loadEntries(DATASHEETS.RewardTrackItemData))
  public pvpRewardsMap = tableIndexBy(() => this.pvpRewards, 'RewardId')
  public pvpReward = tableLookup(() => this.pvpRewardsMap)

  public milestoneRewards = table(() => this.loadEntries(DATASHEETS.RewardMilestoneData))

  public mutatorDifficulties = table(() => this.loadEntries(DATASHEETS.MutationDifficultyStaticData))
  public mutatorDifficultiesMap = tableIndexBy(() => this.mutatorDifficulties, 'MutationDifficulty')
  public mutatorDifficulty = tableLookup(() => this.mutatorDifficultiesMap)

  public mutatorElements = table(() => this.loadEntries(DATASHEETS.ElementalMutationStaticData))
  public mutatorElementsMap = tableIndexBy(() => this.mutatorElements, 'ElementalMutationId')
  public mutatorElement = tableLookup(() => this.mutatorElementsMap)

  public mutatorElementsPerks = table(() => this.loadEntries(DATASHEETS.MutationPerksStaticData))
  public mutatorElementsPerksMap = tableIndexBy(() => this.mutatorElementsPerks, 'ElementalMutationTypeId')
  public mutatorElementPerk = tableLookup(() => this.mutatorElementsPerksMap)

  public mutatorPromotions = table(() => this.loadEntries(DATASHEETS.PromotionMutationStaticData))
  public mutatorPromotionsMap = tableIndexBy(() => this.mutatorPromotions, 'PromotionMutationId')
  public mutatorPromotion = tableLookup(() => this.mutatorPromotionsMap)

  public mutatorCurses = table(() => this.loadEntries(DATASHEETS.CurseMutationStaticData))
  public mutatorCursesMap = tableIndexBy(() => this.mutatorCurses, 'CurseMutationId')
  public mutatorCurse = tableLookup(() => this.mutatorCursesMap)

  public viewGemPerksWithAffix = table(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = table(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = table(() => {
    return this.loadEntries(DATASHEETS.LootTablesData).map((it) => it.pipe(map(convertLoottables)))
  })
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

  public lootBuckets = table(() => {
    return this.loadEntries(DATASHEETS.LootBucketData).map((it) => it.pipe(map(convertLootbuckets)))
  })
  public lootBucketsMap = tableGroupBy(() => this.lootBuckets, 'LootBucket')
  public lootBucket = tableLookup(() => this.lootBucketsMap)
  public lootBucketsByItemIdMap = tableGroupBy(
    () => this.lootBuckets,
    (it) => it.Item,
  )
  public lootBucketsByItemId = tableLookup(() => this.lootBucketsByItemIdMap)

  public lootLimits = table(() => this.loadEntries(DATASHEETS.LootLimitData))
  public lootLimitsMap = tableIndexBy(() => this.lootLimits, 'LootLimitID')
  public lootLimit = tableLookup(() => this.lootLimitsMap)

  public buffBuckets = table(() => {
    return this.loadEntries(DATASHEETS.BuffBucketData).map((it) => it.pipe(map(convertBuffBuckets)))
  })
  public buffBucketsMap = tableIndexBy(() => this.buffBuckets, 'BuffBucketId')
  public buffBucket = tableLookup(() => this.buffBucketsMap)

  public xpAmounts = table(() => this.load(DATASHEETS.ExperienceData.XPLevels))
  public mileStoneRewards = table(() => this.loadEntries(DATASHEETS.RewardMilestoneData))
  public weaponMastery = table(() => this.load(DATASHEETS.CategoricalProgressionRankData.WeaponMastery))

  public attrCon = table(() => this.load(DATASHEETS.AttributeDefinition.Constitution))
  public attrStr = table(() => this.load(DATASHEETS.AttributeDefinition.Strength))
  public attrDex = table(() => this.load(DATASHEETS.AttributeDefinition.Dexterity))
  public attrFoc = table(() => this.load(DATASHEETS.AttributeDefinition.Focus))
  public attrInt = table(() => this.load(DATASHEETS.AttributeDefinition.Intelligence))

  public attrConByLevel = tableIndexBy(() => this.attrCon, 'Level')
  public attrStrByLevel = tableIndexBy(() => this.attrStr, 'Level')
  public attrDexByLevel = tableIndexBy(() => this.attrDex, 'Level')
  public attrFocByLevel = tableIndexBy(() => this.attrFoc, 'Level')
  public attrIntByLevel = tableIndexBy(() => this.attrInt, 'Level')

  public itemAppearances = table(() => this.loadEntries(DATASHEETS.ArmorAppearanceDefinitions))
  public itemAppearancesMap = tableIndexBy(() => this.itemAppearances, 'ItemID')
  public itemAppearance = tableLookup(() => this.itemAppearancesMap)
  public itemAppearancesByNameMap = tableGroupBy(() => this.itemAppearances, 'AppearanceName')
  public itemAppearancesByName = tableLookup(() => this.itemAppearancesByNameMap)

  public weaponAppearances = table(() => this.load(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions))
  public weaponAppearancesMap = tableIndexBy(() => this.weaponAppearances, 'WeaponAppearanceID')
  public weaponAppearance = tableLookup(() => this.weaponAppearancesMap)

  public instrumentAppearances = table(() =>
    this.load(DATASHEETS.WeaponAppearanceDefinitions.InstrumentsAppearanceDefinitions),
  )
  public instrumentAppearancesMap = tableIndexBy(() => this.instrumentAppearances, 'WeaponAppearanceID')
  public instrumentAppearance = tableLookup(() => this.instrumentAppearancesMap)

  public mountAttachmentsAppearances = table(() =>
    this.load(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions_MountAttachments),
  )
  public mountAttachmentsAppearancesMap = tableIndexBy(() => this.mountAttachmentsAppearances, 'WeaponAppearanceID')
  public mountAttachmentsAppearance = tableLookup(() => this.mountAttachmentsAppearancesMap)

  public dyeColors = table(() => this.loadEntries(DATASHEETS.DyeColorData))
  public dyeColorsMap = tableIndexBy(() => this.dyeColors, 'Index')
  public dyeColor = tableLookup(() => this.dyeColorsMap)

  public conversationStates = table(() => this.loadEntries(DATASHEETS.ConversationStateData))
  public conversationStatesMap = tableIndexBy(() => this.conversationStates, 'ConversationStateId')
  public conversationState = tableLookup(() => this.conversationStatesMap)
  public conversationStatesByObjectiveIdMap = tableGroupBy(
    () => this.conversationStates,
    (it) => {
      return [it.LinearObjectiveId1, it.LinearObjectiveId2, it.LinearObjectiveId3].filter((it) => !!it)
    },
  )
  public conversationStatesByObjectiveId = tableLookup(() => this.conversationStatesByObjectiveIdMap)

  public objectives = table(() => this.loadEntries(DATASHEETS.Objectives))
  public objectivesMap = tableIndexBy(() => this.objectives, 'ObjectiveID')
  public objective = tableLookup(() => this.objectivesMap)
  public objectivesByAchievementIdMap = tableGroupBy(() => this.objectives, 'AchievementId')
  public objectivesByAchievementId = tableLookup(() => this.objectivesByAchievementIdMap)
  public objectivesByRequiredAchievementIdMap = tableGroupBy(
    () => this.objectives,
    (it) => getQuestRequiredAchievmentIds(it),
  )
  public objectivesByNpcDestinationIdMap = tableGroupBy(() => this.objectives, 'NpcDestinationId')
  public objectivesByNpcDestinationId = tableLookup(() => this.objectivesByNpcDestinationIdMap)

  public objectiveTasks = table(() => this.loadEntries(DATASHEETS.ObjectiveTasks))
  public objectiveTasksMap = tableIndexBy(() => this.objectiveTasks, 'TaskID')
  public objectiveTask = tableLookup(() => this.objectiveTasksMap)

  public emotes = table(() => this.loadEntries(DATASHEETS.EmoteData))
  public emotesMap = tableIndexBy(() => this.emotes, 'UniqueTagID')
  public emote = tableLookup(() => this.emotesMap)

  public playerTitles = table(() => this.loadEntries(DATASHEETS.PlayerTitleData))
  public playerTitlesMap = tableIndexBy(() => this.playerTitles, 'TitleID')
  public playerTitle = tableLookup(() => this.playerTitlesMap)

  public entitlements = table(() => this.loadEntries(DATASHEETS.EntitlementData))
  public entitlementsMap = tableIndexBy(() => this.entitlements, 'UniqueTagID')
  public entitlement = tableLookup(() => this.entitlementsMap)

  public backstories = table(() => this.loadEntries(DATASHEETS.BackstoryDefinition))
  public backstoriesMap = tableIndexBy(() => this.backstories, 'BackstoryID')
  public backstory = tableLookup(() => this.backstoriesMap)

  public seasonPassData = table(() => this.loadEntries(DATASHEETS.SeasonPassRankData))
  public seasonPassDataMap = tableIndexBy(() => this.seasonPassData, getSeasonPassDataId)
  public seasonPassRow = tableLookup(() => this.seasonPassDataMap)

  public seasonPassRewards = table(() => this.loadEntries(DATASHEETS.SeasonsRewardData))
  public seasonPassRewardsMap = tableIndexBy(() => this.seasonPassRewards, 'RewardId')
  public seasonPassReward = tableLookup(() => this.seasonPassRewardsMap)
  public seasonPassRewardsByDisplayItemIdMap = tableGroupBy(() => this.seasonPassRewards, 'DisplayItemId')
  public seasonPassRewardsByDisplayItemId = tableLookup(() => this.seasonPassRewardsByDisplayItemIdMap)
  public seasonPassRewardsByItemIdMap = tableGroupBy(() => this.seasonPassRewards, 'ItemId')
  public seasonPassRewardsByItemId = tableLookup(() => this.seasonPassRewardsByItemIdMap)

  public seasonsRewardsTasks = table(() => this.loadEntries(DATASHEETS.SeasonsRewardsTasks))
  public seasonsRewardsTasksMap = tableIndexBy(() => this.seasonsRewardsTasks, 'SeasonsTaskID')
  public seasonsRewardsTask = tableLookup(() => this.seasonsRewardsTasksMap)

  public seasonsRewardsStatsKill = table(() => this.load(DATASHEETS.SeasonsRewardsStats.SeasonsRewardsStats_Kill))
  public seasonsRewardsStatsKillMap = tableIndexBy(() => this.seasonsRewardsStatsKill, 'TrackedStatID')
  public seasonsRewardsStatKill = tableLookup(() => this.seasonsRewardsStatsKillMap)

  public expansions = table(() => this.loadEntries(DATASHEETS.ExpansionData))
  public expansionsMap = tableIndexBy(() => this.expansions, 'ExpansionId')
  public expansion = tableLookup(() => this.expansionsMap)
}
