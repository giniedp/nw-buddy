import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, effect, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { FeatureCollection } from 'geojson'
import { combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { xyToLngLat } from '~/widgets/game-map/utils'
import { loadGatherables } from './data/gatherables'
import { loadLore } from './data/lore'
import { loadTerritories } from './data/territories'
import { FilterDataSet, VitalDataSet } from './data/types'
import { loadVitals } from './data/vitals'
import { CreatureType, VitalsData } from '@nw-data/generated'

export interface ZoneMapState {
  isLoaded: boolean
  gatherables: FilterDataSet[]
  lore: FilterDataSet[]
  vitals: VitalDataSet
  vitalsTypes: CreatureType[]
  vitalsCategories: string[]
  territories: FeatureCollection
  areas: FeatureCollection
  pois: FeatureCollection
  mapId: string
  showHeatmap?: boolean
  showLabels?: boolean
  showPOI?: boolean
  showRandomEncounter?: boolean
  showDarknessEncounter?: boolean
  showGoblinEncounter?: boolean
}

export const ZoneMapStore = signalStore(
  withState<ZoneMapState>({
    isLoaded: false,
    territories: null,
    areas: null,
    pois: null,
    gatherables: [],
    vitalsTypes: [],
    vitalsCategories: [],
    lore: [],
    vitals: {
      count: 0,
      data: {},
    },
    mapId: 'newworld_vitaeeterna',
    showHeatmap: true,
    showLabels: true,
    showPOI: true,
    showRandomEncounter: false,
    showDarknessEncounter: false,
    showGoblinEncounter: false,
  }),
  withRedux({
    actions: {
      public: {
        load: noPayload,
        loaded: payload<Omit<ZoneMapState, 'isLoaded'>>(),
        toggleLootTable: payload<{ id: string }>(),
      },
      private: {},
    },
    reducer(actions, on) {
      on(actions.loaded, (state, payload) => {
        patchState(state, {
          ...payload,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      const tl8 = inject(TranslateService)
      return {
        load$: create(actions.load).pipe(
          switchMap(() => {
            return combineLatest({
              territories: loadTerritories(db, tl8, xyToLngLat),
              gatherables: loadGatherables(db, xyToLngLat),
              lore: loadLore(db, xyToLngLat),
              vitals: loadVitals(db, xyToLngLat),
              vitalsTypes: db.vitalsByCreatureType.pipe(map((it) => Array.from<CreatureType>(it.keys() as any))),
              vitalsCategories: db.vitalsCategories.pipe(map((list) => list.map((it) => it.VitalsCategoryID).sort())),
            })
          }),
          map(({ territories, gatherables, lore, vitals, vitalsTypes, vitalsCategories }) =>
            actions.loaded({
              ...territories,
              gatherables,
              lore,
              vitals,
              vitalsTypes,
              vitalsCategories,
              mapId: 'newworld_vitaeeterna',
            }),
          ),
        ),
      }
    },
  }),
  withMethods((state) => {
    return {
      setHeatmap(showHeatmap: boolean) {
        patchState(state, { showHeatmap })
      },
      setLabels(showLabels: boolean) {
        patchState(state, { showLabels })
      },
      setPOI(showPOI: boolean) {
        patchState(state, { showPOI })
      },
      setRandomEncounter(value: boolean) {
        patchState(state, { showRandomEncounter: value })
      },
      setDarknessEncounter(value: boolean) {
        patchState(state, { showDarknessEncounter: value })
      },
      setGoblinEncounter(value: boolean) {
        patchState(state, { showGoblinEncounter: value })
      },
      setMap(mapId: string) {
        patchState(state, { mapId })
      },
    }
  }),
  withHooks({
    onInit(store) {
      store.load()
    },
  }),
  withComputed(({ gatherables, lore, vitals }) => {
    return {
      mapIds: computed(() => {
        const ids = new Set<string>()
        for (const item of gatherables()) {
          for (const key in item.data) {
            ids.add(key)
          }
        }
        for (const item of lore()) {
          for (const key in item.data) {
            ids.add(key)
          }
        }
        return Array.from(ids.values())
      }),
    }
  }),
)
