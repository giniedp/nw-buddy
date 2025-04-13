import { Matrix } from '@babylonjs/core'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { Capital, Impostor } from '../../level/types'
import { cryToGltfMat4, mat4FromAzTransform } from '../../math/mat4'
import { EngineProvider } from '../../services/engine-provider'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { SEGMENT_SIZE } from '../level'
import { SliceAssetComponent } from '../slice/slice-asset-component'
import { StaticMeshComponent } from '../static-mesh-component'
import { TransformComponent } from '../transform-component'

export interface RegionSegmentOptions {
  centerX: number
  centerY: number
  impostors: Impostor[]
  capitals: Capital[]
}

export class RegionSegmentComponent implements GameComponent {
  public entity: GameEntity
  private transform: TransformComponent
  private engine: EngineProvider
  private impostors = new GameEntityCollection()
  private capitals = new GameEntityCollection()
  private data: RegionSegmentOptions
  private scene: SceneProvider
  public readonly centerX: number
  public readonly centerY: number

  public constructor(data: RegionSegmentOptions) {
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = this.entity.component(TransformComponent)
    this.scene = entity.game.system(SceneProvider)
    this.engine = entity.game.system(EngineProvider)

    if (this.data.impostors) {
      for (const impostor of this.data.impostors) {
        this.createImpostorEntity(impostor)
      }
    }
    if (this.data.capitals) {
      for (const capital of this.data.capitals) {
        this.createCapitalEntity(capital)
      }
    }

    this.impostors.initialize(entity.game)
    this.capitals.initialize(entity.game)
  }

  public activate(): void {
    this.scene.main.getEngine().onBeginFrameObservable.add(this.update)
    this.impostors.activate()
  }

  public deactivate(): void {
    this.scene.main.getEngine().onBeginFrameObservable.removeCallback(this.update)
    this.impostors.deactivate()
    this.capitals.deactivate()
  }

  public destroy(): void {
    this.impostors.destroy()
    this.capitals.destroy()
  }

  private update = () => {
    const camera = this.scene.main.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z

    const enableAt = 2 * SEGMENT_SIZE
    const disableAt = 3 * SEGMENT_SIZE

    for (const entity of this.capitals.entities) {
      const transform = entity.component(TransformComponent)
      const dx = Math.abs(transform.node.position.x - cx)
      const dy = Math.abs(transform.node.position.z - cy)
      if (entity.active && (dx >= disableAt || dy >= disableAt)) {
        entity.deactivate()
      }
      if (!entity.active && dx <= enableAt && dy <= enableAt) {
        entity.activate()
      }
    }
  }

  private createImpostorEntity(impostor: Impostor): GameEntity {
    const index = this.impostors.length()
    const entity = this.impostors.create()
    entity.name = `impostor ${String(index).padStart(3, '0')} ${impostor.meshAssetId}`
    entity.addComponents(
      new TransformComponent({
        transform: this.transform.createChild(entity.name, {
          matrix: Matrix.Translation(impostor.worldPosition.x, 0, impostor.worldPosition.y),
        }),
      }),
      new StaticMeshComponent({
        assetId: impostor.meshAssetId,
      }),
    )
    return entity
  }

  private createCapitalEntity(capital: Capital) {
    const index = this.capitals.length()
    const entity = this.capitals.create()
    entity.name = `capital ${index} ${capital.id}`
    entity.addComponents(
      new TransformComponent({
        transform: this.transform.createChild(entity.name, {
          matrix: getCapitalTransformMatrix(capital),
        }),
      }),
      new DebugMeshComponent({
        name: entity.name,
        type: 'sphere',
        size: capital.footprint?.radius || 1,
      }),
      new SliceAssetComponent({
        sliceName: capital.sliceName,
        slcieAssetId: capital.sliceAssetId,
      }),
    )
  }
}

function getCapitalTransformMatrix(capital: Capital) {
  const data: number[] = [
    // Rotation
    0, 0, 0, 1,
    // Scale
    1, 1, 1,
    // Translation
    0, 0, 0,
  ]
  if (capital.rotation) {
    data[0] = capital.rotation.x
    data[1] = capital.rotation.y
    data[2] = capital.rotation.z
    if (capital.rotation.w) {
      data[3] = capital.rotation.w
    }
  }
  if (capital.scale && capital.scale != 0) {
    data[4] = capital.scale
    data[5] = capital.scale
    data[6] = capital.scale
  }
  if (capital.worldPosition) {
    data[7] = capital.worldPosition.x
    data[8] = capital.worldPosition.y
    data[9] = capital.worldPosition.z
  }
  return Matrix.FromArray(cryToGltfMat4(mat4FromAzTransform(data)))
}
