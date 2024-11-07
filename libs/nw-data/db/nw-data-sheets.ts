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
import { DATASHEETS, VariationDataGatherable, VitalsBaseData, VitalsLevelVariantData } from '@nw-data/generated'
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
import { DataLoader, indexLookup, primaryIndex, secondaryIndex, table } from './dsl'

export abstract class NwDataSheets {
  protected abstract loader: DataLoader

  public itemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.MasterItemDefinitions))
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
  public itemsBySetFamilyNameMap = secondaryIndex(this.itemsAll, getItemSetFamilyName)
  public itemsBySetFamilyName = indexLookup(this.itemsBySetFamilyNameMap)

  public housingItemsAll = table(() => [
    this.loader.loadDatasheet(DATASHEETS.VariationData.HouseItems),
    this.loader.loadDatasheet(DATASHEETS.VariationData.HouseItemsMTX),
  ])
  public housingItemsByIdMap = primaryIndex(this.housingItemsAll, 'HouseItemID')
  public housingItemsById = indexLookup(this.housingItemsByIdMap)
  public housingItemsByStatusEffectMap = secondaryIndex(this.housingItemsAll, 'HousingStatusEffect')
  public housingItemsByStatusEffect = indexLookup(this.housingItemsByStatusEffectMap)

  public itemOrHousingItem = async (id: string) => {
    const [a, b] = await Promise.all([this.itemsById(id), this.housingItemsById(id)])
    return a || b
  }

  public houseTypesAll = table(() => this.loader.loadDatasheets(DATASHEETS.HouseTypeData))
  public houseTypesByIdMap = primaryIndex(this.houseTypesAll, 'HouseTypeID')
  public houseTypesById = indexLookup(this.houseTypesByIdMap)
  public houseTypesMetaAll = table(() =>
    this.loader.loadDatasheet<ScannedHouseType>({ uri: 'generated/houses_metadata.json' }),
  )
  public houseTypesMetaByIdMap = primaryIndex(this.houseTypesMetaAll, 'houseTypeID')

  public structureTypesMetaAll = table(() =>
    this.loader.loadDatasheet<ScannedStructureType>({ uri: 'generated/structures_metadata.json' }),
  )
  public structureTypesMetaMap = primaryIndex(this.structureTypesMetaAll, 'type')
  public structureTypesMeta = indexLookup(this.structureTypesMetaMap)

  public stationTypesMetaAll = table(() =>
    this.loader.loadDatasheet<ScannedStationType>({ uri: 'generated/stations_metadata.json' }),
  )
  public stationTypesMetaMap = primaryIndex(this.stationTypesMetaAll, 'stationID')
  public stationTypesMeta = indexLookup(this.stationTypesMetaMap)

  public itemTransformsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ItemTransform))
  public itemTransformsByIdMap = primaryIndex(this.itemTransformsAll, 'FromItemId')
  public itemTransformsById = indexLookup(this.itemTransformsByIdMap)
  public itemTransformsByToItemIdMap = secondaryIndex(this.itemTransformsAll, 'ToItemId')
  public itemTransformsByToItemId = indexLookup(this.itemTransformsByToItemIdMap)

  public abilitiesAll = table(() => this.loader.loadDatasheets(DATASHEETS.AbilityData))
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

  public statusEffectsAll = table(() => this.loader.loadDatasheets(DATASHEETS.StatusEffectData))
  public statusEffectsByIdMap = primaryIndex(this.statusEffectsAll, 'StatusID')
  public statusEffectsById = indexLookup(this.statusEffectsByIdMap)

  public statusEffectCategoriesAll = table(() => this.loader.loadDatasheets(DATASHEETS.StatusEffectCategoryData))
  public statusEffectCategoriesByIdMap = primaryIndex(this.statusEffectCategoriesAll, 'StatusEffectCategoryID')
  public statusEffectCategoriesById = indexLookup(this.statusEffectCategoriesByIdMap)

  public perksAll = table(() => this.loader.loadDatasheets(DATASHEETS.PerkData))
  public perksByIdMap = primaryIndex(this.perksAll, 'PerkID')
  public perksById = indexLookup(this.perksByIdMap)
  public perksByEquipAbilityMap = secondaryIndex(this.perksAll, 'EquipAbility')
  public perksByEquipAbility = indexLookup(this.perksByEquipAbilityMap)
  public perksByAffixMap = secondaryIndex(this.perksAll, 'Affix')
  public perksByAffix = indexLookup(this.perksByAffixMap)

  public perkBucketsAll = table(() => {
    return this.loader.loadDatasheets(DATASHEETS.PerkBucketData).map((it) => it.then(convertPerkBuckets))
  })
  public perkBucketsByIdMap = primaryIndex(this.perkBucketsAll, 'PerkBucketID')
  public perkBucketsById = indexLookup(this.perkBucketsByIdMap)
  public perkBucketsByPerkIdMap = secondaryIndex(this.perkBucketsAll, (it) => {
    return it.Entries.map((it) => 'PerkID' in it && it.PerkID)
  })
  public perkBucketsByPerkId = indexLookup(this.perkBucketsByPerkIdMap)

  public affixStatsAll = table(() => this.loader.loadDatasheets(DATASHEETS.AffixStatData))
  public affixStatsByIdMap = primaryIndex(this.affixStatsAll, 'StatusID')
  public affixStatsById = indexLookup(this.affixStatsByIdMap)
  public affixByStatusEffectMap = secondaryIndex(this.affixStatsAll, 'StatusEffect')
  public affixByStatusEffect = indexLookup(this.affixByStatusEffectMap)

  public cooldownsAll = table(() => this.loader.loadDatasheets(DATASHEETS.CooldownData))
  public cooldownsByIdMap = primaryIndex(this.cooldownsAll, 'ID')
  public cooldownsById = indexLookup(this.cooldownsByIdMap)
  public cooldownsByAbilityIdMap = secondaryIndex(this.cooldownsAll, 'AbilityID')
  public cooldownsByAbilityId = indexLookup(this.cooldownsByAbilityIdMap)

  public damageTables0 = table(() => this.loader.loadDatasheet(DATASHEETS.DamageData.DamageTable))
  public damageTables0Map = primaryIndex(this.damageTables0, 'DamageID')
  public damageTable0 = indexLookup(this.damageTables0Map)

  public damageTablesAll = table(() => this.loader.loadDatasheets(DATASHEETS.DamageData))
  public damageTablesByIdMap = primaryIndex(this.damageTablesAll, 'DamageID')
  public damageTablesById = indexLookup(this.damageTablesByIdMap)
  public damageTablesByStatusEffectMap = secondaryIndex(this.damageTablesAll, 'StatusEffect')
  public damageTablesByStatusEffect = indexLookup(this.damageTablesByStatusEffectMap)

  public gatherablesAll = table(() => this.loader.loadDatasheets(DATASHEETS.GatherableData))
  public gatherablesByIdMap = primaryIndex(this.gatherablesAll, 'GatherableID')
  public gatherablesById = indexLookup(this.gatherablesByIdMap)

  public gatherablesMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedGatherable>({ uri: 'generated/gatherables_metadata.json' }),
  )
  public gatherablesMetadataByIdMap = primaryIndex(this.gatherablesMetadataAll, 'gatherableID')
  public gatherablesMetadataById = indexLookup(this.gatherablesMetadataByIdMap)

  public gatherableVariationsAll = table(
    () =>
      this.loader.loadDatasheets<VariationDataGatherable>({
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

  public gatherableVariationsByIdMap = primaryIndex(this.gatherableVariationsAll, 'VariantID')
  public gatherableVariationsById = indexLookup(this.gatherableVariationsByIdMap)
  public gatherableVariationsByGatherableIdMap = secondaryIndex(this.gatherableVariationsAll, (it) =>
    it.Gatherables.map((it) => it.GatherableID),
  )
  public gatherableVariationsByGatherableId = indexLookup(this.gatherableVariationsByGatherableIdMap)

  public variationsMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedVariation>({ uri: 'generated/variations_metadata.json' }),
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

  public npcsAll = table(() => this.loader.loadDatasheets(DATASHEETS.NPCData))
  public npcsByIdMap = primaryIndex(this.npcsAll, 'NPCId')
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

  public npcsVariationsAll = table(() => this.loader.loadDatasheet(DATASHEETS.VariationData.NPC))
  public npcsVariationsByIdMap = primaryIndex(this.npcsVariationsAll, 'VariantID')
  public npcsVariationsById = indexLookup(this.npcsVariationsByIdMap)
  public npcsVariationsByNpcIdMap = secondaryIndex(this.npcsVariationsAll, 'NPCId')
  public npcsVariationsByNpcId = indexLookup(this.npcsVariationsByNpcIdMap)

  public npcsMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedNpc>({ uri: 'generated/npcs_metadata.json' }),
  )
  public npcsMetadataByIdMap = primaryIndex(this.npcsMetadataAll, 'npcID')
  public npcsMetadataById = indexLookup(this.npcsMetadataByIdMap)

  public mountsAll = table(() => this.loader.loadDatasheets(DATASHEETS.MountData))
  public mountsByIdMap = primaryIndex(this.mountsAll, 'MountId')
  public mountsById = indexLookup(this.mountsByIdMap)

  public armorItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ArmorItemDefinitions))
  public armorItemsByIdMap = primaryIndex(this.armorItemsAll, 'WeaponID')
  public armorItemsById = indexLookup(this.armorItemsByIdMap)

  public weaponItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.WeaponItemDefinitions))
  public weaponItemsByIdMap = primaryIndex(this.weaponItemsAll, 'WeaponID')
  public weaponItemsById = indexLookup(this.weaponItemsByIdMap)

  public ammoItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.AmmoItemDefinitions))
  public ammoItemsByIdMap = primaryIndex(this.ammoItemsAll, 'AmmoID')
  public AmmoItemsById = indexLookup(this.ammoItemsByIdMap)

  public consumableItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ConsumableItemDefinitions))
  public consumableItemsByIdMap = primaryIndex(this.consumableItemsAll, 'ConsumableID')
  public consumableItemsById = indexLookup(this.consumableItemsByIdMap)
  public consumableItemsByAddStatusEffectsMap = secondaryIndex(this.consumableItemsAll, 'AddStatusEffects')
  public consumableItemsByAddStatusEffects = indexLookup(this.consumableItemsByAddStatusEffectsMap)

  public runeItems = table(() => this.loader.loadDatasheet(DATASHEETS.WeaponItemDefinitions.RuneItemDefinitions))
  public runeItemsByIdMap = primaryIndex(this.runeItems, 'WeaponID')
  public runeItemsById = indexLookup(this.runeItemsByIdMap)

  public spellsAll = table(() => this.loader.loadDatasheets(DATASHEETS.SpellData))
  public spellsByIdMap = primaryIndex(this.spellsAll, 'SpellID')
  public spellsById = indexLookup(this.spellsByIdMap)
  public spellsByDamageTable = secondaryIndex(this.spellsAll, 'DamageTable')
  public spellsByAbilityIdMap = secondaryIndex(this.spellsAll, 'AbilityId')
  public spellsByAbilityId = indexLookup(this.spellsByAbilityIdMap)
  public spellsByStatusEffectIdMap = secondaryIndex(this.spellsAll, 'StatusEffects')
  public spellsByStatusEffectId = indexLookup(this.spellsByStatusEffectIdMap)

  public spellsMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedSpell>({ uri: 'generated/spells_metadata.json' }),
  )
  public spellsMetadataByPrefabPathMap = primaryIndex(this.spellsMetadataAll, 'PrefabPath')
  public spellsMetadataByPrefabPath = indexLookup(this.spellsMetadataByPrefabPathMap)

  public gameModesAll = table(() => this.loader.loadDatasheets(DATASHEETS.GameModeData))
  public gameModesByIdMap = primaryIndex(this.gameModesAll, 'GameModeId')
  public gameModesById = indexLookup(this.gameModesByIdMap)

  public loreItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.LoreData))
  public loreItemsByIdMap = primaryIndex(this.loreItemsAll, 'LoreID')
  public loreItemsById = indexLookup(this.loreItemsByIdMap)
  public loreItemsByParentIdMap = secondaryIndex(this.loreItemsAll, 'ParentID')
  public loreItemsByParentId = indexLookup(this.loreItemsByParentIdMap)

  public loreItemsMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedLore>({ uri: 'generated/lore_metadata.json' }),
  )
  public loreItemsMetadataByIdMap = primaryIndex(this.loreItemsMetadataAll, 'loreID')
  public loreItemsMetadataById = indexLookup(this.loreItemsMetadataByIdMap)

  public recipesAll = table(() => this.loader.loadDatasheets(DATASHEETS.CraftingRecipeData))
  public recipesByIdMap = primaryIndex(this.recipesAll, 'RecipeID')
  public recipesById = indexLookup(this.recipesByIdMap)
  public recipesByItemIdMap = secondaryIndex(this.recipesAll, getItemIdFromRecipe)
  public recipesByItemId = indexLookup(this.recipesByItemIdMap)
  public recipesByRequiredAchievementIdMap = primaryIndex(this.recipesAll, 'RequiredAchievementID')
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

  public recipeCategoriesAll = table(() => this.loader.loadDatasheets(DATASHEETS.CraftingCategoryData))
  public recipeCategoriesByIdMap = primaryIndex(this.recipeCategoriesAll, 'CategoryID')
  public recipeCategoriesById = indexLookup(this.recipeCategoriesByIdMap)

  public resourceItemsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ResourceItemDefinitions))
  public resourceItemsByIdMap = primaryIndex(this.resourceItemsAll, 'ResourceID')
  public resourceItemsById = indexLookup(this.resourceItemsByIdMap)
  public resourceItemsByPerkBucketIdMap = secondaryIndex(this.resourceItemsAll, 'PerkBucket')
  public resourceItemsByPerkBucketId = indexLookup(this.resourceItemsByPerkBucketIdMap)

  public affixesAll = table(() => this.loader.loadDatasheets(DATASHEETS.AffixData))
  public affixesByIdMap = primaryIndex(this.affixesAll, 'AffixID')
  public affixesById = indexLookup(this.affixesByIdMap)

  public afflictionsAll = table(() => this.loader.loadDatasheets(DATASHEETS.AfflictionData))
  public afflictionsByIdMap = primaryIndex(this.afflictionsAll, 'AfflictionID')
  public afflictionsById = indexLookup(this.afflictionsByIdMap)

  public costumeChangesAll = table(() => this.loader.loadDatasheets(DATASHEETS.CostumeChangeData))
  public costumeChangesByIdMa = primaryIndex(this.costumeChangesAll, 'CostumeChangeId')
  public costumeChangesById = indexLookup(this.costumeChangesByIdMa)

  public manaCostsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ManaData))
  public manaCostsByIdAll = primaryIndex(this.manaCostsAll, 'CostID')
  public manaCostsById = indexLookup(this.manaCostsByIdAll)

  public staminaDataAll = table(() => this.loader.loadDatasheets(DATASHEETS.StaminaData))
  public staminaDataByIdMap = primaryIndex(this.staminaDataAll, 'CostID')
  public staminaDataById = indexLookup(this.staminaDataByIdMap)

  public gameEventsAll = table(() => this.loader.loadDatasheets(DATASHEETS.GameEventData))
  public gameEventsByIdMap = primaryIndex(this.gameEventsAll, 'EventID')
  public gameEventsByid = indexLookup(this.gameEventsByIdMap)
  public gameEventsByLootLimitIdMap = secondaryIndex(this.gameEventsAll, 'LootLimitId')
  public gameEventsByLootLimitId = indexLookup(this.gameEventsByLootLimitIdMap)

  public categoricalProgressionAll = table(() => this.loader.loadDatasheets(DATASHEETS.CategoricalProgressionData))
  public categoricalProgressionByIdMap = primaryIndex(this.categoricalProgressionAll, 'CategoricalProgressionId')
  public categoricalProgressionById = indexLookup(this.categoricalProgressionByIdMap)

  public achievementsAll = table(() => this.loader.loadDatasheets(DATASHEETS.AchievementData))
  public achievementsByIdMap = primaryIndex(this.achievementsAll, 'AchievementID')
  public achievementsById = indexLookup(this.achievementsByIdMap)

  public metaAchievementsAll = table(() => this.loader.loadDatasheets(DATASHEETS.MetaAchievementData))
  public metaAchievementsByIdMap = primaryIndex(this.metaAchievementsAll, 'MetaAchievementId')
  public metaAchievementsById = indexLookup(this.metaAchievementsByIdMap)

  public tradeskillPostcapAll = table(() => this.loader.loadDatasheets(DATASHEETS.TradeSkillPostCapData))

  public vitalsMetadataAll = table(() => {
    return [
      this.loader.loadDatasheet<ScannedVital>({ uri: 'generated/vitals_metadata1.json' }),
      this.loader.loadDatasheet<ScannedVital>({ uri: 'generated/vitals_metadata2.json' }),
    ]
  })
  public vitalsMetadataByIdMap = primaryIndex(this.vitalsMetadataAll, 'vitalsID')
  public vitalsMetadataById = indexLookup(this.vitalsMetadataByIdMap)

  public vitalsModelsMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedVitalModel>({ uri: 'generated/vitals_models_metadata.json' }),
  )
  public vitalsModelsMetadataByIdMap = primaryIndex(this.vitalsModelsMetadataAll, 'id')
  public vitalsModelsMetadataById = indexLookup(this.vitalsModelsMetadataByIdMap)

  public vitalsBaseAll = table(() => this.loader.loadDatasheets(DATASHEETS.VitalsBaseData))
  public vitalsBaseByIdMap = primaryIndex(this.vitalsBaseAll, 'VitalsID')
  public vitalsBaseById = indexLookup(this.vitalsBaseByIdMap)
  public vitalsLevelVariantsAll = table(() => this.loader.loadDatasheets(DATASHEETS.VitalsLevelVariantData))
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

  public vitalsCategoriesAll = table(() => this.loader.loadDatasheets(DATASHEETS.VitalsCategoryData))
  public vitalsCategoriesByIdMap = primaryIndex(this.vitalsCategoriesAll, 'VitalsCategoryID')
  public vitalsCategoriesById = indexLookup(this.vitalsCategoriesByIdMap)
  public vitalsCategoriesByGroupId = secondaryIndex(this.vitalsCategoriesAll, 'GroupVitalsCategoryId')
  public vitalsCategoriesByGroup = indexLookup(this.vitalsCategoriesByGroupId)

  public vitalsModifiersAll = table(() => this.loader.loadDatasheets(DATASHEETS.VitalsModifierData))
  public vitalsModifiersByIdMap = primaryIndex(this.vitalsModifiersAll, 'CategoryId')
  public vitalsModifiersById = indexLookup(this.vitalsModifiersByIdMap)

  public vitalsLevelsAll = table(() => this.loader.loadDatasheets(DATASHEETS.VitalsLevelData))
  public vitalsLevelsByLevelMap = primaryIndex(this.vitalsLevelsAll, 'Level')
  public vitalsLevelsByLevel = indexLookup(this.vitalsLevelsByLevelMap)

  public damagetypesAll = table(() => this.loader.loadDatasheets(DATASHEETS.DamageTypeData))
  public damagetypesByIdMap = primaryIndex(this.damagetypesAll, 'TypeID')
  public damagetypesById = indexLookup(this.damagetypesByIdMap)

  public territoriesMetadataAll = table(() =>
    this.loader.loadDatasheet<ScannedTerritory>({ uri: 'generated/territories_metadata.json' }),
  )
  public territoriesMetadataByIdMap = primaryIndex(this.territoriesMetadataAll, 'territoryID')
  public territoriesMetadataById = indexLookup(this.territoriesMetadataByIdMap)

  public territoriesAll = table(() => this.loader.loadDatasheets(DATASHEETS.TerritoryDefinition))
  public territoriesByIdMap = primaryIndex(this.territoriesAll, 'TerritoryID')
  public territoriesById = indexLookup(this.territoriesByIdMap)

  public territoriesByDiscoveredAchievementMap = secondaryIndex(this.territoriesAll, 'DiscoveredAchievement')
  public territoriesByDiscoveredAchievement = indexLookup(this.territoriesByDiscoveredAchievementMap)
  public territoriesByPoiTagMap = secondaryIndex(this.territoriesAll, (it) => it.POITag)

  public pvpRanksAll = table(() => this.loader.loadDatasheets(DATASHEETS.PvPRankData))
  public pvpRanksByLevelMap = primaryIndex(this.pvpRanksAll, 'Level')
  public pvpRanksByLevel = indexLookup(this.pvpRanksByLevelMap)

  public pvpStoreBucketsAll = table(() => {
    return this.loader.loadDatasheets(DATASHEETS.PvPStoreData).map((it) => it.then(convertPvoStore))
  })
  public pvpStoreBucketsByIdMap = secondaryIndex(this.pvpStoreBucketsAll, 'Bucket')
  public pvpStoreBucketsById = indexLookup(this.pvpStoreBucketsByIdMap)

  public pvpRewardsAll = table(() => this.loader.loadDatasheets(DATASHEETS.RewardTrackItemData))
  public pvpRewardsByIdMap = primaryIndex(this.pvpRewardsAll, 'RewardId')
  public pvpRewardsById = indexLookup(this.pvpRewardsByIdMap)

  public milestoneRewardsAll = table(() => this.loader.loadDatasheets(DATASHEETS.RewardMilestoneData))

  public mutatorDifficultiesAll = table(() => this.loader.loadDatasheets(DATASHEETS.MutationDifficultyStaticData))
  public mutatorDifficultiesByIdMap = primaryIndex(this.mutatorDifficultiesAll, 'MutationDifficulty')
  public mutatorDifficultyiesById = indexLookup(this.mutatorDifficultiesByIdMap)

  public mutatorElementsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ElementalMutationStaticData))
  public mutatorElementsByIdMap = primaryIndex(this.mutatorElementsAll, 'ElementalMutationId')
  public mutatorElementsById = indexLookup(this.mutatorElementsByIdMap)

  public mutatorElementsPerksAll = table(() => this.loader.loadDatasheets(DATASHEETS.MutationPerksStaticData))
  public mutatorElementsPerksByIdMap = primaryIndex(this.mutatorElementsPerksAll, 'ElementalMutationTypeId')
  public mutatorElementsPerksById = indexLookup(this.mutatorElementsPerksByIdMap)

  public mutatorPromotionsAll = table(() => this.loader.loadDatasheets(DATASHEETS.PromotionMutationStaticData))
  public mutatorPromotionsByIdMap = primaryIndex(this.mutatorPromotionsAll, 'PromotionMutationId')
  public mutatorPromotionsById = indexLookup(this.mutatorPromotionsByIdMap)

  public mutatorCursesAll = table(() => this.loader.loadDatasheets(DATASHEETS.CurseMutationStaticData))
  public mutatorCursesByIdMap = primaryIndex(this.mutatorCursesAll, 'CurseMutationId')
  public mutatorCursesById = indexLookup(this.mutatorCursesByIdMap)

  // public viewGemPerksWithAffix = table(() => queryGemPerksWithAffix(this))
  // public viewMutatorDifficultiesWithRewards = table(() => queryMutatorDifficultiesWithRewards(this))

  public lootTablesAll = table(() => {
    return this.loader.loadDatasheets(DATASHEETS.LootTablesData).map((it) => it.then(convertLoottables))
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
    return this.loader.loadDatasheets(DATASHEETS.LootBucketData).map((it) => it.then(convertLootbuckets))
  })
  public lootBucketsByIdMap = secondaryIndex(this.lootBucketsAll, 'LootBucket')
  public lootBucketsById = indexLookup(this.lootBucketsByIdMap)
  public lootBucketsByItemIdMap = secondaryIndex(this.lootBucketsAll, (it) => it.Item)
  public lootBucketsByItemId = indexLookup(this.lootBucketsByItemIdMap)

  public lootLimitsAll = table(() => this.loader.loadDatasheets(DATASHEETS.LootLimitData))
  public lootLimitsByIdMap = primaryIndex(this.lootLimitsAll, 'LootLimitID')
  public lootLimitsById = indexLookup(this.lootLimitsByIdMap)

  public buffBucketsAll = table(() => {
    return this.loader.loadDatasheets(DATASHEETS.BuffBucketData).map((it) => it.then(convertBuffBuckets))
  })
  public buffBucketsByIdMap = primaryIndex(this.buffBucketsAll, 'BuffBucketId')
  public buffBucketsById = indexLookup(this.buffBucketsByIdMap)

  public xpLevels = table(() => this.loader.loadDatasheet(DATASHEETS.ExperienceData.XPLevels))
  public weaponMasteryAll = table(() =>
    this.loader.loadDatasheet(DATASHEETS.CategoricalProgressionRankData.WeaponMastery),
  )

  public attrCon = table(() => this.loader.loadDatasheet(DATASHEETS.AttributeDefinition.Constitution))
  public attrStr = table(() => this.loader.loadDatasheet(DATASHEETS.AttributeDefinition.Strength))
  public attrDex = table(() => this.loader.loadDatasheet(DATASHEETS.AttributeDefinition.Dexterity))
  public attrFoc = table(() => this.loader.loadDatasheet(DATASHEETS.AttributeDefinition.Focus))
  public attrInt = table(() => this.loader.loadDatasheet(DATASHEETS.AttributeDefinition.Intelligence))

  public attrConByLevel = primaryIndex(this.attrCon, 'Level')
  public attrStrByLevel = primaryIndex(this.attrStr, 'Level')
  public attrDexByLevel = primaryIndex(this.attrDex, 'Level')
  public attrFocByLevel = primaryIndex(this.attrFoc, 'Level')
  public attrIntByLevel = primaryIndex(this.attrInt, 'Level')

  public armorAppearancesAll = table(() => this.loader.loadDatasheets(DATASHEETS.ArmorAppearanceDefinitions))
  public armorAppearancesByIdMap = primaryIndex(this.armorAppearancesAll, 'ItemID')
  public armorAppearancesById = indexLookup(this.armorAppearancesByIdMap)
  public armorAppearancesByNameMap = secondaryIndex(this.armorAppearancesAll, 'AppearanceName')
  public armorAppearancesByName = indexLookup(this.armorAppearancesByNameMap)

  public weaponAppearancesAll = table(() =>
    this.loader.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions),
  )
  public weaponAppearancesByIdMap = primaryIndex(this.weaponAppearancesAll, 'WeaponAppearanceID')
  public weaponAppearancesById = indexLookup(this.weaponAppearancesByIdMap)

  public instrumentAppearancesAll = table(() =>
    this.loader.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.InstrumentsAppearanceDefinitions),
  )
  public instrumentAppearancesByIdMap = primaryIndex(this.instrumentAppearancesAll, 'WeaponAppearanceID')
  public instrumentAppearancesById = indexLookup(this.instrumentAppearancesByIdMap)

  public mountAttachmentsAppearancesAll = table(() =>
    this.loader.loadDatasheet(DATASHEETS.WeaponAppearanceDefinitions.WeaponAppearanceDefinitions_MountAttachments),
  )
  public mountAttachmentsAppearancesByIdMap = primaryIndex(this.mountAttachmentsAppearancesAll, 'WeaponAppearanceID')
  public mountAttachmentsAppearancesById = indexLookup(this.mountAttachmentsAppearancesByIdMap)

  public conversationStatesAll = table(() => this.loader.loadDatasheets(DATASHEETS.ConversationStateData))
  public conversationStatesByIdMap = primaryIndex(this.conversationStatesAll, 'ConversationStateId')
  public conversationStatesById = indexLookup(this.conversationStatesByIdMap)
  public conversationStatesByObjectiveIdMap = secondaryIndex(this.conversationStatesAll, (it) => {
    return [it.LinearObjectiveId1, it.LinearObjectiveId2, it.LinearObjectiveId3].filter((it) => !!it)
  })
  public conversationStatesByObjectiveId = indexLookup(this.conversationStatesByObjectiveIdMap)

  public objectivesAll = table(() => this.loader.loadDatasheets(DATASHEETS.Objectives))
  public objectivesByIdMap = primaryIndex(this.objectivesAll, 'ObjectiveID')
  public objectivesById = indexLookup(this.objectivesByIdMap)
  public objectivesByAchievementIdMap = secondaryIndex(this.objectivesAll, 'AchievementId')
  public objectivesByAchievementId = indexLookup(this.objectivesByAchievementIdMap)
  public objectivesByRequiredAchievementIdMap = secondaryIndex(this.objectivesAll, getQuestRequiredAchievmentIds)
  public objectivesByNpcDestinationIdMap = secondaryIndex(this.objectivesAll, 'NpcDestinationId')
  public objectivesByNpcDestinationId = indexLookup(this.objectivesByNpcDestinationIdMap)

  public objectiveTasksAll = table(() => this.loader.loadDatasheets(DATASHEETS.ObjectiveTasks))
  public objectiveTasksByIdMap = primaryIndex(this.objectiveTasksAll, 'TaskID')
  public objectiveTasksById = indexLookup(this.objectiveTasksByIdMap)

  public seasonPassRanksAll = table(() => this.loader.loadDatasheets(DATASHEETS.SeasonPassRankData))
  public seasonPassRanksByIdMap = primaryIndex(this.seasonPassRanksAll, getSeasonPassDataId)
  public seasonPassRanksById = indexLookup(this.seasonPassRanksByIdMap)

  public seasonPassRewards = table(() => this.loader.loadDatasheets(DATASHEETS.SeasonsRewardData))
  public seasonPassRewardsByIdMap = primaryIndex(this.seasonPassRewards, 'RewardId')
  public seasonPassRewardsById = indexLookup(this.seasonPassRewardsByIdMap)
  public seasonPassRewardsByDisplayItemIdMap = secondaryIndex(this.seasonPassRewards, 'DisplayItemId')
  public seasonPassRewardsByDisplayItemId = indexLookup(this.seasonPassRewardsByDisplayItemIdMap)
  public seasonPassRewardsByItemIdMap = secondaryIndex(this.seasonPassRewards, 'ItemId')
  public seasonPassRewardsByItemId = indexLookup(this.seasonPassRewardsByItemIdMap)

  public seasonsRewardsTasksAll = table(() => this.loader.loadDatasheets(DATASHEETS.SeasonsRewardsTasks))
  public seasonsRewardsTasksByIdMap = primaryIndex(this.seasonsRewardsTasksAll, 'SeasonsTaskID')
  public seasonsRewardsTasksById = indexLookup(this.seasonsRewardsTasksByIdMap)

  public seasonsRewardsStatsKillAll = table(() =>
    this.loader.loadDatasheet(DATASHEETS.SeasonsRewardsStats.SeasonsRewardsStats_Kill),
  )
  public seasonsRewardsStatsKillByIdMap = primaryIndex(this.seasonsRewardsStatsKillAll, 'TrackedStatID')
  public seasonsRewardsStatsKillById = indexLookup(this.seasonsRewardsStatsKillByIdMap)

  public emotesAll = table(() => this.loader.loadDatasheets(DATASHEETS.EmoteData))
  public emotesByIdMap = primaryIndex(this.emotesAll, 'UniqueTagID')
  public emotesById = indexLookup(this.emotesByIdMap)

  public playerTitlesAll = table(() => this.loader.loadDatasheets(DATASHEETS.PlayerTitleData))
  public playerTitlesByIdMap = primaryIndex(this.playerTitlesAll, 'TitleID')
  public playerTitlesById = indexLookup(this.playerTitlesByIdMap)

  public entitlementsAll = table(() => this.loader.loadDatasheets(DATASHEETS.EntitlementData))
  public entitlementsByIdMap = primaryIndex(this.entitlementsAll, 'UniqueTagID')
  public entitlementsById = indexLookup(this.entitlementsByIdMap)

  public backstoriesAll = table(() => this.loader.loadDatasheets(DATASHEETS.BackstoryDefinition))
  public backstoriesByIdMap = primaryIndex(this.backstoriesAll, 'BackstoryID')
  public backstoriesById = indexLookup(this.backstoriesByIdMap)

  public expansionsAll = table(() => this.loader.loadDatasheets(DATASHEETS.ExpansionData))
  public expansionsByIdMap = primaryIndex(this.expansionsAll, 'ExpansionId')
  public expansionsById = indexLookup(this.expansionsByIdMap)
}
