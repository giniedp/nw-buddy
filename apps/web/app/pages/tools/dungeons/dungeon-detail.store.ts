import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Gamemodes, Mutationdifficulty, Vitals } from '@nw-data/types'
import { uniq } from 'lodash'
import { combineLatest, filter, map, of, shareReplay, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { LootContext, NwLootService } from '~/nw/loot'
import { getVitalDungeon } from '~/nw/utils'
import { NW_MAX_CHARACTER_LEVEL } from '~/nw/utils/constants'
import { mapProp, shareReplayRefCount, tapDebug } from '~/utils'

export interface DungeonDetailState {
  dungeon: Gamemodes
  difficulty: Mutationdifficulty
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

// const MUTATION_LOOT_TAGS = [...MUTATION_DIFFICULTY_LOOT_TAGS, 'Restless01_Mut', 'Ebonscale00_Mut']

const DUNGEON_LOOT_TAGS = [
  'Amrine',
  'Edengrove00',
  'ShatteredObelisk',
  'RestlessShores01',
  'Reekwater00',
  'Ebonscale00',
  'ShatterMtn00',
  'CutlassKeys00',
  'BrimstoneSands00',
]

@Injectable()
export class DungeonDetailStore extends ComponentStore<DungeonDetailState> {
  public readonly dungeon$ = this.select(({ dungeon }) => dungeon).pipe(filter((it) => !!it))
  public readonly dungeonId$ = this.select(({ dungeon }) => dungeon?.GameModeId)
  public readonly difficulty$ = this.select(({ difficulty }) => difficulty)

  public readonly isMutable$ = this.dungeon$.pipe(mapProp('IsMutable'))
  public readonly difficulties$ = this.dungeon$.pipe(
    switchMap((it) => {
      return it?.IsMutable ? this.db.mutatorDifficulties : of<Mutationdifficulty[]>([])
    })
  )
  public readonly possibleItemDropIds$ = this.select(({ dungeon }) => dungeon?.PossibleItemDropIds).pipe(
    map((it) => it || [])
  )
  public readonly possibleItemDrops$ = combineLatest({
    ids: this.possibleItemDropIds$,
    items: this.db.itemsMap,
    housing: this.db.housingItemsMap,
  }).pipe(map(({ ids, items, housing }) => ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)))

  public readonly creatures$ = combineLatest({
    dungeonId: this.dungeonId$,
    dungeons: this.db.gameModes,
    vitals: this.db.vitals,
  })
    .pipe(
      map(({ vitals, dungeons, dungeonId }): Vitals[] => {
        const result = vitals.filter((it) => {
          return getVitalDungeon(it, dungeons)?.GameModeId === dungeonId
        })
        return result
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly bosses$ = combineLatest({
    dungeonId: this.dungeonId$,
    dungeons: this.db.gameModes,
    vitals: this.db.vitalsByCreatureType,
  })
    .pipe(
      map(({ vitals, dungeons, dungeonId }): Vitals[] => {
        const miniBosses = vitals.get('DungeonMiniBoss') || []
        const bosses = vitals.get('DungeonBoss') || []
        const result = [...miniBosses, ...bosses].filter((it) => {
          return getVitalDungeon(it, dungeons)?.GameModeId === dungeonId
        })
        return result
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly creatureLootTableIds$ = this.creatures$
    .pipe(map((it) => it.map((e) => e.LootTableId).flat(1)))
    .pipe(map((it) => uniq(it).filter((it) => !!it)))
    .pipe(shareReplayRefCount(1))

  public readonly creatureLootTables$ = combineLatest({
    ids: this.creatureLootTableIds$,
    tables: this.db.lootTablesMap,
  })
    .pipe(map(({ ids, tables }) => ids.map((id) => tables.get(id))))
    .pipe(shareReplayRefCount(1))

  public readonly creatureLootTags$ = this.creatures$
    .pipe(map((it) => it.map((e) => e.LootTags || []).flat(1)))
    .pipe(map((it) => uniq(it).filter((it) => !!it)))
    .pipe(shareReplayRefCount(1))

  public readonly bossesLootTableIds$ = this.creatures$
    .pipe(map((it) => it.map((e) => e.LootTableId).flat(1)))
    .pipe(map((it) => uniq(it).filter((it) => !!it)))
    .pipe(shareReplayRefCount(1))

  public readonly bossesLootTables$ = combineLatest({
    ids: this.creatureLootTableIds$,
    tables: this.db.lootTablesMap,
  })
    .pipe(map(({ ids, tables }) => ids.map((id) => tables.get(id))))
    .pipe(shareReplayRefCount(1))

  public readonly bossesLootTags$ = this.creatures$
    .pipe(map((it) => it.map((e) => e.LootTags || []).flat(1)))
    .pipe(map((it) => uniq(it).filter((it) => !!it)))
    .pipe(shareReplayRefCount(1))

  public readonly lootTagsNormalMode$ = combineLatest({
    dungeon: this.dungeon$,
    creatureTags: this.creatureLootTags$,
    lootTable: this.db.lootTable('CreatureLootMaster'),
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, lootTable }) => {
        const dungeonTags = dungeon.LootTags || []
        // exclude dungeon tags from other dungeons
        const tagsToExclude = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))
        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          ...creatureTags,
          ...dungeonTags,
        ]).filter((it) => !!it && !tagsToExclude.includes(it))

        // console.log({
        //   bossTags,
        //   creatureTags,
        //   lootTags,
        //   tagsToExclude,
        //   tags
        // })
        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: NW_MAX_CHARACTER_LEVEL,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly lootNormalMode$ = this.lootTagsNormalMode$.pipe(
    switchMap(({ tags, values, table }) => {
      const ctx = new LootContext({
        tags: tags,
        values: values,
      })
      // removes all the junk
      ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
      return this.loot.resolveLootItems(table, ctx)
    })
  )

  public readonly lootTagsMutatedMode$ = combineLatest({
    dungeon: this.dungeon$,
    creatureTags: this.creatureLootTags$,
    lootTable: this.db.lootTable('CreatureLootMaster_MutatedContainer'),
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, lootTable }) => {
        const dungeonTags = dungeon.LootTags || []
        const dungeonOverrideTags = dungeon.MutLootTagsOverride || dungeonTags
        const regionTag = DUNGEON_LOOT_TAGS.find((it) => dungeonTags.includes(it))
        const regionExcludeTags = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))

        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          regionTag,
          ...creatureTags,
          ...dungeonOverrideTags,
        ]).filter((it) => !!it && !regionExcludeTags.includes(it))

        // console.log({
        //   dungeon,
        //   dungeonTags,
        //   dungeonOverrideTags,
        //   regionTag,
        //   regionExcludeTags,
        //   tags
        // })
        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.MutMinContLvllLootTagIdOverride || dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: NW_MAX_CHARACTER_LEVEL,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID
        }
      })
    )

  public readonly lootMutatedMode = this.lootTagsMutatedMode$.pipe(
    switchMap(({ tags, values, table }) => {
      const ctx = new LootContext({
        tags: tags,
        values: values,
      })
      // removes all the junk
      ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
      return this.loot.resolveLootItems(table, ctx)
    })
  )

  public readonly lootTagsDifficulty$ = combineLatest({
    dungeon: this.dungeon$,
    difficulty: this.difficulty$,
    creatureTags: this.creatureLootTags$,
    lootTable: this.db.lootTable('CreatureLootMaster_MutatedContainer'),
  })
    .pipe(filter((it) => !!it.dungeon && !!it.difficulty))
    .pipe(
      map(({ dungeon, difficulty, creatureTags, lootTable }) => {
        const mutationTags = difficulty.InjectedLootTags
        const dungeonTags = dungeon.LootTags || []
        const dungeonOverrideTags = dungeon.MutLootTagsOverride || dungeonTags
        const regionTag = DUNGEON_LOOT_TAGS.find((it) => dungeonTags.includes(it))
        const regionExcludeTags = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))

        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          regionTag,
          ...creatureTags,
          ...dungeonOverrideTags,
          ...mutationTags,
        ]).filter((it) => !!it && !regionExcludeTags.includes(it))

        // console.log({
        //   dungeon,
        //   dungeonTags,
        //   dungeonOverrideTags,
        //   regionTag,
        //   regionExcludeTags,
        //   mutationTags,
        //   tags
        // })
        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.MutMinContLvllLootTagIdOverride || dungeon.ContainerLevel,
            EnemyLevel: dungeon.RequiredLevel,
            Level: NW_MAX_CHARACTER_LEVEL,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID
        }
      })
    )

  public readonly lootDifficulty$ = this.lootTagsDifficulty$
    .pipe(
      switchMap(({ tags, values, table }) => {
        const ctx = new LootContext({
          tags: tags,
          values: values,
        })
        // removes all the junk
        ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
        ctx.bucketTags = MUTATION_DIFFICULTY_LOOT_TAGS
        return this.loot.resolveLootItems(table, ctx)
      })
    )

  public constructor(private db: NwDbService, private loot: NwLootService) {
    super({
      dungeon: null,
      difficulty: null,
    })
  }

  public update = this.updater((state: DungeonDetailState, update: Partial<DungeonDetailState>) => {
    return {
      ...state,
      ...update,
    }
  })
}
