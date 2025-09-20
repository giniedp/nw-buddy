import { computed, inject, resource } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import {
  getItemId,
  getItemRarityNumeric,
  getItemRarityWeight,
  isItemArmor,
  isItemArtifact,
  isItemJewelery,
  isItemLootContainer,
  isItemNamed,
  isItemWeapon,
  isMasterItem,
  isVitalBoss,
  isVitalNamed,
  lootContextValues,
  NW_LOOT_GlobalMod,
  NW_MAX_ENEMY_LEVEL,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { HouseItems, MasterItemDefinitions, MutationDifficultyStaticData } from '@nw-data/generated'
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

  // #region CREATURES
  withProps(({ gameMapId: mapId, isMutated }) => {
    const db = injectNwData()
    const creaturesResource = resource({
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
    return {
      creaturesResource,
    }
  }),
  withComputed(({ creaturesResource, gameMapId: isMutated }) => {
    const creatures = resourceValueOf(creaturesResource)

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
    const creatureLootTables = computed(() => {
      return uniq(
        creatures()
          .map((it) => it.LootTableId)
          .flat()
          .filter((it) => !!it),
      )
    })
    const creatureLootTags = computed(() => {
      return uniq(
        creatures()
          .map((it) => it.LootTags || [])
          .flat()
          .filter((it) => !!it),
      )
    })
    return {
      creatures,
      creaturesCommon,
      creaturesNamed,
      creaturesBosses,
      creatureLevelOverride,
      creatureLootTables,
      creatureLootTags,
    }
  }),
  // #endregion

  // #region LOOT

  withProps(({ gameMode, mutaDifficulty }) => {
    const db = injectNwData()
    const lootService = inject(NwLootService)
    const completionResource = resource({
      defaultValue: {
        container: [],
        containerLoot: [],
        loot: [],
      },
      params: () => {
        return {
          gameModeId: gameMode()?.GameModeId,
          activityType: gameMode()?.ActivityType,
          mutaDifficulty: mutaDifficulty(),
        }
      },
      loader: async ({ params }) => {
        const eventIds = await loadCompletionEventIds(db, params)
        const eventLoot = await loadGameEventsRewardLoot(db, lootService, eventIds)
        const { containers, items } = splitItemsToLootContainers(eventLoot)
        return {
          container: containers,
          containerLoot: await loadItemsSalvageLoot(lootService, containers),
          loot: items,
        }
      },
    })
    const itemDropResource = resource({
      params: () => {
        return {
          gameMode: gameMode(),
        }
      },
      loader: async ({ params: { gameMode } }) => {
        if (!gameMode) {
          return []
        }
        // gameMode.WeeklyLootLimitId
        // gameMode.DailyLootLimitId
        const itemIds = gameMode.PossibleItemDropIdsByLevel01 || gameMode.PossibleItemDropIds || []
        const items = await Promise.all(itemIds.map((it) => db.itemOrHousingItem(it)))
        return items
      },
    })
    return {
      completionResource,
      itemDropResource,
    }
  }),

  withProps(({ creatures, creatureLootTables, creatureLootTags, gameMode, mutaDifficulty, mutaElementPerks }) => {
    const lootService = inject(NwLootService)

    const lootContextNormal = computed(() => {
      const dungeon = gameMode()
      if (!dungeon || !creatures()?.length) {
        return null
      }

      const tableIds = creatureLootTables()
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

      const tableIds = uniq([...creatureLootTables(), 'CreatureLootMaster_MutatedContainer'])
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
        tags.push(...(mutaElementPerks().InjectedLootTags || []))
      }
      return {
        tags,
        values,
        tableIds,
      }
    })

    const creatureLootResource = resource({
      defaultValue: {
        container: [],
        containerLoot: [],
        loot: [],
      },
      params: () => {
        return {
          context: lootContextNormal(),
        }
      },
      loader: async ({ params: { context } }) => {
        if (!context) {
          return {
            container: [],
            containerLoot: [],
            loot: [],
          }
        }
        const ctx = new ConstrainedLootContext({
          tags: context.tags,
          values: context.values,
          // removes all the junk
          skipTables: ['CreatureLootCommon'],
          skipBuckets: ['GlobalNamedList'],
        })
        const lootItems = await firstValueFrom(lootService.resolveLootItemsForTables(ctx, context.tableIds))
        const { containers, items } = splitItemsToLootContainers(lootItems)
        return {
          container: containers,
          containerLoot: await loadItemsSalvageLoot(lootService, containers),
          loot: items,
        }
      },
    })

    const creatureLootMutatedResource = resource({
      defaultValue: {
        container: [],
        containerLoot: [],
        loot: [],
      },
      params: () => {
        return {
          context: lootContextMutated(),
          difficulty: mutaDifficulty(),
          perks: mutaElementPerks(),
        }
      },
      loader: async ({ params: { context, difficulty, perks } }) => {
        if (!context) {
          return {
            container: [],
            containerLoot: [],
            loot: [],
          }
        }
        const injectedTags: string[] = []
        if (difficulty) {
          injectedTags.push(...(difficulty.InjectedLootTags || []))
        }
        if (perks?.InjectedLootTags) {
          injectedTags.push(...perks.InjectedLootTags)
        }
        const ctx = new ConstrainedLootContext({
          tags: context.tags,
          values: context.values,
          // removes all the junk
          skipTables: ['CreatureLootCommon'],
          skipBuckets: ['GlobalNamedList'],
          skipBucketTags: injectedTags,
        })
        const lootItems = await firstValueFrom(lootService.resolveLootItemsForTables(ctx, context.tableIds))
        const { containers, items } = splitItemsToLootContainers(lootItems)
        return {
          container: containers,
          containerLoot: await loadItemsSalvageLoot(lootService, containers),
          loot: items,
        }
      },
    })

    const creatureLootDifficultyResource = rxResource({
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
          injectedTags.push(...perks.InjectedLootTags)
        }
        const ctx = new ConstrainedLootContext({
          tags: context.tags,
          values: context.values,
          // removes all the junk
          skipTables: ['CreatureLootCommon'],
          skipBuckets: ['GlobalNamedList'],
          onlyBucketTags: injectedTags,
        })

        return lootService.resolveLootItemsForTables(ctx, context.tableIds)
      },
    })
    return {
      creatureLootResource,
      creatureLootMutatedResource,
      creatureLootDifficultyResource,
    }
  }),
  withComputed(
    ({
      creaturesResource,
      itemDropResource,
      completionResource,
      creatureLootResource,
      creatureLootMutatedResource,
      creatureLootDifficultyResource,
    }) => {
      const lootIsLoading = computed(() => {
        return (
          creaturesResource.isLoading() ||
          completionResource.isLoading() ||
          itemDropResource.isLoading() ||
          creatureLootResource.isLoading() ||
          creatureLootMutatedResource.isLoading() ||
          creatureLootDifficultyResource.isLoading()
        )
      })
      const lootRewards = computed(() => {
        if (lootIsLoading()) {
          return []
        }

        const result = [
          ...(itemDropResource.hasValue() ? itemDropResource.value() || [] : []),
          ...(completionResource.hasValue() ? completionResource.value().container || [] : []),
          ...(creatureLootResource.hasValue() ? creatureLootResource.value().container || [] : []),
        ]
        return filterAndSort(uniqBy(result, getItemId))
      })
      const lootItems = computed(() => {
        if (lootIsLoading()) {
          return []
        }

        const result = [
          ...(completionResource.hasValue() ? completionResource.value().containerLoot || [] : []),
          ...(completionResource.hasValue() ? completionResource.value().loot || [] : []),
          ...(creatureLootResource.hasValue() ? creatureLootResource.value().containerLoot || [] : []),
          ...(creatureLootResource.hasValue() ? creatureLootResource.value().loot || [] : []),
        ]
        return filterAndSort(uniqBy(result, getItemId))
      })
      const lootMutated = computed(() => {
        if (lootIsLoading()) {
          return []
        }

        const result = [
          ...(completionResource.hasValue() ? completionResource.value().containerLoot || [] : []),
          ...(completionResource.hasValue() ? completionResource.value().loot || [] : []),
          ...(creatureLootMutatedResource.hasValue() ? creatureLootMutatedResource.value().containerLoot || [] : []),
          ...(creatureLootMutatedResource.hasValue() ? creatureLootMutatedResource.value().loot || [] : []),
        ]
        return filterAndSort(uniqBy(result, getItemId))
      })
      const lootDifficulty = computed(() => {
        if (lootIsLoading()) {
          return []
        }
        const result = creatureLootDifficultyResource.hasValue() ? creatureLootDifficultyResource.value() || [] : []
        return filterAndSort(uniqBy(result, getItemId))
      })
      return {
        lootRewards,
        lootItems,
        lootMutated,
        lootDifficulty,
      }
    },
  ),
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

        const tierA = a.Tier || 0
        const tierB = b.Tier || 0
        if (tierA !== tierB) {
          return tierB - tierA
        }

        if (isMasterItem(a) && isMasterItem(b)) {
          const lvlA = a.ContainerLevel || 0
          const lvlB = b.ContainerLevel || 0
          if (lvlA !== lvlB) {
            return lvlB - lvlA
          }
        }
        return getItemId(a).localeCompare(getItemId(b))
      })
  )
}

async function loadCompletionEventIds(
  db: NwData,
  {
    gameModeId,
    mutaDifficulty,
    activityType,
  }: {
    gameModeId: string
    mutaDifficulty: MutationDifficultyStaticData
    activityType: string
  },
) {
  const scheduler = await db.gameModeSchedulerDataById(gameModeId)
  const result: string[] = []
  if (scheduler?.ScheduledGMCompletionGameEvent) {
    result.push(scheduler.ScheduledGMCompletionGameEvent)
  }
  if (mutaDifficulty) {
    result.push(mutaDifficulty.CompletionEvent1)
    result.push(mutaDifficulty.CompletionEvent2)
    result.push(mutaDifficulty.CompletionEvent3)
  }
  if (activityType === 'CaptureTheFlag') {
    const events = await db.gameEventsByGameEventType('OutpostRush').then((list) => {
      return (
        list?.filter((it) => {
          return eqCaseInsensitive(it.CreatureType, 'CaptureTheFlag')
        }) || []
      )
    })

    result.push(...events.map((it) => it.EventID))
  }
  if (activityType === 'OutpostRush' || activityType === 'OutpostRush_NoPerks') {
    const events = await db.gameEventsByGameEventType('OutpostRush').then((list) => {
      return (
        list?.filter((it) => {
          return eqCaseInsensitive(it.CreatureType, 'OutpostRush')
        }) || []
      )
    })
    result.push(...events.map((it) => it.EventID))
  }
  if (activityType === 'Arena3v3') {
    const events = await db.gameEventsByGameEventType('PvPArenas').then((list) => list || [])
    result.push(...events.map((it) => it.EventID))
  }
  if (eqCaseInsensitive(gameModeId, 'raidcutlasskeys00')) {
    result.push('hercyneraid_reward')
  }
  if (eqCaseInsensitive(gameModeId, 'trialbrimstonesandworm')) {
    result.push('sandwormelitetrial_reward')
  }
  // Trial_S2_Success
  return result
}

async function loadGameEventsRewardLoot(db: NwData, service: NwLootService, gameEventIds: string[]) {
  if (!gameEventIds?.length) {
    return []
  }
  const items = await Promise.all(
    gameEventIds.map((id) => {
      return loadGameEventRewardLoot(db, service, id)
    }),
  ).then((list) => {
    return list.flat().filter((it) => !!it)
  })
  return uniqBy(items, getItemId)
}

async function loadGameEventRewardLoot(
  db: NwData,
  service: NwLootService,
  gameEventId: string,
): Promise<Array<MasterItemDefinitions | HouseItems>> {
  if (!gameEventId) {
    return []
  }
  const event = await db.gameEventsById(gameEventId)
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
    const drops = await firstValueFrom(service.resolveLootItemsForTables(context, tables))
    items.push(...drops)
  }
  return items
}

async function loadItemsSalvageLoot(
  service: NwLootService,
  container: Array<MasterItemDefinitions | HouseItems>,
): Promise<Array<MasterItemDefinitions | HouseItems>> {
  if (!container?.length) {
    return []
  }

  const items = await Promise.all(
    container.map((it) => {
      return loadItemSalvageLoot(service, it)
    }),
  ).then((list) => {
    return list.flat().filter((it) => !!it)
  })
  return uniqBy(items, getItemId)
}

async function loadItemSalvageLoot(
  service: NwLootService,
  container: MasterItemDefinitions | HouseItems,
): Promise<Array<MasterItemDefinitions | HouseItems>> {
  const info = selectItemSalvageInfo(container)
  if (!info) {
    return []
  }
  const tables = [info.tableId]
  const context = new ConstrainedLootContext({
    tags: info.tags || [],
    values: info.tagValues,
  })
  return firstValueFrom(service.resolveLootItemsForTables(context, tables))
}

function selectItemSalvageInfo(item: MasterItemDefinitions | HouseItems, playerLevel: number | string = '*') {
  if (!item || (isMasterItem(item) && !item.IsSalvageable)) {
    return null
  }
  const recipe = item.RepairRecipe
  if (!recipe?.startsWith('[LTID]')) {
    return null
  }
  return {
    tableId: recipe.replace('[LTID]', ''),
    tags: [NW_LOOT_GlobalMod, ...((item as MasterItemDefinitions)?.SalvageLootTags || [])],
    tagValues: lootContextValues({
      Level: typeof playerLevel === 'string' ? playerLevel : playerLevel - 1,
      MinContLevel: (item as MasterItemDefinitions)?.ContainerLevel,
      SalvageItemRarity: getItemRarityNumeric(item),
      SalvageItemTier: item.Tier,
    }),
  }
}

function splitItemsToLootContainers(list: Array<MasterItemDefinitions | HouseItems>) {
  const containers: typeof list = []
  const items: typeof list = []
  for (const item of list) {
    if (isMasterItem(item) && isItemLootContainer(item)) {
      containers.push(item)
    } else {
      items.push(item)
    }
  }
  return { containers, items }
}
