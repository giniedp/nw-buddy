import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { FeatureCollection } from 'geojson'
import { groupBy, uniq } from 'lodash'
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
}

export const ZoneMapStore = signalStore(
  withState<ZoneMapState>({
    isLoaded: false,
    territories: null,
    areas: null,
    pois: null,
    gatherables: [],
    mapId: 'newworld_vitaeeterna',
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
  withHooks({
    onInit(store) {
      store.load()
    },
  }),
  withComputed(({ territories, areas, pois, gatherables }) => {
    return {
      filters: computed(() => {
        return Object.entries(groupBy(gatherables(), (it) => it.section))
          .map(([key, value]) => {
            const first = value[0]
            return {
              name: first.sectionLabel || key,
              icon: first.sectionIcon,
              items: Object.entries(groupBy(value, (it) => it.category))
                .map(([key, value]) => {
                  const first = value[0]
                  const variants = first.variants.length ? first.variants : null

                  return {
                    name: first.categoryLabel || key,
                    variants,
                    icon: first.categoryIcon,
                    count: first.count,
                    items: value.sort((a, b) => a.subcategory.localeCompare(b.subcategory)),
                  }
                })
                .sort((a, b) => a.name.localeCompare(b.name)),
            }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      }),
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
