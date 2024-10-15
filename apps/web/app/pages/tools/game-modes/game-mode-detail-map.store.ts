import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { inject } from '@angular/core'
import { patchState, signalStore, withState } from '@ngrx/signals'
import { GameModeData, VitalsBaseData } from '@nw-data/generated'
import { ScannedVital } from '@nw-data/scanner'
import { Feature, FeatureCollection, MultiPoint } from 'geojson'
import { uniq } from 'lodash'
import { EMPTY, catchError, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive, stringToColor } from '~/utils'
import { GameMapService } from '~/widgets/game-map'

export interface GameModeDetailMapState {
  mapId: string
  bounds: [number, number, number, number]
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
  vitals: FeatureCollection<MultiPoint, VitalsFeatureProperties>
}

export const GameModeDetailMapStore = signalStore(
  withState<GameModeDetailMapState>({
    mapId: '',
    vitals: null,
    bounds: null,
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ gameModId: string }>(),
        loadVitals: payload<{ vitals: VitalsBaseData[], mapId: string }>(),
      },
      private: {
        loadDone: payload<Pick<GameModeDetailMapState, 'mapId' | 'bounds'>>(),
        loadError: payload<{ error: any }>(),
        loadVitalsDone: payload<{ vitals: FeatureCollection<MultiPoint, VitalsFeatureProperties> }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.loadDone, (state, data) => {
        patchState(state, {
          ...data,
          isLoading: false,
          isLoaded: true,
        })
      })
      on(actions.loadError, (state, { error }) => {
        console.error(error)
        patchState(state, {
          isLoading: false,
          hasError: true,
        })
      })
      on(actions.loadVitalsDone, (state, { vitals }) => {
        patchState(state, {
          vitals,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      const mapService = inject(GameMapService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ gameModId }) => db.gameMode(gameModId)),
          map((data) => {
            actions.loadDone({
              mapId: data?.MapId?.toLowerCase(),
              bounds: selectWorldBounds(data, mapService),
            })
          }),
          catchError((error) => {
            actions.loadError({ error })
            return EMPTY
          }),
        ),
        loadVitals$: create(actions.loadVitals).pipe(
          switchMap(({ vitals, mapId }) => {
            return combineLatest({
              mapId: of(mapId),
              vitals: of(vitals),
              vitalsMetaMap: db.vitalsMetadataMap,
            })
          }),
          map(({ mapId, vitals, vitalsMetaMap }) => {
            return selectVitalsData({
              mapId,
              vitals,
              vitalsMetaMap,
              mapCoord: mapService.xyToLngLat,
            })
          }),
          map((vitals) => {
            actions.loadVitalsDone({ vitals })
          }),
          catchError((error) => {
            console.error(error)
            return EMPTY
          }),
        ),
      }
    },
  }),
)

function selectWorldBounds(game: GameModeData, service: GameMapService): [number, number, number, number] {
  if (!game?.WorldBounds) {
    return null
  }

  if (BOUNDS[game.GameModeId]) {
    const [x1, y1, x2, y2] = BOUNDS[game.GameModeId]
    return [service.xToLng(x1), service.yToLat(y1), service.xToLng(x2), service.yToLat(y2)]
  }

  const [x, y, w, h] = (game.WorldBounds?.split(',') || []).map(Number)
  return [service.xToLng(x), service.yToLat(y), service.xToLng(x + w), service.yToLat(y + h)]
}

const BOUNDS = {
  DungeonAmrine: [600, 550, 1000, 1000],
  DungeonShatteredObelisk: [300, 270, 1000, 730],
  DungeonRestlessShores01: [690, 800, 1300, 1400],
  DungeonEbonscale00: [4500, 4100, 5100, 4600],
  DungeonEdengrove00: [350, 1000, 900, 1600],
  DungeonReekwater00: [650, 550, 1000, 1000],
  DungeonCutlassKeys00: [270, 760, 700, 1200],
  DungeonGreatCleave01: [500, 200, 920, 670],
  DungeonShatterMtn00: [360, 450, 1600, 1300],
  DungeonBrimstoneSands00: [700, 820, 1370, 1500],
  DungeonFirstLight01: [490, 650, 960, 1200],
  DungeonGreatCleave00: [830, 440, 1260, 960],
  RaidCutlassKeys00: [540, 600, 1340, 1340],
}

export type MapCoord = (coord: number[] | [number, number]) => number[]

export type VitalsFeatureCollection = FeatureCollection<MultiPoint, VitalsFeatureProperties>
export type VitalsFeature = Feature<MultiPoint, VitalsFeatureProperties>
export interface VitalsFeatureProperties {
  id: string
  level: number
  type: string
  categories: string[]
  color: string
  size: number
}
function selectVitalsData(options: {
  mapId: string
  vitals: VitalsBaseData[]
  vitalsMetaMap: Map<string, ScannedVital>
  mapCoord: MapCoord
}): VitalsFeatureCollection {
  let featureId = 0

  const features: Record<string, Feature<MultiPoint, VitalsFeatureProperties>> = {}
  for (const item of options.vitals) {
    const meta = options.vitalsMetaMap.get(item.VitalsID)
    const lvlSpawns = meta?.spawns
    if (!lvlSpawns) {
      continue
    }
    const id = item.VitalsID.toLowerCase()
    const color = stringToColor(item.VitalsID)
    const type = (item.CreatureType || '').toLowerCase()
    for (const mapId in lvlSpawns) {
      if (!eqCaseInsensitive(options.mapId, mapId)) {
        continue
      }
      const spawns = lvlSpawns[mapId]
      for (const spawn of spawns) {
        const levels = spawn.l
        const position = spawn.p
        const categories = uniq(
          [...(item.VitalsCategories || []), ...(spawn.c || [])].map((it) => (it || '').toLowerCase()),
        )
        for (const level of levels) {
          const key = [id, level, categories.join()].join()
          if (!features[key]) {
            features[key] = {
              id: featureId++,
              type: 'Feature',
              geometry: {
                type: 'MultiPoint',
                coordinates: [],
              },
              properties: {
                id,
                level,
                color,
                categories,
                type,
                size: 0.65,
              },
            }
          }

          features[key].geometry.coordinates.push(options.mapCoord(position))
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: Object.values(features),
  }
}
