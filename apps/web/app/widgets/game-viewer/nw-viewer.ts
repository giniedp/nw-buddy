import {
  AbstractEngine,
  ArcRotateCamera,
  AssetContainer,
  CreateBox,
  CubeTexture,
  Engine,
  GetExtensionFromUrl,
  HDRCubeTexture,
  ImageProcessingConfiguration,
  LoadAssetContainerAsync,
  Mesh,
  PBRMaterial,
  Scene,
  Texture,
  Vector3,
} from '@babylonjs/core'
import { Inspector } from '@babylonjs/inspector'
import { BehaviorSubject, defer, map, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { fromBjsObservable } from './utils'

export interface NwViewerOptions {
  canvas: HTMLCanvasElement
  rootUrl: string
}

export class NwViewer {
  public readonly engine: AbstractEngine
  public readonly camera: ArcRotateCamera

  public readonly skybox: Mesh
  public readonly skyboxEnabled$ = defer(() => {
    return fromBjsObservable(this.skybox.onEnabledStateChangedObservable)
      .pipe(startWith(this.skybox.isEnabled()))
      .pipe(shareReplayRefCount(1))
  })

  public readonly scene: Scene
  public readonly sceneCamera$ = defer(() => {
    return fromBjsObservable(this.scene.onActiveCameraChanged)
      .pipe(startWith(this.scene.activeCamera))
      .pipe(shareReplayRefCount(1))
  })
  public readonly envMapUrl$ = defer(() => this.#envMapUrl)
  public readonly envMapLoading$ = defer(() => this.#envMapLoading)

  public readonly groundUrl$ = defer(() => this.#groundUrl)

  public readonly imageConfig$ = defer(() => {
    return fromBjsObservable(this.scene.imageProcessingConfiguration.onUpdateParameters)
      .pipe(startWith(this.scene.imageProcessingConfiguration))
      .pipe(shareReplayRefCount(1))
  })

  public readonly imageExposure$ = this.imageConfig$.pipe(map((it) => it.exposure))
  public readonly imageContrast$ = this.imageConfig$.pipe(map((it) => it.contrast))
  public readonly imageTonemapping$ = this.imageConfig$.pipe(map((it) => it.toneMappingEnabled))
  public readonly imageTonemappingType$ = this.imageConfig$.pipe(map((it) => it.toneMappingType))
  public readonly imageToneMappingOptions = [
    { value: ImageProcessingConfiguration.TONEMAPPING_STANDARD, label: 'Standard' },
    { value: ImageProcessingConfiguration.TONEMAPPING_ACES, label: 'ACES' },
    { value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL, label: 'Neutral' },
  ]

  #groundAsset: AssetContainer = null
  #groundUrl = new BehaviorSubject<string>(null)//'assets/models/base.glb')
  #envMapUrl = new BehaviorSubject<string>('https://assets.babylonjs.com/textures/parking.env')
  #envMapLoading = new BehaviorSubject<boolean>(false)
  #dispose$ = new Subject<void>()
  public constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      depth: true,
      alpha: true,
      antialias: true,
      adaptToDeviceRatio: true,
    })
    this.scene = new Scene(this.engine)
    this.scene.clearColor.set(0, 0, 0, 1)
    this.scene.autoClear = true
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true
    this.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL
    this.scene.imageProcessingConfiguration.exposure = 1.0
    this.scene.imageProcessingConfiguration.contrast = 1.0

    this.camera = new ArcRotateCamera('Camera', 0, 0, 10, Vector3.Zero(), this.scene)
    this.camera.setTarget(new Vector3(0, 2, 0))
    this.camera.attachControl(canvas, true)
    this.camera.setPosition(new Vector3(0, 2, 10))
    this.camera.minZ = 0.01
    this.camera.lowerRadiusLimit = 1
    this.camera.upperRadiusLimit = 1000
    this.camera.wheelPrecision = 20
    this.skybox = createSkybox(this.scene)
    this.skybox.setEnabled(false)

    this.envMapUrl$
      .pipe(
        tap(() => this.#envMapLoading.next(true)),
        switchMap((url) => this.loadEnvMap(url).catch()),
        tap(() => this.#envMapLoading.next(false)),
        takeUntil(this.#dispose$),
      )
      .subscribe()

    this.groundUrl$
    .pipe(
      switchMap((url) => this.loadGround(url).catch()),
      takeUntil(this.#dispose$),
    ).subscribe()

    this.engine.runRenderLoop(() => {
      this.engine.resize()
      this.updateSkybox()
      this.scene.render()
    })
  }

  public setExposure(value: number) {
    this.scene.imageProcessingConfiguration.exposure = value
  }
  public setContrast(value: number) {
    this.scene.imageProcessingConfiguration.contrast = value
  }
  public setTonemapping(value: boolean) {
    this.scene.imageProcessingConfiguration.toneMappingEnabled = value
  }
  public setTonemappingType(value: number) {
    this.scene.imageProcessingConfiguration.toneMappingType = value
  }
  public setSkyboxEnabled(enabled: boolean) {
    this.skybox.setEnabled(enabled)
  }
  public setEnvMapUrl(url: string) {
    this.#envMapUrl.next(url)
  }

  private async loadEnvMap(url: string) {
    if (!url) {
      return
    }
    const envMap = await createCubeTexture(url, this.scene)
    envMap.level = 1.0

    const skyMat = this.skybox.material as PBRMaterial
    if (skyMat.reflectionTexture) {
      skyMat.reflectionTexture.dispose()
      skyMat.reflectionTexture = null
    }
    skyMat.reflectionTexture = envMap.clone()
    skyMat.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
    if (this.scene.environmentTexture) {
      this.scene.environmentTexture.dispose()
      this.scene.environmentTexture = null
    }
    this.scene.environmentTexture = envMap
  }

  private async loadGround(url: string) {
    if (!url) {
      return
    }
    const asset = await LoadAssetContainerAsync(url, this.scene)
    if (this.#groundAsset) {
      this.#groundAsset.removeFromScene()
      this.#groundAsset.dispose()
      this.#groundAsset = null
    }
    this.#groundAsset = asset
    this.#groundAsset.addToScene()
    this.#groundAsset.transformNodes[0].scaling.setAll(5)
    this.#groundAsset.transformNodes[0].position.set(0, -0.2, 0)
  }

  public showInspector(host: HTMLElement) {
    Inspector.Show(this.scene, {
      globalRoot: host,
    })
  }

  public dispose() {
    this.engine.dispose()
    this.scene.dispose()
    this.camera.dispose()
    this.#dispose$.next()
  }

  private updateSkybox() {
    const camera = this.camera
    this.skybox.scaling.setAll((camera.maxZ - camera.minZ) / 2)
  }
}

function createSkybox(scene: Scene): Mesh {
  const originalBlockMaterialDirtyMechanism = scene.blockMaterialDirtyMechanism
  scene.blockMaterialDirtyMechanism = true
  try {
    const hdrSkybox = CreateBox('hdrSkyBox', undefined, scene)
    const hdrSkyboxMaterial = new PBRMaterial('skyBox', scene)
    // Use the default image processing configuration on the skybox (e.g. don't apply tone mapping, contrast, or exposure).
    hdrSkyboxMaterial.imageProcessingConfiguration = new ImageProcessingConfiguration()
    hdrSkyboxMaterial.backFaceCulling = false

    hdrSkyboxMaterial.microSurface = 1.0 - 0.3
    hdrSkyboxMaterial.disableLighting = true
    hdrSkyboxMaterial.twoSidedLighting = true
    hdrSkybox.material = hdrSkyboxMaterial
    hdrSkybox.isPickable = false
    hdrSkybox.infiniteDistance = true

    return hdrSkybox
  } finally {
    scene.blockMaterialDirtyMechanism = originalBlockMaterialDirtyMechanism
  }
}

async function createCubeTexture(url: string, scene: Scene, extension?: string) {
  extension = extension ?? GetExtensionFromUrl(url)
  const instantiateTexture = await (async () => {
    if (extension === '.hdr') {
      return () =>
        new HDRCubeTexture(url, scene, 256, false, true, false, true, undefined, undefined, undefined, true, true)
    } else {
      return () => new CubeTexture(url, scene, null, false, null, null, null, undefined, true, extension, true)
    }
  })()

  const originalUseDelayedTextureLoading = scene.useDelayedTextureLoading
  try {
    scene.useDelayedTextureLoading = false
    return instantiateTexture()
  } finally {
    scene.useDelayedTextureLoading = originalUseDelayedTextureLoading
  }
}
