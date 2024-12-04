import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_ENEMY_LEVEL, getVitalDungeons } from '@nw-data/common'
import { CreatureType, MutationDifficultyStaticData, VitalsBaseData as VitalsData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { LootContext, NwLootService } from '~/nw/loot'
import { eqCaseInsensitive, selectStream, shareReplayRefCount } from '~/utils'

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
  'BrimstoneSands00',
  'CutlassKeys00',
  'Ebonscale00',
  'Edengrove00',
  'EXPFirstLight01',
  'GreatCleave00',
  'GreatCleave01',
  'Reekwater00',
  'RestlessShores01',
  'ShatteredObelisk',
  'ShatterMtn00',
]

const TAB_NAMED_CREATURES: Array<CreatureType> = ['Dungeon+', 'Elite+']
const TAB_BOSSES_CREATURES: Array<CreatureType> = [
  'DungeonMiniBoss',
  'DungeonBoss',
  'EliteMiniBoss',
  'EliteBoss',
  'Boss',
  'Raid10Boss',
  'Raid20Boss',
  'SoloBoss',
]

@Injectable()
export class GameModeDetailStore extends ComponentStore<GameModeDetailState> {
  private db = injectNwData()
  private loot: NwLootService = inject(NwLootService)

  public readonly gameModeId$ = this.select(({ gameModeId }) => gameModeId)
  public readonly gameMode$ = selectStream(this.gameModeId$.pipe(switchMap((id) => this.db.gameModesById(id))))
  public readonly isMutable$ = this.select(this.gameMode$, (it) => it?.IsMutable)

  public readonly mutaDifficultyId$ = this.select(({ mutationDifficultyId }) => mutationDifficultyId)
  public readonly mutaDifficulty$ = selectStream(
    {
      isMutable: this.isMutable$,
      value: this.mutaDifficultyId$.pipe(switchMap((id) => this.db.mutatorDifficultiesById(id))),
    },
    ({ isMutable, value }) => (isMutable ? value : null),
  )

  public readonly mutaElementAvailable$ = this.select(this.mutaDifficulty$, (it) => !!it)
  public readonly mutaElementId$ = this.select(({ mutationElementId }) => mutationElementId)
  public readonly mutaElementOptions$ = selectStream(
    {
      available: this.mutaElementAvailable$,
      difficulty: this.mutaDifficulty$,
      values: this.db.mutatorElementsAll(),
    },
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
    { debounce: true },
  )
  public readonly mutaElement$ = selectStream(
    {
      available: this.mutaElementAvailable$,
      options: this.mutaElementOptions$,
      ref: this.mutaElementId$,
    },
    ({ available, options, ref }) => {
      if (!available || !options?.length) {
        return null
      }
      return options.find((it) => it.value === ref)?.object || options[0].object
    },
    { debounce: true },
  )

  public readonly mutaPromotionAvailable$ = this.select(this.mutaDifficulty$, (it) => it && it.MutationDifficulty > 1)
  public readonly mutaPromotionId$ = this.select(({ mutationPromotionId }) => mutationPromotionId)
  public readonly mutaPromotion$ = selectStream(
    {
      available: this.mutaPromotionAvailable$,
      options: this.db.mutatorPromotionsAll(),
      value: this.mutaPromotionId$.pipe(switchMap((id) => this.db.mutatorPromotionsById(id))),
    },
    ({ available, options, value }) => {
      if (!available) {
        return null
      }
      if (value) {
        return value
      }
      return options[0]
    },
    { debounce: true },
  )

  public readonly mutaPromotionOptions$ = selectStream(
    {
      available: this.mutaPromotionAvailable$,
      values: this.db.mutatorPromotionsAll(),
    },
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
    },
    { debounce: true },
  )

  public readonly mutationPromotionOptions$ = selectStream(
    {
      difficulty: this.mutaDifficulty$,
      values: this.db.mutatorPromotionsAll(),
    },
    ({ difficulty, values }) => {
      if (!difficulty || difficulty.MutationDifficulty <= 1) {
        return null
      }
      return values.map((it) => {
        return {
          label: it.Name,
          value: it.PromotionMutationId,
          icon: it.IconPath,
        }
      })
    },
    { debounce: true },
  )

  public readonly mutaCurseAvailable$ = this.select(this.mutaDifficulty$, (it) => it && it.MutationDifficulty > 2)
  public readonly mutaCurseId$ = this.select(({ mutationCurseId }) => mutationCurseId)
  public readonly mutaCurse$ = selectStream(
    {
      available: this.mutaCurseAvailable$,
      options: this.db.mutatorCursesAll(),
      value: this.mutaCurseId$.pipe(switchMap((id) => this.db.mutatorCursesById(id))),
    },
    ({ available, options, value }) => {
      if (!available) {
        return null
      }
      if (value) {
        return value
      }
      return options[0]
    },
    { debounce: true },
  )
  public readonly mutaCurseOptions$ = selectStream(
    {
      available: this.mutaCurseAvailable$,
      values: this.db.mutatorCursesAll(),
    },
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
    },
    { debounce: true },
  )

  public readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)
  public readonly enemyLevelOverride$ = this.select(this.mutaDifficulty$, (diff) => (diff ? 70 : null))

  public readonly difficulties$ = this.isMutable$.pipe(
    switchMap((mutable) => (mutable ? this.db.mutatorDifficultiesAll() : of<MutationDifficultyStaticData[]>([]))),
  )

  public readonly possibleItemDropIds$ = this.select(this.gameMode$, (it) => {
    return it?.PossibleItemDropIdsByLevel01 || it?.PossibleItemDropIds || []
  })
  public readonly possibleItemDrops$ = selectStream(
    {
      ids: this.possibleItemDropIds$,
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
    },
    ({ ids, items, housing }) => ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it),
    {
      debounce: true,
    },
  )

  public readonly creatures$ = selectStream(
    {
      dungeonId: this.gameModeId$,
      dungeonsMaps: this.db.gameModesMapsAll(),
      difficulty: this.mutaDifficulty$,
      vitals: this.db.vitalsAll(),
      vitalsMeta: this.db.vitalsMetadataByIdMap(),
    },
    ({ vitals, vitalsMeta, dungeonsMaps, dungeonId, difficulty }): VitalsData[] => {
      const result = vitals.filter((it) => {
        if (
          difficulty != null &&
          dungeonId === 'DungeonShatteredObelisk' &&
          it.VitalsID === 'Withered_Brute_Named_08'
        ) {
          return true
        }
        return getVitalDungeons(it, dungeonsMaps, vitalsMeta).some((dg) => eqCaseInsensitive(dg.GameModeId, dungeonId))
      })
      return result
    },
    {
      debounce: true,
    },
  )

  public readonly creaturesCommon$ = selectStream(this.creatures$, (list) => {
    return list.filter(
      (it) => !TAB_BOSSES_CREATURES.includes(it.CreatureType) && !TAB_NAMED_CREATURES.includes(it.CreatureType),
    )
  })

  public readonly creaturesBosses$ = selectStream(
    {
      dungeonId: this.gameModeId$,
      dungeonsMaps: this.db.gameModesMapsAll(),
      vitals: this.db.vitalsByCreatureTypeMap(),
      vitalsMeta: this.db.vitalsMetadataByIdMap(),
    },
    ({ vitals, vitalsMeta, dungeonsMaps, dungeonId }): VitalsData[] => {
      const result: VitalsData[] = []
      for (const type of TAB_BOSSES_CREATURES) {
        const list = vitals.get(type) || []
        for (const item of list) {
          if (
            getVitalDungeons(item, dungeonsMaps, vitalsMeta).some((dg) => eqCaseInsensitive(dg.GameModeId, dungeonId))
          ) {
            result.push(item)
          }
        }
      }
      return result
    },
    {
      debounce: true,
    },
  )

  public readonly creaturesNamed$ = selectStream(
    {
      dungeonId: this.gameModeId$,
      dungeonsMaps: this.db.gameModesMapsAll(),
      vitals: this.db.vitalsByCreatureTypeMap(),
      vitalsMeta: this.db.vitalsMetadataByIdMap(),
    },
    ({ vitals, vitalsMeta, dungeonsMaps, dungeonId }): VitalsData[] => {
      const result: VitalsData[] = []
      for (const type of TAB_NAMED_CREATURES) {
        const list = vitals.get(type) || []
        for (const item of list) {
          if (
            getVitalDungeons(item, dungeonsMaps, vitalsMeta).some((dg) => eqCaseInsensitive(dg.GameModeId, dungeonId))
          ) {
            result.push(item)
          }
        }
      }
      return result
    },
    {
      debounce: true,
    },
  )

  public readonly creatureLootTags$ = selectStream(this.creatures$, (list) => {
    return uniq(list.map((e) => e.LootTags || []).flat(1)).filter((it) => !!it)
  })

  public readonly lootTagsNormalMode$ = combineLatest({
    dungeon: this.gameMode$,
    creatureTags: this.creatureLootTags$,
    tables: combineLatest([this.db.lootTablesById('CreatureLootMaster')]),
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
      }),
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
    }),
  )

  public readonly lootTagsMutatedMode$ = selectStream(
    {
      dungeon: this.gameMode$,
      creatureTags: this.creatureLootTags$,
      playerLevel: this.playerLevel$,
      lootTables: combineLatest([
        this.db.lootTablesById('CreatureLootMaster_MutatedContainer'),
        this.db.lootTablesById('CreatureLootMaster'),
      ]),
    },
    ({ dungeon, creatureTags, lootTables, playerLevel }) => {
      if (!dungeon) {
        return null
      }

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
        ...MUTATION_LOOT_TAGS,
      ]).filter((it) => !!it && !regionExcludeTags.includes(it))

      return {
        tags: [...tags],
        values: {
          MinContLevel: Math.max(64, dungeon.ContainerLevel),
          EnemyLevel: Math.max(70, dungeon.ContainerLevel),
          Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
        },
        tables: lootTables,
        tableIds: lootTables.map((it) => it.LootTableID),
      }
    },
    { debounce: true },
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
    }),
  )

  public readonly lootTagsDifficulty$ = selectStream(
    {
      dungeon: this.gameMode$,
      difficulty: this.mutaDifficulty$,
      creatureTags: this.creatureLootTags$,
      playerLevel: this.playerLevel$,
      lootTables: combineLatest([
        this.db.lootTablesById('CreatureLootMaster_MutatedContainer'),
        this.db.lootTablesById('CreatureLootMaster'),
      ]),
    },
    ({ dungeon, difficulty, creatureTags, lootTables, playerLevel }) => {
      if (!dungeon || !difficulty) {
        return null
      }

      const mutationTags = [
        ...difficulty.InjectedLootTags,
        difficulty.InjectedCreatureLoot,
        difficulty.InjectedContainerLoot,
      ].filter((it) => !!it)
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
        ...MUTATION_LOOT_TAGS,
      ]).filter((it) => !!it && !regionExcludeTags.includes(it))

      return {
        tags: [...tags],
        values: {
          MinContLevel: Math.max(65, dungeon.ContainerLevel) - 1,
          EnemyLevel: NW_MAX_ENEMY_LEVEL,
          Level: (playerLevel || NW_MAX_CHARACTER_LEVEL) - 1,
        },
        tables: lootTables,
        tableIds: lootTables.map((it) => it.LootTableID),
      }
    },
    { debounce: true },
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
    }),
  )

  public constructor() {
    super({
      playerLevel: null,
      gameModeId: null,
    })
  }
}
