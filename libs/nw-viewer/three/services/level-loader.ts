import {
  fetchTypedRequest,
  getHeightmapInfoUrl,
  getLevelInfoUrl,
  getLevelMissionUrl,
  LevelInfo,
  TimeOfDay,
} from '@nw-serve'

import { GameEntity, GameEntityCollection, GameService, GameServiceContainer } from '../../ecs'
import { IVec2 } from '../../math'
import { GridCellComponent } from '../components/grid-cell-component'
import { LevelComponent } from '../components/level/level-component'
import { TransformComponent } from '../components/transform-component'
import { ContentProvider } from './content-provider'
import { GridProvider } from './grid-provider'
import { SceneProvider } from './scene-provider'
import { time } from 'console'
import { Color, FogExp2 } from 'three'

export class LevelLoader implements GameService {
  private entities = new GameEntityCollection()
  private content: ContentProvider
  private scene: SceneProvider

  public readonly game: GameServiceContainer
  public readonly entity: GameEntity
  public terrainEnabled = true
  // public terrainEnabledObserver = new Observable<boolean>()

  public initialize(game: GameServiceContainer): void {
    setReadOnly(this, 'game', game)
    this.content = game.get(ContentProvider)
    this.scene = game.get(SceneProvider)
  }

  public destroy(): void {
    this.unloadLevel()
  }

  public setTerrainEnabled(value: boolean) {
    if (this.terrainEnabled === value) {
      return
    }
    this.terrainEnabled = value
    // this.terrainEnabledObserver.notifyObservers(value)
  }

  public async loadLevel(name: string) {
    this.unloadLevel()
    if (!name) {
      return
    }
    const baseUrl = this.content.nwbtUrl
    const levelUrl = getLevelInfoUrl(name)
    const heightmapUrl = getHeightmapInfoUrl(name)
    const missionUrl = getLevelMissionUrl(name)

    const levelInfo = await fetchTypedRequest(baseUrl, levelUrl)
    console.log('level info', levelInfo)

    const heightmapInfo = await fetchTypedRequest(baseUrl, heightmapUrl).catch((err) => {
      console.error('failed to load heightmap', err)
      return null
    })
    const missionInfo = await fetchTypedRequest(baseUrl, missionUrl).catch((err) => {
      console.error('failed to load mission', err)
      return null
    })
    const levelExtent = getLevelExtent(levelInfo)
    this.scene.installQuadTree(levelExtent.min, levelExtent.max)

    const level = this.entities
      .create()
      .withServices(new GridProvider())
      .addComponents(
        new TransformComponent({
          name: `Level ${name}`,
        }),
        new GridCellComponent({
          color: 0x00ff00,
        }),
        new LevelComponent({
          level: levelInfo,
          heightmap: heightmapInfo,
          mission: missionInfo,
        }),
      )

    setReadOnly(this, 'entity', level)
    this.updateFog(levelInfo.timeOfDay)
    this.entities.initialize(this.game)
    this.entities.activate()
  }

  private unloadLevel() {
    setReadOnly(this, 'entity', null)
    this.entities.deactivate()
    this.entities.destroy()
  }

  private updateFog(timeOfDay: TimeOfDay) {
    const scene = this.scene.main
    for (const v of timeOfDay?.variables || []) {
      if (v.name === 'Fog color' && v.color) {
        const color = v.color.split(',').map(Number)
        console.debug('fog color', color)
        scene.fog = new FogExp2(new Color(color[0], color[1], color[2]), 0.005)
        return
      }
    }
    scene.fog = null
  }
}

function getLevelExtent(info: LevelInfo): { min: IVec2; max: IVec2 } {
  if (!info.regions?.length) {
    return null
  }
  const min = { x: 0, y: 0 }
  const max = { x: 0, y: 0 }
  for (const region of info.regions) {
    max.x = Math.max(max.x, (1 + region.location[0]) * info.regionSize)
    max.y = Math.max(max.y, (1 + region.location[1]) * info.regionSize)
  }
  min.x = -min.x
  max.x = -max.x
  return {
    min,
    max,
  }
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}
