import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { FeatureCollection } from 'geojson'
import { uniq } from 'lodash'
import { combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { xyToLngLat } from '~/widgets/game-map/utils'
import { GatherableDataSet, loadGatherables } from './data/gatherables'
import { loadTerritories } from './data/territories'

export interface ZoneMapState {
  isLoaded: boolean
  gatherables: GatherableDataSet[]
  territories: FeatureCollection
  areas: FeatureCollection
  pois: FeatureCollection
  mapId: string
  showHeatmap?: boolean
  showLabels?: boolean
  showPOI?: boolean
  showEncounter?: boolean
}

export const ZoneMapStore = signalStore(
  withState<ZoneMapState>({
    isLoaded: false,
    territories: null,
    areas: null,
    pois: null,
    gatherables: [],
    mapId: 'newworld_vitaeeterna',
    showHeatmap: true,
    showLabels: true,
    showPOI: true,
    showEncounter: false,
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
            })
          }),
          map(({ territories, gatherables }) =>
            actions.loaded({
              ...territories,
              gatherables: gatherables,
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
      setEncounter(showEncounter: boolean) {
        patchState(state, { showEncounter })
      },
    }
  }),
  withHooks({
    onInit(store) {
      store.load()
    },
  }),
  withComputed(({ territories, areas, pois, gatherables }) => {
    return {
      mapIds: computed(() => {
        return uniq(
          gatherables()
            .map((it) => Object.keys(it.data))
            .flat(),
        )
      }),
    }
  }),
)
