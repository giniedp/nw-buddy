import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { NW_MAP_NEWWORLD_VITAEETERNA } from '@nw-data/common'
import { CreatureType, GameModeData, GameModeMapData } from '@nw-data/generated'
import { FeatureCollection } from 'geojson'
import { groupBy, sortBy } from 'lodash'
import { combineLatest, from, map, of, pipe, switchMap, tap } from 'rxjs'
import { injectNwData, injectNwDataOptions } from '~/data'
import { TranslateService } from '~/i18n'
import { xyToLongLat } from '~/widgets/game-map/map-projection'
import { eqCaseInsensitive, humanize, resourceValue } from '../../../../utils'
import { unpackFilterDataSets, unpackVitalDataSet } from './data/packed'
import { loadStructures } from './data/structures'
import { loadRegionBoundaries, loadTerritories, loadZoneConfigs } from './data/territories'
import { FilterDataSet, VitalDataSet } from './data/types'
import { withPersistedState } from './with-persisted-state'
import { ZONE_MAP_TASKS } from './zone-map-tasks'

export interface ZoneMapState {
  isLoaded: boolean
  /**
   * Gatherables and vitals of the selected map are loading
   */
  isMapLoading: boolean
  /**
   * Maps that have gatherables
   */
  mapIds: string[]
  /**
   * Gatherable layers of the selected map
   */
  gatherables: FilterDataSet[]
  /**
   * Vitals of the selected map
   */
  vitals: VitalDataSet
  vitalsTypes: CreatureType[]
  vitalsCategories: string[]
  houses: FilterDataSet[]
  territories: FeatureCollection
  areas: FeatureCollection
  pois: FeatureCollection
  zoneConfigs: FeatureCollection
  regionBounds: FeatureCollection
  mapId: string
  showHeatmap?: boolean
  showLabels?: boolean
  showPOI?: boolean
  showTractmap?: boolean
  showZoneConfigs: boolean
  /**
   * The active panel tab
   */
  segment: ZoneMapSegment
  /**
   * Enabled gatherable and structure layers by layer id. `variants` null means all variants
   */
  layers: Record<string, LayerSelection>
}

export type ZoneMapSegment = 'g' | 'v' | 's'

export interface LayerSelection {
  variants: string[] | null
}

const PERSISTED_KEYS: Array<keyof ZoneMapState & string> = [
  'segment',
  'layers',
  'showHeatmap',
  'showLabels',
  'showPOI',
  'showZoneConfigs',
  'showTractmap',
]

export const ZoneMapStore = signalStore(
  withState<ZoneMapState>({
    isLoaded: false,
    isMapLoading: false,
    mapIds: [],
    territories: null,
    areas: null,
    pois: null,
    zoneConfigs: null,
    regionBounds: null,
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
    showZoneConfigs: false,
    showTractmap: false,
    segment: 'g',
    layers: {},
  }),
  withPersistedState<ZoneMapState>('zone-map', PERSISTED_KEYS),
  withRedux({
    actions: {
      public: {
        load: noPayload,
        loaded:
          payload<
            Pick<
              ZoneMapState,
              | 'territories'
              | 'areas'
              | 'pois'
              | 'zoneConfigs'
              | 'regionBounds'
              | 'houses'
              | 'vitalsTypes'
              | 'vitalsCategories'
            >
          >(),
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
      const tasks = inject(ZONE_MAP_TASKS)
      const options = injectNwDataOptions()
      return {
        load$: create(actions.load).pipe(
          switchMap(() => {
            return combineLatest({
              territories: loadTerritories(db, tl8, xyToLongLat),
              zoneConfigs: loadZoneConfigs(db, tl8, xyToLongLat),
              regionBounds: loadRegionBoundaries(db, tl8, xyToLongLat),
              houses: loadStructures(db, tl8, xyToLongLat),
              vitalsTypes: tasks ? from(tasks.vitalsTypes(options)) : of<CreatureType[]>([]),
              vitalsCategories: from(db.vitalsCategoriesAll()).pipe(
                map((list) => list.map((it) => it.VitalsCategoryID).sort()),
              ),
            })
          }),
          map(({ territories, zoneConfigs, houses, vitalsTypes, vitalsCategories, regionBounds }) => {
            return actions.loaded({
              ...territories,
              zoneConfigs,
              regionBounds,
              houses,
              vitalsTypes,
              vitalsCategories,
            })
          }),
        ),
      }
    },
  }),
  withMethods((state) => {
    const tasks = inject(ZONE_MAP_TASKS)
    const options = injectNwDataOptions()
    return {
      loadMapIds() {
        if (!tasks) {
          return
        }
        tasks.mapIds(options).then((mapIds) => {
          patchState(state, { mapIds })
        })
      },
      loadMapData: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(state, { isMapLoading: true })
          }),
          switchMap((mapId) => {
            if (!tasks || !mapId) {
              return of({ gatherables: [], vitals: { count: 0, data: {} } })
            }
            return from(Promise.all([tasks.gatherables(options, mapId), tasks.vitals(options, mapId)])).pipe(
              map(([gatherables, vitals]) => {
                return {
                  gatherables: unpackFilterDataSets(gatherables),
                  vitals: unpackVitalDataSet(vitals),
                }
              }),
            )
          }),
          tap(({ gatherables, vitals }) => {
            patchState(state, { gatherables, vitals, isMapLoading: false })
          }),
        ),
      ),
      setSegment(segment: ZoneMapSegment) {
        patchState(state, { segment })
      },
      /**
       * Enables or disables the given layers with all variants
       */
      setLayersEnabled(ids: string[], enabled: boolean) {
        patchState(state, ({ layers }) => {
          layers = { ...layers }
          for (const id of ids) {
            if (enabled) {
              layers[id] = { variants: null }
            } else {
              delete layers[id]
            }
          }
          return { layers }
        })
      },
      toggleLayer(id: string) {
        patchState(state, ({ layers }) => {
          layers = { ...layers }
          if (layers[id]) {
            delete layers[id]
          } else {
            layers[id] = { variants: null }
          }
          return { layers }
        })
      },
      /**
       * Toggles a variant on the given layers. A layer without variants left is disabled
       */
      toggleVariant(ids: string[], variant: string) {
        patchState(state, ({ layers }) => {
          layers = { ...layers }
          for (const id of ids) {
            let variants = layers[id]?.variants || []
            if (variants.includes(variant)) {
              variants = variants.filter((it) => it !== variant)
            } else {
              variants = [...variants, variant]
            }
            if (variants.length) {
              layers[id] = { variants }
            } else {
              delete layers[id]
            }
          }
          return { layers }
        })
      },
      setHeatmap(showHeatmap: boolean) {
        patchState(state, { showHeatmap })
      },
      setLabels(showLabels: boolean) {
        patchState(state, { showLabels })
      },
      setPOI(showPOI: boolean) {
        patchState(state, { showPOI })
      },
      setZoneConfigs(showZoneConfigs: boolean) {
        patchState(state, { showZoneConfigs })
      },
      setTractmap(showTractmap: boolean) {
        patchState(state, { showTractmap })
      },
      setMap(mapId: string) {
        patchState(state, { mapId })
      },
    }
  }),
  withHooks({
    onInit(store) {
      store.load()
      store.loadMapIds()
      store.loadMapData(store.mapId)
    },
  }),
  withComputed(({ mapIds, mapId }) => {
    const db = injectNwData()
    const mapOptions = resourceValue({
      params: mapIds,
      loader: async ({ params }) => {
        return selectMapOptions({
          mapIds: params,
          modeMaps: await db.gameModesMapsAll(),
          modes: await db.gameModesByIdMap(),
        })
      },
    })

    return {
      isOpenWorld: computed(() => eqCaseInsensitive(mapId(), NW_MAP_NEWWORLD_VITAEETERNA)),
      mapOptions: computed(() => mapOptions()),
    }
  }),
)

export interface MapOption {
  id: string
  name: string
  category: string
}

function selectMapOptions({
  mapIds,
  modeMaps,
  modes,
}: {
  mapIds: string[]
  modeMaps: GameModeMapData[]
  modes: Map<string, GameModeData>
}) {
  const result: MapOption[] = []
  for (const mapId of mapIds) {
    if (mapId === NW_MAP_NEWWORLD_VITAEETERNA) {
      result.push({
        id: mapId,
        name: 'Vita Eterna',
        category: 'Open World',
      })
      continue
    }
    let hasMode = false
    for (const map of modeMaps) {
      if (!map.CoatlicueName?.toLowerCase()?.endsWith(mapId)) {
        continue
      }
      const mode = modes.get(map.GameModeId)
      result.push({
        id: mapId,
        name: map.UIMapDisplayName || mode?.DisplayName || humanize(mapId),
        category: detectCategory(mode) || 'Other',
      })
      hasMode = true
      break
    }
    if (!hasMode) {
      result.push({
        id: mapId,
        name: humanize(mapId),
        category: 'Other',
      })
    }
  }
  return Object.values(groupBy(result, (it) => it.category)).map((group) => {
    return {
      name: group[0].category,
      options: sortBy(group, (it) => it.name),
    }
  })
}

function detectCategory(mode?: GameModeData) {
  if (!mode) {
    return null
  }
  if (eqCaseInsensitive(mode.GameModeId, 'mutation') || eqCaseInsensitive(mode.GameModeId, 'dungeon')) {
    // useless dummies
    return null
  }
  if (mode.IsSoloTrial) {
    return 'Soul Trials'
  }
  if (mode.IsSeasonTrial) {
    return 'Season Trials'
  }
  if (mode.IsRaidTrial) {
    return 'Raids'
  }
  if (mode.IsDungeon) {
    return 'Expeditions'
  }
  if (mode.ActivityType) {
    return 'Activities'
  }
  return null
}
