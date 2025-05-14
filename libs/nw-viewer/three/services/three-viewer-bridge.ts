import { BehaviorSubject, Observable } from 'rxjs'
import { Vector3 } from 'three'
import { statsGroup, ViewerBridge } from '../../common'
import { GameEntity, GameServiceContainer } from '../../ecs'
import { cryToGltfVec3 } from '../../math/mat4'
import { LevelLoader } from './level-loader'
import { RendererProvider } from './renderer-provider'
import { SceneProvider } from './scene-provider'
import { TransformComponent } from '../components/transform-component'
import { StaticMeshComponent } from '../components/static-mesh-component'

export class ThreeViewerBridge extends ViewerBridge {
  private host: GameServiceContainer
  private scene: SceneProvider
  private renderer: RendererProvider
  private level: LevelLoader

  private camPosVec = new Vector3()
  private camPosValue: [number, number, number] = [0, 0, 0]

  public readonly cameraConnected = new BehaviorSubject<boolean>(false)
  public readonly cameraPosition = new BehaviorSubject<[number, number, number]>([0, 0, 0])
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camPosValue[0] = x
    this.camPosValue[1] = y
    this.camPosValue[2] = z
    cryToGltfVec3(this.camPosValue, this.camPosValue)
    this.scene.camera.position.set(this.camPosValue[0], this.camPosValue[1], this.camPosValue[2])
    this.scene.camera.updateMatrixWorld()
  }
  public setCameraMode(mode: 'free' | 'orbit'): void {
    // TODO:
  }

  public readonly terrainConnected = new BehaviorSubject<boolean>(false)
  public readonly terrainEnabled = new BehaviorSubject<boolean>(false)
  public setTerrainEnabled(value: boolean): void {
    this.terrainEnabled.next(value)
    this.level.setTerrainEnabled(value)
  }

  public readonly levelConnected = new BehaviorSubject<boolean>(false)
  public readonly currentLevel = new BehaviorSubject<string>('')
  public readonly currentRegion = new BehaviorSubject<string>('')
  public readonly currentSegment = new BehaviorSubject<string>('')
  public async loadLevel(value: string, mapName: string) {
    this.currentLevel.next(value)
    this.currentRegion.next('')
    this.currentSegment.next('')
    await this.level.loadLevel(value, mapName)
    this.level.entity
  }

  public readonly envMapConnected = new BehaviorSubject<boolean>(false)
  public readonly envMapUrl = new BehaviorSubject<string>('')
  public setEnvMapUrl(value: string): void {
    this.envMapUrl.next(value)
    this.scene.loadEnvMap(value)
  }
  public readonly envMappedBackground = new BehaviorSubject<boolean>(false)
  public setEnvMappedBackground(value: boolean): void {
    this.envMappedBackground.next(value)
    this.scene.setEnvMapBackground(value)
  }

  public readonly statsConnected = new BehaviorSubject<boolean>(false)
  public readonly stats = new BehaviorSubject<Record<string, string>>({})
  public readonly statsPanel = statsGroup()

  public initialize(host: GameServiceContainer): void {
    this.host = host
    this.scene = host.get(SceneProvider)
    this.renderer = host.get(RendererProvider)
    this.level = host.get(LevelLoader, { optional: true })
    this.cameraConnected.next(!!this.level)
    this.envMapConnected.next(!!this.level)
    this.envMappedBackground.next(true)
    this.levelConnected.next(!!this.level)
    this.renderer.onDraw.add(this.update)
    this.statsConnected.next(true)
  }

  public destroy(): void {
    this.renderer.onUpdate.remove(this.update)
  }

  private update = () => {
    const x = this.camPosValue[0]
    const y = this.camPosValue[1]
    const z = this.camPosValue[2]
    this.scene.camera.getWorldPosition(this.camPosVec)
    this.camPosVec.toArray(this.camPosValue)
    cryToGltfVec3(this.camPosValue, this.camPosValue)
    if (this.camPosValue[0] !== x || this.camPosValue[1] !== y || this.camPosValue[2] !== z) {
      this.cameraPosition.next(this.camPosValue)
    }

    const frameTime = this.renderer.frameTime
    const stats = this.stats.value || {}
    stats['geometries'] = String(this.renderer.geometryCount)
    stats['textures'] = String(this.renderer.textureCount)
    stats['programs'] = String(this.renderer.programCount)
    stats['drawcalls'] = String(this.renderer.renderCalls)
    stats['time'] =
      `${this.renderer.updateTime.toFixed(2)} | ${this.renderer.drawTime.toFixed(2)} | ${frameTime.toFixed(0)}ms (${Math.round(1000 / frameTime)}fps)`
    this.stats.next(stats)
    this.statsPanel.update()
  }

  public createModelEntity(url: string, rootUrl: string, modelLoaded: () => void): GameEntity {
    const entity = new GameEntity()
    const transform = new TransformComponent({
      name: url,
    })
    const staticMesh = new StaticMeshComponent({
      model: url,
      rootUrl: rootUrl,
    })
    entity.addComponents(transform, staticMesh)
    staticMesh.onLoad.add(modelLoaded)
    setTimeout(() => {
      entity.initialize(this.host)
      entity.activate()
    })
    return entity
  }

  public reframeCameraOn(entity: GameEntity): void {
    //
  }

  public toggleDebug(): void {
    //
  }
}
