import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, shareReplay } from 'rxjs'
import { CaseInsensitiveMap } from '../utils'
import { NwDataService } from './nw-data.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './nw-db-views'
import { convertLootbuckets, convertLoottables } from './utils'

export function toMap<T, K extends keyof T>(list: T[], id: K): Map<T[K], T> {
  const result = new CaseInsensitiveMap<T[K], T>()
  for (const item of list) {
    result.set(item[id], item)
  }
  return result
}

function annotate<T>(key: string, value: string) {
  return map((items: T[]) => {
    items.forEach((it) => (it[key] = value))
    return items
  })
}

export function dictToMap<V>(record: Record<string, V>): Map<string, V> {
  return new CaseInsensitiveMap<string, V>(Object.entries(record))
}

function list<T>(source: () => Observable<T[]> | Array<Observable<T[]>>) {
  return defer(() => {
    const src = source()
    return combineLatest(Array.isArray(src) ? src : [src])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))
}
function index<T, K extends keyof T>(getList: () => Observable<T[]>, key: K) {
  return defer(() => getList())
    .pipe(map((items) => toMap(items, key)))
    .pipe(shareReplay(1))
}
function indexGroup<T, K extends keyof T>(getList: () => Observable<T[]>, key: K) {
  return defer(() => getList())
    .pipe(map((it) => dictToMap(groupBy(it, (i) => i[key]))))
    .pipe(shareReplay(1))
}
function lookup<K, T>(getMap: () => Observable<Map<K, T>>) {
  return (id: K | Observable<K>) => {
    return combineLatest({
      data: defer(() => getMap()),
      id: isObservable(id) ? id : of(id),
    }).pipe(map(({ data, id }) => data.get(id)))
  }
}

@Injectable({ providedIn: 'root' })
export class NwDbService {
  public items = list(() =>
    this.data
      .apiMethodsByPrefix('itemdefinitionsMaster', 'itemdefinitionsMasterCommon')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public itemsMap = index(() => this.items, 'ItemID')
  public item = lookup(() => this.itemsMap)
  public itemsBySalvageAchievement = indexGroup(() => this.items, 'SalvageAchievement')

  public housingItems = list(() => [this.data.housingitems()])
  public housingItemsMap = index(() => this.housingItems, 'HouseItemID')
  public housingItem = lookup(() => this.housingItemsMap)


  public itemOrHousingItem = (id: string | Observable<string>) =>
    combineLatest({
      item: this.item(id),
      housing: this.housingItem(id),
    }).pipe(map(({ item, housing }) => item || housing))

  public abilities = list(() =>
    this.data
      .apiMethodsByPrefix('weaponabilitiesAbility', 'weaponabilitiesAbilityAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public abilitiesMap = index(() => this.abilities, 'AbilityID')
  public ability = lookup(() => this.abilitiesMap)

  public statusEffects = list(() =>
    this.data
      .apiMethodsByPrefix('statuseffects', 'statuseffectsAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public statusEffectsMap = index(() => this.statusEffects, 'StatusID')
  public statusEffect = lookup(() => this.statusEffectsMap)

  public damageTable0 = list(() => [this.data.damagetable()])

  public damageTables = list(() =>
    this.data
      .apiMethodsByPrefix('damagetable', 'damagetable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public damageTableMap = index(() => this.damageTables, 'DamageID')
  public damageTable = lookup(() => this.damageTableMap)

  public armors = list(() => [this.data.itemdefinitionsArmor()])
  public armorsMap = index(() => this.armors, 'WeaponID')
  public armor = lookup(() => this.armorsMap)

  public weapons = list(() => [this.data.itemdefinitionsWeapons()])
  public weaponsMap = index(() => this.weapons, 'WeaponID')
  public weapon = lookup(() => this.weaponsMap)

  public consumables = list(() => [this.data.itemdefinitionsConsumables()])
  public consumablesMap = index(() => this.consumables, 'ConsumableID')
  public consumable = lookup(() => this.consumablesMap)

  public runes = list(() => [this.data.itemdefinitionsRunes()])
  public runesMap = index(() => this.runes, 'WeaponID')
  public rune = lookup(() => this.runesMap)

  public spellTable = list(() =>
    this.data
      .apiMethodsByPrefix('spelltable', 'spelltable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public spellTableMap = index(() => this.spellTable, 'SpellID')

  public gameModes = list(() => [this.data.gamemodes()])
  public gameModesMap = index(() => this.gameModes, 'GameModeId')
  public gameMode = lookup(() => this.gameModesMap)

  public perks = list(() => [this.data.perks()])
  public perksMap = index(() => this.perks, 'PerkID')
  public perk = lookup(() => this.perksMap)

  public perkBuckets = list(() => [this.data.perkbuckets()])
  public perkBucketsMap = index(() => this.perkBuckets, 'PerkBucketID')
  public perkBucket = lookup(() => this.perkBucketsMap)

  public recipes = list(() => [this.data.crafting()])
  public recipesMap = index(() => this.recipes, 'RecipeID')
  public recipesMapByItemId = index(() => this.recipes, 'ItemID')
  public recipe = lookup(() => this.recipesMap)

  public recipeCategories = list(() => [this.data.craftingcategories()])
  public recipeCategoriesMap = index(() => this.recipeCategories, 'CategoryID')
  public recipeCategory = lookup(() => this.recipeCategoriesMap)

  public affixDefinitions = list(() => [this.data.affixdefinitions()])
  public affixDefinitionsMap = index(() => this.affixDefinitions, 'AffixID')
  public affixDefinition = lookup(() => this.affixDefinitionsMap)

  public affixStats = list(() => [this.data.affixstats()])
  public affixStatsMap = index(() => this.affixStats, 'StatusID')
  public affixStat = lookup(() => this.affixStatsMap)

  public afflictions = list(() => [this.data.afflictions()])
  public afflictionsMap = index(() => this.afflictions, 'AfflictionID')
  public affliction = lookup(() => this.afflictionsMap)

  public manacosts = list(() => [this.data.manacostsPlayer()])
  public manacostsMap = index(() => this.manacosts, 'ID')

  public staminacostsPlayer = list(() => [this.data.staminacostsPlayer()])
  public staminacostsPlayerMap = index(() => this.staminacostsPlayer, 'CostID')

  public arenas = list(() => [this.data.arenasArenadefinitions()])
  public arenasMap = index(() => this.arenas, 'TerritoryID')
  public arena = lookup(() => this.arenasMap)

  public itemsConsumables = list(() => [this.data.itemdefinitionsConsumables()])
  public itemsConsumablesMap = index(() => this.itemsConsumables, 'ConsumableID')

  public gameEvents = list(() => [this.data.gameevents()])
  public gameEventsMap = index(() => this.gameEvents, 'EventID')
  public gameEvent = lookup(() => this.gameEventsMap)

  public categoriesProgression = list(() => [this.data.categoricalprogression()])
  public categoriesProgressionMap = index(() => this.categoriesProgression, 'CategoricalProgressionId')

  public metaAchievements = list(() => [this.data.metaachievements()])
  public metaAchievementsMap = index(() => this.metaAchievements, 'MetaAchievementId')

  public tradeskillPostcap = list(() => [this.data.tradeskillpostcap()])

  public vitals = list(() => [this.data.vitals()])
  public vitalsMap = index(() => this.vitals, 'VitalsID')
  public vital = lookup(() => this.vitalsMap)

  public vitalsByFamily = indexGroup(() => this.vitals, 'Family')
  public vitalsOfFamily = lookup(() => this.vitalsByFamily)

  public vitalsByCreatureType = indexGroup(() => this.vitals, 'CreatureType')
  public vitalsOfCreatureType = lookup(() => this.vitalsByCreatureType)

  public vitalsFamilies = list(() => this.vitalsByFamily.pipe(map((it) => Array.from(it.keys()))))

  public vitalsCategories = list(() => [this.data.vitalscategories()])
  public vitalsCategoriesMap = index(() => this.vitalsCategories, 'VitalsCategoryID')
  public vitalsCategory = lookup(() => this.vitalsCategoriesMap)
  public vitalsCategoriesMapByGroup = indexGroup(() => this.vitalsCategories, 'GroupVitalsCategoryId')

  public vitalsModifiers = list(() => [this.data.vitalsmodifierdata()])
  public vitalsModifiersMap = index(() => this.vitalsModifiers, 'CategoryId')
  public vitalsModifier = lookup(() => this.vitalsModifiersMap)

  public vitalsLevels = list(() => [this.data.vitalsleveldata()])
  public vitalsLevelsMap = index(() => this.vitalsLevels, 'Level')
  public vitalsLevel = lookup(() => this.vitalsLevelsMap)

  public damagetypes = list(() => this.data.damagetypes())
  public damagetypesMap = index(() => this.damagetypes, 'TypeID')
  public damagetype = lookup(() => this.damagetypesMap)

  public affixstats = list(() => this.data.affixstats())
  public affixstatsMap = index(() => this.affixstats, 'StatusID')
  public affixstat = lookup(() => this.affixstatsMap)

  public territories = list(() => this.data.territorydefinitions())
  public territoriesMap = index(() => this.territories, 'TerritoryID')
  public territory = lookup(() => this.territoriesMap)

  public pois = list(() =>
    this.data
      .apiMethodsByPrefix('pointofinterestdefinitions', 'pointofinterestdefinitionsPoidefinitions0202')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public poisMap = index(() => this.pois, 'TerritoryID')
  public poi = lookup(() => this.poisMap)

  public milestoneRewards = list(() => this.data.milestonerewards())
  public mutatorDifficulties = list(() => this.data.gamemodemutatorsMutationdifficulty())
  public viewGemPerksWithAffix = list(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = list(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = list(() =>
    this.data.apiMethodsByPrefix('loottables', 'loottables').map((it) =>
      this.data[it.name]()
        .pipe(map(convertLoottables))
        .pipe(annotate('$source', it.suffix || '_'))
    )
  )
  public lootTablesMap = index(() => this.lootTables, 'LootTableID')
  public lootTable = lookup(() => this.lootTablesMap)

  public lootBuckets = list(() => this.data.lootbuckets().pipe(map(convertLootbuckets)))
  public lootBucketsMap = indexGroup(() => this.lootBuckets, 'LootBucket')
  public lootBucket = lookup(() => this.lootBucketsMap)

  public lootLimits = list(() => [this.data.lootlimits()])
  public lootLimitsMap = index(() => this.lootLimits, 'LootLimitID')

  public xpAmounts = this.data.xpamountsbylevel().pipe(shareReplay(1))
  public weaponMastery = this.data.weaponmastery().pipe(shareReplay(1))

  public attrCon = this.data.attributeconstitution().pipe(shareReplay(1))
  public attrStr = this.data.attributestrength().pipe(shareReplay(1))
  public attrDex = this.data.attributedexterity().pipe(shareReplay(1))
  public attrFoc = this.data.attributefocus().pipe(shareReplay(1))
  public attrInt = this.data.attributeintelligence().pipe(shareReplay(1))

  public constructor(public readonly data: NwDataService) {
    //
  }
}
