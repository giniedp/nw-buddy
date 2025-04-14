import { Color4, Matrix } from '@babylonjs/core'
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
type ActivytState = 'inactive' | 'ready' | 'active'
export class RegionSegmentComponent implements GameComponent {
  public entity: GameEntity
  private transform: TransformComponent
  private engine: EngineProvider
  private state: ActivytState = 'inactive'
  private indicator: DebugMeshComponent
  private colorInactive = new Color4(0.25, 0.25, 0.25, 0.2)
  private colorActive = new Color4(0.25, 0.25, 0.25, 0.5)

  private impostors = new GameEntityCollection()
  private capitals = new GameEntityCollection()
  private capitalIndicators = new GameEntityCollection()
  private capitalColorInactive = new Color4(1, 0, 1, 0.5)
  private capitalColorActive = new Color4(1, 1, 1, 0.5)

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
    this.indicator = entity.optionalComponent(DebugMeshComponent)

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

    if (this.impostors.length() > 0) {
      this.colorInactive.g = 0.5
      this.colorActive.g = 0.5
    }
    if (this.capitals.length() > 0) {
      this.colorInactive.b = 0.5
      this.colorActive.b = 0.5
    }

    this.impostors.initialize(entity.game)
    this.capitals.initialize(entity.game)
    this.capitalIndicators.initialize(entity.game)
  }

  public activate(): void {
    this.indicator?.setColor(this.colorInactive)
    this.scene.main.getEngine().onBeginFrameObservable.add(this.update)
    this.capitalIndicators.activate()
  }

  public deactivate(): void {
    this.scene.main.getEngine().onBeginFrameObservable.removeCallback(this.update)
    this.impostors.deactivate()
    this.capitals.deactivate()
    this.capitalIndicators.deactivate()
  }

  public destroy(): void {
    this.impostors.destroy()
    this.capitals.destroy()
    this.capitalIndicators.destroy()
  }

  private update = () => {
    this.updateSegmentActivity()
    this.updateCapitals()
  }

  private updateSegmentActivity() {
    const viewDistance = this.engine.viewDistance
    const camera = this.scene.main.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z

    const enableAt = viewDistance - SEGMENT_SIZE
    const disableAt = viewDistance

    const active = this.state === 'active'
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)
    if (active && (dx >= disableAt || dy >= disableAt)) {
      this.state = 'inactive'
      this.indicator?.setColor(this.colorInactive)
      this.impostors.deactivate()
    }
    if (!active && dx <= enableAt && dy <= enableAt) {
      this.state = 'active'
      this.indicator?.setColor(this.colorActive)
      this.impostors.activate()
    }
  }

  private updateCapitals() {
    const camera = this.scene.main.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z

    const enableAt = 1 * SEGMENT_SIZE
    const disableAt = enableAt + SEGMENT_SIZE

    for (let i = 0; i < this.capitals.length(); i++) {
      const entity = this.capitals.entities[i]
      const indicator = this.capitalIndicators.entities[i].optionalComponent(DebugMeshComponent)
      const transform = entity.component(TransformComponent)
      const dx = Math.abs(transform.node.position.x - cx)
      const dy = Math.abs(transform.node.position.z - cy)
      if (entity.active && (dx >= disableAt || dy >= disableAt)) {
        entity.deactivate()
        indicator?.setColor(this.capitalColorInactive)
      }
      if (!entity.active && dx <= enableAt && dy <= enableAt) {
        entity.activate()
        indicator?.setColor(this.capitalColorActive)
        //console.log('capital', entity.name, 'activated', this)
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
      new SliceAssetComponent({
        sliceName: capital.sliceName,
        slcieAssetId: capital.sliceAssetId,
      }),
    )
    this.capitalIndicators.create().addComponents(
      new TransformComponent({
        transform: this.transform.createChild(entity.name, {
          matrix: getCapitalTransformMatrix(capital),
        }),
      }),
      new DebugMeshComponent({
        name: entity.name,
        type: 'sphere',
        size: capital.footprint?.radius || 1,
        color: this.capitalColorInactive,
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
