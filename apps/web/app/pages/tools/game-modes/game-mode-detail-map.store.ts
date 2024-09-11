import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { inject } from '@angular/core'
import { patchState, signalStore, withState } from '@ngrx/signals'
import { GameModeData } from '@nw-data/generated'
import { EMPTY, catchError, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { GameMapService } from '~/widgets/game-map'

export interface GameModeDetailMapState {
  mapId: string
  bounds: [number, number, number, number]
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export const GameModeDetailMapStore = signalStore(
  withState<GameModeDetailMapState>({
    mapId: '',
    bounds: null,
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ gameModId: string }>(),
      },
      private: {
        loaded: payload<Pick<GameModeDetailMapState, 'mapId' | 'bounds'>>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.loaded, (state, data) => {
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
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      const mapService = inject(GameMapService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ gameModId }) => db.gameMode(gameModId)),
          map((data) => {
            actions.loaded({
              mapId: data?.MapId?.toLowerCase(),
              bounds: selectWorldBounds(data, mapService),
            })
          }),
          catchError((error) => {
            actions.loadError({ error })
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
