import { Injectable } from '@angular/core'
import { GameEvent, Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty } from '@nw-data/types'
import { ValueService } from 'ag-grid-community'
import { uniq } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, switchMap, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { shareReplayRefCount } from '~/core/utils'

export interface DifficultyWithRewards {
  difficulty: Mutationdifficulty
  rewards: Array<{
    event: GameEvent
    item: ItemDefinitionMaster
  }>
}

// const MAP_DUNGEON_TO_VITALS_GROUP: Record<string, string[]> = {
//   DungeonAmrine: ['Star_Excavation'],
//   DungeonEdengrove00: ['Genesis'],
//   DungeonShatteredObelisk: ['Starstone'],
//   DungeonRestlessShores01: ['Skerryshiv'],
//   DungeonReekwater00: ['Lazarus_Well'],
//   DungeonEbonscale00: ['Shipyard'],
//   DungeonShatterMtn00: ['IsabellaLair', 'IsabellaPhase1', 'IsabellaPhase2'],
// }

// const MAP_DUNGEON_TO_VITALS_LOOT_TAGS: Record<string, string[]> = {
//   DungeonAmrine: ['Amrine'],
//   DungeonEdengrove00: ['Edengrove00'],
//   DungeonShatteredObelisk: ['ShatteredObelisk'],
//   DungeonRestlessShores01: ['RestlessShores01'],
//   DungeonReekwater00: ['Reekwater00'],
//   DungeonEbonscale00: ['Ebonscale00'],
//   DungeonShatterMtn00: ['ShatterMtn00']
// }

const MUTATION_LOOT_TAGS = [
  'MutDiff',
  'MutDiff1',
  'MutDiff2',
  'MutDiff3',
  'MutDiff4',
  'MutDiff5',
  'MutDiff6',
  'MutDiff7',
  'MutDiff8',
  'MutDiff9',
  'MutDiff10',
]

@Injectable({ providedIn: 'root' })
export class DungeonsService {
  public dungeon$ = defer(() => this.nw.db.data.gamemodes())
    .pipe(map((list) => list.filter((it) => it.IsDungeon).sort((a, b) => a.RequiredLevel - b.RequiredLevel)))
    .pipe(shareReplayRefCount(1))

  public difficultie$ = defer(() => this.nw.db.data.gamemodemutatorsMutationdifficulty()).pipe(shareReplayRefCount(1))

  public difficultieWithRewards$ = defer(() => {
    return combineLatest({
      difficulty: this.difficultie$,
      events: this.nw.db.gameEventsMap,
      items: this.nw.db.itemsMap,
    })
  })
    .pipe(map(({ difficulty, events, items }) => this.buildDifficultyTable(difficulty, events, items)))
    .pipe(shareReplayRefCount(1))

  public mutation$ = defer(() => this.nw.db.data.gamemodemutatorsElementalmutations()).pipe(shareReplayRefCount(1))

  public constructor(public nw: NwService) {}

  private buildDifficultyTable(
    difficulty: Mutationdifficulty[],
    events: Map<string, GameEvent>,
    items: Map<string, ItemDefinitionMaster>
  ): Array<DifficultyWithRewards> {
    return difficulty.map<DifficultyWithRewards>((it) => {
      const cEvents = [
        events.get(it.CompletionEvent1),
        events.get(it.CompletionEvent2),
        events.get(it.CompletionEvent3),
      ]
      return {
        difficulty: it,
        rewards: cEvents.map((event) => ({
          event: event,
          item: items.get(event?.ItemReward),
        })),
      }
    })
  }

  public dungeonPossibleDrops(
    dungeon: Gamemodes | Observable<Gamemodes>
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      dungeon: isObservable(dungeon) ? dungeon : of(dungeon),
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
    }).pipe(
      map(({ dungeon, items, housing }) => {
        return dungeon.PossibleItemDropIds.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)
      })
    )
  }

  public dungeonLoot(dungeon: Gamemodes): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.LootTags),
    })
      .pipe(map(({ bossTags, lootTags }) => uniq([...bossTags, ...lootTags])))
      .pipe(
        switchMap((tags) => {
          return this.nw.lootbuckets.all().filter(tags).exclude(MUTATION_LOOT_TAGS).items()
        })
      )
  }

  public dungeonMutatedLoot(dungeon: Gamemodes): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.MutLootTagsOverride || dungeon.LootTags),
    })
      .pipe(map(({ bossTags, lootTags }) => uniq([...bossTags, ...lootTags])))
      .pipe(
        switchMap((tags) => {
          return this.nw.lootbuckets.all().filter(tags).exclude(MUTATION_LOOT_TAGS).items()
        })
      )
  }

  public dungeonMutationLoot(
    dungeon: Gamemodes,
    mutation: Mutationdifficulty
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    if (!dungeon.IsMutable) {
      return of([])
    }
    // return this.dungeonMutatedLoot(dungeon)
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.MutLootTagsOverride || dungeon.LootTags),
    })
      .pipe(
        map(({ bossTags, lootTags }) => {
          return uniq([...bossTags, ...lootTags])
        })
      )
      .pipe(tap(console.log))
      .pipe(
        switchMap((tags) => {
          return this.nw.lootbuckets.all().filter(tags).filter(mutation.InjectedLootTags).items()
        })
      )
  }

  public dungeon(id: string): Observable<Gamemodes> {
    return this.dungeon$.pipe(map((list) => list.find((it) => it.GameModeId === id)))
  }

  public dungeonDifficulties(dungeon: Gamemodes): Observable<Mutationdifficulty[]> {
    return dungeon.IsMutable ? this.difficultie$ : of([])
  }

  public dungeonDifficulty(difficulties: Mutationdifficulty[], level: number | Observable<number>) {
    return difficulties.find((it) => it.MutationDifficulty === Number(level))
  }

  // public dungeonCreatureGroup(dungeon: Gamemodes): string[] {
  //   return MAP_DUNGEON_TO_VITALS_GROUP[dungeon.GameModeId]
  // }

  // public dungeonCreaturesCategories(dungeon: Gamemodes) {
  //   const groups = this.dungeonCreatureGroup(dungeon) || []
  //   return this.nw.db.vitalsCategoriesMapByGroup
  //     .pipe(
  //       map((vitals) => {
  //         return (
  //           groups
  //             .map((it) => vitals.get(it))
  //             .filter((it) => !!it)
  //             .flat(1)
  //             .map((it) => it.VitalsCategoryID) || []
  //         )
  //       })
  //     )
  //     .pipe(map(uniq))
  // }

  public dungeonBosses(dungeon: Gamemodes) {
    const include = [dungeon.GameModeId.replace(/^Dungeon/, '')]
    return combineLatest({
      // categories: this.dungeonCreaturesCategories(dungeon),
      vitals: this.nw.db.vitalsByCreatureType,
    }).pipe(
      map(({ vitals }) => {
        const bosses = vitals.get('DungeonBoss')
        const result = bosses.filter((it) => {
          return (it.LootTags || []).some((i) => include.includes(i))
        })
        // console.log({
        //   include,
        //   bosses,
        //   result
        // })
        return result
      })
    )
  }

  public dungeonCreatures(dungeon: Gamemodes) {
    const include = [dungeon.GameModeId.replace(/^Dungeon/, '')]
    return combineLatest({
      vitals: this.nw.db.vitals,
    }).pipe(
      map(({ vitals }) => {
        return vitals.filter((it) => {
          return (it.LootTags || []).some((i) => include.includes(i))
        })
      })
    )
  }

  public dungeonBossesLootTags(dungeon: Gamemodes) {
    return this.dungeonBosses(dungeon)
      .pipe(map((it) => it.map((e) => e.LootTags).flat(1)))
      .pipe(map((it) => Array.from(new Set(it))))
  }
}
