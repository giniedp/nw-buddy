import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { CreatureType } from '@nw-data/generated'
import { FeatureCollection } from 'geojson'
import { combineLatest, from, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { xyToLngLat } from '~/widgets/game-map/utils'
import { loadGatherables } from './data/gatherables'
import { loadStructures } from './data/structures'
import { loadTerritories } from './data/territories'
import { FilterDataSet, VitalDataSet } from './data/types'
import { loadVitals } from './data/vitals'

export interface ZoneMapState {
  isLoaded: boolean
  gatherables: FilterDataSet[]
  vitals: VitalDataSet
  vitalsTypes: CreatureType[]
  vitalsCategories: string[]
  houses: FilterDataSet[]
  territories: FeatureCollection
  areas: FeatureCollection
  pois: FeatureCollection
  mapId: string
  showHeatmap?: boolean
  showLabels?: boolean
  showPOI?: boolean
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
    houses: [],
    vitals: {
      count: 0,
      data: {},
    },
    mapId: 'newworld_vitaeeterna',
    showHeatmap: true,
    showLabels: true,
    showPOI: true,
  }),
  withRedux({
    actions: {
      public: {
        load: noPayload,
        loaded: payload<Omit<ZoneMapState, 'isLoaded' | 'mapId'>>(),
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
      //const db = inject(NwDataService)
      const db = injectNwData()
      const tl8 = inject(TranslateService)
      return {
        load$: create(actions.load).pipe(
          switchMap(() => {
            return combineLatest({
              territories: loadTerritories(db, tl8, xyToLngLat),
              gatherables: loadGatherables(db, xyToLngLat),
              vitals: loadVitals({
                db: db,
                mapCoord: xyToLngLat,
              }),
              houses: loadStructures(db, tl8, xyToLngLat),
              vitalsTypes: from(db.vitalsByCreatureTypeMap()).pipe(
                map((it) => Array.from<CreatureType>(it.keys() as any)),
              ),
              vitalsCategories: from(db.vitalsCategoriesAll()).pipe(
                map((list) => list.map((it) => it.VitalsCategoryID).sort()),
              ),
            })
          }),
          map(({ territories, gatherables, houses, vitals, vitalsTypes, vitalsCategories }) =>
            actions.loaded({
              ...territories,
              gatherables,
              houses,
              vitals,
              vitalsTypes,
              vitalsCategories,
              //mapId: 'newworld_vitaeeterna',
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
  withComputed(({ gatherables }) => {
    return {
      mapIds: computed(() => {
        const ids = new Set<string>()
        for (const item of gatherables()) {
          for (const key in item.data) {
            ids.add(key)
          }
        }
        return Array.from(ids.values())
      }),
    }
  }),
)
