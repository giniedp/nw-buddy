import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { describeNodeSize, getGatherableNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { FeatureCollection, MultiPoint } from 'geojson'
import { EMPTY, catchError, combineLatest, map, of, switchMap } from 'rxjs'
import { GameMapService } from '~/widgets/game-map/game-map.service'
import { GatherableService } from '../gatherable/gatherable.service'
import { FilterSpecification } from 'maplibre-gl'

export interface GatherableDetailMapState {
  data: Record<string, GatherableMapData>
  mapId: string
  mapIds: string[]
  showHeatmap: boolean
  showRandomEncounter: boolean
  disabledSizes: string[]
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export interface GatherableMapData {
  mapId: string
  data: GatherableCollection
  sizeCount: Record<string, number>
}

export type GatherableCollection = FeatureCollection<MultiPoint, GatherableProperties>
export interface GatherableProperties {
  gatherableId: string
  variantId: string
  color: string
  size: number
  type: string
  name: string
  lootTable: string
  encounter: string
}

export const GatherableDetailMapStore = signalStore(
  withState<GatherableDetailMapState>({
    data: {},
    mapId: null,
    mapIds: [],
    showHeatmap: true,
    showRandomEncounter: false,
    disabledSizes: [],
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ ids: string[] }>(),
        selectMap: payload<{ mapId: string }>(),
        toggleHeatmap: noPayload,
        toggleSize: payload<{ size: string }>(),
        toggleRandomEncounter: noPayload,
      },
      private: {
        loaded: payload<{
          data: GatherableDetailMapState['data']
        }>(),
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
      on(actions.loaded, (state, { data }) => {
        data ||= {}
        const mapIds = Object.keys(data)
        patchState(state, {
          data: data,
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
      const gameMap = inject(GameMapService)
      const service = inject(GatherableService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ ids }) => loadGatherable({ gameMap, service, ids })),
          map((data) => {
            actions.loaded({ data })
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
    const mapData = computed(() => data()?.[mapId()]?.data)
    const bounds = computed(() => selectBounds(mapData()))
    const countData = computed(() => {
      const disabled = disabledSizes() || []
      const counter = data()?.[mapId()]?.sizeCount
      return getGatherableNodeSizes()
        .map((it) => {
          const props = describeNodeSize(it)
          return {
            size: it,
            count: counter?.[it] || 0,
            label: props.label,
            color: props.color,
            active: !disabled.includes(it),
          }
        })
        .filter((it) => it.count)
    })
    const filter = computed((): FilterSpecification => {
      const rows: FilterSpecification[] = []
      for (const size of disabledSizes()) {
        rows.push(['!=', ['get', 'type'], size])
      }
      if (!showRandomEncounter()) {
        rows.push(['!=', ['get', 'encounter'], 'random'])
      }
      if (rows.length === 0) {
        return null
      }

      return ['all', ...rows] as any
    })
    return {
      mapData,
      countData,
      bounds,
      filter,
    }
  }),
)

function loadGatherable({
  gameMap,
  service,
  ids,
}: {
  gameMap: GameMapService
  service: GatherableService
  ids: string[]
}) {
  return combineLatest({
    records: service.gatherables(of(ids)),
    chunks: service.positionChunks(of(ids)),
  }).pipe(
    map(({ records, chunks }) => {
      if (!records?.length) {
        return null
      }
      const result: Record<string, GatherableMapData> = {}
      for (const record of records) {
        const properties: GatherableProperties = {
          gatherableId: record.GatherableID,
          variantId: null,
          color: null,
          size: 1,
          type: null,
          name: record.DisplayName,
          lootTable: record.FinalLootTable,
          encounter: null,
        }
        if (record.$meta) {
          for (const { mapID, positions, encounter } of record.$meta.spawns) {
            if (!result[mapID]) {
              result[mapID] = {
                mapId: mapID,
                data: {
                  type: 'FeatureCollection',
                  features: [],
                },
                sizeCount: {},
              }
            }
            const size =
              getGatherableNodeSize(record.FinalLootTable) || getGatherableNodeSize(record.GatherableID) || 'Medium'
            const props = describeNodeSize(size)
            result[mapID].sizeCount[props.size] ||= 0
            result[mapID].sizeCount[props.size] += positions.length
            result[mapID].data.features.push({
              type: 'Feature',
              geometry: {
                type: 'MultiPoint',
                coordinates: positions.map((pos) => gameMap.xyToLngLat([pos[0], pos[1]])),
              },
              properties: {
                ...properties,
                variantId: null,
                color: props.color,
                size: props.scale,
                type: props.size,
                encounter,
              },
            })
          }
        }
        for (const variation of record.$variations || []) {
          for (const { LootTable } of variation.Gatherables || []) {
            for (const { mapID, positions, encounter } of variation.$meta?.spawns || []) {
              if (!result[mapID]) {
                result[mapID] = {
                  mapId: mapID,
                  data: {
                    type: 'FeatureCollection',
                    features: [],
                  },
                  sizeCount: {},
                }
              }
              const chunk = chunks.find((it) => it.chunk === positions.chunkID)
              const points = chunk.data.slice(positions.elementOffset, positions.elementOffset + positions.elementCount)
              const lootTable = LootTable[0] || record.FinalLootTable
              const size = getGatherableNodeSize(lootTable) || getGatherableNodeSize(record.GatherableID) || 'Medium'
              const props = describeNodeSize(size)
              result[mapID].sizeCount[props.size] ||= 0
              result[mapID].sizeCount[props.size] += points.length
              result[mapID].data.features.push({
                type: 'Feature',
                geometry: {
                  type: 'MultiPoint',
                  coordinates: points.map((pos) => gameMap.xyToLngLat([pos[0], pos[1]])),
                },
                properties: {
                  ...properties,
                  variantId: variation.VariantID,
                  color: props.color,
                  size: props.scale,
                  type: props.size,
                  encounter,
                  lootTable: lootTable,
                  name: variation.Name,
                },
              })
            }
          }
        }
      }
      return result
    }),
  )
}

function selectBounds(data: GatherableCollection): [number, number, number, number] {
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
