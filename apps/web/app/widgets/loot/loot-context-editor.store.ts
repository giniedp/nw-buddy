import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { getGameModeLootTags } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { withNwData } from '~/data/with-nw-data'
import { eqCaseInsensitive } from '~/utils'

export interface LootContextEditorState {
  isLoaded: boolean

  playerLevel: number
  contLevel: number
  poiLevel: number
  enemyLevel: number
  vitalId: string
  vitalLevel: number

  salvageItemGearScore: number
  salvageItemRarity: number
  salvageItemTier: number

  territoryId: number
  poiId: number
  gameModeId: string
  mutaDifficultyId: number
  mutaElementTypeId: string

  constantTags: string[]
  customTags: string[]
}

const DEFAULT_STATE: LootContextEditorState = {
  isLoaded: false,
  playerLevel: null,
  contLevel: null,
  poiLevel: null,
  enemyLevel: null,
  vitalId: null,
  vitalLevel: null,
  territoryId: null,
  poiId: null,
  gameModeId: null,
  mutaDifficultyId: null,
  mutaElementTypeId: null,
  salvageItemGearScore: null,
  salvageItemRarity: null,
  salvageItemTier: null,
  constantTags: ['GlobalMod'],
  customTags: [],
}

export type LootContextEditorStore = typeof LootContextEditorStore
export const LootContextEditorStore = signalStore(
  { protectedState: false },
  withState<LootContextEditorState>(DEFAULT_STATE),
  withNwData((db) => {
    return {
      territories: db.territoriesAll(),
      territoriesMap: db.territoriesByIdMap(),
      gameModes: db.gameModesAll(),
      gameModesMap: db.gameModesByIdMap(),
      mutaDifficulties: db.mutatorDifficultiesAll(),
      mutaDifficultiesMap: db.mutatorDifficultiesByIdMap(),
      mutaElements: db.mutatorElementsPerksAll(),
      mutaElementsMap: db.mutatorElementsPerksByIdMap(),
      vitals: db.vitalsAll(),
      vitalsMap: db.vitalsByIdMap(),
    }
  }),
  withComputed(({ nwData, vitalId, territoryId, poiId, gameModeId, mutaDifficultyId, mutaElementTypeId }) => {
    return {
      vital: computed(() => nwData()?.vitalsMap?.get(vitalId())),
      poi: computed(() => nwData()?.territoriesMap?.get(poiId())),
      territory: computed(() => nwData()?.territoriesMap?.get(territoryId())),
      gameMode: computed(() => nwData()?.gameModesMap?.get(gameModeId())),
      mutaDifficulty: computed(() => nwData()?.mutaDifficultiesMap?.get(mutaDifficultyId())),
      mutaElement: computed(() => nwData()?.mutaElementsMap?.get(mutaElementTypeId())),
    }
  }),
  withComputed(({ vital, territory, poi, gameMode, mutaDifficulty, mutaElement }) => {
    const gameModeIsMutable = computed(() => gameMode()?.IsMutable)
    const gameModeIsMutation = computed(() => !!gameModeIsMutable() && !!mutaDifficulty())
    return {
      vitalTags: computed(() => vital()?.LootTags || []),
      territoryTags: computed(() => territory()?.LootTags || []),
      poiTags: computed(() => poi()?.LootTags || []),
      gameModeIsMutable,
      gameModeIsMutation,
      gameModeTags: computed(() => {
        if (!gameModeIsMutation()) {
          return getGameModeLootTags(gameMode())
        }
        return getGameModeLootTags(gameMode(), mutaDifficulty(), mutaElement())
      }),
    }
  }),
  withComputed(({ constantTags, customTags, vitalTags, territoryTags, poiTags, gameModeTags }) => {
    const fixedTags = computed(() => {
      const result = [...constantTags(), ...vitalTags(), ...territoryTags(), ...poiTags(), ...gameModeTags()]
        .filter((it) => !!it)
        .sort()
      return uniqBy(result, (it) => it.toLowerCase())
    })
    const editableTags = computed(() => {
      const result = [...customTags()].filter((it) => !!it).sort()
      return uniqBy(result, (it) => it.toLowerCase())
    })

    const tags = computed(() => {
      return [
        ...fixedTags().map((it) => {
          return {
            tag: it,
            editable: false,
          }
        }),
        ...editableTags().map((it) => {
          return {
            tag: it,
            editable: true,
          }
        }),
      ]
    })

    return {
      tags,
      contextTags: computed(() => tags().map((it) => it.tag)),
    }
  }),
  withComputed(
    ({ playerLevel, enemyLevel, contLevel, poiLevel, salvageItemGearScore, salvageItemRarity, salvageItemTier }) => {
      return {
        contextValues: computed(() => {
          const values: Record<string, string | number> = {
            Level: playerLevel(),
            EnemyLevel: enemyLevel(),
            MinContLevel: contLevel(),
            MinPOIContLevel: poiLevel(),
            SalvageItemGearScore: salvageItemGearScore(),
            SalvageItemRarity: salvageItemRarity(),
            SalvageItemTier: salvageItemTier(),
          }
          for (const key in values) {
            if (values[key] == null) {
              delete values[key]
            }
          }
          return values
        }),
      }
    },
  ),

  withMethods((state) => {
    return {
      addTag: (tag: string) => {
        patchState(state, {
          customTags: uniqBy([...state.customTags(), tag], (it) => it.toLowerCase()),
        })
      },
      removeTag: (tag: string) => {
        patchState(state, {
          customTags: state.customTags().filter((it) => !eqCaseInsensitive(it, tag)),
        })
      },
      reset: () => {
        patchState(state, DEFAULT_STATE)
      },
      restore: (data: Partial<LootContextEditorState>) => {
        patchState(state, data)
      },
    }
  }),
)
