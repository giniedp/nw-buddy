import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, getVitalDungeons } from '@nw-data/common'
import { Mutationdifficulty, Vitals } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { LootContext, NwLootService } from '~/nw/loot'
import { selectStream, shareReplayRefCount } from '~/utils'

export interface GameModeDetailState {
  gameModeId: string
  mutationDifficultyId?: number
  mutationElementId?: string
  mutationPromotionId?: string
  mutationCurseId?: string
  playerLevel: number
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

const MUTATION_LOOT_TAGS = ['MutatorLoot_Fire', 'MutatorLoot_Ice', 'MutatorLoot_Nature', 'MutatorLoot_Void']

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
  private db: NwDbService = inject(NwDbService)
  private loot: NwLootService = inject(NwLootService)

  public readonly gameModeId$ = this.select(({ gameModeId }) => gameModeId)
  public readonly gameMode$ = selectStream(this.db.gameMode(this.gameModeId$))
  public readonly isMutable$ = this.select(this.gameMode$, (it) => it?.IsMutable)

  public readonly mutaDifficultyId$ = this.select(({ mutationDifficultyId }) => mutationDifficultyId)
  public readonly mutaDifficulty$ = this.select(
    this.isMutable$,
    this.db.mutatorDifficulty(this.mutaDifficultyId$),
    (isMutable, value) => (isMutable ? value : null)
  )

  public readonly mutaElementAvailable$ = this.select(this.mutaDifficulty$, (it) => !!it)
  public readonly mutaElementId$ = this.select(({ mutationElementId }) => mutationElementId)
  public readonly mutaElementOptions$ = this.select(
    combineLatest({
      available: this.mutaElementAvailable$,
      difficulty: this.mutaDifficulty$,
      values: this.db.mutatorElements,
    }),
    ({ available, difficulty, values }) => {
      if (!available) {
        return null
      }
      return values
        .filter((it) => it.ElementalDifficultyTier === difficulty?.DifficultyTier)
        .map((it) => {
          return {
            label: it.Name,
            value: it.CategoryWildcard,
            icon: it.IconPath,
            object: it,
          }
        })
    },
    {
      debounce: true,
    }
  )
  public readonly mutaElement$ = this.select(
    combineLatest({
      available: this.mutaElementAvailable$,
      options: this.mutaElementOptions$,
      ref: this.mutaElementId$,
    }),
    ({ available, options, ref }) => {
      if (!available || !options?.length) {
        return null
      }
      return options.find((it) => it.value === ref)?.object || options[0].object
    }
  )

  public readonly mutaPromotionAvailable$ = this.select(this.mutaDifficulty$, (it) => it && it.MutationDifficulty > 1)
  public readonly mutaPromotionId$ = this.select(({ mutationPromotionId }) => mutationPromotionId)
  public readonly mutaPromotion$ = this.select(
    combineLatest({
      available: this.mutaPromotionAvailable$,
      options: this.db.mutatorPromotions,
      value: this.db.mutatorPromotion(this.mutaPromotionId$),
    }),
    ({ available, options, value }) => {
      if (!available) {
        return null
      }
      if (value) {
        return value
      }
      return options[0]
    }
  )
  public readonly mutaPromotionOptions$ = this.select(
    combineLatest({
      available: this.mutaPromotionAvailable$,
      values: this.db.mutatorPromotions,
    }),
    ({ available, values }) => {
      if (!available) {
        return null
      }
      return values.map((it) => {
        return {
          label: it.Name,
          value: it.PromotionMutationId,
          icon: it.IconPath,
          object: it,
        }
      })
    }
  )

  public readonly mutationPromotionOptions$ = this.select(
    this.mutaDifficulty$,
    this.db.mutatorPromotions,
    (diff, list) => {
      if (!diff || diff.MutationDifficulty <= 1) {
        return null
      }
      return list.map((it) => {
        return {
          label: it.Name,
          value: it.PromotionMutationId,
          icon: it.IconPath,
        }
      })
    }
  )

  public readonly mutaCurseAvailable$ = this.select(this.mutaDifficulty$, (it) => it && it.MutationDifficulty > 2)
  public readonly mutaCurseId$ = this.select(({ mutationCurseId }) => mutationCurseId)
  public readonly mutaCurse$ = this.select(
    combineLatest({
      available: this.mutaCurseAvailable$,
      options: this.db.mutatorCurses,
      value: this.db.mutatorCurse(this.mutaCurseId$),
    }),
    ({ available, options, value }) => {
      if (!available) {
        return null
      }
      if (value) {
        return value
      }
      return options[0]
    }
  )
  public readonly mutaCurseOptions$ = this.select(
    combineLatest({
      available: this.mutaCurseAvailable$,
      values: this.db.mutatorCurses,
    }),
    ({ available, values }) => {
      if (!available) {
        return null
      }
      return values.map((it) => {
        return {
          label: it.Name,
          value: it.CurseMutationId,
          icon: it.IconPath,
          object: it,
        }
      })
    }
  )

  public readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)
  public readonly enemyLevelOverride$ = this.select(this.mutaDifficulty$, (diff) => (diff ? 70 : null))

  public readonly difficulties$ = this.isMutable$.pipe(
    switchMap((mutable) => (mutable ? this.db.mutatorDifficulties : of<Mutationdifficulty[]>([])))
  )

  public readonly possibleItemDropIds$ = this.select(this.gameMode$, (it) => it?.PossibleItemDropIds || [])
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
      dungeonId: this.gameModeId$,
      dungeons: this.db.gameModes,
      difficulty: this.mutaDifficulty$,
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

  public readonly dingeonCommonCreatures$ = selectStream(this.creatures$, (list) => {
    return list.filter((it) => it.CreatureType !== 'Boss' && it.CreatureType !== 'DungeonMiniBoss')
  })

  public readonly creaturesBosses$ = selectStream(
    {
      dungeonId: this.gameModeId$,
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

  public readonly creaturesNamed$ = selectStream(
    {
      dungeonId: this.gameModeId$,
      dungeons: this.db.gameModes,
      vitals: this.db.vitalsByCreatureType,
      vitalsMeta: this.db.vitalsMetadataMap,
    },
    ({ vitals, vitalsMeta, dungeons, dungeonId }): Vitals[] => {
      const result = (vitals.get('Dungeon+') || []).filter((it) => {
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
    dungeon: this.gameMode$,
    creatureTags: this.creatureLootTags$,
    tables: combineLatest([this.db.lootTable('CreatureLootMaster')]),
    playerLevel: this.playerLevel$,
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, tables, playerLevel }) => {
        const dungeonTags = dungeon.LootTags || []
        // exclude dungeon tags from other dungeons
        const tagsToExclude = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))
        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          ...creatureTags,
          ...dungeonTags,
        ]).filter((it) => !!it && !tagsToExclude.includes(it))

        const defaultPlayerLevel = dungeon.RequiredLevel || dungeon.RecommendedLevel || dungeon.ContainerLevel
        return {
          tags: [...tags],
          values: {
            MinContLevel: dungeon.ContainerLevel,
            EnemyLevel: dungeon.ContainerLevel,
            Level: (playerLevel || defaultPlayerLevel) - 1,
          },
          tables,
          tableIds: tables.map((it) => it.LootTableID),
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly lootNormalMode$ = this.lootTagsNormalMode$.pipe(
    switchMap(({ tags, values, tables }) => {
      const ctx = new LootContext({
        tags: tags,
        values: values,
      })
      // removes all the junk
      ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
      return combineLatest(tables.map((table) => this.loot.resolveLootItems(table, ctx))).pipe(map((it) => it.flat()))
    })
  )

  public readonly lootTagsMutatedMode$ = combineLatest({
    dungeon: this.gameMode$,
    creatureTags: this.creatureLootTags$,
    playerLevel: this.playerLevel$,
    lootTables: combineLatest([
      this.db.lootTable('CreatureLootMaster_MutatedContainer'),
      this.db.lootTable('CreatureLootMaster'),
    ]),
  })
    .pipe(filter((it) => !!it.dungeon))
    .pipe(
      map(({ dungeon, creatureTags, lootTables, playerLevel }) => {
        const dungeonTags = dungeon.LootTags || []
        const dungeonOverrideTags = dungeon.MutLootTagsOverride || dungeonTags
        const regionTag = DUNGEON_LOOT_TAGS.find((it) => dungeonTags.includes(it))
        const regionExcludeTags = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))
        //console.log({ dungeon })
        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          regionTag,
          ...creatureTags,
          ...dungeonOverrideTags,
          ...MUTATION_LOOT_TAGS,
        ]).filter((it) => !!it && !regionExcludeTags.includes(it))

        //console.log('container level', dungeon.ContainerLevel, dungeon.RequiredLevel, dungeon.RecommendedLevel)

        return {
          tags: [...tags],
          values: {
            MinContLevel: Math.max(70, dungeon.ContainerLevel),
            EnemyLevel: Math.max(70, dungeon.ContainerLevel),
            Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
          },
          tables: lootTables,
          tableIds: lootTables.map((it) => it.LootTableID),
        }
      })
    )

  public readonly lootMutatedMode = this.lootTagsMutatedMode$.pipe(
    switchMap(({ tags, values, tables }) => {
      const ctx = new LootContext({
        tags: tags,
        values: values,
      })
      // removes all the junk
      ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
      return combineLatest(tables.map((table) => this.loot.resolveLootItems(table, ctx))).pipe(map((it) => it.flat()))
    })
  )

  public readonly lootTagsDifficulty$ = combineLatest({
    dungeon: this.gameMode$,
    difficulty: this.mutaDifficulty$,
    creatureTags: this.creatureLootTags$,
    playerLevel: this.playerLevel$,
    lootTables: combineLatest([
      this.db.lootTable('CreatureLootMaster_MutatedContainer'),
      this.db.lootTable('CreatureLootMaster'),
    ]),
  })
    .pipe(filter((it) => !!it.dungeon && !!it.difficulty))
    .pipe(
      map(({ dungeon, difficulty, creatureTags, lootTables, playerLevel }) => {
        // console.log({ dungeon, difficulty })
        const mutationTags = [
          ...difficulty.InjectedLootTags,
          difficulty.InjectedCreatureLoot,
          difficulty.InjectedContainerLoot,
        ].filter((it) => !!it)
        const dungeonTags = dungeon.LootTags || []
        const dungeonOverrideTags = dungeon.MutLootTagsOverride || dungeonTags
        const regionTag = DUNGEON_LOOT_TAGS.find((it) => dungeonTags.includes(it))
        const regionExcludeTags = DUNGEON_LOOT_TAGS.filter((it) => !dungeonTags.includes(it))
        //console.log('container level', dungeon.ContainerLevel)
        const tags = uniq([
          // required to access global loot table
          'GlobalMod',
          regionTag,
          ...creatureTags,
          ...dungeonOverrideTags,
          ...mutationTags,
          ...MUTATION_LOOT_TAGS,
        ]).filter((it) => !!it && !regionExcludeTags.includes(it))

        return {
          tags: [...tags],
          values: {
            MinContLevel: Math.max(70, dungeon.ContainerLevel),
            EnemyLevel: Math.max(70, dungeon.ContainerLevel),
            Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
          },
          tables: lootTables,
          tableIds: lootTables.map((it) => it.LootTableID),
        }
      })
    )

  public readonly lootDifficulty$ = this.lootTagsDifficulty$.pipe(
    switchMap(({ tags, values, tables }) => {
      const ctx = new LootContext({
        tags: tags,
        values: values,
      })
      // removes all the junk
      ctx.ignoreTablesAndBuckets = ['CreatureLootCommon', 'GlobalNamedList']
      ctx.bucketTags = [...MUTATION_DIFFICULTY_LOOT_TAGS]
      return combineLatest(tables.map((table) => this.loot.resolveLootItems(table, ctx))).pipe(map((it) => it.flat()))
    })
  )

  public constructor() {
    super({
      playerLevel: null,
      gameModeId: null,
    })
  }
}
