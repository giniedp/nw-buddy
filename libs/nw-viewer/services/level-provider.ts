import { Matrix, TransformNode } from '@babylonjs/core'
import { DebugMeshComponent } from '@nw-viewer/components/debug-mesh-component'
import { LevelComponent } from '../components/level'
import { createChildTransform, TransformComponent } from '../components/transform-component'
import { GameEntityCollection, GameHost, GameSystem } from '../ecs'
import { LevelData } from '../level/types'
import { SceneProvider } from './scene-provider'

export class LevelProvider implements GameSystem {
  private entities = new GameEntityCollection()
  public game: GameHost
  public terrainDisabled = false

  public initialize(game: GameHost): void {
    this.game = game
  }

  public destroy(): void {
    this.unloadLevel()
  }

  public disableTerrain() {
    this.terrainDisabled
  }

  public loadLevel(data: LevelData) {
    this.unloadLevel()
    if (!data) {
      return
    }
    const entity = this.entities.create()
    entity.addComponent(new TransformComponent({ name: `level - ${data.meta.name}` }))
    entity.addComponent(new LevelComponent(data))
    this.entities.initialize(this.game)
    this.entities.activate()
  }

  /**
   * playgrond level for testing various things
   */
  public loadTestLevel() {
    this.unloadLevel()

    const scene = this.game.system(SceneProvider).main
    const root = new TransformNode('root', scene)
    root.position.set(0, 2, 5)

    const transform = createChildTransform(root, 'mid', {
      matrix: Matrix.Translation(0, 0, 10),
    })

    this.entities.create().addComponents(
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new TransformComponent({
        transform: createChildTransform(transform, 'e1', {
          matrix: Matrix.Translation(0, 0, 0),
        }),
      }),
    )

    this.entities.create().addComponents(
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new TransformComponent({
        transform: createChildTransform(transform, 'e1', {
          matrix: Matrix.Translation(2, 0, 0),
        }),
      }),
    )

    this.entities.create().addComponents(
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new TransformComponent({
        transform: createChildTransform(transform, 'e1', {
          matrix: Matrix.Translation(-2, 0, 0),
        }),
      }),
    )

    this.entities.create().addComponents(
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new TransformComponent({
        transform: createChildTransform(transform, 'e1', {
          matrix: Matrix.Translation(0, 0, 0),
          isAbsolute: true,
        }),
      }),
    )

    this.entities.create().addComponents(
      new DebugMeshComponent({ name: 'e1', type: 'sphere', size: 1 }),
      new TransformComponent({
        transform: createChildTransform(transform, 'e1', {
          matrix: Matrix.Translation(2, 0, 0),
          isAbsolute: true,
        }),
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
