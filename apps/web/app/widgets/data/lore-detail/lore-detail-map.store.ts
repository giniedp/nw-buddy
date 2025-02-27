import { noPayload, payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { describeNodeSize } from '@nw-data/common'
import { LoreData } from '@nw-data/generated'
import { ScannedLore } from '@nw-data/generated'
import { Feature, FeatureCollection, MultiPoint } from 'geojson'
import { isEqual } from 'lodash'
import { FilterSpecification } from 'maplibre-gl'
import { catchError, combineLatest, EMPTY, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { GameMapService } from '~/widgets/game-map'
import { selectLoreList, selectLoreRoot, selectLoreTree } from './utils'

export interface LoreDetailMapState {
  items: LoreData[]
  itemsMetaMap: Map<string, ScannedLore>
  selectedId: string
  disabledIds: string[]
  mapId: string
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export interface LoreFeatureProperties {
  id: string
  root: string
  parent: string
  color: string
  label: string
  title: string
}

export type LoreFeature = Feature<MultiPoint, LoreFeatureProperties>
export type LoreFeatureCollection = FeatureCollection<MultiPoint, LoreFeatureProperties>

export const LoreDetailMapStore = signalStore(
  withState<LoreDetailMapState>({
    items: [],
    itemsMetaMap: new Map(),
    selectedId: null,
    disabledIds: [],
    mapId: null,
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: noPayload,
        select: payload<{ id: string }>(),
        selectMap: payload<{ mapId: string }>(),
        toggleId: payload<{ id: string }>(),
      },
      private: {
        loaded: payload<Pick<LoreDetailMapState, 'items' | 'itemsMetaMap'>>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.select, (state, { id }) => {
        patchState(state, {
          selectedId: id,
          disabledIds: [],
        })
      })
      on(actions.selectMap, (state, { mapId }) => {
        patchState(state, { mapId })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          disabledIds: [],
          isLoaded: true,
          isLoading: false,
          hasError: false,
        })
      })
      on(actions.loadError, (state) => {
        patchState(state, {
          isLoaded: true,
          isLoading: false,
          hasError: true,
        })
      })
      on(actions.toggleId, (state, { id }) => {
        patchState(state, ({ disabledIds }) => {
          disabledIds = [...disabledIds]
          const index = disabledIds.indexOf(id)
          if (index >= 0) {
            disabledIds.splice(index, 1)
          } else {
            disabledIds.push(id)
          }
          return {
            disabledIds,
          }
        })
      })
    },
    effects(actions, create) {
      const db = injectNwData()
      return {
        load$: create(actions.load).pipe(
          switchMap(() => {
            return combineLatest({
              items: db.loreItemsAll(),
              itemsMetaMap: db.loreItemsMetadataByIdMap(),
            })
          }),
          map((data) => {
            actions.loaded(data)
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
  withComputed(({ items, itemsMetaMap, selectedId }) => {
    const mapService = inject(GameMapService)
    const item = computed(() => items().find((it) => eqCaseInsensitive(it.LoreID, selectedId())), { equal: isEqual })
    const root = computed(() => selectLoreRoot(item(), items()), { equal: isEqual })
    const tree = computed(() => selectLoreTree(item(), items()))
    const list = computed(() => selectLoreList(tree()))
    const data = computed(() => {
      const result: Record<string, LoreFeatureCollection> = {}
      const props = describeNodeSize('Medium')
      let featureId = 0
      for (const item of list()) {
        const meta = itemsMetaMap().get(item.LoreID)
        for (const { mapID, positions } of meta?.spawns || []) {
          result[mapID] ||= {
            type: 'FeatureCollection',
            features: [],
          }
          result[mapID].features.push({
            id: featureId++,
            type: 'Feature',
            geometry: {
              type: 'MultiPoint',
              coordinates: positions.map((it) => mapService.xyToLngLat(it)),
            },
            properties: {
              id: item.LoreID,
              root: root().LoreID,
              parent: item.ParentID,
              color: props.color,
              label: String(item.Order),
              title: item.Title,
            },
          })
        }
      }
      return result
    })
    const mapIds = computed(() => Object.keys(data()))
    return {
      root,
      item,
      data,
      mapIds,
    }
  }),
  withComputed(({ data, mapId }) => {
    const mapData = computed(() => data()?.[mapId()])
    const bounds = computed(() => selectBounds(mapData()))
    return {
      mapData,
      bounds,
    }
  }),
  withComputed(({ disabledIds }) => {
    return {
      filter: computed((): FilterSpecification => {
        if (!disabledIds().length) {
          return null
        }
        return ['!', ['in', ['get', 'id'], ['literal', disabledIds()]]] as any
      }),
    }
  }),
)

function selectBounds(data: LoreFeatureCollection): [number, number, number, number] {
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
