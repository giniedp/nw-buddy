import { CapitalInfo, ChunkInfo, EntityInfo, ImpostorInfo } from '@nw-serve'
import { Color, Matrix4, Vector3 } from 'three'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { GridProvider } from '../../services/grid-provider'
import { RendererProvider } from '../../services/renderer-provider'
import { SceneProvider } from '../../services/scene-provider'
import { GridCellComponent } from '../grid-cell-component'
import { StaticMeshComponent } from '../static-mesh-component'
import { StaticShapeComponent } from '../static-shape-component'
import { createTransform, Transform, TransformComponent } from '../transform-component'
import {
  ENABLE_IMPOSTORS,
  LOAD_CAPITALS_AT,
  LOAD_IMPOSTORS_AT,
  SHOW_CAPITALS_AT,
  SHOW_IMPOSTORS_AT,
  UNLOAD_AT,
} from './constants'
import { EntityGroupComponent } from './entity-group-component'

export type CapitalWithEntities = CapitalInfo & {
  matrix: Matrix4
  entities: EntityInfo[]
}

export type ChunkWithEntities = ChunkInfo & {
  matrix: Matrix4
  entities: EntityInfo[]
}

export type EntityInfoWithPosition = EntityInfo & {
  matrix: Matrix4
}

export interface ThreeRegionSegmentOptions {
  name: string
  level: string
  region: string
  centerX: number
  centerY: number
  impostors: ImpostorInfo[]
  capitals: CapitalWithEntities[]
  chunks: ChunkWithEntities[]
  entities: EntityInfoWithPosition[]
  distribution?: EntityInfo[]
}

const v3tmp = new Vector3()
const colTmp = new Color()
export class SegmentComponent implements GameComponent {
  private capitalsLayer: Transform
  // private capitalLayerNodes: Map<string, TransformNode>
  private capitalsLoaded: boolean = false
  private capitalsShown: boolean = false

  private impostorsLayer: Transform
  private impostorsLoaded: boolean = false
  private impostorsShown: boolean = false

  private indicator: StaticShapeComponent
  private color = new Color(0.15, 0.15, 0.15)
  private alpha = 0.1

  private impostors = new GameEntityCollection()
  private capitals = new GameEntityCollection()
  private capitalIndicators = new GameEntityCollection()
  private distribution = new GameEntityCollection()

  private data: ThreeRegionSegmentOptions
  private scene: SceneProvider
  private renderer: RendererProvider
  private transform: TransformComponent

  public readonly entity: GameEntity
  public readonly level: string
  public readonly region: string
  public readonly centerX: number
  public readonly centerY: number

  public constructor(data: ThreeRegionSegmentOptions) {
    this.level = data.level
    this.region = data.region
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)

    this.scene = entity.service(SceneProvider)
    this.renderer = entity.service(RendererProvider)
    this.transform = entity.component(TransformComponent)
    this.indicator = entity.component(StaticShapeComponent, true)

    this.capitalsLayer = createTransform({
      name: `capitals`,
      parent: this.transform.node,
      matrix: new Matrix4(),
      matrixIsWorld: true,
    })
    this.impostorsLayer = createTransform({
      name: `impostors`,
      parent: this.transform.node,
      matrix: new Matrix4(),
      matrixIsWorld: true,
    })

    this.createImpostors(this.data.impostors)
    this.createCapitals(this.data.capitals)
    this.createChunks(this.data.chunks)
    this.createEntities(this.data.entities)

    if (this.data.entities?.length) {
      this.color.r = 0.5
      this.color.r = 0.5
    }
    if (this.impostors.length() > 0) {
      this.color.g = 0.5
      this.color.g = 0.5
    }
    if (this.data.capitals?.length) {
      this.color.b = 0.5
      this.color.b = 0.5
    }

    this.impostors.initialize(entity.game)
    this.capitals.initialize(entity.game)
    this.distribution.initialize(entity.game)
    this.capitalIndicators.initialize(entity.game)
  }

  public activate(): void {
    this.indicator?.setColor(this.color)
    this.renderer.onUpdate.add(this.update)
    this.capitalIndicators.activate()
  }

  public deactivate(): void {
    this.renderer.onUpdate.remove(this.update)
    this.impostors.deactivate()
    this.capitals.deactivate()
    this.distribution.deactivate()
    this.capitalIndicators.deactivate()
  }

  public destroy(): void {
    this.impostors.destroy()
    this.capitals.destroy()
    this.distribution.destroy()
    this.capitalIndicators.destroy()
  }

  private update = () => {
    this.updateSegmentState()
  }

  private updateSegmentState() {
    this.scene.camera.getWorldPosition(v3tmp)
    const cx = v3tmp.x
    const cy = v3tmp.z
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)
    const d2 = dx * dx + dy * dy

    const unloadAt = UNLOAD_AT * UNLOAD_AT
    const loadCapitalsAt = LOAD_CAPITALS_AT * LOAD_CAPITALS_AT
    const loadImpostorsAt = LOAD_IMPOSTORS_AT * LOAD_IMPOSTORS_AT

    const showCapitalsAt = SHOW_CAPITALS_AT * SHOW_CAPITALS_AT
    const showImpostorsAt = SHOW_IMPOSTORS_AT * SHOW_IMPOSTORS_AT
    const hasEntities = this.data.entities?.length > 0

    let alpha = this.alpha
    if ((this.capitalsLoaded || this.impostorsLoaded) && d2 >= unloadAt) {
      this.capitalsLoaded = false
      this.impostorsLoaded = false
      this.impostors.deactivate()
      this.capitals.deactivate()
      this.distribution.deactivate()
    }
    if (!this.impostorsLoaded && d2 <= loadImpostorsAt) {
      this.impostorsLoaded = true
      this.impostors.activate()
    }
    if (!this.capitalsLoaded && d2 <= loadCapitalsAt) {
      this.capitalsLoaded = true
      this.capitals.activate()
      this.distribution.activate()
    }

    if (this.impostorsShown && d2 >= showImpostorsAt) {
      this.impostorsShown = false
      this.scene.main.remove(this.impostorsLayer)
    }
    if (!this.impostorsShown && d2 <= showImpostorsAt) {
      this.impostorsShown = true
      this.scene.main.attach(this.impostorsLayer)
    }

    if (this.capitalsShown && d2 >= showCapitalsAt) {
      this.capitalsShown = false
      this.scene.main.remove(this.capitalsLayer)
    }
    if (!this.capitalsShown && d2 <= showCapitalsAt) {
      this.capitalsShown = true
      this.scene.main.attach(this.capitalsLayer)
    }

    if (this.impostorsShown && this.capitalsShown && hasEntities) {
      this.impostorsShown = false
      this.scene.main.remove(this.impostorsLayer)
    }

    if (!this.capitalsLoaded && !this.impostorsLoaded) {
      alpha = 0.2
    }
    if (!this.capitalsLoaded && this.impostorsLoaded) {
      alpha = 0.4
    }
    if (this.impostorsShown) {
      alpha = 0.6
    }
    if (this.capitalsLoaded) {
      alpha = 0.8
    }
    if (this.capitalsShown) {
      alpha = 1.0
    }
    if (alpha != this.alpha) {
      colTmp.set(this.color.r, this.color.g, this.color.b)
      if (alpha == 0.2) {
        colTmp.setScalar(getGrayscale(colTmp.r, colTmp.g, colTmp.b))
      } else {
        colTmp.multiplyScalar(alpha)
      }
      this.alpha = alpha
      this.indicator?.setColor(colTmp)
    }
  }

  private createImpostors(impostor: ImpostorInfo[]) {
    if (!impostor?.length) {
      return
    }
    for (const item of impostor) {
      this.createImpostor(item)
    }
  }

  private createImpostor(impostor: ImpostorInfo) {
    if (!ENABLE_IMPOSTORS || !impostor.model) {
      return
    }

    const baseName = urlPathBasename(impostor.model)
    this.impostors
      .create(baseName)
      .addComponents(
        new TransformComponent({
          name: baseName,
          parent: this.impostorsLayer,
          matrix: new Matrix4().setPosition(-impostor.position[0], 0, impostor.position[1]),
          matrixIsWorld: true,
        }),
      )
      .addComponent(
        new StaticMeshComponent({
          model: impostor.model,
        }),
      )
  }

  private createCapitals(items: Array<CapitalWithEntities | ChunkWithEntities>) {
    if (!items?.length) {
      return
    }
    for (const item of items) {
      this.createCapital(item, `capital ${item.id}`)
    }
  }

  private createChunks(items: Array<CapitalWithEntities | ChunkWithEntities>) {
    if (!items?.length) {
      return
    }
    for (const item of items) {
      this.createCapital(item, `chunk ${item.id}`)
    }
  }

  private createCapital(capital: CapitalWithEntities | ChunkWithEntities, entityName: string) {
    // this.capitals.create(entityName).addComponents(
    //   new TransformComponent({
    //     transform: createChildTransform(this.capitalsLayer, entityName, {
    //       matrix: capital.matrix,
    //     }),
    //   }),
    //   new CapitalComponent(capital),
    // )
    // if (ENABLE_CAPITAL_INDICATOR) {
    //   let size = 1
    //   let color = new Color4(1, 0.5, 1, 1)
    //   let shape: 'sphere' | 'box' = 'sphere'
    //   if ('radius' in capital) {
    //     size = capital.radius || 1
    //   }
    //   if ('size' in capital) {
    //     size = capital.size || 1
    //     shape = 'box'
    //   }
    //   this.capitalIndicators.create().addComponents(
    //     new TransformComponent({
    //       transform: createChildTransform(this.capitalsLayer, entityName, {
    //         matrix: capital.matrix,
    //       }),
    //     }),
    //     new DebugMeshComponent({
    //       name: entityName,
    //       type: shape,
    //       size: size,
    //       color: color,
    //     }),
    //   )
    // }
  }

  private createEntities(entities: EntityInfoWithPosition[]) {
    if (!entities?.length) {
      return
    }
    const entityName = 'entities'
    this.capitals
      .create(entityName)

      .addComponents(
        new TransformComponent({
          name: entityName,
          parent: this.capitalsLayer,
          matrix: new Matrix4(),
        }),
        new EntityGroupComponent({
          entities,
        }),

      )
  }
}

function urlPathBasename(url: string) {
  if (url.includes('?')) {
    url = url.split('?')[0]
  }
  if (url.includes('#')) {
    url = url.split('#')[0]
  }
  return url.split('/').pop()
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}

function getGrayscale(r:number, g:number, b:number) {
  return r * 0.3 + g * 0.59 + b * 0.11
}
