import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, getVitalDungeons } from '@nw-data/common'
import { Gamemodes, Mutationdifficulty, Vitals } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { LootContext, NwLootService } from '~/nw/loot'
import { selectStream, shareReplayRefCount } from '~/utils'

export interface GameModeDetailState {
  playerLevel: number
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
  'EXPFirstLight01',
]

@Injectable()
export class GameModeDetailStore extends ComponentStore<GameModeDetailState> {
  public readonly dungeon$ = this.select(({ dungeon }) => dungeon).pipe(filter((it) => !!it))
  public readonly dungeonId$ = this.select(({ dungeon }) => dungeon?.GameModeId)
  public readonly difficulty$ = this.select(({ difficulty }) => difficulty)
  public readonly playerLevel$ = this.select(({ dungeon, playerLevel }) => playerLevel)

  public readonly isMutable$ = this.select(this.dungeon$, (it) => it?.IsMutable)
  public readonly difficulties$ = this.dungeon$.pipe(
    switchMap((it) => {
      return it?.IsMutable ? this.db.mutatorDifficulties : of<Mutationdifficulty[]>([])
    })
  )
  public readonly possibleItemDropIds$ = this.select(this.dungeon$, (it) => it?.PossibleItemDropIds || [])
  public readonly possibleItemDrops$ = selectStream(
    {
      ids: this.possibleItemDropIds$,
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
    },
    ({ ids, items, housing }) => ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it),
    {
      debounce: true,
    }
  )

  public readonly creatures$ = selectStream(
    {
      dungeonId: this.dungeonId$,
      dungeons: this.db.gameModes,
      difficulty: this.difficulty$,
      vitals: this.db.vitals,
      vitalsMeta: this.db.vitalsMetadataMap,
    },
    ({ vitals, vitalsMeta, dungeons, dungeonId, difficulty }): Vitals[] => {
      const result = vitals.filter((it) => {
        if (
          difficulty != null &&
          dungeonId === 'DungeonShatteredObelisk' &&
          it.VitalsID === 'Withered_Brute_Named_08'
        ) {
          return true
        }
        return getVitalDungeons(it, dungeons, vitalsMeta).some((dg) => dg.GameModeId === dungeonId)
      })
      return result
    },
    {
      debounce: true,
    }
  )

  public readonly bosses$ = selectStream(
    {
      dungeonId: this.dungeonId$,
      dungeons: this.db.gameModes,
      vitals: this.db.vitalsByCreatureType,
      vitalsMeta: this.db.vitalsMetadataMap,
    },
    ({ vitals, vitalsMeta, dungeons, dungeonId }): Vitals[] => {
      const miniBosses = vitals.get('DungeonMiniBoss') || []
      const bosses = vitals.get('DungeonBoss') || []
      const result = [...miniBosses, ...bosses].filter((it) => {
        return getVitalDungeons(it, dungeons, vitalsMeta).some((dg) => dg.GameModeId === dungeonId)
      })
      return result
    },
    {
      debounce: true,
    }
  )

  public readonly creatureLootTags$ = selectStream(this.creatures$, (list) => {
    return uniq(list.map((e) => e.LootTags || []).flat(1)).filter((it) => !!it)
  })

  public readonly lootTagsNormalMode$ = combineLatest({
    dungeon: this.dungeon$,
    creatureTags: this.creatureLootTags$,
    lootTable: this.db.lootTable('CreatureLootMaster'),
    playerLevel: this.playerLevel$,
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, lootTable, playerLevel }) => {
        const dungeonTags = dungeon.LootTags || []
        // exclude dungeon tags from other dungeons
        const tagsToExclude = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))
        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          ...creatureTags,
          ...dungeonTags,
        ]).filter((it) => !!it && !tagsToExclude.includes(it))

        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.ContainerLevel - 1,
            EnemyLevel: dungeon.ContainerLevel - 1,
            Level: (playerLevel || dungeon.ContainerLevel) - 1,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID,
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
    playerLevel: this.playerLevel$,
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, lootTable, playerLevel }) => {
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

        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.ContainerLevel - 1,
            EnemyLevel: dungeon.ContainerLevel - 1,
            Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID,
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
    playerLevel: this.playerLevel$,
  })
    .pipe(filter((it) => !!it.dungeon && !!it.difficulty))
    .pipe(
      map(({ dungeon, difficulty, creatureTags, lootTable, playerLevel }) => {
        const mutationTags = [...difficulty.InjectedLootTags, ...difficulty.InjectedCreatureLoot]
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

        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.ContainerLevel - 1,
            EnemyLevel: dungeon.ContainerLevel - 1,
            Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
          },
          table: lootTable,
          tableId: lootTable?.LootTableID,
        }
      })
    )

  public readonly lootDifficulty$ = this.lootTagsDifficulty$.pipe(
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
      playerLevel: null,
      dungeon: null,
      difficulty: null,
    })
  }

  public update = this.updater((state: GameModeDetailState, update: Partial<GameModeDetailState>) => {
    return {
      ...state,
      ...update,
    }
  })
}
