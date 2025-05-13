import { Observable } from 'rxjs'
import { GameEntity, GameService, GameServiceContainer } from '../ecs'
import { StatsGroup } from './stats'

export abstract class ViewerBridge implements GameService {
  abstract cameraConnected: Observable<boolean>
  abstract cameraPosition: Observable<[number, number, number]>
  abstract setCameraPosition(x: number, y: number, z: number): void
  abstract setCameraMode(mode: 'free' | 'orbit'): void

  abstract terrainConnected: Observable<boolean>
  abstract terrainEnabled: Observable<boolean>
  abstract setTerrainEnabled(value: boolean): void

  abstract levelConnected: Observable<boolean>
  abstract currentLevel: Observable<string>
  abstract currentRegion: Observable<string>
  abstract currentSegment: Observable<string>
  abstract loadLevel(value: string, mapName: string): void

  abstract envMapConnected: Observable<boolean>
  abstract envMappedBackground: Observable<boolean>
  abstract setEnvMappedBackground(value: boolean): void
  abstract envMapUrl: Observable<string>
  abstract setEnvMapUrl(value: string): void

  abstract statsConnected: Observable<boolean>
  abstract stats: Observable<Record<string, string>>
  abstract statsPanel?: StatsGroup

  abstract initialize(host: GameServiceContainer): void
  abstract destroy(): void

  abstract reframeCameraOn(entity: GameEntity): void
  abstract createModelEntity(url: string, rootUrl: string, loaded: () => void): GameEntity

  abstract toggleDebug(): void
}
