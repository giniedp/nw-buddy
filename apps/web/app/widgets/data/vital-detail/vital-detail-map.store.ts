import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { describeNodeSize } from '@nw-data/common'
import { ScannedVital } from '@nw-data/generated'
import { Feature, FeatureCollection, MultiPoint } from 'geojson'
import { FilterSpecification } from 'maplibre-gl'
import { catchError, EMPTY, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { GameMapService } from '~/widgets/game-map'

export interface VitalDetailMapState {
  data: Record<string, VitalMapFeatureCollection>
  lookup: Record<string | number, VitalMapFeature>
  mapId: string
  mapIds: string[]
  showHeatmap: boolean
  showRandomEncounter: boolean
  hasRandomEncounter: boolean
  disabledSizes: string[]
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export type VitalMapFeatureCollection = FeatureCollection<MultiPoint, VitalMapFeatureProperties>
export type VitalMapFeature = Feature<MultiPoint, VitalMapFeatureProperties>
export interface VitalMapFeatureProperties {
  vitalId: string
  level: number
  color: string
  size: number
  encounter: string[]
  territories: number[]
  label: string
}

export const VitalDetailMapStore = signalStore(
  withState<VitalDetailMapState>({
    data: {},
    lookup: {},
    mapId: null,
    mapIds: [],
    showHeatmap: true,
    showRandomEncounter: false,
    hasRandomEncounter: false,
    disabledSizes: [],
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ id: string }>(),
        selectMap: payload<{ mapId: string }>(),
        toggleHeatmap: noPayload,
        toggleSize: payload<{ size: string }>(),
        toggleRandomEncounter: noPayload,
      },
      private: {
        loaded: payload<Pick<VitalDetailMapState, 'data' | 'hasRandomEncounter' | 'lookup'>>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.toggleHeatmap, (state) => {
        patchState(state, ({ showHeatmap }) => {
          return { showHeatmap: !showHeatmap }
        })
      })
      on(actions.toggleRandomEncounter, (state) => {
        patchState(state, ({ showRandomEncounter }) => {
          return { showRandomEncounter: !showRandomEncounter }
        })
      })
      on(actions.toggleSize, (state, { size }) => {
        patchState(state, ({ disabledSizes }) => {
          const index = disabledSizes.indexOf(size)
          if (index >= 0) {
            disabledSizes = disabledSizes.filter((it) => it !== size)
          } else {
            disabledSizes = [...disabledSizes, size]
          }
          return { disabledSizes }
        })
      })
      on(actions.selectMap, (state, { mapId }) => {
        patchState(state, { mapId })
      })
      on(actions.loaded, (state, data) => {
        const mapIds = Object.keys(data.data)
        patchState(state, {
          ...data,
          mapIds: mapIds,
          mapId: mapIds[0],
          isLoaded: true,
          isLoading: false,
          hasError: false,
        })
      })
      on(actions.loadError, (state, { error }) => {
        patchState(state, {
          data: null,
          isLoaded: true,
          isLoading: false,
          hasError: true,
        })
      })
    },
    effects(actions, create) {
      const service = inject(GameMapService)
      const db = injectNwData()
      return {
        load$: create(actions.load).pipe(
          switchMap(async ({ id }) => {
            return loadVitalData(service, await db.vitalsMetadataById(id))
          }),
          map(({ data, lookup, hasRandomEncounter }) => {
            actions.loaded({ data, lookup, hasRandomEncounter })
            return null
          }),
          catchError((error) => {
            console.error(error)
            actions.loadError({ error })
            return EMPTY
          }),
        ),
      }
    },
  }),
  withComputed(({ data, mapId, disabledSizes, showRandomEncounter }) => {
    const mapData = computed(() => data()?.[mapId()])
    const bounds = computed(() => selectBounds(mapData()))
    const filter = computed((): FilterSpecification => {
      const rows: FilterSpecification[] = []
      if (!showRandomEncounter()) {
        rows.push(['!', ['in', 'random', ['get', 'encounter']]])
      }
      if (rows.length === 0) {
        return null
      }

      return ['all', ...rows] as any
    })
    return {
      mapData,
      bounds,
      filter,
    }
  }),
)

function loadVitalData(gameMap: GameMapService, meta: ScannedVital) {
  const index: Record<string, Record<number, VitalMapFeature>> = {}
  const lookup: Record<string | number, VitalMapFeature> = {}
  const color = describeNodeSize('Medium').color
  let hasRandomEncounter = false
  let featureId = 0
  for (const [mapId, spawns] of Object.entries(meta?.spawns || {})) {
    index[mapId] ||= {}
    const mapData = index[mapId]
    for (const spawn of spawns) {
      const levels = [...spawn.l]
      if (levels.length === 0) {
        levels.push(0)
      }
      for (const level of levels) {
        hasRandomEncounter ||= spawn.e.includes('random')
        mapData[level] ||= {
          id: featureId++,
          type: 'Feature',
          geometry: {
            type: 'MultiPoint',
            coordinates: [],
          },
          properties: {
            vitalId: meta.vitalsID,
            level: level,
            color: color,
            size: 1,
            encounter: spawn.e,
            territories: spawn.t || [],
            label: String(level),
          },
        }
        lookup[mapData[level].id] = mapData[level]
        mapData[level].geometry.coordinates.push(gameMap.xyToLngLat([spawn.p[0], spawn.p[1]]))
      }
    }
  }

  const result: Record<string, VitalMapFeatureCollection> = {}
  for (const [mapId, data] of Object.entries(index)) {
    result[mapId] = {
      type: 'FeatureCollection',
      features: Object.values(data),
    }
  }
  return {
    data: result,
    lookup,
    hasRandomEncounter,
  }
}

function selectBounds(data: VitalMapFeatureCollection): [number, number, number, number] {
  if (!data) {
    return null
  }
  let min: [number, number] = null
  let max: [number, number] = null
  for (const feature of data.features) {
    for (const [x, y] of feature.geometry.coordinates) {
      if (!min) {
        min = [x, y]
        max = [x, y]
      } else {
        min[0] = Math.min(min[0], x)
        min[1] = Math.min(min[1], y)
        max[0] = Math.max(max[0], x)
        max[1] = Math.max(max[1], y)
      }
    }
  }
  if (min[0] === max[0] || min[1] === max[1]) {
    min[0] -= 0.0001
    min[1] -= 0.0001
    max[0] += 0.0001
    max[1] += 0.0001
  }
  return [min[0], min[1], max[0], max[1]]
}
