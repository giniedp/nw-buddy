import { BoundingInfo, Color4, Matrix, TransformNode, Vector3 } from '@babylonjs/core'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'

import { CapitalInfo, EntityInfo, ImpostorInfo } from '@nw-serve'
import { StaticMeshComponent } from '../static-mesh-component'
import { createChildTransform, TransformComponent } from '../transform-component'
import { CapitalComponent } from './capital-component'
import {
  LOAD_CAPITALS_AT,
  LOAD_IMPOSTORS_AT,
  SEGMENT_SIZE,
  SHOW_CAPITALS_AT,
  SHOW_IMPOSTORS_AT,
  ENABLE_IMPOSTORS,
  UNLOAD_AT,
  ENABLE_CAPITAL_INDICATOR,
} from './constants'

export type CapitalWitEntities = CapitalInfo & {
  matrix: Matrix
  entities: EntityInfo[]
}

export interface RegionSegmentOptions {
  level: string
  region: string
  centerX: number
  centerY: number
  impostors: ImpostorInfo[]
  capitals: CapitalWitEntities[]
}

export class RegionSegmentComponent implements GameComponent {
  public entity: GameEntity
  private transform: TransformComponent
  private level: string
  private region: string

  private capitalsLayer: TransformNode
  private capitalsLoaded: boolean = false
  private capitalsShown: boolean = false

  private impostorsLayer: TransformNode
  private impostorsLoaded: boolean = false
  private impostorsShown: boolean = false

  private indicator: DebugMeshComponent
  private color = new Color4(0.25, 0.25, 0.25, 0.2)

  private impostors = new GameEntityCollection()
  private capitals = new GameEntityCollection()
  private capitalIndicators = new GameEntityCollection()

  private data: RegionSegmentOptions
  private scene: SceneProvider

  public readonly centerX: number
  public readonly centerY: number

  public constructor(data: RegionSegmentOptions) {
    this.level = data.level
    this.region = data.region
    this.centerX = data.centerX
    this.centerY = data.centerY
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = this.entity.component(TransformComponent)
    this.capitalsLayer = this.transform.createChild('capitals')
    this.impostorsLayer = this.transform.createChild('impostors')
    this.capitalsLayer.setEnabled(false)
    this.impostorsLayer.setEnabled(false)

    this.transform.node.setEnabled(false)
    this.scene = entity.service(SceneProvider)
    this.indicator = entity.component(DebugMeshComponent, true)

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
      this.color.g = 0.5
      this.color.g = 0.5
    }
    if (this.capitals.length() > 0) {
      this.color.b = 0.5
      this.color.b = 0.5
    }

    this.impostors.initialize(entity.game)
    this.capitals.initialize(entity.game)
    this.capitalIndicators.initialize(entity.game)
  }

  public activate(): void {
    this.indicator?.setColor(this.color)
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
    this.updateSegmentState()
  }

  private updateSegmentState() {
    const camera = this.scene.main.activeCamera
    const cx = camera.position.x
    const cy = camera.position.z
    const dx = Math.abs(this.centerX - cx)
    const dy = Math.abs(this.centerY - cy)
    const d2 = dx * dx + dy * dy

    const unloadAt = UNLOAD_AT * UNLOAD_AT
    const loadCapitalsAt = LOAD_CAPITALS_AT * LOAD_CAPITALS_AT
    const loadImpostorsAt = LOAD_IMPOSTORS_AT * LOAD_IMPOSTORS_AT

    const showCapitalsAt = SHOW_CAPITALS_AT * SHOW_CAPITALS_AT
    const showImpostorsAt = SHOW_IMPOSTORS_AT * SHOW_IMPOSTORS_AT

    let alpha = this.color.a
    if ((this.capitalsLoaded || this.impostorsLoaded) && d2 >= unloadAt) {
      this.capitalsLoaded = false
      this.impostorsLoaded = false
      this.impostors.deactivate()
      this.capitals.deactivate()
    }
    if (!this.impostorsLoaded && d2 <= loadImpostorsAt) {
      this.impostorsLoaded = true
      this.impostors.activate()
    }
    if (!this.capitalsLoaded && d2 <= loadCapitalsAt) {
      this.capitalsLoaded = true
      this.capitals.activate()
    }

    if (this.impostorsShown && d2 >= showImpostorsAt) {
      this.impostorsShown = false
      this.impostorsLayer.setEnabled(false)
    }
    if (!this.impostorsShown && d2 <= showImpostorsAt) {
      this.impostorsShown = true
      this.impostorsLayer.setEnabled(true)
    }

    if (this.capitalsShown && d2 >= showCapitalsAt) {
      this.capitalsShown = false
      this.capitalsLayer.setEnabled(false)
    }
    if (!this.capitalsShown && d2 <= showCapitalsAt) {
      this.capitalsShown = true
      this.capitalsLayer.setEnabled(true)
    }

    if (this.impostorsShown && this.capitalsShown) {
      this.impostorsShown = false
      this.impostorsLayer.setEnabled(false)
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
    if (alpha != this.color.a) {
      this.color.a = alpha
      this.indicator?.setColor(this.color)
    }
  }

  private createImpostorEntity(impostor: ImpostorInfo) {
    if (!ENABLE_IMPOSTORS || !impostor.model) {
      return
    }
    const baseName = impostor.model.split('/').pop()
    const entity = this.impostors.create(baseName)
    entity.addComponents(
      new TransformComponent({
        transform: createChildTransform(this.impostorsLayer, baseName, {
          matrix: Matrix.Translation(impostor.position[0], 0, impostor.position[1]),
        }),
      }),
      new StaticMeshComponent({
        model: impostor.model,
      }),
    )
  }

  private createCapitalEntity(capital: CapitalWitEntities) {
    const index = this.capitals.length()

    const entityName = `${this.transform.node.name} - capital ${index} ${capital.id}`

    this.capitals.create(entityName).addComponents(
      new TransformComponent({
        transform: createChildTransform(this.capitalsLayer, entityName, {
          matrix: capital.matrix,
        }),
      }),
      new CapitalComponent(capital),
    )

    if (ENABLE_CAPITAL_INDICATOR) {
      this.capitalIndicators.create().addComponents(
        new TransformComponent({
          transform: createChildTransform(this.capitalsLayer, entityName, {
            matrix: capital.matrix,
          }),
        }),
        new DebugMeshComponent({
          name: entityName,
          type: 'sphere',
          size: capital.radius || 1,
          color: new Color4(1, 0.5, 1, 1),
        }),
      )
    }
  }
}
