import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {
  getVitalArmor,
  getVitalCategoryInfo,
  getVitalDamage,
  getVitalDungeons,
  getVitalHealth,
  NW_MAX_ENEMY_LEVEL,
} from '@nw-data/common'
import {
  GameModeData,
  VitalsCategoryData,
  VitalsBaseData as VitalsData,
  VitalsLevelVariantData,
  VitalsModifierData,
} from '@nw-data/generated'
import { ScannedVital } from '@nw-data/scanner'
import { map } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { apiResource } from '~/utils'

export interface VitalDetailState {
  vitalId: string
  vital: VitalsData & VitalsLevelVariantData
  metadata: ScannedVital
  modifier: VitalsModifierData
  categories: VitalsCategoryData[]
  dungeons: GameModeData[]
  levelOverride: number
}
export interface VitalMutationState {
  mutaElementId: string
  mutaDifficultyId: number
}

export const VitalDetailStore = signalStore(
  withState<VitalDetailState>({
    vitalId: null,
    vital: null,
    metadata: null,
    modifier: null,
    categories: [],
    dungeons: [],
    levelOverride: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load({ vitalId }: { vitalId: string }) {
        const vital = await db.vitalsById(vitalId)
        return {
          vitalId,
          vital,
          metadata: await db.vitalsMetadataById(vitalId),
          modifier: await db.vitalsModifiersById(vital?.CreatureType),
          categories: await Promise.all(
            (vital.VitalsCategories || []).map((it) => {
              return db.vitalsCategoriesById(it)
            }),
          ).then((it) => it.filter((it) => !!it)),
          dungeons: getVitalDungeons(vital, await db.gameModesAll(), await db.vitalsMetadataByIdMap()),
          levelOverride: null,
        }
      },
    }
  }),
  withState<VitalMutationState>({
    mutaElementId: null,
    mutaDifficultyId: null,
  }),
  withMethods((state) => {
    return {
      setLevel: rxMethod<{ level: number }>(
        map((it) => {
          patchState(state, { levelOverride: it.level })
        }),
      ),
      setMutation: rxMethod<{ mutaElementId: string; mutaDifficultyId: number }>(
        map((it) => {
          patchState(state, {
            mutaElementId: it.mutaElementId,
            mutaDifficultyId: it.mutaDifficultyId,
            levelOverride: null,
          })
        }),
      ),
    }
  }),
  withComputed(({ vital, levelOverride, categories, dungeons, mutaDifficultyId }) => {
    return {
      creatureType: computed(() => vital()?.CreatureType),
      displayName: computed(() => vital()?.DisplayName),
      level: computed(() => {
        if (levelOverride()) {
          return levelOverride()
        }
        if (mutaDifficultyId()) {
          return NW_MAX_ENEMY_LEVEL
        }
        return vital()?.Level
      }),
      combatCategories: computed(() => getVitalCategoryInfo(vital())),
      aliasNames: computed(() => {
        return categories()
          .map((it) => it.DisplayName?.trim())
          .filter((it) => !!it)
      }),
      isVitalFromDungeon: computed(() => !!dungeons()?.length),
    }
  }),
  withComputed(({ vital, level, modifier, mutaElementId, mutaDifficultyId }) => {
    const db = injectNwData()

    const levelData = apiResource({
      request: level,
      loader: ({ request }) => db.vitalsLevelsByLevel(request),
    }).value
    const mutaElement = apiResource({
      request: mutaElementId,
      loader: ({ request }) => (request ? db.mutatorElementsById(request) : null),
    }).value
    const mutaDifficulty = apiResource({
      request: mutaDifficultyId,
      loader: ({ request }) => (request ? db.mutatorDifficultiesById(request) : null),
    }).value

    return {
      levelData,
      mutaElement,
      mutaDifficulty,
      armor: computed(() => getVitalArmor(vital(), levelData())),
      gearScore: computed(() => levelData()?.GearScore),
      damage: computed(() => {
        return getVitalDamage({
          vital: vital(),
          level: levelData(),
          damageTable: { DmgCoef: 1, AddDmg: 0 },
          difficulty: mutaDifficulty(),
          modifier: modifier(),
        })
      }),
      health: computed(() => {
        return getVitalHealth({
          vital: vital(),
          level: levelData(),
          modifier: modifier(),
          difficulty: mutaDifficulty(),
        })
      }),
    }
  }),
)
