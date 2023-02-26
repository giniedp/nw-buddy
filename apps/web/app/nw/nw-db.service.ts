import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { groupBy } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, shareReplay } from 'rxjs'
import { CaseInsensitiveMap, CaseInsensitiveSet } from '~/utils'
import { NwDataService } from './nw-data.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './nw-db-views'
import { convertLootbuckets } from './utils/loot-buckets'
import { convertLoottables } from './utils/loot-tables'


export function createIndex<T, K extends keyof T>(list: T[], id: K): Map<T[K], T> {
  const result = new CaseInsensitiveMap<T[K], T>()
  for (const item of list) {
    result.set(item[id], item)
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
export type IndexKey<T> = T extends Array<any> ? never: T

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
    }).pipe(map(({ data, id }) => data.get(id)))
  }
}

@Injectable({ providedIn: 'root' })
export class NwDbService {
  public items = table(() =>
    this.data
      .apiMethodsByPrefix('itemdefinitionsMaster', 'itemdefinitionsMasterCommon')
      .sort()
      .reverse() // ajust to avoid AI category to show first... items have no icons
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public itemsMap = indexBy(() => this.items, 'ItemID')
  public item = lookup(() => this.itemsMap)
  public itemsBySalvageAchievement = indexGroupBy(() => this.items, 'SalvageAchievement')

  public housingItems = table(() => [this.data.housingitems()])
  public housingItemsMap = indexBy(() => this.housingItems, 'HouseItemID')
  public housingItem = lookup(() => this.housingItemsMap)
  public housingItemsByStatusEffectMap = indexGroupSetBy(() => this.housingItems, (it) => it.HousingStatusEffect)
  public housingItemsByStatusEffect = lookup(() => this.housingItemsByStatusEffectMap)

  public itemOrHousingItem = (id: string | Observable<string>) =>
    combineLatest({
      item: this.item(id),
      housing: this.housingItem(id),
    }).pipe(map(({ item, housing }) => item || housing))

  public abilities = table(() =>
    this.data
      .apiMethodsByPrefix('weaponabilitiesAbility', 'weaponabilitiesAbilityAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public abilitiesMap = indexBy(() => this.abilities, 'AbilityID')
  public ability = lookup(() => this.abilitiesMap)
  public abilitiesByStatusEffectMap = indexGroupSetBy(() => this.abilities, (it) => it.StatusEffect)
  public abilitiesByStatusEffect = lookup(() => this.abilitiesByStatusEffectMap)
  public abilitiesBySelfApplyStatusEffectMap = indexGroupSetBy(() => this.abilities, (it) => it.SelfApplyStatusEffect)
  public abilitiesBySelfApplyStatusEffect = lookup(() => this.abilitiesBySelfApplyStatusEffectMap)

  public statusEffects = table(() =>
    this.data
      .apiMethodsByPrefix('statuseffects', 'statuseffectsAi')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public statusEffectsMap = indexBy(() => this.statusEffects, 'StatusID')
  public statusEffect = lookup(() => this.statusEffectsMap)

  public perks = table(() => [this.data.perks()])
  public perksMap = indexBy(() => this.perks, 'PerkID')
  public perk = lookup(() => this.perksMap)
  public perksByEquipAbilityMap = indexGroupSetBy(() => this.perks, (it) => it.EquipAbility)
  public perksByEquipAbility = lookup(() => this.perksByEquipAbilityMap)
  public perksByAffixMap = indexGroupSetBy(() => this.perks, (it) => it.Affix)
  public perksByAffix = lookup(() => this.perksByAffixMap)

  public perkBuckets = table(() => [this.data.perkbuckets()])
  public perkBucketsMap = indexBy(() => this.perkBuckets, 'PerkBucketID')
  public perkBucket = lookup(() => this.perkBucketsMap)

  public affixStats = table(() => [this.data.affixstats()])
  public affixStatsMap = indexBy(() => this.affixStats, 'StatusID')
  public affixStat = lookup(() => this.affixStatsMap)
  public affixByStatusEffectMap = indexGroupSetBy(() => this.affixStats, (it) => it.StatusEffect)
  public affixByStatusEffect = lookup(() => this.affixByStatusEffectMap)

  public damageTable0 = table(() => [this.data.damagetable()])

  public damageTables = table(() =>
    this.data
      .apiMethodsByPrefix('damagetable', 'damagetable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public damageTableMap = indexBy(() => this.damageTables, 'DamageID')
  public damageTable = lookup(() => this.damageTableMap)

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
  public consumablesByAddStatusEffectsMap = indexGroupSetBy(() => this.consumables, (it) => it.AddStatusEffects)
  public consumablesByAddStatusEffects = lookup(() => this.consumablesByAddStatusEffectsMap)

  public runes = table(() => [this.data.itemdefinitionsRunes()])
  public runesMap = indexBy(() => this.runes, 'WeaponID')
  public rune = lookup(() => this.runesMap)

  public spells = table(() =>
    this.data
      .apiMethodsByPrefix('spelltable', 'spelltable')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public spellsMap = indexBy(() => this.spells, 'SpellID')
  public spell = lookup(() => this.spellsMap)

  public gameModes = table(() => [this.data.gamemodes()])
  public gameModesMap = indexBy(() => this.gameModes, 'GameModeId')
  public gameMode = lookup(() => this.gameModesMap)

  public recipes = table(() => [this.data.crafting()])
  public recipesMap = indexBy(() => this.recipes, 'RecipeID')
  public recipesMapByItemId = indexBy(() => this.recipes, 'ItemID')
  public recipe = lookup(() => this.recipesMap)

  public recipeCategories = table(() => [this.data.craftingcategories()])
  public recipeCategoriesMap = indexBy(() => this.recipeCategories, 'CategoryID')
  public recipeCategory = lookup(() => this.recipeCategoriesMap)

  public affixDefinitions = table(() => [this.data.affixdefinitions()])
  public affixDefinitionsMap = indexBy(() => this.affixDefinitions, 'AffixID')
  public affixDefinition = lookup(() => this.affixDefinitionsMap)


  public afflictions = table(() => [this.data.afflictions()])
  public afflictionsMap = indexBy(() => this.afflictions, 'AfflictionID')
  public affliction = lookup(() => this.afflictionsMap)

  public manacosts = table(() => [this.data.manacostsPlayer()])
  public manacostsMap = indexBy(() => this.manacosts, 'ID')

  public staminacostsPlayer = table(() => [this.data.staminacostsPlayer()])
  public staminacostsPlayerMap = indexBy(() => this.staminacostsPlayer, 'CostID')

  public arenas = table(() => [this.data.arenasArenadefinitions()])
  public arenasMap = indexBy(() => this.arenas, 'TerritoryID')
  public arena = lookup(() => this.arenasMap)

  public itemsConsumables = table(() => [this.data.itemdefinitionsConsumables()])
  public itemsConsumablesMap = indexBy(() => this.itemsConsumables, 'ConsumableID')

  public gameEvents = table(() => [this.data.gameevents()])
  public gameEventsMap = indexBy(() => this.gameEvents, 'EventID')
  public gameEvent = lookup(() => this.gameEventsMap)

  public categoriesProgression = table(() => [this.data.categoricalprogression()])
  public categoriesProgressionMap = indexBy(() => this.categoriesProgression, 'CategoricalProgressionId')

  public metaAchievements = table(() => [this.data.metaachievements()])
  public metaAchievementsMap = indexBy(() => this.metaAchievements, 'MetaAchievementId')

  public tradeskillPostcap = table(() => [this.data.tradeskillpostcap()])

  public vitals = table(() => [this.data.vitals()])
  public vitalsMap = indexBy(() => this.vitals, 'VitalsID')
  public vital = lookup(() => this.vitalsMap)

  public vitalsByFamily = indexGroupBy(() => this.vitals, 'Family')
  public vitalsOfFamily = lookup(() => this.vitalsByFamily)

  public vitalsByCreatureType = indexGroupBy(() => this.vitals, 'CreatureType')
  public vitalsOfCreatureType = lookup(() => this.vitalsByCreatureType)

  public vitalsFamilies = table(() => this.vitalsByFamily.pipe(map((it) => Array.from(it.keys()) as Array<Vitals['Family']>)))

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

  public affixstats = table(() => this.data.affixstats())
  public affixstatsMap = indexBy(() => this.affixstats, 'StatusID')
  public affixstat = lookup(() => this.affixstatsMap)

  public territories = table(() => this.data.territorydefinitions())
  public territoriesMap = indexBy(() => this.territories, 'TerritoryID')
  public territory = lookup(() => this.territoriesMap)

  public pois = table(() =>
    this.data
      .apiMethodsByPrefix('pointofinterestdefinitions', 'pointofinterestdefinitionsPoidefinitions0202')
      .map((it) => this.data[it.name]().pipe(annotate('$source', it.suffix || '_')))
  )
  public poisMap = indexBy(() => this.pois, 'TerritoryID')
  public poi = lookup(() => this.poisMap)

  public milestoneRewards = table(() => this.data.milestonerewards())
  public mutatorDifficulties = table(() => this.data.gamemodemutatorsMutationdifficulty())
  public viewGemPerksWithAffix = table(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = table(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = table(() =>
    this.data.apiMethodsByPrefix('loottables', 'loottables').map((it) =>
      this.data[it.name]()
        .pipe(map(convertLoottables))
        .pipe(annotate('$source', it.suffix || '_'))
    )
  )
  public lootTablesMap = indexBy(() => this.lootTables, 'LootTableID')
  public lootTable = lookup(() => this.lootTablesMap)

  public lootBuckets = table(() => this.data.lootbuckets().pipe(map(convertLootbuckets)))
  public lootBucketsMap = indexGroupBy(() => this.lootBuckets, 'LootBucket')
  public lootBucket = lookup(() => this.lootBucketsMap)

  public lootLimits = table(() => [this.data.lootlimits()])
  public lootLimitsMap = indexBy(() => this.lootLimits, 'LootLimitID')

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
