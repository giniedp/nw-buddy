import { Color4, Matrix, Scene, Vector3 } from '@babylonjs/core'
import { fetchTypedRequest, getRegionEntitiesUrl, getRegionInfoUrl, ImpostorInfo, RegionInfo } from '@nw-serve'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { cryToBabylonMat4 } from '../../../math/mat4'
import { ContentProvider } from '../../services/content-provider'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { TransformComponent } from '../transform-component'
import { REGION_VISIBILITY, SEGMENT_SIZE } from './constants'
import {
  CapitalWithEntities,
  ChunkWithEntities,
  EntityInfoWithPosition,
  RegionSegmentComponent,
} from './region-segment'

export interface RegionOptions {
  levelName: string
  regionName: string
  regionSize: number
  centerX: number
  centerY: number
}

export class RegionComponent implements GameComponent {
  // private data: RegionMetadata
  private scene: Scene
  private content: ContentProvider
  private segments = new GameEntityCollection()
  private transform: TransformComponent
  private isVisible: boolean
  private isLoaded: boolean
  private indicator: DebugMeshComponent
  private colorInactive = new Color4(0.25, 0.25, 0.25, 0.25)
  private colorActive = new Color4(0.25, 0.25, 0.25, 0.5)

  private levelName: string
  private regionName: string
  private regionSize: number
  public entity: GameEntity
  public centerX: number
  public centerY: number
  public originX: number
  public originY: number

  public constructor(data: RegionOptions) {
    this.levelName = data.levelName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.originX = this.centerX - 0.5 * data.regionSize
    this.originY = this.centerY - 0.5 * data.regionSize
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider).main
    this.content = entity.service(ContentProvider)
    this.transform = entity.component(TransformComponent)
    this.indicator = entity.component(DebugMeshComponent, true)

    this.indicator?.setColor(this.colorInactive)
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

    const regionSize = this.regionSize
    const enableAt = regionSize * 0.5 + REGION_VISIBILITY
    const disableAt = regionSize * 0.5 + REGION_VISIBILITY + SEGMENT_SIZE
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)

    if (this.isVisible && (dx >= disableAt || dy >= disableAt)) {
      this.isVisible = false
      this.segments.deactivate()
      this.indicator?.setColor(this.colorInactive)
    } else if (!this.isVisible && dx <= enableAt && dy <= enableAt) {
      this.isVisible = true
      this.segments.activate()
      this.indicator?.setColor(this.colorActive)
    }
    if (this.isVisible && !this.isLoaded) {
      this.isLoaded = true
      this.load()
    }
  }

  private async load() {
    const baseUrl = this.content.nwbtUrl
    const request = getRegionInfoUrl(this.levelName, this.regionName)
    const data = await fetchTypedRequest(baseUrl, request)
    const entities = await fetchTypedRequest(baseUrl, getRegionEntitiesUrl(this.levelName, this.regionName))
    //const distribution = await fetchTypedRequest(baseUrl, getRegionDistributionUrl(this.levelName, this.regionName))
    this.segments.clear()

    const capitals: CapitalWithEntities[] = []
    const chunks: ChunkWithEntities[] = []
    const items: EntityInfoWithPosition[] = []

    for (const layer of data.capitals || []) {
      for (const capital of layer.capitals || []) {
        const capEntities = entities?.[layer.name]?.[capital.id] || []
        if (capEntities.length === 0) {
          continue
        }
        // capitals.push({
        //   ...capital,
        //   matrix: Matrix.FromArray(cryToBabylonMat4(capital.transform)),
        //   entities: capEntities,
        // })
        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: Matrix.FromArray(cryToBabylonMat4(item.transform)),
          })
        }
      }

      for (const chunk of layer.chunks || []) {
        const capEntities = entities?.[layer.name]?.[chunk.id] || []
        if (capEntities.length === 0) {
          continue
        }
        // chunks.push({
        //   ...chunk,
        //   matrix: Matrix.FromArray(cryToBabylonMat4(chunk.transform)),
        //   entities: capEntities,
        // })
        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: Matrix.FromArray(cryToBabylonMat4(item.transform)),
          })
        }
      }
    }

    const count = this.regionSize / SEGMENT_SIZE
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        this.createSegment(x, y, data, capitals, chunks, items)
      }
    }
    this.segments.initialize(this.entity.game)
    if (this.isVisible) {
      this.segments.activate()
    }
  }

  private createSegment(
    x: number,
    y: number,
    data: RegionInfo,
    capitalsTx: CapitalWithEntities[],
    chunksTx: ChunkWithEntities[],
    itemsTx: EntityInfoWithPosition[],
  ) {
    const index = this.segments.length()
    const impostors: ImpostorInfo[] = []
    const capitals: CapitalWithEntities[] = []
    const chunks: ChunkWithEntities[] = []
    const entities: EntityInfoWithPosition[] = []

    const originX = this.originX + x * SEGMENT_SIZE
    const originY = this.originY + y * SEGMENT_SIZE

    for (const impostor of data.impostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
        continue
      }
      impostors.push(impostor)
    }

    for (const impostor of data.poiImpostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      if (position[0] < originX || position[0] >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
        continue
      }
      impostors.push(impostor)
    }
    const position = new Vector3()
    for (const capital of capitalsTx || []) {
      capital.matrix.getTranslationToRef(position)
      if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
        continue
      }
      capitals.push(capital)
    }
    for (const chunk of chunksTx || []) {
      chunk.matrix.getTranslationToRef(position)
      if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
        continue
      }
      chunks.push(chunk)
    }
    for (const item of itemsTx || []) {
      item.matrix.getTranslationToRef(position)
      if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
        continue
      }
      if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
        continue
      }
      entities.push(item)
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
        level: this.levelName,
        region: this.regionName,
        impostors: impostors,
        capitals: capitals,
        chunks: chunks,
        entities: entities,
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
}
