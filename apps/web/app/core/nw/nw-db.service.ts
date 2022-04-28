import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, shareReplay, tap } from 'rxjs'
import { CaseInsensitiveMap } from '../utils'
import { NwDataService } from './nw-data.service'

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
      this.data.datatablesItemdefinitionsMasterCommon().pipe(annotate('$source', 'common')),
      this.data.datatablesItemdefinitionsMasterCrafting().pipe(annotate('$source', 'crafting')),
      this.data.datatablesItemdefinitionsMasterLoot().pipe(annotate('$source', 'loot')),
      this.data.datatablesItemdefinitionsMasterNamed().pipe(annotate('$source', 'named')),
      this.data.datatablesItemdefinitionsMasterFaction().pipe(annotate('$source', 'faction')),
      this.data.datatablesItemdefinitionsMasterOmega().pipe(annotate('$source', 'omega')),
      this.data.datatablesItemdefinitionsMasterPlaytest().pipe(annotate('$source', 'playtest')),
      this.data.datatablesItemdefinitionsMasterPvp().pipe(annotate('$source', 'pvp')),
      this.data.datatablesItemdefinitionsMasterQuest().pipe(annotate('$source', 'quest')),
      this.data.datatablesItemdefinitionsMasterStore().pipe(annotate('$source', 'store')),
      this.data.datatablesItemdefinitionsMasterAi().pipe(annotate('$source', 'ai')),
    ])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public itemsMap = defer(() => this.items)
    .pipe(map((items) => toMap(items, 'ItemID')))
    .pipe(shareReplay(1))

  public abilities = defer(() => {
    return combineLatest([
      this.data.datatablesWeaponabilitiesAbilityAi().pipe(annotate('$source', 'ai')),
      this.data.datatablesWeaponabilitiesAbilityAttributethreshold().pipe(annotate('$source', 'attributethreshold')),
      this.data.datatablesWeaponabilitiesAbilityBlunderbuss().pipe(annotate('$source', 'blunderbuss')),
      this.data.datatablesWeaponabilitiesAbilityBow().pipe(annotate('$source', 'bow')),
      this.data.datatablesWeaponabilitiesAbilityFiremagic().pipe(annotate('$source', 'firemagic')),
      this.data.datatablesWeaponabilitiesAbilityGlobal().pipe(annotate('$source', 'global')),
      this.data.datatablesWeaponabilitiesAbilityGreataxe().pipe(annotate('$source', 'greataxe')),
      this.data.datatablesWeaponabilitiesAbilityHatchet().pipe(annotate('$source', 'hatchet')),
      this.data.datatablesWeaponabilitiesAbilityIcemagic().pipe(annotate('$source', 'icemagic')),
      this.data.datatablesWeaponabilitiesAbilityLifemagic().pipe(annotate('$source', 'lifemagic')),
      this.data.datatablesWeaponabilitiesAbilityMusket().pipe(annotate('$source', 'musket')),
      this.data.datatablesWeaponabilitiesAbilityRapier().pipe(annotate('$source', 'rapier')),
      this.data.datatablesWeaponabilitiesAbilitySpear().pipe(annotate('$source', 'spear')),
      this.data.datatablesWeaponabilitiesAbilitySword().pipe(annotate('$source', 'sword')),
      this.data.datatablesWeaponabilitiesAbilityWarhammer().pipe(annotate('$source', 'warhammer')),
    ])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public abilitiesMap = defer(() => this.abilities)
    .pipe(map((items) => toMap(items, 'AbilityID')))
    .pipe(shareReplay(1))

  public statusEffects = defer(() => {
    return combineLatest([
      this.data.datatablesStatuseffects().pipe(annotate('$source', '_')),
      this.data.datatablesStatuseffectsAi().pipe(annotate('$source', 'api')),
      this.data.datatablesStatuseffectsBow().pipe(annotate('$source', 'bow')),
      this.data.datatablesStatuseffectsBlunderbuss().pipe(annotate('$source', 'blunderbuss')),
      this.data.datatablesStatuseffectsCommon().pipe(annotate('$source', 'common')),
      this.data.datatablesStatuseffectsFirestaff().pipe(annotate('$source', 'firestaff')),
      this.data.datatablesStatuseffectsGreataxe().pipe(annotate('$source', 'greataxe')),
      this.data.datatablesStatuseffectsGreatsword().pipe(annotate('$source', 'greatsword')),
      this.data.datatablesStatuseffectsHatchet().pipe(annotate('$source', 'hatchet')),
      this.data.datatablesStatuseffectsIcemagic().pipe(annotate('$source', 'icemagic')),
      this.data.datatablesStatuseffectsItem().pipe(annotate('$source', 'item')),
      this.data.datatablesStatuseffectsLifestaff().pipe(annotate('$source', 'lifestaff')),
      this.data.datatablesStatuseffectsMusket().pipe(annotate('$source', 'musket')),
      this.data.datatablesStatuseffectsPerks().pipe(annotate('$source', 'perks')),
      this.data.datatablesStatuseffectsRapier().pipe(annotate('$source', 'rapier')),
      this.data.datatablesStatuseffectsSpear().pipe(annotate('$source', 'spear')),
      this.data.datatablesStatuseffectsSword().pipe(annotate('$source', 'sword')),
      this.data.datatablesStatuseffectsVoidgauntlet().pipe(annotate('$source', 'voidgauntlet')),
      this.data.datatablesStatuseffectsWarhammer().pipe(annotate('$source', 'warhammer')),
    ])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public statusEffectsMap = defer(() => this.statusEffects)
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))

    public damageTable0 = defer(() => {
      return combineLatest([
        this.data.datatablesDamagetable(),
      ])
    })
      .pipe(map((it) => it.flat(1)))
      .pipe(shareReplay(1))

  public damageTable = defer(() => {
    return combineLatest([
      this.data.datatablesDamagetable(),
      this.data.datatablesDamagetableAlligator(),
      this.data.datatablesDamagetableBoar(),
      this.data.datatablesDamagetableBroken(),
      this.data.datatablesDamagetableDamned(),
      this.data.datatablesDamagetableDamnedCommander(),
      this.data.datatablesDamagetableDamnedCommanderFtue(),
      this.data.datatablesDamagetableDungeon(),
      this.data.datatablesDamagetableElk(),
      this.data.datatablesDamagetableGoat(),
      this.data.datatablesDamagetablePerks(),
      this.data.datatablesDamagetableSkeleton(),
      this.data.datatablesDamagetableSpirit(),
      this.data.datatablesDamagetableStructures(),
      this.data.datatablesDamagetableTendrilCorrupted(),
      this.data.datatablesDamagetableUndead(),
    ])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public damageTableMap = defer(() => this.damageTable)
    .pipe(map((items) => toMap(items, 'DamageID')))
    .pipe(shareReplay(1))

  public weapons = defer(() => {
    return combineLatest([this.data.datatablesItemdefinitionsWeapons()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public weaponsMap = defer(() => this.weapons)
    .pipe(map((items) => toMap(items, 'WeaponID')))
    .pipe(shareReplay(1))

  public perks = defer(() => {
    return combineLatest([this.data.datatablesPerks()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public perksMap = defer(() => this.perks)
    .pipe(map((items) => toMap(items, 'PerkID')))
    .pipe(shareReplay(1))

  public perkBuckets = defer(() => {
    return combineLatest([this.data.datatablesPerkbuckets()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public perkBucketsMap = defer(() => this.perkBuckets)
    .pipe(map((items) => toMap(items, 'PerkBucketID')))
    .pipe(shareReplay(1))

  public housingItems = defer(() => {
    return combineLatest([this.data.datatablesHousingitems()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public recipes = defer(() => {
    return combineLatest([this.data.datatablesCrafting()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public recipesMap = defer(() => this.recipes)
    .pipe(map((items) => toMap(items, 'RecipeID')))
    .pipe(shareReplay(1))

  public recipeCategories = defer(() => {
    return combineLatest([this.data.datatablesCraftingcategories()])
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
    return combineLatest([this.data.datatablesAffixdefinitions()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public affixdefinitionsMap = defer(() => this.affixdefinitions)
    .pipe(map((items) => toMap(items, 'AffixID')))
    .pipe(shareReplay(1))

  public affixStats = defer(() => {
    return combineLatest([this.data.datatablesAffixstats()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public affixStatsMap = defer(() => this.affixStats)
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))

  public arenas = defer(() => {
    return combineLatest([this.data.datatablesArenasArenadefinitions()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public arenasMap = defer(() => {
    return this.arenas
  })
    .pipe(map((items) => toMap(items, 'TerritoryID')))
    .pipe(shareReplay(1))

  public itemsConsumables = defer(() => {
    return combineLatest([this.data.datatablesItemdefinitionsConsumables()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public itemsConsumablesMap = defer(() => {
    return this.itemsConsumables
  })
    .pipe(map((items) => toMap(items, 'ConsumableID')))
    .pipe(shareReplay(1))

  public gameEvents = defer(() => {
    return combineLatest([this.data.datatablesGameevents()])
  })
    .pipe(map((it) => it.flat(1)))
    .pipe(shareReplay(1))

  public gameEventsMap = defer(() => {
    return this.gameEvents
  })
    .pipe(map((items) => toMap(items, 'EventID')))
    .pipe(shareReplay(1))

  public categoriesProgression = defer(() => {
    return this.data.datatablesCategoricalprogression()
  }).pipe(shareReplay(1))

  public categoriesProgressionMap = defer(() => {
    return this.categoriesProgression
  })
    .pipe(map((items) => toMap(items, 'CategoricalProgressionId')))
    .pipe(shareReplay(1))

  public metaAchievements = defer(() => {
    return this.data.datatablesMetaachievements()
  }).pipe(shareReplay(1))

  public metaAchievementsMap = defer(() => {
    return this.metaAchievements
  })
    .pipe(map((items) => toMap(items, 'MetaAchievementId')))
    .pipe(shareReplay(1))

  public tradeskillPostcap = defer(() => {
    return this.data.datatablesTradeskillpostcap()
  })
    .pipe(shareReplay(1))

  public vitals = defer(() => {
    return this.data.datatablesVitals()
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

  public vitalsFamilies = defer(() => {
    return this.vitalsByFamily
  })
    .pipe(map((it) => Array.from(it.keys())))
    .pipe(shareReplay(1))


  public damagetypes = defer(() => {
    return this.data.datatablesDamagetypes()
  }).pipe(shareReplay(1))

  public damagetypesMap = defer(() => {
    return this.damagetypes
  })
    .pipe(map((items) => toMap(items, 'TypeID')))
    .pipe(shareReplay(1))

  public affixstats = defer(() => {
    return this.data.datatablesAffixstats()
  }).pipe(shareReplay(1))

  public affixstatsMap = defer(() => {
    return this.affixstats
  })
    .pipe(map((items) => toMap(items, 'StatusID')))
    .pipe(shareReplay(1))
  public constructor(public readonly data: NwDataService) {}
}
