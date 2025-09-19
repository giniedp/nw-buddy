import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import {
  getItemId,
  getItemRarityWeight,
  isItemArmor,
  isItemArtifact,
  isItemJewelery,
  isItemNamed,
  isItemWeapon,
  isMasterItem,
  isVitalBoss,
  isVitalNamed,
  lootContextValues,
  NW_LOOT_GlobalMod,
  NW_MAX_ENEMY_LEVEL,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { uniq, uniqBy } from 'lodash'
import { firstValueFrom, map, of } from 'rxjs'
import { injectNwData } from '../../../data'
import { ConstrainedLootContext, NwLootService } from '../../../nw/loot'
import { eqCaseInsensitive, promiseMap, resourceValue, resourceValueOf } from '../../../utils'
import { selectGameEventItemReward } from '../../../widgets/data/game-event-detail/selectors'

export interface GameModeStoreState {
  gameMapId: string
  mutationCurseId: string
  mutationElementId: string
  mutationPromotionId: string
  mutationDifficultyId: number
}

export type GameModeStore = InstanceType<typeof GameModeStore>
export const GameModeStore = signalStore(
  withState<GameModeStoreState>({
    gameMapId: null,
    mutationCurseId: null,
    mutationElementId: null,
    mutationPromotionId: null,
    mutationDifficultyId: null,
  }),
  withComputed(({ gameMapId }) => {
    const db = injectNwData()
    const gameMap = resourceValue({
      keepPrevious: true,
      params: gameMapId,
      loader: ({ params }) => db.gameModesMapsById(params),
    })
    const gameModeId = computed(() => gameMap()?.GameModeId)
    const gameMode = resourceValue({
      params: gameModeId,
      loader: ({ params }) => db.gameModesById(params),
      keepPrevious: true,
    })
    const isMutable = computed(() => gameMode()?.IsMutable)
    return {
      gameMap,
      gameModeId,
      gameMode,
      isMutable,
    }
  }),
  withComputed(() => {
    const db = injectNwData()
    const nwData = resourceValue({
      loader: () => {
        return promiseMap({
          gameModeMaps: db.gameModesMapsAll(),
          gameModeSchedulerMap: db.gameModeSchedulerDataByIdMap(),
          mutatorCursesMap: db.mutatorCursesByIdMap(),
          mutatorElementsMap: db.mutatorElementsByIdMap(),
          mutatorPromotionsMap: db.mutatorPromotionsByIdMap(),
          mutatorDifficultiesMap: db.mutatorDifficultiesByIdMap(),
          mutatorElementsPerksMap: db.mutatorElementsPerksByIdMap(),
        })
      },
      defaultValue: {
        gameModeMaps: [],
        gameModeSchedulerMap: new Map(),
        mutatorCursesMap: new Map(),
        mutatorElementsMap: new Map(),
        mutatorPromotionsMap: new Map(),
        mutatorDifficultiesMap: new Map(),
        mutatorElementsPerksMap: new Map(),
      },
    })

    return {
      nwData,
    }
  }),
  withMethods((state) => {
    return {
      connectMap: signalMethod((gameMapId: string) => {
        patchState(state, { gameMapId })
      }),
      connectMutaCurse: signalMethod((mutationCurseId: string) => {
        patchState(state, { mutationCurseId })
      }),
      connectMutaElement: signalMethod((mutationElementId: string) => {
        patchState(state, { mutationElementId })
      }),
      connectMutaPromotion: signalMethod((mutationPromotionId: string) => {
        patchState(state, { mutationPromotionId })
      }),
      connectMutaDifficulty: signalMethod((mutationDifficultyId: number | string) => {
        patchState(state, { mutationDifficultyId: Number(mutationDifficultyId) || null })
      }),
    }
  }),
  // #region DIFFICULTY
  withComputed(({ nwData, isMutable, mutationDifficultyId }) => {
    const mutaDifficulty = computed(() => {
      if (!isMutable()) {
        return null
      }
      return nwData().mutatorDifficultiesMap.get(mutationDifficultyId())
    })
    const options = computed(() => {
      if (!isMutable()) {
        return null
      }
      return Array.from(nwData().mutatorDifficultiesMap.values())
    })
    return {
      mutaDifficulty,
      mutaDifficultyLevel: computed(() => mutaDifficulty()?.MutationDifficulty),
      mutaDifficulties: options,
      isMutated: computed(() => !mutaDifficulty()),
    }
  }),
  // #endregion

  // #region ELEMENTS
  withComputed(({ nwData, mutaDifficulty, mutationElementId }) => {
    const isAvailable = computed(() => !!mutaDifficulty())
    const options = computed(() => {
      if (!isAvailable()) {
        return null
      }
      return Array.from(nwData().mutatorElementsMap.values())
        .filter((it) => it.ElementalDifficultyTier === mutaDifficulty()?.DifficultyTier)
        .map((it) => {
          return {
            label: it.Name,
            value: it.CategoryWildcard,
            icon: it.IconPath,
            object: it,
          }
        })
    })
    const selection = computed(() => {
      if (!options()?.length) {
        return null
      }
      return options()?.find((it) => it.value === mutationElementId())?.object || options()[0].object
    })
    return {
      mutaElementAvailable: isAvailable,
      mutaElementOptions: options,
      mutaElement: selection,
      mutaElementId: computed(() => selection()?.ElementalMutationId),
      mutaElementPerks: computed(() => nwData().mutatorElementsPerksMap?.get(selection()?.CategoryWildcard)),
    }
  }),
  // #endregion

  // #region PROMOTIONS
  withComputed(({ nwData, mutaDifficulty, mutationPromotionId }) => {
    const isAvailable = computed(() => mutaDifficulty()?.MutationDifficulty > 1)
    const options = computed(() => {
      if (!isAvailable) {
        return null
      }
      return Array.from(nwData().mutatorPromotionsMap.values()).map((it) => {
        return {
          label: it.Name,
          value: it.PromotionMutationId,
          icon: it.IconPath,
          object: it,
        }
      })
    })
    const selection = computed(() => {
      if (!options()?.length) {
        return null
      }
      return nwData().mutatorPromotionsMap.get(mutationPromotionId()) || options()[0].object
    })
    return {
      mutaPromotionAvailable: isAvailable,
      mutaPromotionOptions: options,
      mutaPromotion: selection,
    }
  }),
  // #endregion

  // #region CURSE
  withComputed(({ nwData, mutaDifficulty, mutationCurseId }) => {
    const isAvailable = computed(() => mutaDifficulty()?.MutationDifficulty > 2)
    const options = computed(() => {
      if (!isAvailable()) {
        return null
      }
      return Array.from(nwData().mutatorCursesMap.values()).map((it) => {
        return {
          label: it.Name,
          value: it.CurseMutationId,
          icon: it.IconPath,
          object: it,
        }
      })
    })
    const selection = computed(() => {
      if (!options()?.length) {
        return null
      }
      return nwData().mutatorCursesMap.get(mutationCurseId()) || options()[0].object
    })
    return {
      mutaCurseAvailable: isAvailable,
      mutaCurseOptions: options,
      mutaCurse: selection,
    }
  }),
  // #endregion

  withComputed(({ gameMode, mutaDifficulty }) => {
    const db = injectNwData()
    const lootService = inject(NwLootService)
    const completionEventIds = resourceValue({
      defaultValue: [],
      // keepPrevious: true,
      params: () => {
        return {
          gameMode: gameMode(),
          mutaDifficulty: mutaDifficulty(),
        }
      },
      loader: async ({ params: { gameMode, mutaDifficulty } }) => {
        const scheduler = await db.gameModeSchedulerDataById(gameMode?.GameModeId)
        const result: string[] = []
        if (scheduler?.ScheduledGMCompletionGameEvent) {
          result.push(scheduler.ScheduledGMCompletionGameEvent)
        }
        if (mutaDifficulty) {
          result.push(mutaDifficulty.CompletionEvent1)
          result.push(mutaDifficulty.CompletionEvent2)
          result.push(mutaDifficulty.CompletionEvent3)
        }
        if (gameMode?.ActivityType === 'CaptureTheFlag') {
          const events = await db.gameEventsByGameEventType('OutpostRush').then((list) => {
            return (
              list?.filter((it) => {
                return eqCaseInsensitive(it.CreatureType, 'CaptureTheFlag')
              }) || []
            )
          })

          result.push(...events.map((it) => it.EventID))
        }
        if (gameMode?.ActivityType === 'OutpostRush' || gameMode?.ActivityType === 'OutpostRush_NoPerks') {
          const events = await db.gameEventsByGameEventType('OutpostRush').then((list) => {
            return (
              list?.filter((it) => {
                return eqCaseInsensitive(it.CreatureType, 'OutpostRush')
              }) || []
            )
          })
          result.push(...events.map((it) => it.EventID))
        }
        if (gameMode?.ActivityType === 'Arena3v3') {
          const events = await db.gameEventsByGameEventType('PvPArenas').then((list) => list || [])
          result.push(...events.map((it) => it.EventID))
        }
        return result
      },
    })
    const completionRewards = resourceValue({
      params: () => completionEventIds(),
      loader: async ({ params }) => {
        if (!params?.length) {
          return []
        }
        //
        return await Promise.all(
          params.map(async (id) => {
            const event = await db.gameEventsById(id)
            const rewardSpec = selectGameEventItemReward(event)
            const items: Array<MasterItemDefinitions | HouseItems> = []
            if (rewardSpec?.housingItemId) {
              const item = await db.itemOrHousingItem(rewardSpec?.housingItemId)
              items.push(item)
            }
            if (rewardSpec?.itemId) {
              const item = await db.itemOrHousingItem(rewardSpec?.itemId)
              items.push(item)
            }
            if (rewardSpec?.lootTableId) {
              const tables = [rewardSpec.lootTableId]
              const context = new ConstrainedLootContext({
                tags: rewardSpec.lootTags || [],
                values: lootContextValues({
                  Level: '*',
                }),
              })
              const drops = await firstValueFrom(lootService.resolveLootItemsForTables(context, tables))
              items.push(...drops)
            }
            return items
          }),
        ).then((list) => {
          return uniqBy(
            list.flat().filter((it) => !!it),
            (it) => getItemId(it),
          )
        })
      },
    })

    return {
      possibleItemDropIds: computed(() => {
        const mode = gameMode()
        if (!mode) {
          return []
        }
        const result: string[] = []
        result.push(...(gameMode().PossibleItemDropIdsByLevel01 || gameMode().PossibleItemDropIds || []))
        if (mode.LootLimitId) {
          result.push(mode.LootLimitId)
        }
        if (mode.DailyLootLimitId) {
          result.push(mode.DailyLootLimitId)
        }
        if (mode.WeeklyLootLimitId) {
          result.push(mode.WeeklyLootLimitId)
        }
        return result
      }),
      completionRewards,
    }
  }),

  // #region CREATURES
  withComputed(({ gameMapId: mapId, isMutated }) => {
    const db = injectNwData()
    const creatures = resourceValue({
      defaultValue: [],
      params: () => {
        return {
          mapId: mapId(),
          mutated: isMutated(),
        }
      },
      loader: ({ params }) => {
        return db.vitalsForGameMap({
          gameMapId: params.mapId,
          mutated: params.mutated,
        })
      },
    })

    const creaturesNamed = computed(() => {
      return creatures().filter((it) => isVitalNamed(it) && !isVitalBoss(it))
    })
    const creaturesBosses = computed(() => {
      return creatures().filter((it) => isVitalBoss(it))
    })
    const creaturesCommon = computed(() => {
      return creatures().filter((it) => !isVitalNamed(it) && !isVitalBoss(it))
    })
    const creatureLevelOverride = computed(() => {
      return isMutated() ? NW_MAX_ENEMY_LEVEL : null
    })
    return {
      creatures,
      creaturesCommon,
      creaturesNamed,
      creaturesBosses,
      creatureLevelOverride,
    }
  }),
  // #endregion

  // #region LOOT
  withComputed(({ creatures, gameMode, mutaDifficulty, mutaElementPerks }) => {
    const lootService = inject(NwLootService)
    const creatureLootTags = computed(() => {
      return uniq(
        creatures()
          .map((it) => it.LootTags || [])
          .flat()
          .filter((it) => !!it),
      )
    })
    const lootContextNormal = computed(() => {
      const dungeon = gameMode()
      if (!dungeon || !creatures()?.length) {
        return null
      }

      const tableIds = ['CreatureLootMaster']
      const values = lootContextValues({
        MinContLevel: dungeon.ContainerLevel,
        EnemyLevel: dungeon.ContainerLevel,
        Level: '*',
      })
      // prettier-ignore
      const tags = [
        NW_LOOT_GlobalMod,
        ...creatureLootTags(),
        ...(dungeon.LootTags || []),
      ]
      return {
        tags,
        values,
        tableIds,
      }
    })
    const lootContextMutated = computed(() => {
      const dungeon = gameMode()
      if (!dungeon || !creatures()?.length || !mutaDifficulty()) {
        return null
      }

      const tableIds = ['CreatureLootMaster', 'CreatureLootMaster_MutatedContainer']
      const values = lootContextValues({
        MinContLevel: Math.max(65, dungeon.ContainerLevel) - 1,
        EnemyLevel: NW_MAX_ENEMY_LEVEL,
        Level: '*',
      })
      const tags = [
        NW_LOOT_GlobalMod,
        ...creatureLootTags(),
        ...(dungeon.MutLootTagsOverride || dungeon.LootTags || []),
        ...(mutaDifficulty().InjectedLootTags || []),
      ]
      if (mutaElementPerks()?.InjectedCreatureLoot) {
        tableIds.push(mutaElementPerks().InjectedCreatureLoot)
        tags.push(mutaElementPerks().InjectedLootTags)
      }
      return {
        tags,
        values,
        tableIds,
      }
    })

    const lootNormal = resourceValueOf<Array<MasterItemDefinitions | HouseItems>>(
      rxResource({
        params: () => {
          return {
            context: lootContextNormal(),
          }
        },
        stream: ({ params: { context } }) => {
          if (!context) {
            return of([])
          }
          const ctx = new ConstrainedLootContext({
            tags: context.tags,
            values: context.values,
            // removes all the junk
            skipTables: ['CreatureLootCommon'],
            skipBuckets: ['GlobalNamedList'],
          })
          return lootService.resolveLootItemsForTables(ctx, context.tableIds).pipe(map(filterAndSort))
        },
      }),
      {
        keepPrevious: true,
      },
    )

    const lootMutated = resourceValueOf<Array<MasterItemDefinitions | HouseItems>>(
      rxResource({
        params: () => {
          return {
            context: lootContextMutated(),
            difficulty: mutaDifficulty(),
            perks: mutaElementPerks(),
          }
        },
        stream: ({ params: { context, difficulty, perks } }) => {
          if (!context) {
            return of([])
          }
          const injectedTags: string[] = []
          if (difficulty) {
            injectedTags.push(...(difficulty.InjectedLootTags || []))
          }
          if (perks?.InjectedLootTags) {
            injectedTags.push(perks.InjectedLootTags)
          }
          const ctx = new ConstrainedLootContext({
            tags: context.tags,
            values: context.values,
            // removes all the junk
            skipTables: ['CreatureLootCommon'],
            skipBuckets: ['GlobalNamedList'],
            skipBucketTags: injectedTags,
          })
          return lootService.resolveLootItemsForTables(ctx, context.tableIds).pipe(map(filterAndSort))
        },
      }),
      {
        keepPrevious: true,
      },
    )

    const lootDifficulty = resourceValueOf<Array<MasterItemDefinitions | HouseItems>>(
      rxResource({
        params: () => {
          return {
            context: lootContextMutated(),
            difficulty: mutaDifficulty(),
            perks: mutaElementPerks(),
          }
        },
        stream: ({ params: { context, difficulty, perks } }) => {
          if (!context || !difficulty) {
            return of([])
          }
          const injectedTags: string[] = []
          if (difficulty) {
            injectedTags.push(...(difficulty.InjectedLootTags || []))
          }
          if (perks?.InjectedLootTags) {
            injectedTags.push(perks.InjectedLootTags)
          }
          const ctx = new ConstrainedLootContext({
            tags: context.tags,
            values: context.values,
            // removes all the junk
            skipTables: ['CreatureLootCommon'],
            skipBuckets: ['GlobalNamedList'],
            onlyBucketTags: injectedTags,
          })

          return lootService.resolveLootItemsForTables(ctx, context.tableIds).pipe(map(filterAndSort))
        },
      }),
      {
        keepPrevious: true,
      },
    )
    return {
      lootNormal,
      lootMutated,
      lootDifficulty,
    }
  }),
  // #endregion
)

function filterAndSort(items: Array<MasterItemDefinitions | HouseItems>) {
  return (
    uniqBy(items, (it) => getItemId(it))
      // .filter((it) => getItemRarity(it) != 'common')
      .sort((nodeA, nodeB) => {
        const a = nodeA
        const b = nodeB
        const rarrityA = getItemRarityWeight(a)
        const rarrityB = getItemRarityWeight(b)
        if (rarrityA !== rarrityB) {
          return rarrityA >= rarrityB ? -1 : 1
        }
        const isGearA = isMasterItem(a) && (isItemArmor(a) || isItemJewelery(a) || isItemWeapon(a))
        const isGearB = isMasterItem(b) && (isItemArmor(b) || isItemJewelery(b) || isItemWeapon(b))
        if (isGearA !== isGearB) {
          return isGearA ? -1 : 1
        }
        const isNamedA = isMasterItem(a) && (isItemNamed(a) || isItemArtifact(a))
        const isNamedB = isMasterItem(b) && (isItemNamed(b) || isItemArtifact(b))
        if (isNamedA !== isNamedB) {
          return isNamedA ? -1 : 1
        }

        return getItemId(a).localeCompare(getItemId(b))
      })
  )
}
