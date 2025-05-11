import { CanvasTexture, Sprite, SpriteMaterial } from 'three'
import { getVitalTypeMarker } from '../../../nw-data/common'
import { VitalsBaseData, VitalsCategoryData, VitalsLevelVariantData } from '../../../nw-data/generated'
import { VitalSpawnInfo } from '../../../nw-serve'
import { GameComponent, GameEntity } from '../../ecs'
import { NwDataProvider } from '../services/nw-data-provider'
import { SceneProvider } from '../services/scene-provider'
import { TransformComponent } from './transform-component'

export interface NameplateComponentOptions {
  vital: VitalSpawnInfo
}

const D1 = 40 * 40
const D2 = 45 * 45
const W = 200
const H = 120
const RATIO = W / H

export class NameplateComponent implements GameComponent {
  public entity: GameEntity
  private vital: VitalSpawnInfo
  private nwData: NwDataProvider
  private transform: TransformComponent

  private imageSrc = '/assets/icons/marker/marker_ai_level_bg_dungeon.png'
  private isActive = false
  private texture: CanvasTexture
  private material: SpriteMaterial
  private sprite: Sprite
  private scene: SceneProvider
  private maxDistance: number

  public constructor(options: NameplateComponentOptions) {
    this.vital = options.vital
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider)
    this.transform = entity.component(TransformComponent)
    this.nwData = entity.service(NwDataProvider, { optional: true })
  }

  public activate(): void {
    if (!this.nwData) {
      return
    }
    this.isActive = true
    this.loadData().then((data) => this.render(data))
    this.scene.renderer.onDraw.add(this.update)
  }

  public deactivate(): void {
    this.scene.renderer.onDraw.remove(this.update)
    this.isActive = false
    this.sprite?.removeFromParent()
    this.material?.dispose()
    this.texture?.dispose()
  }

  public destroy(): void {
    //
  }

  private update = () => {
    if (!this.sprite) {
      return
    }

    this.sprite.material.opacity = 1 - Math.max(0, Math.min(1, (this.transform.distanceSq - D1) / (D2 - D1)))
    this.sprite.visible = this.transform.distanceSq <= D2

    const scale = Math.min(10, Math.max(1, this.transform.distance / 5))
    this.sprite.scale.set(scale, scale / RATIO, scale)
  }

  private render(data: VitalData): void {
    if (!this.isActive) {
      return
    }

    const name = data.vitalName
    const level = String(data.vitalLevel)

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    if (data.image) {
      ctx.drawImage(data.image, 0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.font = '18px Caslon-Antique'
      ctx.textAlign = 'center'
      ctx.fillText(name, 0.5 * W, 0.3 * H)
    }

    ctx.fillStyle = 'white'
    ctx.font = '24px Caslon-Antique'
    ctx.textAlign = 'center'
    ctx.fillText(level, 0.5 * W, 0.5 * H + 12)

    this.texture = new CanvasTexture(canvas)
    this.material = new SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0, // will be set in update
    })

    this.sprite = new Sprite(this.material)
    this.sprite.scale.set(1, 1 / RATIO, 1)
    this.sprite.position.set(0, 2, 0)
    this.sprite.renderOrder = 999

    this.transform.node.add(this.sprite)
  }

  private async loadData(): Promise<VitalData> {
    const result: VitalData = {
      id: this.vital.vitalsId,
      vital: null,
      category: null,
      vitalName: '',
      categoryName: '',
      vitalLevel: null,
      image: null,
    }
    result.vital = await this.nwData.db.vitalsById(this.vital.vitalsId)
    result.category = await this.nwData.db.vitalsCategoriesById(this.vital.categoryId)

    if (result.vital) {
      result.vitalName = await this.nwData.tl8.getAsync(result.vital.DisplayName)
    }
    if (result.category) {
      result.categoryName = await this.nwData.tl8.getAsync(result.category.DisplayName)
    }
    if (result.vital) {
      result.image = await loadImage('/' + getVitalTypeMarker(result.vital))
    }

    result.vitalLevel = this.vital.level || result.vital.Level
    return result
  }
}

interface VitalData {
  id: string
  vital: VitalsBaseData & VitalsLevelVariantData
  category: VitalsCategoryData
  vitalName: string
  categoryName: string
  vitalLevel: number
  image: HTMLImageElement
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })
}
