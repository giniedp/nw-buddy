import { Matrix, Observable, TransformNode } from '@babylonjs/core'
import { fetchTypedRequest, getHeightmapInfoUrl, getLevelInfoUrl, getLevelMissionUrl, LevelInfo } from '@nw-serve'
import { GameEntityCollection, GameService, GameServiceContainer } from '../../ecs'
import { DebugMeshComponent } from '../components/debug-mesh-component'
import { LevelComponent } from '../components/level/level-component'
import { QuadTreeComponent, QuadTreeOptions } from '../components/quad-tree-component'
import { StaticMeshComponent } from '../components/static-mesh-component'
import { createChildTransform, TransformComponent } from '../components/transform-component'
import { ContentProvider } from './content-provider'
import { SceneProvider } from './scene-provider'

export class LevelProvider implements GameService {
  private entities = new GameEntityCollection()
  private content: ContentProvider

  private scene: SceneProvider
  public game: GameServiceContainer
  public terrainEnabled = true
  public terrainEnabledObserver = new Observable<boolean>()

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.content = game.get(ContentProvider)
    this.scene = game.get(SceneProvider)
    this.scene.main.onMeshImportedObservable
    this.scene.main.onMeshRemovedObservable
  }

  public destroy(): void {
    this.unloadLevel()
  }

  public setTerrainEnabled(value: boolean) {
    if (this.terrainEnabled === value) {
      return
    }
    this.terrainEnabled = value
    this.terrainEnabledObserver.notifyObservers(value)
  }

  public async loadLevel(name: string, mapName: string) {
    this.unloadLevel()
    if (!name) {
      return
    }
    const baseUrl = this.content.nwbtUrl
    const levelUrl = getLevelInfoUrl(name)
    const heightmapUrl = getHeightmapInfoUrl(name)
    const missionUrl = getLevelMissionUrl(name)

    const levelInfo = await fetchTypedRequest(baseUrl, levelUrl)
    const heightmapInfo = await fetchTypedRequest(baseUrl, heightmapUrl).catch((err) => {
      console.error('failed to load heightmap', err)
      return null
    })
    const missionInfo = await fetchTypedRequest(baseUrl, missionUrl).catch((err) => {
      console.error('failed to load mission', err)
      return null
    })

    const entity = this.entities.create()
    entity.addComponent(new TransformComponent({ name: `level - ${name}` }))
    entity.addComponent(new QuadTreeComponent(quadTreeOptions(levelInfo)))
    entity.addComponent(
      new LevelComponent({
        level: levelInfo,
        heightmap: heightmapInfo,
        mission: missionInfo,
      }),
    )
    this.entities.initialize(this.game)
    this.entities.activate()
  }

  /**
   * playgrond level for testing various things
   */
  public loadTestLevel() {
    this.unloadLevel()

    const scene = this.game.get(SceneProvider).main
    const root = new TransformNode('root', scene)
    root.position.set(0, 0, 0)

    const model = '/objects/nature/veg_bushes/bushes_jungle/swisscheese/jav_jgl_swisscheese_a.cgf'

    const transform = createChildTransform(root, 'mid', {
      matrix: Matrix.Translation(0, 0, 10),
    })

    const t = createChildTransform(transform, 'e1', {
      matrix: Matrix.Translation(0, 3, 0),
    })
    const m = t.getWorldMatrix()
    const mi = m.invertToRef(new Matrix())

    const instances = [Matrix.Translation(5, 0, 0), Matrix.Translation(-5, 0, 0)]
    // for (const instance of instances) {
    //   mi.multiplyToRef(instance, instance)
    // }

    this.entities.create().addComponents(
      new TransformComponent({
        transform: t,
      }),
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new StaticMeshComponent({
        model,
        instances: instances,
      }),
    )

    this.entities.initialize(this.game)
    this.entities.activate()
  }

  private unloadLevel() {
    this.entities.deactivate()
    this.entities.destroy()
  }
}

function quadTreeOptions(info: LevelInfo): QuadTreeOptions {
  if (!info.regions?.length) {
    return null
  }
  const min = { x: 0, y: 0 }
  const max = { x: 0, y: 0 }
  for (const region of info.regions) {
    max.x = Math.max(max.x, (1 + region.location[0]) * info.regionSize)
    max.y = Math.max(max.y, (1 + region.location[1]) * info.regionSize)
  }
  return {
    min,
    max,
    leafSize: 64,
  }
}
