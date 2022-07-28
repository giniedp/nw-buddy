import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, shareReplay } from 'rxjs'
import { CaseInsensitiveMap } from '../utils'
import { NwDataService } from './nw-data.service'
import { queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './nw-db-views'
import { convertLootbuckets, convertLoottables, createLootGraph } from './utils'

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

function list<T, R>(source: () => Observable<T[]> | Array<Observable<T[]>>) {
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
  public items = list(() => [
    this.data.itemdefinitionsMasterCommon().pipe(annotate('$source', 'Common')),
    this.data.itemdefinitionsMasterCrafting().pipe(annotate('$source', 'Crafting')),
    this.data.itemdefinitionsMasterLoot().pipe(annotate('$source', 'Loot')),
    this.data.itemdefinitionsMasterNamed().pipe(annotate('$source', 'Named')),
    this.data.itemdefinitionsMasterFaction().pipe(annotate('$source', 'Faction')),
    this.data.itemdefinitionsMasterOmega().pipe(annotate('$source', 'Omega')),
    this.data.itemdefinitionsMasterPlaytest().pipe(annotate('$source', 'Playtest')),
    this.data.itemdefinitionsMasterPvp().pipe(annotate('$source', 'Pvp')),
    this.data.itemdefinitionsMasterQuest().pipe(annotate('$source', 'Quest')),
    this.data.itemdefinitionsMasterStore().pipe(annotate('$source', 'Store')),
    this.data.itemdefinitionsMasterAi().pipe(annotate('$source', 'Ai')),
  ])
  public itemsMap = index(() => this.items, 'ItemID')
  public item = lookup(() => this.itemsMap)

  public housingItems = list(() => [this.data.housingitems()])
  public housingItemsMap = index(() => this.housingItems, 'HouseItemID')
  public housingItem = lookup(() => this.housingItemsMap)

  public abilities = list(() => [
    this.data.weaponabilitiesAbilityAi().pipe(annotate('$source', 'Ai')),
    this.data.weaponabilitiesAbilityAttributethreshold().pipe(annotate('$source', 'Attributethreshold')),
    this.data.weaponabilitiesAbilityBlunderbuss().pipe(annotate('$source', 'Blunderbuss')),
    this.data.weaponabilitiesAbilityBow().pipe(annotate('$source', 'Bow')),
    this.data.weaponabilitiesAbilityFiremagic().pipe(annotate('$source', 'Firemagic')),
    this.data.weaponabilitiesAbilityGlobal().pipe(annotate('$source', 'Global')),
    this.data.weaponabilitiesAbilityGreataxe().pipe(annotate('$source', 'Greataxe')),
    this.data.weaponabilitiesAbilityHatchet().pipe(annotate('$source', 'Hatchet')),
    this.data.weaponabilitiesAbilityIcemagic().pipe(annotate('$source', 'Icemagic')),
    this.data.weaponabilitiesAbilityLifemagic().pipe(annotate('$source', 'Lifemagic')),
    this.data.weaponabilitiesAbilityMusket().pipe(annotate('$source', 'Musket')),
    this.data.weaponabilitiesAbilityRapier().pipe(annotate('$source', 'Rapier')),
    this.data.weaponabilitiesAbilitySpear().pipe(annotate('$source', 'Spear')),
    this.data.weaponabilitiesAbilitySword().pipe(annotate('$source', 'Sword')),
    this.data.weaponabilitiesAbilityWarhammer().pipe(annotate('$source', 'Warhammer')),
  ])
  public abilitiesMap = index(() => this.abilities, 'AbilityID')
  public ability = lookup(() => this.abilitiesMap)

  public statusEffects = list(() => [
    this.data.statuseffects().pipe(annotate('$source', '_')),
    this.data.statuseffectsAi().pipe(annotate('$source', 'Ai')),
    this.data.statuseffectsBow().pipe(annotate('$source', 'Bow')),
    this.data.statuseffectsBlunderbuss().pipe(annotate('$source', 'Blunderbuss')),
    this.data.statuseffectsCommon().pipe(annotate('$source', 'Common')),
    this.data.statuseffectsFirestaff().pipe(annotate('$source', 'Firestaff')),
    this.data.statuseffectsGreataxe().pipe(annotate('$source', 'Greataxe')),
    this.data.statuseffectsGreatsword().pipe(annotate('$source', 'Greatsword')),
    this.data.statuseffectsHatchet().pipe(annotate('$source', 'Hatchet')),
    this.data.statuseffectsIcemagic().pipe(annotate('$source', 'Icemagic')),
    this.data.statuseffectsItem().pipe(annotate('$source', 'Item')),
    this.data.statuseffectsLifestaff().pipe(annotate('$source', 'Lifestaff')),
    this.data.statuseffectsMusket().pipe(annotate('$source', 'Musket')),
    this.data.statuseffectsPerks().pipe(annotate('$source', 'Perks')),
    this.data.statuseffectsRapier().pipe(annotate('$source', 'Rapier')),
    this.data.statuseffectsSpear().pipe(annotate('$source', 'Spear')),
    this.data.statuseffectsSword().pipe(annotate('$source', 'Sword')),
    this.data.statuseffectsVoidgauntlet().pipe(annotate('$source', 'Voidgauntlet')),
    this.data.statuseffectsWarhammer().pipe(annotate('$source', 'Warhammer')),
  ])
  public statusEffectsMap = index(() => this.statusEffects, 'StatusID')
  public statusEffect = lookup(() => this.statusEffectsMap)

  public damageTable0 = list(() => [this.data.damagetable()])

  public damageTables = list(() => [
    this.data.damagetable().pipe(annotate('$source', '_')),
    this.data.damagetableAlligator().pipe(annotate('$source', 'Alligator')),
    this.data.damagetableBoar().pipe(annotate('$source', 'Boar')),
    this.data.damagetableBroken().pipe(annotate('$source', 'Broken')),
    this.data.damagetableDamned().pipe(annotate('$source', 'Damned')),
    this.data.damagetableDamnedCommander().pipe(annotate('$source', 'DamnedCommander')),
    this.data.damagetableDamnedCommanderFtue().pipe(annotate('$source', 'DamnedCommanderFtue')),
    this.data.damagetableDungeon().pipe(annotate('$source', 'Dungeon')),
    this.data.damagetableElk().pipe(annotate('$source', 'Elk')),
    this.data.damagetableGoat().pipe(annotate('$source', 'Goat')),
    this.data.damagetablePerks().pipe(annotate('$source', 'Perks')),
    this.data.damagetableSkeleton().pipe(annotate('$source', 'Skeleton')),
    this.data.damagetableSpirit().pipe(annotate('$source', 'Spirit')),
    this.data.damagetableStructures().pipe(annotate('$source', 'Structures')),
    this.data.damagetableTendrilCorrupted().pipe(annotate('$source', 'TendrilCorrupted')),
    this.data.damagetableUndead().pipe(annotate('$source', 'Undead')),
  ])
  public damageTableMap = index(() => this.damageTables, 'DamageID')
  public damageTable = lookup(() => this.damageTableMap)

  public weapons = list(() => [this.data.itemdefinitionsWeapons()])
  public weaponsMap = index(() => this.weapons, 'WeaponID')
  public weapon = lookup(() => this.weaponsMap)

  public spellTable = list(() => [
    this.data.spelltable().pipe(annotate('$source', '_')),
    this.data.spelltableAi().pipe(annotate('$source', 'Ai')),
    this.data.spelltableBow().pipe(annotate('$source', 'Bow')),
    this.data.spelltableBlunderbuss().pipe(annotate('$source', 'Blunderbuss')),
    this.data.spelltableFiremagic().pipe(annotate('$source', 'Firemagic')),
    this.data.spelltableGlobal().pipe(annotate('$source', 'Global')),
    this.data.spelltableGreataxe().pipe(annotate('$source', 'Greataxe')),
    this.data.spelltableGreatsword().pipe(annotate('$source', 'Greatsword')),
    this.data.spelltableHatchet().pipe(annotate('$source', 'Hatchet')),
    this.data.spelltableIcemagic().pipe(annotate('$source', 'Icemagic')),
    this.data.spelltableLifemagic().pipe(annotate('$source', 'Lifemagic')),
    this.data.spelltableMusket().pipe(annotate('$source', 'Musket')),
    this.data.spelltableRapier().pipe(annotate('$source', 'Rapier')),
    this.data.spelltableSpear().pipe(annotate('$source', 'Spear')),
    this.data.spelltableSword().pipe(annotate('$source', 'Sword')),
    this.data.spelltableVoidgauntlet().pipe(annotate('$source', 'Voidgauntlet')),
    this.data.spelltableWarhammer().pipe(annotate('$source', 'Warhammer')),
  ])
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

  public damagetypes = list(() => this.data.damagetypes())
  public damagetypesMap = index(() => this.damagetypes, 'TypeID')
  public damagetype = lookup(() => this.damagetypesMap)

  public affixstats = list(() => this.data.affixstats())
  public affixstatsMap = index(() => this.affixstats, 'StatusID')
  public affixstat = lookup(() => this.affixstatsMap)

  public territories = list(() => this.data.territorydefinitions())
  public territoriesMap = index(() => this.territories, 'TerritoryID')
  public territory = lookup(() => this.territoriesMap)

  public milestoneRewards = list(() => this.data.milestonerewards())
  public mutatorDifficulties = list(() => this.data.gamemodemutatorsMutationdifficulty())
  public viewGemPerksWithAffix = list(() => queryGemPerksWithAffix(this))
  public viewMutatorDifficultiesWithRewards = list(() => queryMutatorDifficultiesWithRewards(this))

  public lootTables = list(() => [
    this.data.loottables().pipe(annotate('$source', 'Common')).pipe(map(convertLoottables)),
    this.data.loottablesOmega().pipe(annotate('$source', 'Omega')).pipe(map(convertLoottables)),
    this.data.loottablesPlaytest().pipe(annotate('$source', 'Playtest')).pipe(map(convertLoottables)),
    this.data.loottablesPvpRewardsTrack().pipe(annotate('$source', 'PvpRewardsTrack')).pipe(map(convertLoottables)),
  ])
  public lootTablesMap = index(() => this.lootTables, 'LootTableID')
  public lootTable = lookup(() => this.lootTablesMap)
  public lootGraph = defer(() =>
    combineLatest({
      tables: this.lootTablesMap,
      buckets: this.lootBucketsMap,
    })
  )
    .pipe(map(({ tables, buckets }) => createLootGraph({ tables, buckets })))
    .pipe(shareReplay(1))

  public lootBuckets = list(() => this.data.lootbuckets().pipe(map(convertLootbuckets)))
  public lootBucketsMap = indexGroup(() => this.lootBuckets, 'LootBucket')
  public lootBucket = lookup(() => this.lootBucketsMap)

  // defer(() => this.lootBuckets)
  //   .pipe(map((data) => list(() => data.map((it) => of(it.Entries)))))

  public constructor(public readonly data: NwDataService) {
    //
  }
}
