import { Scene } from '@babylonjs/core'
import { EngineProvider } from '@nw-viewer/services/engine-provider'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { Capital, Impostor, RegionMetadata } from '../../level/types'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { SEGMENT_SIZE } from '../level/constants'
import { TransformComponent } from '../transform-component'
import { RegionSegmentComponent } from './region-segment'

export interface RegionOptions extends RegionMetadata {
  centerX: number
  centerY: number
}

export class RegionComponent implements GameComponent {
  private data: RegionMetadata
  private scene: Scene
  private engine: EngineProvider
  private segments = new GameEntityCollection()
  private transform: TransformComponent

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
    const count = this.data.mapSettings.regionSize / SEGMENT_SIZE
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        this.createSegment(x, y)
      }
    }
    this.segments.initialize(entity.game)
  }

  private createSegment(x: number, y: number) {
    const index = this.segments.length()
    const segment = this.segments.create()
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
    segment.addComponents(
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
        size: SEGMENT_SIZE,
        type: 'ground',
        name: segmentName + ' outline',
        position: {
          x: centerX,
          y: 0,
          z: centerY,
        },
      }),
    )
  }

  public activate(): void {
    this.scene.getEngine().onBeginFrameObservable.add(this.update)
    console.log('activate region', this.data.name, this)
  }

  public deactivate(): void {
    this.scene.getEngine().onBeginFrameObservable.removeCallback(this.update)
    this.segments.deactivate()
  }

  public destroy(): void {
    this.segments.destroy()
  }

  private update = () => {
    const viewDistance = this.engine.viewDistance
    const camera = this.scene.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z

    const enableAt = viewDistance - SEGMENT_SIZE
    const disableAt = viewDistance

    for (const entity of this.segments.entities) {
      const segment = entity.component(RegionSegmentComponent)
      const dx = Math.abs(segment.centerX - cx)
      const dy = Math.abs(segment.centerY - cy)
      if (entity.active && (dx >= disableAt || dy >= disableAt)) {
        entity.deactivate()
      }
      if (!entity.active && dx <= enableAt && dy <= enableAt) {
        entity.activate()
      }
    }
  }
}
