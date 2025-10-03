import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { NW_MAP_NEWWORLD_VITAEETERNA } from '@nw-data/common'
import { CreatureType, GameModeData, GameModeMapData } from '@nw-data/generated'
import { FeatureCollection } from 'geojson'
import { groupBy, sortBy } from 'lodash'
import { combineLatest, from, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { xyToLngLat } from '~/widgets/game-map/map-projection'
import { eqCaseInsensitive, humanize, resourceValue } from '../../../../utils'
import { loadGatherables } from './data/gatherables'
import { loadStructures } from './data/structures'
import { loadRegionBoundaries, loadTerritories, loadZoneConfigs } from './data/territories'
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
  zoneConfigs: FeatureCollection
  regionBounds: FeatureCollection
  mapId: string
  showHeatmap?: boolean
  showLabels?: boolean
  showPOI?: boolean
  showTractmap?: boolean
  showZoneConfigs: boolean
}

export const ZoneMapStore = signalStore(
  withState<ZoneMapState>({
    isLoaded: false,
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
  }),
  withRedux({
    actions: {
      public: {
        load: noPayload,
        loaded: payload<Omit<ZoneMapState, 'isLoaded' | 'mapId' | 'showZoneConfigs' | 'showTractmap'>>(),
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
              zoneConfigs: loadZoneConfigs(db, tl8, xyToLngLat),
              regionBounds: loadRegionBoundaries(db, tl8, xyToLngLat),
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
          map(
            ({
              territories,
              zoneConfigs,
              gatherables,
              houses,
              vitals,
              vitalsTypes,
              vitalsCategories,
              regionBounds,
            }) => {
              return actions.loaded({
                ...territories,
                zoneConfigs,
                regionBounds,
                gatherables,
                houses,
                vitals,
                vitalsTypes,
                vitalsCategories,
              })
            },
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
    },
  }),
  withComputed(({ gatherables, mapId }) => {
    const db = injectNwData()
    const mapOptions = resourceValue({
      params: gatherables,
      loader: async ({ params }) => {
        return selectMapOptions({
          mapIds: selectMapIds(params),
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

function selectMapIds(gatherables: FilterDataSet[]) {
  const ids = new Set<string>()
  for (const item of gatherables) {
    for (const key in item.data) {
      ids.add(key)
    }
  }
  return Array.from(ids.values())
}

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
