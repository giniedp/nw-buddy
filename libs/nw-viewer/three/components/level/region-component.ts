import { fetchTypedRequest, getRegionEntitiesUrl, getRegionInfoUrl, ImpostorInfo, RegionInfo } from '@nw-serve'
import { Box3, Color, Matrix4, Vector3 } from 'three'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { cryToGltfMat4 } from '../../../math/mat4'
import { ContentProvider } from '../../services/content-provider'
import { GridProvider } from '../../services/grid-provider'
import { RendererProvider } from '../../services/renderer-provider'
import { SceneProvider } from '../../services/scene-provider'
import { GridCellComponent } from '../grid-cell-component'
import { StaticShapeComponent } from '../static-shape-component'
import { TransformComponent } from '../transform-component'
import { REGION_VISIBILITY, SEGMENT_SIZE } from './constants'
import { CapitalWithEntities, ChunkWithEntities, EntityInfoWithPosition, SegmentComponent } from './segment-component'

export interface RegionComponentOptions {
  levelName: string
  regionName: string
  regionSize: number
  centerX: number
  centerY: number
  worldBounds: Box3
}

export class RegionComponent implements GameComponent {
  private three: RendererProvider
  private content: ContentProvider
  private scene: SceneProvider
  private transform: TransformComponent
  private segments = new GameEntityCollection()
  private isActive: boolean
  private isVisible: boolean
  private isLoaded: boolean
  private indicator: StaticShapeComponent
  private colorInvisible = new Color(0.1, 0.1, 0.1)
  private colorVisible = new Color(0.25, 0.25, 0.25)
  private worldBounds: Box3
  public readonly entity: GameEntity
  public readonly centerX: number
  public readonly centerY: number
  public readonly originX: number
  public readonly originY: number
  public readonly levelName: string
  public readonly regionName: string
  public readonly regionSize: number

  public constructor(data: RegionComponentOptions) {
    this.levelName = data.levelName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.originX = this.centerX + 0.5 * data.regionSize
    this.originY = this.centerY - 0.5 * data.regionSize
    this.worldBounds = data.worldBounds
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)
    this.three = entity.service(RendererProvider)
    this.scene = entity.service(SceneProvider)
    this.content = entity.service(ContentProvider)
    this.transform = entity.component(TransformComponent)
    this.indicator = entity.component(StaticShapeComponent, true)

    this.indicator?.setColor(this.colorInvisible)
  }

  public activate(): void {
    this.isActive = true
    this.three.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.isActive = false
    this.three.onUpdate.remove(this.update)
    this.segments.deactivate()
  }

  public destroy(): void {
    this.segments.destroy()
  }

  private update = () => {
    this.updateRegionActivity()
  }

  private updateRegionActivity() {
    const camera = this.scene.camera
    const cx = camera.position.x
    const cy = camera.position.z

    const regionSize = this.regionSize
    const visibleAt = regionSize * 0.5 + REGION_VISIBILITY
    const invisibleAt = regionSize * 0.5 + REGION_VISIBILITY + SEGMENT_SIZE
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)

    if (this.isVisible && (dx >= invisibleAt || dy >= invisibleAt)) {
      this.isVisible = false
      this.segments.deactivate()
      this.indicator?.setColor(this.colorInvisible)
    } else if (!this.isVisible && dx <= visibleAt && dy <= visibleAt) {
      this.isVisible = true
      this.segments.activate()
      this.indicator?.setColor(this.colorVisible)
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
    if (!this.isActive) {
      this.isLoaded = false
      return
    }
    console.log('region data loaded', this.levelName, this.regionName, {
      data,
      entities,
    })
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
        //   matrix: Matrix.FromArray(cryToGltfMat4(capital.transform)),
        //   entities: capEntities,
        // })
        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: new Matrix4().fromArray(cryToGltfMat4(item.transform)),
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
        //   matrix: Matrix.FromArray(cryToGltfMat4(chunk.transform)),
        //   entities: capEntities,
        // })
        for (const item of capEntities) {
          items.push({
            ...item,
            matrix: new Matrix4().fromArray(cryToGltfMat4(item.transform)),
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

    const originX = this.originX - x * SEGMENT_SIZE
    const originY = this.originY + y * SEGMENT_SIZE

    for (const impostor of data.impostors || []) {
      const position = impostor?.position
      if (!position) {
        continue
      }
      if (-position[0] >= originX || -position[0] < originX - SEGMENT_SIZE) {
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
      if (-position[0] >= originX || -position[0] < originX - SEGMENT_SIZE) {
        continue
      }
      if (position[1] < originY || position[1] >= originY + SEGMENT_SIZE) {
        continue
      }
      impostors.push(impostor)
    }
    const position = new Vector3()
    // for (const capital of capitalsTx || []) {
    //   capital.matrix.getTranslationToRef(position)
    //   if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   capitals.push(capital)
    // }
    // for (const chunk of chunksTx || []) {
    //   chunk.matrix.getTranslationToRef(position)
    //   if (position.x < originX || position.x >= originX + SEGMENT_SIZE) {
    //     continue
    //   }
    //   if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
    //     continue
    //   }
    //   chunks.push(chunk)
    // }

    for (const item of itemsTx || []) {
      position.setFromMatrixPosition(item.matrix)
      if (position.x >= originX || position.x < originX - SEGMENT_SIZE) {
        continue
      }
      if (position.z < originY || position.z >= originY + SEGMENT_SIZE) {
        continue
      }
      if (this.worldBounds && !this.worldBounds.containsPoint(position)) {
        continue
      }
      entities.push(item)
    }
    const centerX = originX - 0.5 * SEGMENT_SIZE
    const centerY = originY + 0.5 * SEGMENT_SIZE

    const segmentName = `segment ${x} ${y}`

    this.segments
      .create()
      .withServices(new GridProvider())
      .addComponents(
        new TransformComponent({
          name: segmentName,
          parent: this.transform.node,
          matrix: new Matrix4().setPosition(centerX, 0.1, centerY),
          matrixIsWorld: true,
        }),
        new GridCellComponent({
          color: 0x00ffff,
        }),
        new StaticShapeComponent({
          type: 'ground',
          scale: SEGMENT_SIZE - 1,
        }),
        new SegmentComponent({
          name: segmentName,
          level: this.levelName,
          region: this.regionName,
          impostors: impostors,
          capitals: capitals,
          chunks: chunks,
          entities: entities,
          centerX: centerX,
          centerY: centerY,
        }),
      )
  }
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}
