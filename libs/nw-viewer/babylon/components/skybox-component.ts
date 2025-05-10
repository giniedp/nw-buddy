import {
  BaseTexture,
  CreateBox,
  ImageProcessingConfiguration,
  Mesh,
  PBRMaterial,
  Scene,
  Texture,
} from '@babylonjs/core'
import { defer, Subject, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../../ecs'
import { LightingProvider } from '../services/lighting-provider'
import { SceneProvider } from '../services/scene-provider'
import { fromBObservable } from '../utils'

export class SkyboxComponent implements GameComponent {
  #disable$ = new Subject<void>()
  private lighting: LightingProvider
  private scene: Scene
  private mesh: Mesh

  public entity: GameEntity
  public visible$ = defer(() => fromBObservable(this.mesh.onEnabledStateChangedObservable))

  public get material() {
    return this.mesh?.material
  }

  public setVisible(visible: boolean) {
    this.mesh?.setEnabled(visible)
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider).main
    this.lighting = entity.service(LightingProvider)
    this.mesh = createSkybox(this.scene)
  }

  public activate(): void {
    this.scene.onBeforeRenderObservable.add(this.update)
    this.lighting.skybox$.pipe(takeUntil(this.#disable$)).subscribe((enabled) => this.mesh.setEnabled(enabled))
    this.lighting.envMap$.pipe(takeUntil(this.#disable$)).subscribe((envMap) => this.replaceEnvMap(envMap))
  }

  public deactivate(): void {
    this.scene.onBeforeRenderObservable.removeCallback(this.update)
    this.#disable$.next()
    this.replaceEnvMap(null)
  }

  public destroy(): void {
    this.mesh?.dispose()
    this.mesh = null
  }

  private update = () => {
    const camera = this.scene.activeCamera
    if (camera) {
      this.mesh.scaling.setAll((camera.maxZ - camera.minZ) / 2)
    }
  }

  private replaceEnvMap(envMap: BaseTexture) {
    const skyMat = this.mesh.material as PBRMaterial
    if (skyMat.reflectionTexture) {
      skyMat.reflectionTexture.dispose()
      skyMat.reflectionTexture = null
    }
    if (envMap) {
      skyMat.reflectionTexture = envMap.clone()
      skyMat.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
    }
  }
}

function createSkybox(scene: Scene): Mesh {
  const originalBlockMaterialDirtyMechanism = scene.blockMaterialDirtyMechanism
  scene.blockMaterialDirtyMechanism = true
  try {
    const mesh = CreateBox('skybox', { width: 1, height: 1, depth: 1 }, scene)
    const material = new PBRMaterial('skyBox', scene)
    // Use the default image processing configuration on the skybox (e.g. don't apply tone mapping, contrast, or exposure).
    material.imageProcessingConfiguration = new ImageProcessingConfiguration()
    material.backFaceCulling = false

    material.microSurface = 1.0 - 0.3
    material.disableLighting = true
    material.twoSidedLighting = true
    mesh.material = material
    mesh.isPickable = false
    mesh.infiniteDistance = true
    mesh.alwaysSelectAsActiveMesh = true
    mesh.refreshBoundingInfo()

    return mesh
  } finally {
    scene.blockMaterialDirtyMechanism = originalBlockMaterialDirtyMechanism
  }
}
