import { Color4, Scene } from '@babylonjs/core'
import { EngineProvider } from '@nw-viewer/services/engine-provider'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { Capital, Impostor, RegionMetadata } from '../../level/types'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { REGION_VISIBILITY, SEGMENT_SIZE } from '../level/constants'
import { TransformComponent } from '../transform-component'
import { RegionSegmentComponent } from './region-segment'

export interface RegionOptions extends RegionMetadata {
  centerX: number
  centerY: number
}

type ActivytState = 'active' | 'inactive'
export class RegionComponent implements GameComponent {
  private data: RegionMetadata
  private scene: Scene
  private engine: EngineProvider
  private segments = new GameEntityCollection()
  private transform: TransformComponent
  private state: ActivytState = 'inactive'
  private indicator: DebugMeshComponent
  private colorInactive = new Color4(0.25, 0.25, 0.25, 0.25)
  private colorActive = new Color4(0.25, 0.25, 0.25, 0.5)

  public entity: GameEntity
  public centerX: number
  public centerY: number
  public originX: number
  public originY: number

  public constructor(data: RegionOptions) {
    this.data = data
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.originX = this.centerX - 0.5 * this.data.mapSettings.regionSize
    this.originY = this.centerY - 0.5 * this.data.mapSettings.regionSize
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.game.system(SceneProvider).main
    this.engine = entity.game.system(EngineProvider)
    this.transform = entity.component(TransformComponent)
    this.indicator = entity.optionalComponent(DebugMeshComponent)
    const count = this.data.mapSettings.regionSize / SEGMENT_SIZE
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        this.createSegment(x, y)
      }
    }
    this.indicator?.setColor(this.colorInactive)
    this.segments.initialize(entity.game)
  }

  private createSegment(x: number, y: number) {
    const index = this.segments.length()
    const impostors: Impostor[] = []
    const capitals: Capital[] = []

    const originX = this.originX + x * SEGMENT_SIZE
    const originY = this.originY + y * SEGMENT_SIZE

    if (this.data.impostors) {
      for (const impostor of this.data.impostors) {
        if (impostor.worldPosition.x < originX || impostor.worldPosition.x > originX + SEGMENT_SIZE) {
          continue
        }
        if (impostor.worldPosition.y < originY || impostor.worldPosition.y > originY + SEGMENT_SIZE) {
          continue
        }
        impostors.push(impostor)
      }
    }
    if (this.data.poiImpostors) {
      for (const impostor of this.data.poiImpostors) {
        if (impostor.worldPosition.x < originX || impostor.worldPosition.x > originX + SEGMENT_SIZE) {
          continue
        }
        if (impostor.worldPosition.y < originY || impostor.worldPosition.y > originY + SEGMENT_SIZE) {
          continue
        }
        impostors.push(impostor)
      }
    }
    if (this.data.capitals) {
      for (const capital of this.data.capitals) {
        if (capital.worldPosition.x < originX || capital.worldPosition.x > originX + SEGMENT_SIZE) {
          continue
        }
        if (capital.worldPosition.y < originY || capital.worldPosition.y > originY + SEGMENT_SIZE) {
          continue
        }
        capitals.push(capital)
      }
    }
    const centerX = originX + 0.5 * SEGMENT_SIZE
    const centerY = originY + 0.5 * SEGMENT_SIZE

    const segmentName = `segment ${String(index).padStart(3, '0')}`
    this.segments.create().addComponents(
      new TransformComponent({
        transform: this.transform.createChild(segmentName),
        // just a "folder" transform, not affecting the segment assets
      }),
      new RegionSegmentComponent({
        impostors: impostors,
        capitals: capitals,
        centerX: centerX,
        centerY: centerY,
      }),
      new DebugMeshComponent({
        size: SEGMENT_SIZE * 0.99,
        type: 'ground',
        name: segmentName + ' outline',
        position: {
          x: centerX,
          y: 0.1,
          z: centerY,
        },
      }),
    )
  }

  public activate(): void {
    this.scene.getEngine().onBeginFrameObservable.add(this.update)
  }

  public deactivate(): void {
    this.scene.getEngine().onBeginFrameObservable.removeCallback(this.update)
    this.segments.deactivate()
  }

  public destroy(): void {
    this.segments.destroy()
  }

  private update = () => {
    this.updateRegionActivity()
  }

  private updateRegionActivity() {
    const camera = this.scene.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z

    const regionSize = this.data.mapSettings.regionSize
    const enableAt = regionSize * 0.5 + REGION_VISIBILITY
    const disableAt = regionSize * 0.5 + REGION_VISIBILITY + SEGMENT_SIZE
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)

    const active = this.state === 'active'
    if (active && (dx >= disableAt || dy >= disableAt)) {
      this.state = 'inactive'
      this.segments.deactivate()
      this.indicator?.setColor(this.colorInactive)
    } else if (!active && dx <= enableAt && dy <= enableAt) {
      this.state = 'active'
      this.segments.activate()
      this.indicator?.setColor(this.colorActive)
    }
  }
}
