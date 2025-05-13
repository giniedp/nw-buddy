import { Vector3 } from '@babylonjs/core'
import { BehaviorSubject } from 'rxjs'
import { statsGroup, ViewerBridge } from '../../common'
import { GameEntity, GameServiceContainer } from '../../ecs'
import { babylonToCryVec3, cryToBabylonVec3 } from '../../math/mat4'
import { ActionlistComponent } from '../components/actionlist-component'
import { SkinnedMeshComponent } from '../components/skinned-mesh-component'
import { reduceMeshesExtendsToBoundingInfo, reframeCamera } from '../utils'
import { EngineProvider } from './engine-provider'
import { LevelProvider } from './level-provider'
import { LightingProvider } from './lighting-provider'
import { SceneProvider } from './scene-provider'
import { Inspector } from '@babylonjs/inspector'

export class BabylonViewerBridge extends ViewerBridge {
  private host: GameServiceContainer
  private scene: SceneProvider
  private engine: EngineProvider
  private level: LevelProvider
  private lighting: LightingProvider

  private camPosVec = new Vector3()
  private camPosValue: [number, number, number] = [0, 0, 0]

  public readonly cameraConnected = new BehaviorSubject<boolean>(false)
  public readonly cameraPosition = new BehaviorSubject<[number, number, number]>([0, 0, 0])
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camPosValue[0] = x
    this.camPosValue[1] = y
    this.camPosValue[2] = z
    cryToBabylonVec3(this.camPosValue, this.camPosValue)
    this.scene.freeCamera.position.set(this.camPosValue[0], this.camPosValue[1], this.camPosValue[2])
    this.scene.freeCamera.update()
  }
  public setCameraMode(mode: 'free' | 'orbit'): void {
    switch (mode) {
      case 'free': {
        if (this.scene.main.activeCamera !== this.scene.freeCamera) {
          this.scene.main.activeCamera = this.scene.freeCamera
        }
        break
      }
      case 'orbit': {
        if (this.scene.main.activeCamera !== this.scene.arcRotateCamera) {
          this.scene.main.activeCamera = this.scene.arcRotateCamera
        }
        break
      }
    }
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
  }

  public readonly envMapConnected = new BehaviorSubject<boolean>(false)
  public readonly envMapUrl = new BehaviorSubject<string>('')
  public setEnvMapUrl(value: string): void {
    this.envMapUrl.next(value)
    this.lighting.load(value)
  }
  public readonly envMappedBackground = new BehaviorSubject<boolean>(false)
  public setEnvMappedBackground(value: boolean): void {
    this.envMappedBackground.next(value)
    this.lighting.setSkyboxEnabled(value)
  }

  public readonly statsConnected = new BehaviorSubject<boolean>(false)
  public readonly stats = new BehaviorSubject<Record<string, string>>({})
  public readonly statsPanel = statsGroup()

  public initialize(host: GameServiceContainer): void {
    this.host = host
    this.scene = host.get(SceneProvider)
    this.engine = host.get(EngineProvider)
    this.level = host.get(LevelProvider, { optional: true })
    this.lighting = host.get(LightingProvider, { optional: true })
    this.cameraConnected.next(true)
    this.envMapConnected.next(!!this.lighting)

    this.levelConnected.next(!!this.level)
    this.engine.engine.onBeginFrameObservable.add(this.update)
  }

  public destroy(): void {
    this.engine.engine.onBeginFrameObservable.removeCallback(this.update)
  }

  private update = () => {
    const x = this.camPosValue[0]
    const y = this.camPosValue[1]
    const z = this.camPosValue[2]
    this.scene.main.activeCamera.getWorldMatrix().getTranslationToRef(this.camPosVec)
    this.camPosVec.toArray(this.camPosValue)
    babylonToCryVec3(this.camPosValue, this.camPosValue)
    if (this.camPosValue[0] !== x || this.camPosValue[1] !== y || this.camPosValue[2] !== z) {
      this.cameraPosition.next(this.camPosValue)
    }
    this.statsPanel.update()
  }

  public createModelEntity(url: string, rootUrl: string, modelLoaded: () => void): GameEntity {
    const model = new SkinnedMeshComponent({
      url,
      rootUrl,
    })
    const actionlist = new ActionlistComponent({
      animationDatabase: null,
      defaultTags: [],
    })
    model.onDataLoaded.add(() => {
      modelLoaded()
    })

    const entity = this.host.createEntity()
    entity.addComponent(model)
    entity.addComponent(actionlist)
    setTimeout(() => {
      entity.initialize(this.host)
      entity.activate()
    })
    return entity
  }

  public reframeCameraOn(entity: GameEntity): void {
    const mesh = entity.component(SkinnedMeshComponent, true)
    if (mesh) {
      const extents = mesh.computeMaxExtents()
      const bounding = reduceMeshesExtendsToBoundingInfo(extents)
      const camera = this.scene.arcRotateCamera
      reframeCamera(camera, bounding)
    }
  }

  public toggleDebug(): void {
    if (Inspector.IsVisible) {
      Inspector.Hide()
      return
    }
    const scene = this.scene.main
    const host = scene.getEngine()._renderingCanvas.parentElement
    Inspector.Show(scene, {
      globalRoot: host.querySelector('#inspector'),
      embedMode: true,
    })
  }
}
