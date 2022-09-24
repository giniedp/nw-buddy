import { Injectable } from '@angular/core'
import { GameEvent, Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty } from '@nw-data/types'
import { uniq } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, switchMap } from 'rxjs'
import { NwLootbucketService, NwService } from '~/core/nw'
import { getVitalDungeon } from '~/core/nw/utils'
import { DungeonPreferencesService } from '~/core/preferences'
import { shareReplayRefCount } from '~/core/utils'

export interface DifficultyWithRewards {
  difficulty: Mutationdifficulty
  rewards: Array<{
    event: GameEvent
    item: ItemDefinitionMaster
  }>
}

const MUTATION_DIFFICULTY_LOOT_TAGS = [
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

const MUTATION_LOOT_TAGS = [...MUTATION_DIFFICULTY_LOOT_TAGS, 'Restless01_Mut', 'Ebonscale00_Mut']

@Injectable({ providedIn: 'root' })
export class DungeonsService {
  public dungeon$ = defer(() => this.nw.db.data.gamemodes())
    .pipe(map((list) => list.filter((it) => it.IsDungeon).sort((a, b) => a.RequiredLevel - b.RequiredLevel)))
    .pipe(shareReplayRefCount(1))

  public difficultie$ = defer(() => this.nw.db.mutatorDifficulties).pipe(shareReplayRefCount(1))

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

  public constructor(
    public nw: NwService,
    public preferences: DungeonPreferencesService,
    private lootBuckets: NwLootbucketService
  ) {}

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

  public possibleDrops(
    dungeon: Gamemodes | Observable<Gamemodes>
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      dungeon: isObservable(dungeon) ? dungeon : of(dungeon),
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
    }).pipe(
      map(({ dungeon, items, housing }) => {
        return (dungeon.PossibleItemDropIds || []).map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)
      })
    )
  }

  public lootNormalMode(dungeon: Gamemodes): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.LootTags || []),
    }).pipe(
      switchMap(({ bossTags, lootTags }) => {
        const tags = uniq([...bossTags, ...lootTags])
        const ctx = this.lootBuckets.context({
          tags: [...tags],
          conditions: {
            MinContLevel: dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: dungeon.RequiredLevel,
          },
        })
        return this.lootBuckets
          .all()
          .filter((it) => this.lootBuckets.matchAnyTag(it, tags))
          .filter((it) => !this.lootBuckets.matchAnyTag(it, MUTATION_LOOT_TAGS))
          .filter((it) => ctx.accessLootbucket(it))
          .items()
      })
    )
  }

  public lootMutatedMode(dungeon: Gamemodes): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.MutLootTagsOverride || dungeon.LootTags),
    }).pipe(
      switchMap(({ bossTags, lootTags }) => {
        const tags = uniq([...bossTags, ...lootTags])
        const ctx = this.lootBuckets.context({
          tags: [...tags],
          conditions: {
            MinContLevel: dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: dungeon.RequiredLevel,
          },
        })
        return this.lootBuckets
          .all()
          .filter((it) => this.lootBuckets.matchAnyTag(it, tags))
          .filter((it) => !this.lootBuckets.matchAnyTag(it, MUTATION_DIFFICULTY_LOOT_TAGS))
          .filter((it) => ctx.accessLootbucket(it))
          .items()
      })
    )
  }

  public lootMutatedModeForDifficulty(
    dungeon: Gamemodes,
    mutation: Mutationdifficulty
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    if (!dungeon.IsMutable || !mutation) {
      return of([])
    }
    return combineLatest({
      bossTags: this.dungeonBossesLootTags(dungeon),
      lootTags: of(dungeon.MutLootTagsOverride || dungeon.LootTags),
    }).pipe(
      switchMap(({ bossTags, lootTags }) => {
        const tags = uniq([...bossTags, ...lootTags, ...mutation.InjectedLootTags])
        const ctx = this.lootBuckets.context({
          tags: [...tags],
          conditions: {
            MinContLevel: dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: dungeon.RequiredLevel,
          },
        })
        return this.lootBuckets
          .all()
          .filter((it) => this.lootBuckets.matchAnyTag(it, mutation.InjectedLootTags))
          .filter((it) => ctx.accessLootbucket(it))
          .items()
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

  public dungeonBosses(dungeon: Gamemodes) {
    const dungeonId = dungeon.GameModeId
    return combineLatest({
      vitals: this.nw.db.vitalsByCreatureType,
      dungeons: this.nw.db.gameModes,
    }).pipe(
      map(({ vitals, dungeons }) => {
        const miniBosses = vitals.get('DungeonMiniBoss') || []
        const bosses = vitals.get('DungeonBoss') || []
        const result = [...miniBosses, ...bosses].filter((it) => {
          return getVitalDungeon(it, dungeons)?.GameModeId === dungeonId
        })
        return result
      })
    )
  }

  public dungeonCreatures(dungeon: Gamemodes) {
    const dungeonId = dungeon.GameModeId
    return combineLatest({
      vitals: this.nw.db.vitals,
      dungeons: this.nw.db.gameModes,
    }).pipe(
      map(({ vitals, dungeons }) => {
        return vitals.filter((it) => getVitalDungeon(it, dungeons)?.GameModeId === dungeonId)
      })
    )
  }

  public dungeonBossesLootTags(dungeon: Gamemodes) {
    return this.dungeonBosses(dungeon)
      .pipe(map((it) => it.map((e) => e.LootTags).flat(1)))
      .pipe(map((it) => uniq(it)))
  }
}
