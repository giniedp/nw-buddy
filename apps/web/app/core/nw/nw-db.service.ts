import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, shareReplay, tap } from 'rxjs'
import { CaseInsensitiveMap, shareReplayRefCount } from '../utils'
import { NwDataService } from './nw-data.service'
import { queryDamageTypeToWeaponType, queryGemPerksWithAffix, queryMutatorDifficultiesWithRewards } from './nw-db-views'

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

@Injectable({ providedIn: 'root' })
export class NwDbService {
  public items = defer(() => {
    return combineLatest([
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
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public itemsMap = defer(() => this.items)
    .pipe(map((items) => toMap(items, 'ItemID')))
    .pipe(shareReplay(1))

  public abilities = defer(() => {
    return combineLatest([
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
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public abilitiesMap = defer(() => this.abilities)
    .pipe(map((items) => toMap(items, 'AbilityID')))
    .pipe(shareReplay(1))

  public statusEffects = defer(() => {
    return combineLatest([
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
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public statusEffectsMap = defer(() => this.statusEffects)
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))

  public damageTable0 = defer(() => {
    return combineLatest([this.data.damagetable()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public damageTable = defer(() => {
    return combineLatest([
      this.data.damagetable(),
      this.data.damagetableAlligator(),
      this.data.damagetableBoar(),
      this.data.damagetableBroken(),
      this.data.damagetableDamned(),
      this.data.damagetableDamnedCommander(),
      this.data.damagetableDamnedCommanderFtue(),
      this.data.damagetableDungeon(),
      this.data.damagetableElk(),
      this.data.damagetableGoat(),
      this.data.damagetablePerks(),
      this.data.damagetableSkeleton(),
      this.data.damagetableSpirit(),
      this.data.damagetableStructures(),
      this.data.damagetableTendrilCorrupted(),
      this.data.damagetableUndead(),
    ])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public damageTableMap = defer(() => this.damageTable)
    .pipe(map((items) => toMap(items, 'DamageID')))
    .pipe(shareReplay(1))

  public weapons = defer(() => {
    return combineLatest([this.data.itemdefinitionsWeapons()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public weaponsMap = defer(() => this.weapons)
    .pipe(map((items) => toMap(items, 'WeaponID')))
    .pipe(shareReplay(1))

  public spellTable = defer(() => {
    return combineLatest([
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
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public spellTableMap = defer(() => this.spellTable)
    .pipe(map((items) => toMap(items, 'SpellID')))
    .pipe(shareReplay(1))

  public perks = defer(() => {
    return combineLatest([this.data.perks()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public perksMap = defer(() => this.perks)
    .pipe(map((items) => toMap(items, 'PerkID')))
    .pipe(shareReplay(1))

  public perkBuckets = defer(() => {
    return combineLatest([this.data.perkbuckets()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public perkBucketsMap = defer(() => this.perkBuckets)
    .pipe(map((items) => toMap(items, 'PerkBucketID')))
    .pipe(shareReplay(1))

  public housingItems = defer(() => {
    return combineLatest([this.data.housingitems()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public recipes = defer(() => {
    return combineLatest([this.data.crafting()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public recipesMap = defer(() => this.recipes)
    .pipe(map((items) => toMap(items, 'RecipeID')))
    .pipe(shareReplay(1))

  public recipeCategories = defer(() => {
    return combineLatest([this.data.craftingcategories()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public recipeCategoriesMap = defer(() => this.recipeCategories)
    .pipe(map((items) => toMap(items, 'CategoryID')))
    .pipe(shareReplay(1))

  public recipesMapByItemId = defer(() => this.recipes)
    .pipe(map((items) => toMap(items, 'ItemID')))
    .pipe(shareReplay(1))

  public housingItemsMap = defer(() => this.housingItems)
    .pipe(map((items) => toMap(items, 'HouseItemID')))
    .pipe(shareReplay(1))

  public affixdefinitions = defer(() => {
    return combineLatest([this.data.affixdefinitions()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public affixdefinitionsMap = defer(() => this.affixdefinitions)
    .pipe(map((items) => toMap(items, 'AffixID')))
    .pipe(shareReplay(1))

  public affixStats = defer(() => {
    return combineLatest([this.data.affixstats()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public affixStatsMap = defer(() => this.affixStats)
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))

  public afflictions = defer(() => {
    return combineLatest([this.data.afflictions()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public afflictionsMap = defer(() => this.afflictions)
    .pipe(map((items) => toMap(items, 'AfflictionID')))
    .pipe(shareReplay(1))

  public manacosts = defer(() => {
    return combineLatest([this.data.manacostsPlayer()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public manacostsMap = defer(() => this.manacosts)
    .pipe(map((items) => toMap(items, 'ID')))
    .pipe(shareReplay(1))

  public staminacostsPlayer = defer(() => {
    return combineLatest([this.data.staminacostsPlayer()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public staminacostsPlayerMap = defer(() => this.staminacostsPlayer)
    .pipe(map((items) => toMap(items, 'CostID')))
    .pipe(shareReplay(1))

  public arenas = defer(() => {
    return combineLatest([this.data.arenasArenadefinitions()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public arenasMap = defer(() => {
    return this.arenas
  }).pipe(map((items) => toMap(items, 'TerritoryID')))

  public itemsConsumables = defer(() => {
    return combineLatest([this.data.itemdefinitionsConsumables()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public itemsConsumablesMap = defer(() => {
    return this.itemsConsumables
  })
    .pipe(map((items) => toMap(items, 'ConsumableID')))
    .pipe(shareReplay(1))
    .pipe(shareReplay(1))

  public gameEvents = defer(() => {
    return combineLatest([this.data.gameevents()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public gameEventsMap = defer(() => {
    return this.gameEvents
  })
    .pipe(map((items) => toMap(items, 'EventID')))
    .pipe(shareReplay(1))

  public categoriesProgression = defer(() => {
    return this.data.categoricalprogression()
  }).pipe(shareReplay(1))

  public categoriesProgressionMap = defer(() => {
    return this.categoriesProgression
  })
    .pipe(map((items) => toMap(items, 'CategoricalProgressionId')))
    .pipe(shareReplay(1))

  public metaAchievements = defer(() => {
    return this.data.metaachievements()
  }).pipe(shareReplay(1))

  public metaAchievementsMap = defer(() => {
    return this.metaAchievements
  })
    .pipe(map((items) => toMap(items, 'MetaAchievementId')))
    .pipe(shareReplay(1))

  public tradeskillPostcap = defer(() => {
    return this.data.tradeskillpostcap()
  }).pipe(shareReplay(1))

  public vitals = defer(() => {
    return this.data.vitals()
  }).pipe(shareReplay(1))

  public vitalsMap = defer(() => {
    return this.vitals
  })
    .pipe(map((items) => toMap(items, 'VitalsID')))
    .pipe(shareReplay(1))

  public vitalsByFamily = defer(() => {
    return this.vitals
  })
    .pipe(map((it) => dictToMap(groupBy(it, (i) => i.Family))))
    .pipe(shareReplay(1))

  public vitalsByCreatureType = defer(() => {
      return this.vitals
    })
      .pipe(map((it) => dictToMap(groupBy(it, (i) => i.CreatureType))))
      .pipe(shareReplay(1))

  public vitalsFamilies = defer(() => {
    return this.vitalsByFamily
  })
    .pipe(map((it) => Array.from(it.keys())))
    .pipe(shareReplay(1))

  public vitalsCategories = defer(() => {
    return this.data.vitalscategories()
  }).pipe(shareReplay(1))

  public vitalsCategoriesMap = defer(() => {
    return this.vitalsCategories
  })
    .pipe(map((items) => toMap(items, 'VitalsCategoryID')))
    .pipe(shareReplay(1))

  public vitalsCategoriesMapByGroup = defer(() => {
    return this.vitalsCategories
  })
    .pipe(map((it) => dictToMap(groupBy(it, (i) => i.GroupVitalsCategoryId))))
    .pipe(shareReplay(1))

  public damagetypes = defer(() => {
    return this.data.damagetypes()
  }).pipe(shareReplay(1))

  public damagetypesMap = defer(() => {
    return this.damagetypes
  })
    .pipe(map((items) => toMap(items, 'TypeID')))
    .pipe(shareReplay(1))

  public affixstats = defer(() => {
    return this.data.affixstats()
  }).pipe(shareReplay(1))

  public affixstatsMap = defer(() => {
    return this.affixstats
  })
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))

  public territories = defer(() => {
    return this.data.territorydefinitions()
  }).pipe(shareReplay(1))

  public territoriesMap = defer(() => {
    return this.territories
  })
    .pipe(map((items) => toMap(items, 'TerritoryID')))
    .pipe(shareReplay(1))

  public milestoneRewards = defer(() => {
    return this.data.milestonerewards()
  }).pipe(shareReplay(1))

  public mutatorDifficulties = defer(() => this.data.gamemodemutatorsMutationdifficulty())
    .pipe(shareReplay(1))

  public viewDamageTypeToWeaponType = defer(() => queryDamageTypeToWeaponType())
    .pipe(shareReplayRefCount(1))

  public viewGemPerksWithAffix = defer(() => queryGemPerksWithAffix(this))
    .pipe(shareReplayRefCount(1))

  public viewMutatorDifficultiesWithRewards = defer(() => queryMutatorDifficultiesWithRewards(this))
    .pipe(shareReplayRefCount(1))

  public constructor(public readonly data: NwDataService) {}
}
