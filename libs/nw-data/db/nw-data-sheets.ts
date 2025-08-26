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
  MasterItemDefinitions,
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
} from '@nw-data/generated'
import { DataLoader, indexLookup, primaryIndex, secondaryIndex, table } from './dsl'
import { eqCaseInsensitive } from '../common/utils/caseinsensitive-compare'
import { NW_TRADESKILLS_INFOS } from '../common/tradeskill'

export abstract class NwDataSheets {
  protected abstract loader: DataLoader

  public loadDatasheet = <T>(uri: DataSheetUri<T>) => {
    return this.loader.loadDatasheet<T>(uri)
  }
  public loadDatasheets = <T>(collection: Record<string, DataSheetUri<T>>) => {
    return this.loader.loadDatasheets(collection)
  }

  public itemsAll = table(
    () => this.loadDatasheets(DATASHEETS.MasterItemDefinitions),
    (list) => {
      return list.sort((a, b) => {
        return b.$source === 'MasterItemDefinitions_AI' ? -1 : a.$source.localeCompare(b.$source)
      })
    },
  )
  public itemsByIdMap = primaryIndex(this.itemsAll, 'ItemID')
  public itemsById = indexLookup(this.itemsByIdMap)
  public itemsByIdTradingFamilyMap = secondaryIndex(this.itemsAll, 'TradingFamily')
  public itemsByIdTradingFamily = indexLookup(this.itemsByIdTradingFamilyMap)
  public itemsBySalvageAchievementMap = secondaryIndex(this.itemsAll, 'SalvageAchievement')
  public itemsBySalvageAchievement = indexLookup(this.itemsBySalvageAchievementMap)
  public itemsByIngredientCategoryMap = secondaryIndex(this.itemsAll, 'IngredientCategories')
  public itemsByIngredientCategory = indexLookup(this.itemsByIngredientCategoryMap)
  public itemsByAppearanceIdMap = secondaryIndex(this.itemsAll, (it) => {
    return [it.ArmorAppearanceM, it.ArmorAppearanceF, it.WeaponAppearanceOverride].filter((it) => !!it)
  })
  public itemsByAppearanceId = indexLookup(this.itemsByAppearanceIdMap)
  public itemsByItemTypeMap = secondaryIndex(this.itemsAll, 'ItemType')
  public itemsByItemType = indexLookup(this.itemsByItemTypeMap)
  public itemsBySetFamilyNameMap = secondaryIndex<MasterItemDefinitions, string>(this.itemsAll, getItemSetFamilyName)
  public itemsBySetFamilyName = indexLookup(this.itemsBySetFamilyNameMap)

  public housingItemsAll = table(() => this.loadDatasheets(DATASHEETS.HouseItems))
  public housingItemsByIdMap = primaryIndex(this.housingItemsAll, 'HouseItemID')
  public housingItemsById = indexLookup(this.housingItemsByIdMap)
  public housingItemsByStatusEffectMap = secondaryIndex(this.housingItemsAll, 'HousingStatusEffect')
  public housingItemsByStatusEffect = indexLookup(this.housingItemsByStatusEffectMap)

  public itemOrHousingItem = async (id: string) => {
    const [a, b] = await Promise.all([this.itemsById(id), this.housingItemsById(id)])
    return a || b
  }

  public houseTypesAll = table(() => this.loadDatasheets(DATASHEETS.HouseTypeData))
  public houseTypesByIdMap = primaryIndex(this.houseTypesAll, 'HouseTypeID')
  public houseTypesById = indexLookup(this.houseTypesByIdMap)
  public houseTypesMetaAll = table(() =>
    this.loadDatasheet<ScannedHouseType>({ uri: 'generated/houses_metadata.json' }),
  )
  public houseTypesMetaByIdMap = primaryIndex(this.houseTypesMetaAll, 'houseTypeID')

  public structureTypesMetaAll = table(() =>
    this.loadDatasheet<ScannedStructureType>({ uri: 'generated/structures_metadata.json' }),
  )
  public structureTypesMetaMap = primaryIndex(this.structureTypesMetaAll, 'type')
  public structureTypesMeta = indexLookup(this.structureTypesMetaMap)

  public stationTypesMetaAll = table(() =>
    this.loadDatasheet<ScannedStationType>({ uri: 'generated/stations_metadata.json' }),
  )
  public stationTypesMetaMap = primaryIndex(this.stationTypesMetaAll, 'stationID')
  public stationTypesMeta = indexLookup(this.stationTypesMetaMap)

  public itemTransformsAll = table(() => this.loadDatasheets(DATASHEETS.ItemTransform))
  public itemTransformsByIdMap = primaryIndex(this.itemTransformsAll, 'FromItemId')
  public itemTransformsById = indexLookup(this.itemTransformsByIdMap)
  public itemTransformsByToItemIdMap = secondaryIndex(this.itemTransformsAll, 'ToItemId')
  public itemTransformsByToItemId = indexLookup(this.itemTransformsByToItemIdMap)

  public abilitiesAll = table(() => this.loadDatasheets(DATASHEETS.AbilityData))
  public abilitiesByIdMap = primaryIndex(this.abilitiesAll, 'AbilityID')
  public abilitiesById = indexLookup(this.abilitiesByIdMap)
  public abilitiesByStatusEffectMap = secondaryIndex(this.abilitiesAll, 'StatusEffect')
  public abilitiesByStatusEffect = indexLookup(this.abilitiesByStatusEffectMap)
  public abilitiesBySelfApplyStatusEffectMap = secondaryIndex(this.abilitiesAll, 'SelfApplyStatusEffect')
  public abilitiesBySelfApplyStatusEffect = indexLookup(this.abilitiesBySelfApplyStatusEffectMap)
  public abilitiesByOtherApplyStatusEffectMap = secondaryIndex(this.abilitiesAll, 'OtherApplyStatusEffect')
  public abilitiesByOtherApplyStatusEffect = indexLookup(this.abilitiesByOtherApplyStatusEffectMap)
  public abilitiesByRequiredAbilityIdMap = secondaryIndex(this.abilitiesAll, 'RequiredAbilityId')
  public abilitiesByRequiredAbilityId = indexLookup(this.abilitiesByRequiredAbilityIdMap)
  public abilitiesByRequiredEquippedAbilityIdMap = secondaryIndex(this.abilitiesAll, 'RequiredEquippedAbilityId')
  public abilitiesByRequiredEquippedAbilityId = indexLookup(this.abilitiesByRequiredEquippedAbilityIdMap)
  public abilitiesByAbilityListMap = secondaryIndex(this.abilitiesAll, 'AbilityList')
  public abilitiesByAbilityList = indexLookup(this.abilitiesByAbilityListMap)

  public statusEffectsAll = table(() => this.loadDatasheets(DATASHEETS.StatusEffectData))
  public statusEffectsByIdMap = primaryIndex(this.statusEffectsAll, 'StatusID')
  public statusEffectsById = indexLookup(this.statusEffectsByIdMap)

  public statusEffectCategoriesAll = table(() => this.loadDatasheets(DATASHEETS.StatusEffectCategoryData))
  public statusEffectCategoriesByIdMap = primaryIndex(this.statusEffectCategoriesAll, 'StatusEffectCategoryID')
  public statusEffectCategoriesById = indexLookup(this.statusEffectCategoriesByIdMap)

  public perksExclusiveLabelAll = table(() => this.loadDatasheets(DATASHEETS.PerkExclusiveLabelData))
  public perksExclusiveLabelByIdMap = primaryIndex(this.perksExclusiveLabelAll, 'ExclusiveLabelID')

  public perksAll = table(() => this.loadDatasheets(DATASHEETS.PerkData))
  public perksByIdMap = primaryIndex(this.perksAll, 'PerkID')
  public perksById = indexLookup(this.perksByIdMap)
  public perksByEquipAbilityMap = secondaryIndex(this.perksAll, 'EquipAbility')
  public perksByEquipAbility = indexLookup(this.perksByEquipAbilityMap)
  public perksByAffixMap = secondaryIndex(this.perksAll, 'Affix')
  public perksByAffix = indexLookup(this.perksByAffixMap)

  public perkBucketsAll = table(() => {
    return this.loadDatasheets(DATASHEETS.PerkBucketData).map((it) => it.then(convertPerkBuckets))
  })
  public perkBucketsByIdMap = primaryIndex(this.perkBucketsAll, 'PerkBucketID')
  public perkBucketsById = indexLookup(this.perkBucketsByIdMap)
  public perkBucketsByPerkIdMap = secondaryIndex(this.perkBucketsAll, (it) => {
    return it.Entries.map((it) => 'PerkID' in it && it.PerkID)
  })
  public perkBucketsByPerkId = indexLookup(this.perkBucketsByPerkIdMap)

  public affixStatsAll = table(() => this.loadDatasheets(DATASHEETS.AffixStatData))
  public affixStatsByIdMap = primaryIndex(this.affixStatsAll, 'StatusID')
  public affixStatsById = indexLookup(this.affixStatsByIdMap)
  public affixByStatusEffectMap = secondaryIndex(this.affixStatsAll, 'StatusEffect')
  public affixByStatusEffect = indexLookup(this.affixByStatusEffectMap)

  public cooldownsAll = table(() => this.loadDatasheets(DATASHEETS.CooldownData))
  public cooldownsByAbilityIdMap = secondaryIndex(this.cooldownsAll, 'AbilityID')
  public cooldownsByAbilityId = indexLookup(this.cooldownsByAbilityIdMap)

  public damageTables0 = table(() => this.loadDatasheet(DATASHEETS.DamageData.DamageTable))
  public damageTables0Map = primaryIndex(this.damageTables0, 'DamageID')
  public damageTable0 = indexLookup(this.damageTables0Map)

  public damageTablesAll = table(() => this.loadDatasheets(DATASHEETS.DamageData))
  public damageTablesBySourceMap = secondaryIndex(this.damageTablesAll, '$source')
  public damageTablesBySource = indexLookup(this.damageTablesBySourceMap)
  public damageTablesBySourceAndRowId = (table: string, rowId: string) => {
    return this.damageTablesBySource(table).then((list) => list.find((it) => eqCaseInsensitive(it.DamageID, rowId)))
  }
  // DEPRECATED:
  public damageTablesByIdMap = primaryIndex(this.damageTablesAll, 'DamageID')
  // DEPRECATED:
  public damageTablesById = indexLookup(this.damageTablesByIdMap)
  public damageTablesByStatusEffectMap = secondaryIndex(this.damageTablesAll, 'StatusEffect')
  public damageTablesByStatusEffect = indexLookup(this.damageTablesByStatusEffectMap)

  public arenaBalanceDataAll = table(() => this.loadDatasheets(DATASHEETS.ArenaBalanceData))
  public openWroldBalanceDataAll = table(() => this.loadDatasheets(DATASHEETS.OpenWorldBalanceData))
  public outpostRushBalanceDataAll = table(() => this.loadDatasheets(DATASHEETS.OutpostRushBalanceData))
  public warBalanceDataAll = table(() => this.loadDatasheets(DATASHEETS.WarBalanceData))
  // pvpBalanceArena: this.db.useTable((it) => it.ArenaBalanceData.ArenaPvpBalanceTable),
  // pvpBalanceOpenworld: this.db.useTable((it) => it.OpenWorldBalanceData.OpenWorldPvpBalanceTable),
  // pvpBalanceOutpostrush: this.db.useTable((it) => it.OutpostRushBalanceData.OutpostRushPvpBalanceTable),
  // pvpBalanceWar: this.db.useTable((it) => it.WarBalanceData.WarPvpBalanceTable),

  public gatherablesAll = table(() => this.loadDatasheets(DATASHEETS.GatherableData))
  public gatherablesByIdMap = primaryIndex(this.gatherablesAll, 'GatherableID')
  public gatherablesById = indexLookup(this.gatherablesByIdMap)

  public gatherablesMetadataAll = table(() =>
    this.loadDatasheet<ScannedGatherable>({ uri: 'generated/gatherables_metadata.json' }),
  )
  public gatherablesMetadataByIdMap = primaryIndex(this.gatherablesMetadataAll, 'gatherableID')
  public gatherablesMetadataById = indexLookup(this.gatherablesMetadataByIdMap)

  public gatherableVariationsAll = table(
    () => {
      return this.loadDatasheets<VariationDataGatherable>(DATASHEETS.VariationDataGatherable)
    },
    convertGatherableVariations,
  )

  public gatherableVariationsByIdMap = primaryIndex(this.gatherableVariationsAll, 'VariantID')
  public gatherableVariationsById = indexLookup(this.gatherableVariationsByIdMap)
  public gatherableVariationsByGatherableIdMap = secondaryIndex(this.gatherableVariationsAll, (it) =>
    it.Gatherables.map((it) => it.GatherableID),
  )
  public gatherableVariationsByGatherableId = indexLookup(this.gatherableVariationsByGatherableIdMap)

  public variationsMetadataAll = table(() =>
    this.loadDatasheet<ScannedVariation>({ uri: 'generated/variations_metadata.json' }),
  )
  public variationsMetadataByIdMap = primaryIndex(this.variationsMetadataAll, 'variantID')
  public variationsMetadataById = indexLookup(this.variationsMetadataByIdMap)
  public async variationsChunk(id: number) {
    if (id == null) {
      return []
    }
    return this.loader
      .fetch(`generated/variations_metadata.${id}.chunk`)
      .then((res) => res.arrayBuffer())
      .then((res) => new Float32Array(res))
      .then((data) => {
        const points: [number, number][] = []
        for (let i = 0; i < data.length; i += 2) {
          points.push([data[i], data[i + 1]])
        }
        return points
      })
  }

  public npcsAll = table(() => this.loadDatasheets(DATASHEETS.NPCData))
  public npcsByIdMap = secondaryIndex(this.npcsAll, 'NPCId') // contains duplicates
  public npcsById = indexLookup(this.npcsByIdMap)
  public npcsByConversationStateIdMap = secondaryIndex(this.npcsAll, (it) => {
    const index: string[] = []
    for (const key in it) {
      if (key.startsWith('ConversationStateId')) {
        index.push(it[key])
      }
    }
    return index
  })
  public npcsByConversationStateId = indexLookup(this.npcsByConversationStateIdMap)

  public npcsVariationsAll = table(() => this.loadDatasheet(DATASHEETS.VariationData.NPC))
  public npcsVariationsByIdMap = primaryIndex(this.npcsVariationsAll, 'VariantID')
  public npcsVariationsById = indexLookup(this.npcsVariationsByIdMap)
  public npcsVariationsByNpcIdMap = secondaryIndex(this.npcsVariationsAll, 'NPCId')
  public npcsVariationsByNpcId = indexLookup(this.npcsVariationsByNpcIdMap)

  public npcsMetadataAll = table(() => this.loadDatasheet<ScannedNpc>({ uri: 'generated/npcs_metadata.json' }))
  public npcsMetadataByIdMap = primaryIndex(this.npcsMetadataAll, 'npcID')
  public npcsMetadataById = indexLookup(this.npcsMetadataByIdMap)

  public mountsAll = table(() => this.loadDatasheets(DATASHEETS.MountData))
  public mountsByIdMap = primaryIndex(this.mountsAll, 'MountId')
  public mountsById = indexLookup(this.mountsByIdMap)

  public armorItemsAll = table(() => this.loadDatasheets(DATASHEETS.ArmorItemDefinitions))
  public armorItemsByIdMap = primaryIndex(this.armorItemsAll, 'WeaponID')
  public armorItemsById = indexLookup(this.armorItemsByIdMap)

  public weaponItemsAll = table(() => this.loadDatasheets(DATASHEETS.WeaponItemDefinitions))
  public weaponItemsByIdMap = primaryIndex(this.weaponItemsAll, 'WeaponID')
  public weaponItemsById = indexLookup(this.weaponItemsByIdMap)

  public ammoItemsAll = table(() => this.loadDatasheets(DATASHEETS.AmmoItemDefinitions))
  public ammoItemsByIdMap = primaryIndex(this.ammoItemsAll, 'AmmoID')
  public ammoItemsById = indexLookup(this.ammoItemsByIdMap)

  public dyeColorsAll = table(() => this.loadDatasheets(DATASHEETS.DyeColorData))
  public dyeColorsByIndexMap = primaryIndex(this.dyeColorsAll, 'Index')
  public dyeColorsByIndex = indexLookup(this.dyeColorsByIndexMap)

  public dyeItemsAll = table(() => this.loadDatasheets(DATASHEETS.DyeItemDefinitions))
  public dyeItemsByIdMap = primaryIndex(this.dyeItemsAll, 'DyeItemId')
  public dyeItemsById = indexLookup(this.dyeItemsByIdMap)
  public dyeItemsByIndexMap = primaryIndex(this.dyeItemsAll, 'ColorIndex')
  public dyeItemsByIndex = indexLookup(this.dyeItemsByIndexMap)

  public consumableItemsAll = table(() => this.loadDatasheets(DATASHEETS.ConsumableItemDefinitions))
  public consumableItemsByIdMap = primaryIndex(this.consumableItemsAll, 'ConsumableID')
  public consumableItemsById = indexLookup(this.consumableItemsByIdMap)
  public consumableItemsByAddStatusEffectsMap = secondaryIndex(this.consumableItemsAll, 'AddStatusEffects')
  public consumableItemsByAddStatusEffects = indexLookup(this.consumableItemsByAddStatusEffectsMap)

  public runeItems = table(() => this.loadDatasheet(DATASHEETS.WeaponItemDefinitions.RuneItemDefinitions))
  public runeItemsByIdMap = primaryIndex(this.runeItems, 'WeaponID')
  public runeItemsById = indexLookup(this.runeItemsByIdMap)

  public spellsAll = table(() => this.loadDatasheets(DATASHEETS.SpellData))
  public spellsByIdMap = primaryIndex(this.spellsAll, 'SpellID')
  public spellsById = indexLookup(this.spellsByIdMap)
  public spellsByDamageTableMap = secondaryIndex(this.spellsAll, 'DamageTable')
  public spellsByDamageTable = indexLookup(this.spellsByDamageTableMap)
  public spellsByAbilityIdMap = secondaryIndex(this.spellsAll, 'AbilityId')
  public spellsByAbilityId = indexLookup(this.spellsByAbilityIdMap)
  public spellsByStatusEffectIdMap = secondaryIndex(this.spellsAll, 'StatusEffects')
  public spellsByStatusEffectId = indexLookup(this.spellsByStatusEffectIdMap)

  public spellsMetadataAll = table(() => this.loadDatasheet<ScannedSpell>({ uri: 'generated/spells_metadata.json' }))
  public spellsMetadataByPrefabPathMap = primaryIndex(this.spellsMetadataAll, 'PrefabPath')
  public spellsMetadataByPrefabPath = indexLookup(this.spellsMetadataByPrefabPathMap)

  public gameModesAll = table(() => this.loadDatasheets(DATASHEETS.GameModeData))
  public gameModesByIdMap = primaryIndex(this.gameModesAll, 'GameModeId')
  public gameModesById = indexLookup(this.gameModesByIdMap)


  public gameModesMapsAll = table(() => this.loadDatasheets(DATASHEETS.GameModeMapData))
  public gameModesMapsByIdMap = primaryIndex(this.gameModesMapsAll, 'GameModeId')
  public gameModesMapsById = indexLookup(this.gameModesMapsByIdMap)

  public loreItemsAll = table(() => this.loadDatasheets(DATASHEETS.LoreData))
  public loreItemsByIdMap = primaryIndex(this.loreItemsAll, 'LoreID')
  public loreItemsById = indexLookup(this.loreItemsByIdMap)
  public loreItemsByParentIdMap = secondaryIndex(this.loreItemsAll, 'ParentID')
  public loreItemsByParentId = indexLookup(this.loreItemsByParentIdMap)

  public loreItemsMetadataAll = table(() => this.loadDatasheet<ScannedLore>({ uri: 'generated/lore_metadata.json' }))
  public loreItemsMetadataByIdMap = primaryIndex(this.loreItemsMetadataAll, 'loreID')
  public loreItemsMetadataById = indexLookup(this.loreItemsMetadataByIdMap)

  public craftingCategoriesAll = table(() => this.loadDatasheets(DATASHEETS.CraftingCategoryData))
  public craftingCategoriesByIdMap = primaryIndex(this.craftingCategoriesAll, 'CategoryID')
  public craftingCategoriesById = indexLookup(this.craftingCategoriesByIdMap)

  public recipesAll = table(() => this.loadDatasheets(DATASHEETS.CraftingRecipeData))
  public recipesByIdMap = primaryIndex(this.recipesAll, 'RecipeID')
  public recipesById = indexLookup(this.recipesByIdMap)
  public recipesByItemIdMap = secondaryIndex(this.recipesAll, getItemIdFromRecipe)
  public recipesByItemId = indexLookup(this.recipesByItemIdMap)
  public recipesByRequiredAchievementIdMap = secondaryIndex(this.recipesAll, 'RequiredAchievementID')
  public recipesByRequiredAchievementId = indexLookup(this.recipesByRequiredAchievementIdMap)
  public recipesByIngredientsMap = secondaryIndex(this.recipesAll, (it) =>
    getCraftingIngredients(it)
      .map((it) => it.ingredient)
      .filter((it) => !!it),
  )
  public recipesByIngredient = indexLookup(this.recipesByIngredientsMap)
  public recipesByFirstCraftAchievementIdMap = secondaryIndex(this.recipesAll, 'FirstCraftAchievementId')
  public recipesByFirstCraftAchievementId = indexLookup(this.recipesByFirstCraftAchievementIdMap)
  public recipesByUnlockedAchievementBlocksRecraftingMap = secondaryIndex(
    this.recipesAll,
    'UnlockedAchievementBlocksRecrafting',
  )
  public recipesByUnlockedAchievementBlocksRecrafting = indexLookup(this.recipesByFirstCraftAchievementIdMap)

  public recipeCategoriesAll = table(() => this.loadDatasheets(DATASHEETS.CraftingCategoryData))
  public recipeCategoriesByIdMap = primaryIndex(this.recipeCategoriesAll, 'CategoryID')
  public recipeCategoriesById = indexLookup(this.recipeCategoriesByIdMap)

  public resourceItemsAll = table(() => this.loadDatasheets(DATASHEETS.ResourceItemDefinitions))
  public resourceItemsByIdMap = primaryIndex(this.resourceItemsAll, 'ResourceID')
  public resourceItemsById = indexLookup(this.resourceItemsByIdMap)
  public resourceItemsByPerkBucketIdMap = secondaryIndex(this.resourceItemsAll, 'PerkBucket')
  public resourceItemsByPerkBucketId = indexLookup(this.resourceItemsByPerkBucketIdMap)

  public affixesAll = table(() => this.loadDatasheets(DATASHEETS.AffixData))
  public affixesByIdMap = primaryIndex(this.affixesAll, 'AffixID')
  public affixesById = indexLookup(this.affixesByIdMap)

  public afflictionsAll = table(() => this.loadDatasheets(DATASHEETS.AfflictionData))
  public afflictionsByIdMap = primaryIndex(this.afflictionsAll, 'AfflictionID')
  public afflictionsById = indexLookup(this.afflictionsByIdMap)

  public costumeChangesAll = table(() => this.loadDatasheets(DATASHEETS.CostumeChangeData))
  public costumeChangesByIdMa = primaryIndex(this.costumeChangesAll, 'CostumeChangeId')
  public costumeChangesById = indexLookup(this.costumeChangesByIdMa)

  public manaCostsAll = table(() => this.loadDatasheets(DATASHEETS.ManaData))
  public manaCostsByIdMap = primaryIndex(this.manaCostsAll, 'CostID')
  public manaCostsById = indexLookup(this.manaCostsByIdMap)

  public staminaDataAll = table(() => this.loadDatasheets(DATASHEETS.StaminaData))
  public staminaDataByIdMap = primaryIndex(this.staminaDataAll, 'CostID')
  public staminaDataById = indexLookup(this.staminaDataByIdMap)

  public gameEventsAll = table(() => this.loadDatasheets(DATASHEETS.GameEventData))
  public gameEventsByIdMap = primaryIndex(this.gameEventsAll, 'EventID')
  public gameEventsById = indexLookup(this.gameEventsByIdMap)
  public gameEventsByLootLimitIdMap = secondaryIndex(this.gameEventsAll, 'LootLimitId')
  public gameEventsByLootLimitId = indexLookup(this.gameEventsByLootLimitIdMap)

  public categoricalProgressionAll = table(() => this.loadDatasheets(DATASHEETS.CategoricalProgressionData))
  public categoricalProgressionByIdMap = primaryIndex(this.categoricalProgressionAll, 'CategoricalProgressionId')
  public categoricalProgressionById = indexLookup(this.categoricalProgressionByIdMap)

  public itemCurrencyConversionAll = table(() => this.loadDatasheets(DATASHEETS.ItemCurrencyConversionData))
  public itemCurrencyConversionByIdMap = secondaryIndex(this.itemCurrencyConversionAll, 'ConversionID')
  public itemCurrencyConversionById = indexLookup(this.itemCurrencyConversionByIdMap)
  public itemCurrencyConversionByItemIdMap = secondaryIndex(this.itemCurrencyConversionAll, 'ItemID')
  public itemCurrencyConversionByItemId = indexLookup(this.itemCurrencyConversionByItemIdMap)
  public itemCurrencyConversionByProgressionIdMap = secondaryIndex(this.itemCurrencyConversionAll, 'CategoricalProgressionId')
  public itemCurrencyConversionByProgressionId = indexLookup(this.itemCurrencyConversionByProgressionIdMap)

  public achievementsAll = table(() => this.loadDatasheets(DATASHEETS.AchievementData))
  public achievementsByIdMap = primaryIndex(this.achievementsAll, 'AchievementID')
  public achievementsById = indexLookup(this.achievementsByIdMap)

  public metaAchievementsAll = table(() => this.loadDatasheets(DATASHEETS.MetaAchievementData))
  public metaAchievementsByIdMap = primaryIndex(this.metaAchievementsAll, 'MetaAchievementId')
  public metaAchievementsById = indexLookup(this.metaAchievementsByIdMap)

  public tradeskillAll = table(() => Promise.resolve(NW_TRADESKILLS_INFOS))
  public tradeskillByIdMap = primaryIndex(this.tradeskillAll, 'ID')
  public tradeskillById = indexLookup(this.tradeskillByIdMap)
  public tradeskillPostcapAll = table(() => this.loadDatasheets(DATASHEETS.TradeSkillPostCapData))
  public tradeskillRankDataAll = table(() => this.loadDatasheets(DATASHEETS.TradeskillRankData))
  public tradeskillRankDataByTradeskillMap = secondaryIndex(this.tradeskillRankDataAll, '$source')
  public tradeskillRankDataByTradeskill = indexLookup(this.tradeskillRankDataByTradeskillMap)
  public tradeskillRankDataByTradeskillAndLevel = async (tradeskill: string, level: number) => {
    const list = await this.tradeskillRankDataByTradeskill(tradeskill)
    return list?.find((it) => it.Level === level)
  }

  public vitalsMetadataAll = table(() => {
    return [
      this.loadDatasheet<ScannedVital>({ uri: 'generated/vitals_metadata1.json' }),
      this.loadDatasheet<ScannedVital>({ uri: 'generated/vitals_metadata2.json' }),
    ]
  })
  public vitalsMetadataByIdMap = primaryIndex(this.vitalsMetadataAll, 'vitalsID')
  public vitalsMetadataById = indexLookup(this.vitalsMetadataByIdMap)

  public vitalsModelsMetadataAll = table(() =>
    this.loadDatasheet<ScannedVitalModel>({ uri: 'generated/vitals_models_metadata.json' }),
  )
  public vitalsModelsMetadataByIdMap = primaryIndex(this.vitalsModelsMetadataAll, 'id')
  public vitalsModelsMetadataById = indexLookup(this.vitalsModelsMetadataByIdMap)

  public vitalsBaseAll = table(() => this.loadDatasheets(DATASHEETS.VitalsBaseData))
  public vitalsBaseByIdMap = primaryIndex(this.vitalsBaseAll, 'VitalsID')
  public vitalsBaseById = indexLookup(this.vitalsBaseByIdMap)
  public vitalsLevelVariantsAll = table(() => this.loadDatasheets(DATASHEETS.VitalsLevelVariantData))
  public vitalsLevelVariantsByIdMap = primaryIndex(this.vitalsLevelVariantsAll, 'VitalsID')
  public vitalsLevelVariants = indexLookup(this.vitalsLevelVariantsByIdMap)

  public vitalsAll = table<VitalsBaseData & VitalsLevelVariantData>(async () => {
    return Promise.all([this.vitalsBaseByIdMap(), this.vitalsLevelVariantsAll()]).then(([baseMap, variants]) => {
      return variants.map((it) => {
        const base = baseMap.get(it.VitalsID)
        return {
          ...base,
          ...it,
        }
      })
    })
  })
  public vitalsByIdMap = primaryIndex(this.vitalsAll, 'VitalsID')
  public vitalsById = indexLookup(this.vitalsByIdMap)
  public vitalsByFamilyMap = secondaryIndex(this.vitalsAll, 'Family')
  public vitalsByFamily = indexLookup(this.vitalsByFamilyMap)
  public vitalsByCreatureTypeMap = secondaryIndex(this.vitalsAll, 'CreatureType')
  public vitalsByCreatureType = indexLookup(this.vitalsByCreatureTypeMap)

  // public vitalsFamilies = table(() =>
  //   this.vitalsByFamilyMap.pipe(map((it) => Array.from(it.keys()) as Array<VitalsBaseData['Family']>)),
  // )

  public vitalsCategoriesAll = table(() => this.loadDatasheets(DATASHEETS.VitalsCategoryData))
  public vitalsCategoriesByIdMap = primaryIndex(this.vitalsCategoriesAll, 'VitalsCategoryID')
  public vitalsCategoriesById = indexLookup(this.vitalsCategoriesByIdMap)
  public vitalsCategoriesByGroupId = secondaryIndex(this.vitalsCategoriesAll, 'GroupVitalsCategoryId')
  public vitalsCategoriesByGroup = indexLookup(this.vitalsCategoriesByGroupId)

  public vitalsModifiersAll = table(() => this.loadDatasheets(DATASHEETS.VitalsModifierData))
  public vitalsModifiersByIdMap = primaryIndex(this.vitalsModifiersAll, 'CategoryId')
  public vitalsModifiersById = indexLookup(this.vitalsModifiersByIdMap)

  public vitalsLevelsAll = table(() => this.loadDatasheets(DATASHEETS.VitalsLevelData))
  public vitalsLevelsByLevelMap = primaryIndex(this.vitalsLevelsAll, 'Level')
  public vitalsLevelsByLevel = indexLookup(this.vitalsLevelsByLevelMap)

  public damagetypesAll = table(() => this.loadDatasheets(DATASHEETS.DamageTypeData))
  public damagetypesByIdMap = primaryIndex(this.damagetypesAll, 'TypeID')
  public damagetypesById = indexLookup(this.damagetypesByIdMap)

  public territoriesMetadataAll = table(() =>
    this.loadDatasheet<ScannedTerritory>({ uri: 'generated/territories_metadata.json' }),
  )
  public territoriesMetadataByIdMap = primaryIndex(this.territoriesMetadataAll, 'territoryID')
  public territoriesMetadataById = indexLookup(this.territoriesMetadataByIdMap)

  public territoriesAll = table(() => this.loadDatasheets(DATASHEETS.TerritoryDefinition))
  public territoriesByIdMap = primaryIndex(this.territoriesAll, 'TerritoryID')
  public territoriesById = indexLookup(this.territoriesByIdMap)

  public territoriesByDiscoveredAchievementMap = secondaryIndex(this.territoriesAll, 'DiscoveredAchievement')
  public territoriesByDiscoveredAchievement = indexLookup(this.territoriesByDiscoveredAchievementMap)
  public territoriesByPoiTagMap = secondaryIndex(this.territoriesAll, (it) => it.POITag)

  public territoriesByFactionControlBuffMap = secondaryIndex(this.territoriesAll, 'FactionControlBuff')
  public territoriesByFactionControlBuff = indexLookup(this.territoriesByFactionControlBuffMap)

  public pvpRanksAll = table(() => this.loadDatasheets(DATASHEETS.PvPRankData))
  public pvpRanksByLevelMap = primaryIndex(this.pvpRanksAll, 'Level')
  public pvpRanksByLevel = indexLookup(this.pvpRanksByLevelMap)

  public pvpStoreBucketsAll = table(() => {
    return this.loadDatasheets(DATASHEETS.PvPStoreData).map((it) => it.then(convertPvoStore))
  })
  public pvpStoreBucketsByIdMap = secondaryIndex(this.pvpStoreBucketsAll, 'Bucket')
  public pvpStoreBucketsById = indexLookup(this.pvpStoreBucketsByIdMap)
  public pvpStoreBucketsByBucketAndRow = async (bucket: string, row: number) => {
    const list = await this.pvpStoreBucketsAll()
    return list.find((it) => it.Bucket === bucket && it.Row === row)
  }

  public pvpRewardsAll = table(() => this.loadDatasheets(DATASHEETS.RewardTrackItemData))
  public pvpRewardsByIdMap = primaryIndex(this.pvpRewardsAll, 'RewardId')
  public pvpRewardsById = indexLookup(this.pvpRewardsByIdMap)

  public milestoneRewardsAll = table(() => this.loadDatasheets(DATASHEETS.RewardMilestoneData))

  public mutatorDifficultiesAll = table(() => this.loadDatasheets(DATASHEETS.MutationDifficultyStaticData))
  public mutatorDifficultiesByIdMap = primaryIndex(this.mutatorDifficultiesAll, 'MutationDifficulty')
  public mutatorDifficultiesById = indexLookup(this.mutatorDifficultiesByIdMap)

  public mutatorElementsAll = table(() => this.loadDatasheets(DATASHEETS.ElementalMutationStaticData))
  public mutatorElementsByIdMap = primaryIndex(this.mutatorElementsAll, 'ElementalMutationId')
  public mutatorElementsById = indexLookup(this.mutatorElementsByIdMap)

  public mutatorElementsPerksAll = table(() => this.loadDatasheets(DATASHEETS.MutationPerksStaticData))
  public mutatorElementsPerksByIdMap = primaryIndex(this.mutatorElementsPerksAll, 'ElementalMutationTypeId')
  public mutatorElementsPerksById = indexLookup(this.mutatorElementsPerksByIdMap)

  public mutatorPromotionsAll = table(() => this.loadDatasheets(DATASHEETS.PromotionMutationStaticData))
  public mutatorPromotionsByIdMap = primaryIndex(this.mutatorPromotionsAll, 'PromotionMutationId')
  public mutatorPromotionsById = indexLookup(this.mutatorPromotionsByIdMap)

  public mutatorCursesAll = table(() => this.loadDatasheets(DATASHEETS.CurseMutationStaticData))
  public mutatorCursesByIdMap = primaryIndex(this.mutatorCursesAll, 'CurseMutationId')
  public mutatorCursesById = indexLookup(this.mutatorCursesByIdMap)

  public lootTablesAll = table(() => {
    return this.loadDatasheets(DATASHEETS.LootTablesData).map((it) => it.then(convertLoottables))
  })
  public lootTablesByIdMap = primaryIndex(this.lootTablesAll, 'LootTableID')
  public lootTablesById = indexLookup(this.lootTablesByIdMap)
  public lootTablesByLootBucketIdMap = secondaryIndex(this.lootTablesAll, (row) => {
    return row.Items.map((it) => it.LootBucketID)
  })
  public lootTablesByLootBucketId = indexLookup(this.lootTablesByLootBucketIdMap)
  public lootTablesByLootTableIdMap = secondaryIndex(this.lootTablesAll, (row) => row.Items.map((it) => it.LootTableID))
  public lootTablesByLootTableId = indexLookup(this.lootTablesByLootTableIdMap)
  public lootTablesByLootItemIdMap = secondaryIndex(this.lootTablesAll, (row) => row.Items.map((it) => it.ItemID))
  public lootTablesByLootItemId = indexLookup(this.lootTablesByLootItemIdMap)

  public lootBucketsAll = table(() => {
    return this.loadDatasheets(DATASHEETS.LootBucketData).map((it) => it.then(convertLootbuckets))
  })
  public lootBucketsByIdMap = secondaryIndex(this.lootBucketsAll, 'LootBucket')
  public lootBucketsById = indexLookup(this.lootBucketsByIdMap)
  public lootBucketsByItemIdMap = secondaryIndex(this.lootBucketsAll, (it) => it.Item)
  public lootBucketsByItemId = indexLookup(this.lootBucketsByItemIdMap)

  public lootLimitsAll = table(() => this.loadDatasheets(DATASHEETS.LootLimitData))
  public lootLimitsByIdMap = primaryIndex(this.lootLimitsAll, 'LootLimitID')
  public lootLimitsById = indexLookup(this.lootLimitsByIdMap)

  public buffBucketsAll = table(() => {
    return this.loadDatasheets(DATASHEETS.BuffBucketData).map((it) => it.then(convertBuffBuckets))
  })
  public buffBucketsByIdMap = primaryIndex(this.buffBucketsAll, 'BuffBucketId')
  public buffBucketsById = indexLookup(this.buffBucketsByIdMap)

  public xpLevels = table(() => this.loadDatasheet(DATASHEETS.ExperienceData.XPLevels))
  public weaponMasteryAll = table(() => this.loadDatasheet(DATASHEETS.CategoricalProgressionRankData.WeaponMastery))

  public categoricalRankTerritoryStanding = table(() =>
    this.loadDatasheet(DATASHEETS.CategoricalProgressionRankData.Territory_Standing),
  )
  public categoricalRankWeaponMastery = table(() =>
    this.loadDatasheet(DATASHEETS.CategoricalProgressionRankData.WeaponMastery),
  )
  public categoricalRankMutator = table(() =>
    this.loadDatasheet(DATASHEETS.CategoricalProgressionRankData.MutatorRankData),
  )

  public attrCon = table(() => this.loadDatasheet(DATASHEETS.AttributeDefinition.Constitution))
  public attrStr = table(() => this.loadDatasheet(DATASHEETS.AttributeDefinition.Strength))
  public attrDex = table(() => this.loadDatasheet(DATASHEETS.AttributeDefinition.Dexterity))
  public attrFoc = table(() => this.loadDatasheet(DATASHEETS.AttributeDefinition.Focus))
  public attrInt = table(() => this.loadDatasheet(DATASHEETS.AttributeDefinition.Intelligence))

  public attrConByLevel = primaryIndex(this.attrCon, 'Level')
  public attrStrByLevel = primaryIndex(this.attrStr, 'Level')
  public attrDexByLevel = primaryIndex(this.attrDex, 'Level')
  public attrFocByLevel = primaryIndex(this.attrFoc, 'Level')
  public attrIntByLevel = primaryIndex(this.attrInt, 'Level')

  public armorAppearancesAll = table(() => this.loadDatasheets(DATASHEETS.ArmorAppearanceDefinitions))
  public armorAppearancesByIdMap = primaryIndex(this.armorAppearancesAll, 'ItemID')
  public armorAppearancesById = indexLookup(this.armorAppearancesByIdMap)
  public armorAppearancesByNameMap = secondaryIndex(this.armorAppearancesAll, 'AppearanceName')
  public armorAppearancesByName = indexLookup(this.armorAppearancesByNameMap)

  public weaponAppearancesAll = table(() =>
    this.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions),
  )
  public weaponAppearancesByIdMap = primaryIndex(this.weaponAppearancesAll, 'WeaponAppearanceID')
  public weaponAppearancesById = indexLookup(this.weaponAppearancesByIdMap)

  public instrumentAppearancesAll = table(() =>
    this.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.InstrumentsAppearanceDefinitions),
  )
  public instrumentAppearancesByIdMap = primaryIndex(this.instrumentAppearancesAll, 'WeaponAppearanceID')
  public instrumentAppearancesById = indexLookup(this.instrumentAppearancesByIdMap)

  public mountAttachmentsAppearancesAll = table(() =>
    this.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions_MountAttachments),
  )
  public mountAttachmentsAppearancesByIdMap = primaryIndex(this.mountAttachmentsAppearancesAll, 'WeaponAppearanceID')
  public mountAttachmentsAppearancesById = indexLookup(this.mountAttachmentsAppearancesByIdMap)

  public conversationStatesAll = table(() => this.loadDatasheets(DATASHEETS.ConversationStateData))
  public conversationStatesByIdMap = primaryIndex(this.conversationStatesAll, 'ConversationStateId')
  public conversationStatesById = indexLookup(this.conversationStatesByIdMap)
  public conversationStatesByObjectiveIdMap = secondaryIndex(this.conversationStatesAll, (it) => {
    return [it.LinearObjectiveId1, it.LinearObjectiveId2, it.LinearObjectiveId3].filter((it) => !!it)
  })
  public conversationStatesByObjectiveId = indexLookup(this.conversationStatesByObjectiveIdMap)

  public objectivesAll = table(() => this.loadDatasheets(DATASHEETS.Objectives))
  public objectivesByIdMap = primaryIndex(this.objectivesAll, 'ObjectiveID')
  public objectivesById = indexLookup(this.objectivesByIdMap)
  public objectivesByAchievementIdMap = secondaryIndex(this.objectivesAll, 'AchievementId')
  public objectivesByAchievementId = indexLookup(this.objectivesByAchievementIdMap)
  public objectivesByRequiredAchievementIdMap = secondaryIndex(this.objectivesAll, getQuestRequiredAchievmentIds)
  public objectivesByNpcDestinationIdMap = secondaryIndex(this.objectivesAll, 'NpcDestinationId')
  public objectivesByNpcDestinationId = indexLookup(this.objectivesByNpcDestinationIdMap)

  public objectiveTasksAll = table(() => this.loadDatasheets(DATASHEETS.ObjectiveTasks))
  public objectiveTasksByIdMap = primaryIndex(this.objectiveTasksAll, 'TaskID')
  public objectiveTasksById = indexLookup(this.objectiveTasksByIdMap)

  public seasonsAll = table(() => this.loadDatasheets(DATASHEETS.SeasonsRewardsSeasonData))
  public seasonsByIdMap = primaryIndex(this.seasonsAll, 'SeasonId')
  public seasonsById = indexLookup(this.seasonsByIdMap)
  public seasonsByIndexMap = primaryIndex(this.seasonsAll, 'SeasonIndex')
  public seasonsByIndex = indexLookup(this.seasonsByIndexMap)

  public seasonPassRanksAll = table(() => this.loadDatasheets(DATASHEETS.SeasonPassRankData))
  public seasonPassRanksByIdMap = primaryIndex(this.seasonPassRanksAll, getSeasonPassDataId)
  public seasonPassRanksById = indexLookup(this.seasonPassRanksByIdMap)
  public seasonPassRanksByRewardIdMap = secondaryIndex(this.seasonPassRanksAll, (it) => [it.FreeRewardId, it.PremiumRewardId])
  public seasonPassRanksByRewardId = indexLookup(this.seasonPassRanksByRewardIdMap)

  public seasonsRewardsChaptersAll = table(() => this.loadDatasheets(DATASHEETS.SeasonsRewardsChapterData))
  public seasonsRewardsChaptersByIdMap = primaryIndex(this.seasonsRewardsChaptersAll, 'ChapterId')
  public seasonsRewardsChaptersById = indexLookup(this.seasonsRewardsChaptersByIdMap)
  public seasonsRewardsChaptersByRewardIdMap = secondaryIndex(this.seasonsRewardsChaptersAll, 'ChapterRewardId')
  public seasonsRewardsChaptersByRewardId = indexLookup(this.seasonsRewardsChaptersByRewardIdMap)

  public seasonsRewardsAll = table(() => this.loadDatasheets(DATASHEETS.SeasonsRewardData))
  public seasonsRewardsByIdMap = primaryIndex(this.seasonsRewardsAll, 'RewardId')
  public seasonsRewardsById = indexLookup(this.seasonsRewardsByIdMap)
  public seasonsRewardsByDisplayItemIdMap = secondaryIndex(this.seasonsRewardsAll, 'DisplayItemId')
  public seasonsRewardsByDisplayItemId = indexLookup(this.seasonsRewardsByDisplayItemIdMap)
  public seasonsRewardsByItemIdMap = secondaryIndex(this.seasonsRewardsAll, 'ItemId')
  public seasonsRewardsByItemId = indexLookup(this.seasonsRewardsByItemIdMap)

  public seasonsRewardsTasksAll = table(() => this.loadDatasheets(DATASHEETS.SeasonsRewardsTasks))
  public seasonsRewardsTasksByIdMap = primaryIndex(this.seasonsRewardsTasksAll, 'SeasonsTaskID')
  public seasonsRewardsTasksById = indexLookup(this.seasonsRewardsTasksByIdMap)

  public seasonsRewardsStatsKillAll = table(() =>
    this.loadDatasheet(DATASHEETS.SeasonsRewardsStats.SeasonsRewardsStats_Kill),
  )
  public seasonsRewardsStatsKillByIdMap = primaryIndex(this.seasonsRewardsStatsKillAll, 'TrackedStatID')
  public seasonsRewardsStatsKillById = indexLookup(this.seasonsRewardsStatsKillByIdMap)

  public emotesAll = table(() => this.loadDatasheets(DATASHEETS.EmoteData))
  public emotesByIdMap = primaryIndex(this.emotesAll, 'UniqueTagID')
  public emotesById = indexLookup(this.emotesByIdMap)

  public playerTitlesAll = table(() => this.loadDatasheets(DATASHEETS.PlayerTitleData))
  public playerTitlesByIdMap = primaryIndex(this.playerTitlesAll, 'TitleID')
  public playerTitlesById = indexLookup(this.playerTitlesByIdMap)

  public entitlementsAll = table(() => this.loadDatasheets(DATASHEETS.EntitlementData))
  public entitlementsByIdMap = primaryIndex(this.entitlementsAll, 'UniqueTagID')
  public entitlementsById = indexLookup(this.entitlementsByIdMap)
  public entitlementsByRewardTypeMap = secondaryIndex(this.entitlementsAll, 'RewardType')
  public entitlementsByRewardType = indexLookup(this.entitlementsByRewardTypeMap)

  public backstoriesAll = table(() => this.loadDatasheets(DATASHEETS.BackstoryDefinition))
  public backstoriesByIdMap = primaryIndex(this.backstoriesAll, 'BackstoryID')
  public backstoriesById = indexLookup(this.backstoriesByIdMap)

  public expansionsAll = table(() => this.loadDatasheets(DATASHEETS.ExpansionData))
  public expansionsByIdMap = primaryIndex(this.expansionsAll, 'ExpansionId')
  public expansionsById = indexLookup(this.expansionsByIdMap)

  public factionControlBuffsAll = table(() => this.loadDatasheets(DATASHEETS.FactionControlBuffDefinitions))
  public factionControlBuffsByIdMap = primaryIndex(this.factionControlBuffsAll, 'FactionControlBuffID')
  public factionControlBuffsById = indexLookup(this.factionControlBuffsByIdMap)
}
