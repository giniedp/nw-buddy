import { Injectable } from '@angular/core'
import {
  convertBuffBuckets,
  convertLootbuckets,
  convertLoottables,
  convertPerkBuckets,
  getIngretientsFromRecipe,
  getItemIdFromRecipe,
  getItemSetFamilyName,
  getQuestRequiredAchuevmentIds,
  getSeasonPassDataId,
} from '@nw-data/common'
import { Housingitems, Vitals } from '@nw-data/generated'
import { groupBy, sortBy } from 'lodash'
import { Observable, combineLatest, defer, isObservable, map, of, shareReplay } from 'rxjs'
import { CaseInsensitiveMap, CaseInsensitiveSet } from '~/utils'
import { NwDataService } from './nw-data.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './nw-db-views'

export function createIndex<T, K extends keyof T>(list: T[], id: K): Map<T[K], T> {
  const result = new CaseInsensitiveMap<T[K], T>()
  for (const item of list) {
    result.set(item[id], item)
  }
  return result
}

export function createIndexByFn<T>(list: T[], id: (it: T) => string): Map<string, T> {
  const result = new CaseInsensitiveMap<string, T>()
  for (const item of list) {
    result.set(id(item), item)
  }
  return result
}

export function createIndexGroup<T, K extends keyof T>(list: T[], id: K): Map<string, T[]> {
  return dictToMap(groupBy(list, (i) => i[id]))
}

function makeArray<T>(it: T | T[]): T[] {
  if (Array.isArray(it)) {
    return it
  }
  return [it]
}
export function createIndexGroupSet<T>(list: T[], getKeys: (it: T) => string[] | string): Map<string, Set<T>> {
  const result = new CaseInsensitiveMap<string, Set<T>>()
  for (const item of list) {
    const keys = makeArray(getKeys(item) || [])
    for (const key of keys) {
      const list = result.get(key) || new CaseInsensitiveSet()
      list.add(item)
      result.set(key, list)
    }
  }
  return result
}
export type IndexKey<T> = T extends Array<any> ? never : T

function annotate<T>(key: string, value: string) {
  return map((items: T[]) => {
    items.forEach((it) => (it[key] = value))
    return items
  })
}

export function dictToMap<V>(record: Record<string, V>): Map<string, V> {
  return new CaseInsensitiveMap<string, V>(Object.entries(record))
}

function table<T>(source: () => Observable<T[]> | Array<Observable<T[]>>) {
  return defer(() => {
    const src = source()
    return combineLatest(Array.isArray(src) ? src : [src])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))
}
function indexBy<T, K extends keyof T>(source: () => Observable<T[]>, key: K) {
  return defer(() => source())
    .pipe(map((items) => createIndex(items, key)))
    .pipe(shareReplay(1))
}
function indexByFn<T>(source: () => Observable<T[]>, key: (it: T) => string) {
  return defer(() => source())
    .pipe(map((items) => createIndexByFn(items, key)))
    .pipe(shareReplay(1))
}
function indexGroupSetBy<T>(source: () => Observable<T[]>, fn: (it: T) => string[] | string) {
  return defer(() => source())
    .pipe(map((items) => createIndexGroupSet(items, fn)))
    .pipe(shareReplay(1))
}
function indexGroupBy<T, K extends keyof T>(source: () => Observable<T[]>, key: K) {
  return defer(() => source())
    .pipe(map((items) => createIndexGroup(items, key)))
    .pipe(shareReplay(1))
}
function lookup<K, T>(getMap: () => Observable<Map<K, T>>) {
  return (id: K | Observable<K>) => {
    return combineLatest({
      data: defer(() => getMap()),
      id: isObservable(id) ? id : of(id),
    }).pipe(map(({ data, id }) => (id != null ? data.get(id) : null)))
  }
}

@Injectable({ providedIn: 'root' })
export class NwDbService {
  public items = table(() => {
    const backsort = ['Ai', 'Playtest', 'Omega']
    let methods = [
      ...this.data.apiMethodsByPrefix('itemdefinitionsMaster', 'itemdefinitionsMasterCommon'),
      ...this.data.apiMethodsByPrefix('mtxItemdefinitionsMtx', 'itemdefinitionsMasterCommon'),
    ]
    methods = sortBy(methods, (it) => (backsort.includes(it.suffix) ? `x${it.suffix}` : it.suffix))
    return methods.map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  })

  public itemsMap = indexBy(() => this.items, 'ItemID')
  public item = lookup(() => this.itemsMap)
  public itemsBySalvageAchievement = indexGroupBy(() => this.items, 'SalvageAchievement')
  public itemsByIngredientCategoryMap = indexGroupSetBy(
    () => this.items,
    (it) => it.IngredientCategories,
  )
  public itemsByIngredientCategory = lookup(() => this.itemsByIngredientCategoryMap)
  public itemsByAppearanceId = indexGroupSetBy(
    () => this.items,
    (it) => [it.ArmorAppearanceM, it.ArmorAppearanceF, it.WeaponAppearanceOverride],
  )
  public itemsByItemTypeMap = indexGroupSetBy(
    () => this.items,
    (it) => it.ItemType,
  )
  public itemsBySetFamilyName = indexGroupSetBy(
    () => this.items,
    (it) => getItemSetFamilyName(it),
  )
  public itemSet = lookup(() => this.itemsBySetFamilyName)

  public housingItems = table(() => [
    this.data.housingitems(),
    this.data.mtxHousingitemsMtx() as any as Observable<Housingitems[]>,
  ])
  public housingItemsMap = indexBy(() => this.housingItems, 'HouseItemID')
  public housingItem = lookup(() => this.housingItemsMap)
  public housingItemsByStatusEffectMap = indexGroupSetBy(
    () => this.housingItems,
    (it) => it.HousingStatusEffect,
  )
  public housingItemsByStatusEffect = lookup(() => this.housingItemsByStatusEffectMap)

  public itemOrHousingItem = (id: string | Observable<string>) =>
    combineLatest({
      item: this.item(id),
      housing: this.housingItem(id),
    }).pipe(map(({ item, housing }) => item || housing))

  public abilities = table(() =>
    this.data
      .apiMethodsByPrefix('weaponabilitiesAbility', 'weaponabilitiesAbilityAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public abilitiesMap = indexBy(() => this.abilities, 'AbilityID')
  public ability = lookup(() => this.abilitiesMap)
  public abilitiesByStatusEffectMap = indexGroupSetBy(
    () => this.abilities,
    (it) => it.StatusEffect,
  )
  public abilitiesByStatusEffect = lookup(() => this.abilitiesByStatusEffectMap)
  public abilitiesBySelfApplyStatusEffectMap = indexGroupSetBy(
    () => this.abilities,
    (it) => it.SelfApplyStatusEffect,
  )
  public abilitiesBySelfApplyStatusEffect = lookup(() => this.abilitiesBySelfApplyStatusEffectMap)
  public abilitiesByOtherApplyStatusEffectMap = indexGroupSetBy(
    () => this.abilities,
    (it) => it.OtherApplyStatusEffect,
  )
  public abilitiesByOtherApplyStatusEffect = lookup(() => this.abilitiesByOtherApplyStatusEffectMap)

  public statusEffects = table(() =>
    this.data
      .apiMethodsByPrefix('statuseffects', 'statuseffectsAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public statusEffectsMap = indexBy(() => this.statusEffects, 'StatusID')
  public statusEffect = lookup(() => this.statusEffectsMap)

  public statusEffectCategories = table(() => this.data.statuseffectcategories())
  public statusEffectCategoriesMap = indexBy(() => this.statusEffectCategories, 'StatusEffectCategoryID')
  public statusEffectCategory = lookup(() => this.statusEffectCategoriesMap)

  public perks = table(() => [this.data.perks()])
  public perksMap = indexBy(() => this.perks, 'PerkID')
  public perk = lookup(() => this.perksMap)
  public perksByEquipAbilityMap = indexGroupSetBy(
    () => this.perks,
    (it) => it.EquipAbility,
  )
  public perksByEquipAbility = lookup(() => this.perksByEquipAbilityMap)
  public perksByAffixMap = indexGroupSetBy(
    () => this.perks,
    (it) => it.Affix,
  )
  public perksByAffix = lookup(() => this.perksByAffixMap)

  public perkBuckets = table(() => [this.data.perkbuckets().pipe(map(convertPerkBuckets))])
  public perkBucketsMap = indexBy(() => this.perkBuckets, 'PerkBucketID')
  public perkBucket = lookup(() => this.perkBucketsMap)

  public affixStats = table(() => [this.data.affixstats()])
  public affixStatsMap = indexBy(() => this.affixStats, 'StatusID')
  public affixStat = lookup(() => this.affixStatsMap)
  public affixByStatusEffectMap = indexGroupSetBy(
    () => this.affixStats,
    (it) => it.StatusEffect,
  )
  public affixByStatusEffect = lookup(() => this.affixByStatusEffectMap)

  public damageTable0 = table(() => [this.data.damagetable()])

  public damageTables = table(() =>
    this.data
      .apiMethodsByPrefix('damagetable', 'damagetable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public damageTableMap = indexBy(() => this.damageTables, 'DamageID')
  public damageTable = lookup(() => this.damageTableMap)
  public damageTablesByStatusEffectMap = indexGroupSetBy(
    () => this.damageTables,
    (it) => it.StatusEffect,
  )
  public damageTablesByStatusEffect = lookup(() => this.damageTablesByStatusEffectMap)

  public dmgTableEliteAffix = table(() => [this.data.charactertablesEliteaffixDatatablesDamagetableEliteAffix()])
  public dmgTableEliteAffixMap = indexBy(() => this.dmgTableEliteAffix, 'DamageID')

  public gatherables = table(() => [this.data.gatherables()])
  public gatherablesMap = indexBy(() => this.gatherables, 'GatherableID')
  public gatherable = lookup(() => this.gatherablesMap)

  public mounts = table(() => [this.data.mountsMounts()])
  public mountsMap = indexBy(() => this.mounts, 'MountId')
  public mount = lookup(() => this.mountsMap)

  public armors = table(() => [this.data.itemdefinitionsArmor()])
  public armorsMap = indexBy(() => this.armors, 'WeaponID')
  public armor = lookup(() => this.armorsMap)

  public weapons = table(() => [this.data.itemdefinitionsWeapons()])
  public weaponsMap = indexBy(() => this.weapons, 'WeaponID')
  public weapon = lookup(() => this.weaponsMap)

  public ammos = table(() => [this.data.itemdefinitionsAmmo()])
  public ammosMap = indexBy(() => this.ammos, 'AmmoID')
  public ammo = lookup(() => this.ammosMap)

  public consumables = table(() => [this.data.itemdefinitionsConsumables()])
  public consumablesMap = indexBy(() => this.consumables, 'ConsumableID')
  public consumable = lookup(() => this.consumablesMap)
  public consumablesByAddStatusEffectsMap = indexGroupSetBy(
    () => this.consumables,
    (it) => it.AddStatusEffects,
  )
  public consumablesByAddStatusEffects = lookup(() => this.consumablesByAddStatusEffectsMap)

  public runes = table(() => [this.data.itemdefinitionsRunes()])
  public runesMap = indexBy(() => this.runes, 'WeaponID')
  public rune = lookup(() => this.runesMap)

  public spells = table(() =>
    this.data
      .apiMethodsByPrefix('spelltable', 'spelltable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public spellsMap = indexBy(() => this.spells, 'SpellID')
  public spell = lookup(() => this.spellsMap)
  public spellsByDamageTable = indexGroupSetBy(
    () => this.spells,
    (it) => it.DamageTable,
  )

  public spellsMetadata = table(() => [this.data.generatedSpellsmetadata()])
  public spellsMetadataMap = indexBy(() => this.spellsMetadata, 'PrefabPath')
  public spellsMeta = lookup(() => this.spellsMetadataMap)

  public gameModes = table(() => [this.data.gamemodes()])
  public gameModesMap = indexBy(() => this.gameModes, 'GameModeId')
  public gameMode = lookup(() => this.gameModesMap)

  public quests = table(() =>
    this.data
      .apiMethodsByPrefix('quests', 'quests01Starterbeach01Objectives')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public questsMap = indexBy(() => this.quests, 'ObjectiveID')
  public quest = lookup(() => this.questsMap)
  public questsByAchievementId = indexGroupSetBy(
    () => this.quests,
    (it) => it.AchievementId,
  )
  public questsByRequiredAchievementId = indexGroupSetBy(
    () => this.quests,
    (it) => getQuestRequiredAchuevmentIds(it),
  )

  public recipes = table(() =>
    this.data
      .apiMethodsByPrefix('crafting', 'crafting')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public recipesMap = indexBy(() => this.recipes, 'RecipeID')
  public recipesMapByItemId = indexGroupSetBy(
    () => this.recipes,
    (it) => getItemIdFromRecipe(it),
  )
  public recipesMapByRequiredAchievementId = indexBy(() => this.recipes, 'RequiredAchievementID')
  public recipesMapByIngredients = indexGroupSetBy(
    () => this.recipes,
    (it) =>
      getIngretientsFromRecipe(it)
        .map((it) => it.ingredient)
        .filter((it) => !!it),
  )
  public recipe = lookup(() => this.recipesMap)
  public recipeByAchievementId = lookup(() => this.recipesMapByRequiredAchievementId)
  public recipesByIngredientId = lookup(() => this.recipesMapByIngredients)
  public recipesByItemId = lookup(() => this.recipesMapByItemId)

  public recipeCategories = table(() => [this.data.craftingcategories()])
  public recipeCategoriesMap = indexBy(() => this.recipeCategories, 'CategoryID')
  public recipeCategory = lookup(() => this.recipeCategoriesMap)

  public resources = table(() => [this.data.itemdefinitionsResources()])
  public resourcesMap = indexBy(() => this.resources, 'ResourceID')
  public resource = lookup(() => this.resourcesMap)

  public affixDefinitions = table(() => [this.data.affixdefinitions()])
  public affixDefinitionsMap = indexBy(() => this.affixDefinitions, 'AffixID')
  public affixDefinition = lookup(() => this.affixDefinitionsMap)

  public afflictions = table(() => [this.data.afflictions()])
  public afflictionsMap = indexBy(() => this.afflictions, 'AfflictionID')
  public affliction = lookup(() => this.afflictionsMap)

  public costumes = table(() => [this.data.costumechangesCostumechanges()])
  public costumesMap = indexBy(() => this.costumes, 'CostumeChangeId')
  public costume = lookup(() => this.costumesMap)

  public manacosts = table(() => [this.data.manacostsPlayer()])
  public manacostsMap = indexBy(() => this.manacosts, 'CostID')

  public staminacostsPlayer = table(() => [this.data.staminacostsPlayer()])
  public staminacostsPlayerMap = indexBy(() => this.staminacostsPlayer, 'CostID')

  public arenas = table(() => [this.data.arenasArenadefinitions()])
  public arenasMap = indexBy(() => this.arenas, 'TerritoryID')
  public arena = lookup(() => this.arenasMap)

  public itemsConsumables = table(() => [this.data.itemdefinitionsConsumables()])
  public itemsConsumablesMap = indexBy(() => this.itemsConsumables, 'ConsumableID')

  public gameEvents = table(() => {
    return [
      this.data.gameevents(),
      this.data
        .apiMethodsByPrefix('questgameevents', 'gameevents')
        .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
    ].flat()
  })
  public gameEventsMap = indexBy(() => this.gameEvents, 'EventID')
  public gameEvent = lookup(() => this.gameEventsMap)

  public categoriesProgression = table(() => [this.data.categoricalprogression()])
  public categoriesProgressionMap = indexBy(() => this.categoriesProgression, 'CategoricalProgressionId')

  public metaAchievements = table(() => [this.data.metaachievements()])
  public metaAchievementsMap = indexBy(() => this.metaAchievements, 'MetaAchievementId')

  public tradeskillPostcap = table(() => [this.data.tradeskillpostcap()])

  public vitalsMetadata = table(() => [this.data.generatedVitalsmetadata()])
  public vitalsMetadataMap = indexBy(() => this.vitalsMetadata, 'vitalsID')
  public vitalsMeta = lookup(() => this.vitalsMetadataMap)

  public vitals = table(() => [
    this.data.vitals(),
    this.data.vitalstablesVitalsFirstlight() as unknown as Observable<Vitals[]>,
    this.data.vitalsPlayer() as unknown as Observable<Vitals[]>,
  ])
  public vitalsMap = indexBy(() => this.vitals, 'VitalsID')
  public vital = lookup(() => this.vitalsMap)

  public vitalsPlayer = table(() => [this.data.vitalsPlayer()])
  public vitalsPlayerMap = indexBy(() => this.vitals, 'VitalsID')
  public vitalPlayer = lookup(() => this.vitalsPlayerMap)

  public vitalsByFamily = indexGroupBy(() => this.vitals, 'Family')
  public vitalsOfFamily = lookup(() => this.vitalsByFamily)

  public vitalsByCreatureType = indexGroupBy(() => this.vitals, 'CreatureType')
  public vitalsOfCreatureType = lookup(() => this.vitalsByCreatureType)

  public vitalsFamilies = table(() =>
    this.vitalsByFamily.pipe(map((it) => Array.from(it.keys()) as Array<Vitals['Family']>)),
  )

  public vitalsCategories = table(() => [this.data.vitalscategories()])
  public vitalsCategoriesMap = indexBy(() => this.vitalsCategories, 'VitalsCategoryID')
  public vitalsCategory = lookup(() => this.vitalsCategoriesMap)
  public vitalsCategoriesMapByGroup = indexGroupBy(() => this.vitalsCategories, 'GroupVitalsCategoryId')

  public vitalsModifiers = table(() => [this.data.vitalsmodifierdata()])
  public vitalsModifiersMap = indexBy(() => this.vitalsModifiers, 'CategoryId')
  public vitalsModifier = lookup(() => this.vitalsModifiersMap)

  public vitalsLevels = table(() => [this.data.vitalsleveldata()])
  public vitalsLevelsMap = indexBy(() => this.vitalsLevels, 'Level')
  public vitalsLevel = lookup(() => this.vitalsLevelsMap)

  public damagetypes = table(() => this.data.damagetypes())
  public damagetypesMap = indexBy(() => this.damagetypes, 'TypeID')
  public damagetype = lookup(() => this.damagetypesMap)

  public territories = table(() => this.data.territorydefinitions())
  public territoriesMap = indexBy(() => this.territories, 'TerritoryID')
  public territory = lookup(() => this.territoriesMap)

  public pois = table(() =>
    this.data
      .apiMethodsByPrefix('pointofinterestdefinitions', 'pointofinterestdefinitionsPoidefinitions0202')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_'))),
  )
  public poisMap = indexBy(() => this.pois, 'TerritoryID')
  public poi = lookup(() => this.poisMap)
  public poiByPoiTag = indexGroupSetBy(
    () => this.pois,
    (it) => it.POITag?.split(','),
  )

  public milestoneRewards = table(() => this.data.milestonerewards())

  public mutatorDifficulties = table(() => this.data.gamemodemutatorsMutationdifficulty())
  public mutatorDifficultiesMap = indexBy(() => this.mutatorDifficulties, 'MutationDifficulty')
  public mutatorDifficulty = lookup(() => this.mutatorDifficultiesMap)

  public mutatorElements = table(() => this.data.gamemodemutatorsElementalmutations())
  public mutatorElementsMap = indexBy(() => this.mutatorElements, 'ElementalMutationId')
  public mutatorElement = lookup(() => this.mutatorElementsMap)

  public mutatorElementsPerks = table(() => this.data.gamemodemutatorsElementalmutationperks())
  public mutatorElementsPerksMap = indexBy(() => this.mutatorElementsPerks, 'ElementalMutationTypeId')
  public mutatorElementPerk = lookup(() => this.mutatorElementsPerksMap)

  public mutatorPromotions = table(() => this.data.gamemodemutatorsPromotionmutations())
  public mutatorPromotionsMap = indexBy(() => this.mutatorPromotions, 'PromotionMutationId')
  public mutatorPromotion = lookup(() => this.mutatorPromotionsMap)

  public mutatorCurses = table(() => this.data.gamemodemutatorsCursemutations())
  public mutatorCursesMap = indexBy(() => this.mutatorCurses, 'CurseMutationId')
  public mutatorCurse = lookup(() => this.mutatorCursesMap)

  public viewGemPerksWithAffix = table(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = table(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = table(() =>
    this.data
      .matchingApiMethods<'loottables'>((it) => {
        return it.split(/([A-Z][a-z]+)/g).some((token) => {
          return token.toLowerCase() === 'loottables'
        })
      })
      .map((it) => {
        return this.data[it]().pipe(map(convertLoottables)).pipe(annotate('$source', it))
      }),
  )
  public lootTablesMap = indexBy(() => this.lootTables, 'LootTableID')
  public lootTable = lookup(() => this.lootTablesMap)

  public lootBuckets = table(() => this.data.lootbuckets().pipe(map(convertLootbuckets)))
  public lootBucketsMap = indexGroupBy(() => this.lootBuckets, 'LootBucket')
  public lootBucket = lookup(() => this.lootBucketsMap)

  public lootLimits = table(() => [this.data.lootlimits()])
  public lootLimitsMap = indexBy(() => this.lootLimits, 'LootLimitID')

  public buffBuckets = table(() => this.data.buffbuckets().pipe(map(convertBuffBuckets)))
  public buffBucketsMap = indexBy(() => this.buffBuckets, 'BuffBucketId')
  public buffBucket = lookup(() => this.buffBucketsMap)

  public xpAmounts = this.data.xpamountsbylevel().pipe(shareReplay(1))
  public weaponMastery = this.data.weaponmastery().pipe(shareReplay(1))

  public attrCon = this.data.attributeconstitution().pipe(shareReplay(1))
  public attrStr = this.data.attributestrength().pipe(shareReplay(1))
  public attrDex = this.data.attributedexterity().pipe(shareReplay(1))
  public attrFoc = this.data.attributefocus().pipe(shareReplay(1))
  public attrInt = this.data.attributeintelligence().pipe(shareReplay(1))

  public itemAppearances = table(() => this.data.itemappearancedefinitions())
  public itemAppearancesMap = indexBy(() => this.itemAppearances, 'ItemID')
  public itemAppearance = lookup(() => this.itemAppearancesMap)
  public itemAppearancesByNameMap = indexGroupBy(() => this.itemAppearances, 'AppearanceName')
  public itemAppearancesByName = lookup(() => this.itemAppearancesByNameMap)

  public weaponAppearances = table(() => this.data.itemdefinitionsWeaponappearances())
  public weaponAppearancesMap = indexBy(() => this.weaponAppearances, 'WeaponAppearanceID')
  public weaponAppearance = lookup(() => this.weaponAppearancesMap)

  public instrumentAppearances = table(() => this.data.itemdefinitionsInstrumentsappearances())
  public instrumentAppearancesMap = indexBy(() => this.instrumentAppearances, 'WeaponAppearanceID')
  public instrumentAppearance = lookup(() => this.instrumentAppearancesMap)

  public mountAttachmentsAppearances = table(() => this.data.itemdefinitionsWeaponappearancesMountattachments())
  public mountAttachmentsAppearancesMap = indexBy(() => this.mountAttachmentsAppearances, 'WeaponAppearanceID')
  public mountAttachmentsAppearance = lookup(() => this.mountAttachmentsAppearancesMap)

  public dyeColors = table(() => this.data.dyecolors())
  public dyeColorsMap = indexBy(() => this.dyeColors, 'Index')
  public dyeColor = lookup(() => this.dyeColorsMap)

  public objectives = table(() => [this.data.objectives()])
  public objectivesMap = indexBy(() => this.objectives, 'ObjectiveID')
  public objective = lookup(() => this.objectivesMap)

  public objectiveTasks = table(() => [this.data.objectivetasks()])
  public objectiveTasksMap = indexBy(() => this.objectiveTasks, 'TaskID')
  public objectiveTask = lookup(() => this.objectiveTasksMap)

  public cooldownsPlayer = table(() => this.data.cooldownsPlayer())
  public cooldownsPlayerMap = indexBy(() => this.cooldownsPlayer, 'AbilityID')
  public cooldownPlayer = lookup(() => this.cooldownsPlayerMap)

  public emotes = table(() => this.data.emotedefinitions())
  public emotesMap = indexBy(() => this.emotes, 'UniqueTagID')
  public emote = lookup(() => this.emotesMap)

  public playerTitles = table(() => this.data.playertitles())
  public playerTitlesMap = indexBy(() => this.playerTitles, 'TitleID')
  public playerTitle = lookup(() => this.playerTitlesMap)

  public seasonPassData = table(() =>
    this.data
      .matchingApiMethods<'seasonsrewardsSeason1SeasonpassdataSeason1'>((it) => {
        return !!it.match(/seasonsrewardsSeason\d+SeasonpassdataSeason\d+/i)
      })
      .map((it) => this.data[it]().pipe(annotate('$source', it.match(/Season\d+/i)?.[0]))),
  )
  public seasonPassDataMap = indexByFn(() => this.seasonPassData, getSeasonPassDataId)
  public seasonPassRow = lookup(() => this.seasonPassDataMap)

  public seasonPassRewards = table(() =>
    this.data
      .matchingApiMethods<'seasonsrewardsSeason1RewarddataSeason1'>((it) => {
        return !!it.match(/seasonsrewardsSeason\d+RewarddataSeason\d+/i)
      })
      .map((it) => this.data[it]().pipe(annotate('$source', it.match(/Season\d+/i)?.[0]))),
  )
  public seasonPassRewardsMap = indexBy(() => this.seasonPassRewards, 'RewardId')
  public seasonPassReward = lookup(() => this.seasonPassRewardsMap)

  public constructor(public readonly data: NwDataService) {
    //
  }
}
