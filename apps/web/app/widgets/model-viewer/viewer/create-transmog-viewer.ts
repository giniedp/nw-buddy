import { DyeColorData } from '@nw-data/generated'
import {
  Skeleton,
  ISceneLoaderAsyncResult,
  Engine,
  Scene,
  Color4,
  ArcRotateCamera,
  Vector3,
  CubeTexture,
  DefaultRenderingPipeline,
  SceneLoader,
  Tags,
  Quaternion,
  IShadowLight,
  ShadowGenerator,
  PointLight,
  AbstractMesh,
  Tools,
  Scalar,
  Color3,
  ImportMeshAsync,
  LoadAssetContainerAsync,
} from '@babylonjs/core'
import { NwMaterialExtension } from './nw-material-extension'
import { registerNwMaterialPlugin } from './nw-material-plugin'
import { updateNwMaterial } from './nw-material-update'
import { environment } from 'apps/web/environments'

export type TransmogModelSlot = 'level' | 'player' | 'head' | 'chest' | 'hands' | 'legs' | 'feet'
export type TransmogViewer = ReturnType<typeof createTransmogViewer>
export interface TransmogViewerContext {
  playerSkeleton: Skeleton
  models: Record<TransmogModelSlot, TransmogViewerModel>
  timeOfDay: number
}
export interface TransmogViewerModel extends ISceneLoaderAsyncResult {
  slot: TransmogModelSlot
}

export function createTransmogViewer(canvas: HTMLCanvasElement) {
  registerNwMaterialPlugin()

  const { scene, engine, camera, pipeline } = createScene(canvas)
  bindCandleLightFlicker(scene)
  bindGlowLayerPulse(scene, pipeline)
  bindCameraCenter(scene, camera)
  bindTimeOfDay(scene)
  //scene.debugLayer.show()

  function useAppearance(
    tag: string,
    options: {
      dyeR: DyeColorData | null
      dyeG: DyeColorData | null
      dyeB: DyeColorData | null
      dyeA: DyeColorData | null
      debugMask: boolean
      dyeEnabled: boolean
      appearance: any
    },
  ) {
    updateAppearance(scene, tag, options)
  }

  function useModel(slot: TransmogModelSlot, url: string) {
    return loadModel(scene, url, slot)
  }

  function hideMeshes(tag: string, names: string[]) {
    const meshes = scene.getMeshesByTags(tag)
    if (!meshes.length) {
      return
    }
    for (const mesh of meshes) {
      if (!mesh.name?.toLowerCase()?.includes('shadowproxy')) {
        mesh.setEnabled(!names.includes(mesh.name))
      }
    }
  }

  // window.addEventListener('keyup', (e) => {
  //   const player = getContext(scene).models.player
  //   if (!player) {
  //     return
  //   }
  //   const animations = player.animationGroups
  //   const randomAnimation = animations[Math.floor(Math.random() * animations.length)]
  //   randomAnimation.play(false)
  // })

  function dispose() {
    engine.stopRenderLoop()
    scene.dispose()
    engine.dispose()
  }

  return {
    resize: () => engine.resize(),
    useModel,
    useAppearance,
    dispose,
    takeScreenshot: () => captureScreenshot(scene, canvas),
    hideMeshes,
    setTimeOfDay: (timeOfDay: number) => {
      const context = getContext(scene)
      context.timeOfDay = timeOfDay
    },
  }
}

const LIGHT_CONFIG = {
  SunLight: {
    intensity: 50,
    shadow: true,
  },
  AzothLight: {
    intensity: 1,
    shadow: true,
  },
  FillLight: {
    intensity: 0.1,
    shadow: false,
  },
  CandleLight: {
    intensity: 1,
    shadow: true,
  },
  Ibl: {
    intensity: 0.001,
    shadow: false,
  },
} as const

function createScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0, 0, 0, 1)

  const camera = new ArcRotateCamera(
    'camera',
    (245 * Math.PI) / 180,
    (75 * Math.PI) / 180,
    2,
    new Vector3(0, 1, 0),
    scene,
  )
  camera.minZ = 0.1
  camera.maxZ = 100
  camera.wheelPrecision = 100
  camera.lowerRadiusLimit = 0.25
  camera.upperRadiusLimit = 2.5
  camera.panningAxis = new Vector3(0, 1, 0)
  camera.panningDistanceLimit = 0.8
  camera.panningOriginTarget = new Vector3(0, 1, 0)
  camera.attachControl(canvas, true)

  const envHdri = CubeTexture.CreateFromPrefilteredData(
    'https://playground.babylonjs.com/textures/environment.env',
    scene,
  )
  envHdri.name = 'env'
  envHdri.gammaSpace = false
  scene.environmentTexture = envHdri
  scene.environmentIntensity = LIGHT_CONFIG.Ibl.intensity

  const pipeline = new DefaultRenderingPipeline('fx', true, scene, [camera], true)
  pipeline.fxaaEnabled = true
  pipeline.bloomEnabled = true
  pipeline.imageProcessingEnabled = true
  pipeline.imageProcessing.contrast = 1.2
  pipeline.imageProcessing.exposure = 1
  pipeline.grainEnabled = false
  pipeline.depthOfFieldEnabled = true
  pipeline.fxaaEnabled = true
  pipeline.glowLayerEnabled = true
  pipeline.glowLayer.intensity = 0.25

  scene.registerBeforeRender(() => {
    pipeline.depthOfField.focusDistance = Vector3.Distance(camera.position, camera.target) * 1000
    pipeline.depthOfField.focalLength = 50
  })

  engine.runRenderLoop(() => {
    scene.render()
  })

  return {
    engine,
    camera,
    scene,
    pipeline,
  }
}

function getContext(scene: Scene): TransmogViewerContext {
  return scene.getOrAddExternalDataWithFactory('transmog', (): TransmogViewerContext => {
    return {
      playerSkeleton: null,
      timeOfDay: 0,
      models: {
        level: null,
        player: null,
        head: null,
        chest: null,
        hands: null,
        legs: null,
        feet: null,
      },
    }
  })
}

async function loadModel(scene: Scene, url: string, slot: TransmogModelSlot) {
  unloadModel(scene, slot)
  if (!url) {
    return
  }

  const context = getContext(scene)
  const isPlayer = slot === 'player'
  const isLevel = slot === 'level'
  const isGear = !isPlayer && !isLevel

  let baseUrl = environment.modelsUrl + '/'
  if (isLevel || isPlayer) {
    baseUrl = ''
  } else {
    url = url.replace(/^\//, '')
  }

  const result = await ImportMeshAsync(url, scene, {
    rootUrl: baseUrl,
  })
  context.models[slot] = {
    slot,
    ...result,
  }

  for (const mesh of result.meshes) {
    Tags.AddTagsTo(mesh, slot)
    if (mesh.name?.toLowerCase()?.includes('shadowproxy')) {
      mesh.setEnabled(false)
    }
    mesh.receiveShadows = isLevel
  }
  for (const light of result.lights) {
    light.setEnabled(false)
  }

  if (isLevel) {
    for (const light of scene.lights) {
      createShadowGenerator(light as any)
      light.setEnabled(true)
      const config = LIGHT_CONFIG[light.name as keyof typeof LIGHT_CONFIG]
      if (config) {
        light.intensity = config.intensity
        light.shadowEnabled = config.shadow
      }
    }
    addShadowCaster(scene, context.models.player?.meshes)
    addShadowCaster(scene, context.models.head?.meshes)
    addShadowCaster(scene, context.models.chest?.meshes)
    addShadowCaster(scene, context.models.hands?.meshes)
    addShadowCaster(scene, context.models.legs?.meshes)
    addShadowCaster(scene, context.models.feet?.meshes)
    addShadowCaster(scene, result.meshes)
  } else if (!!context.models.level) {
    addShadowCaster(scene, result.meshes)
  }

  if (isPlayer) {
    context.playerSkeleton = result.skeletons[0]
    const camera = scene.activeCamera as ArcRotateCamera
    camera.focusOn(result.meshes, true)
    camera.panningOriginTarget.set(camera.target.x, camera.panningOriginTarget.y, camera.target.z)
    camera.target.set(camera.target.x, camera.target.y + 0.25, camera.target.z)
  }
  for (const model of Object.values(context.models)) {
    if (!model || model.slot === 'player' || model.slot === 'level') {
      continue
    }
    for (const mesh of model.meshes || []) {
      mesh.skeleton = context.playerSkeleton
    }
  }

  updatePositions(scene)
}

function unloadModel(scene: Scene, slot: TransmogModelSlot) {
  const context = getContext(scene)
  const model = context.models[slot]
  if (!model) {
    return
  }
  context.models[slot] = null
  removeShadowCaster(scene, model.meshes)
  for (const it of model.meshes || []) {
    it.dispose()
  }
  for (const it of model.lights || []) {
    it.dispose()
  }
  for (const it of model.skeletons || []) {
    it.dispose()
  }
}

const rotation = Quaternion.Identity()
function updatePositions(scene: Scene) {
  const context = getContext(scene)
  if (!context.models.player) {
    return
  }
  const position = context.models.player.meshes[0].position
  Quaternion.RotationAxisToRef(Vector3.Up(), 0, rotation)

  for (const model of Object.values(context.models)) {
    if (!model || model.slot === 'level') {
      continue
    }
    const root = model.meshes[0]
    if (root) {
      root.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
      root.position.set(position.x, position.y, position.z)
    }
  }
}

function createShadowGenerator(light: IShadowLight) {
  const result = new ShadowGenerator(1024, light)
  if (light instanceof PointLight) {
    result.usePoissonSampling = true
    result.transparencyShadow = true
  } else {
    result.useBlurCloseExponentialShadowMap = true
  }
  return result
}

function addShadowCaster(scene: Scene, meshes: AbstractMesh[]) {
  if (!meshes || !meshes.length) {
    return
  }
  for (const light of scene.lights) {
    const shadow = light.getShadowGenerator() as ShadowGenerator
    if (!shadow) {
      continue
    }
    for (const mesh of meshes) {
      shadow.removeShadowCaster(mesh)
      shadow.addShadowCaster(mesh)
    }
  }
}

function removeShadowCaster(scene: Scene, meshes: AbstractMesh[]) {
  if (!meshes || !meshes.length) {
    return
  }
  for (const light of scene.lights) {
    const shadow = light.getShadowGenerator() as ShadowGenerator
    if (!shadow) {
      continue
    }
    for (const mesh of meshes) {
      shadow.removeShadowCaster(mesh)
    }
  }
}

async function captureScreenshot(scene: Scene, canvas: HTMLCanvasElement) {
  const engine = scene.getEngine()
  let width = canvas.clientWidth
  let height = canvas.clientHeight
  // limit to 2k by keeping the aspect ratio
  if (width > 2000) {
    height = (height * 2000) / width
    width = 2000
  }

  return new Promise<string>((resolve, reject) => {
    try {
      Tools.CreateScreenshot(engine, scene.cameras[0], { width, height }, resolve)
    } catch (e) {
      reject(e)
    }
  })
}

function bindCandleLightFlicker(scene: Scene) {
  const intensityMin = 0.5
  const intensityMax = 0.75
  const updateMin = 100
  const updateMax = 150
  const tweenTime = 60

  let nextUpdate = 0
  let intensity = intensityMin

  scene.registerBeforeRender(() => {
    const light = scene.getLightByName('CandleLight') as PointLight
    if (!light) {
      return
    }

    light.intensity = Scalar.Lerp(light.intensity, intensity, scene.getEngine().getTimeStep() / tweenTime)
    const step = scene.getEngine().getTimeStep()
    nextUpdate -= step
    if (nextUpdate > 0) {
      return
    }

    nextUpdate = updateMin + Math.random() * (updateMax - updateMin)
    intensity = intensityMin + Math.random() * (intensityMax - intensityMin)
  })
}

function bindGlowLayerPulse(scene: Scene, pipeline: DefaultRenderingPipeline) {
  const intensityMin = 0.25
  const intensityMax = 0.5
  const periodTime = 3000
  let time = 0
  scene.registerBeforeRender(() => {
    time += scene.getEngine().getTimeStep()
    while (time > periodTime) {
      time -= periodTime
    }
    pipeline.glowLayer.intensity = Scalar.Lerp(
      intensityMin,
      intensityMax,
      0.5 + Math.sin((time / periodTime) * Math.PI * 2) / 2,
    )
  })
}

function bindCameraCenter(scene: Scene, camera: ArcRotateCamera) {
  const tweenTime = 1000
  scene.registerBeforeRender(() => {
    const context = getContext(scene)
    if (!context.models.player) {
      return
    }
    const position = context.models.player.meshes[0].position
    const target = camera.target
    const step = scene.getEngine().getTimeStep()
    camera.target.set(
      Scalar.Lerp(target.x, position.x, step / tweenTime),
      camera.target.y,
      Scalar.Lerp(target.z, position.z, step / tweenTime),
    )
  })
}

function bindTimeOfDay(scene: Scene) {
  const context = getContext(scene)
  const tweenTime = 1000
  const minIntensity = 0.001
  const maxIntensity = 0.75
  const minSky = Color3.FromHexString('#000000')
  const maxSky = Color3.FromHexString('#87ceeb')

  let targetIntensity = 0
  let targetSky = Color3.Black()
  scene.registerBeforeRender(() => {
    const step = scene.getEngine().getTimeStep()
    const target = Math.max(0.001, Math.min(1, context.timeOfDay))

    targetIntensity = Scalar.Lerp(minIntensity, maxIntensity, target)
    Color3.LerpToRef(minSky, maxSky, target, targetSky)

    scene.environmentIntensity = Scalar.Lerp(scene.environmentIntensity, targetIntensity, step / tweenTime)
    scene.clearColor.r = Scalar.Lerp(scene.clearColor.r, targetSky.r, step / tweenTime)
    scene.clearColor.g = Scalar.Lerp(scene.clearColor.g, targetSky.g, step / tweenTime)
    scene.clearColor.b = Scalar.Lerp(scene.clearColor.b, targetSky.b, step / tweenTime)
    scene.clearColor.a = 1
  })
}

function updateAppearance(
  scene: Scene,
  tag: string,
  options: {
    dyeR: DyeColorData | null
    dyeG: DyeColorData | null
    dyeB: DyeColorData | null
    dyeA: DyeColorData | null
    debugMask: boolean
    dyeEnabled: boolean
    appearance: any
  },
) {
  const meshes = scene.getMeshesByTags(tag)
  if (!meshes.length) {
    return
  }
  const dyeR = options.dyeR
  const dyeG = options.dyeG
  const dyeB = options.dyeB
  const dyeA = options.dyeA
  const appearance = options.appearance || NwMaterialExtension.getAppearance(meshes[0].material)
  updateNwMaterial({
    meshes: meshes,
    appearance: appearance,
    dyeR: dyeR?.ColorAmount,
    dyeROverride: dyeR?.ColorOverride,
    dyeRColor: dyeR?.Color,
    dyeG: dyeG?.ColorAmount,
    dyeGOverride: dyeG?.ColorOverride,
    dyeGColor: dyeG?.Color,
    dyeB: dyeB?.ColorAmount,
    dyeBOverride: dyeB?.ColorOverride,
    dyeBColor: dyeB?.Color,
    dyeA: dyeA?.SpecAmount,
    //dyeAOverride: dyeA?.SpecOverride,
    dyeAColor: dyeA?.SpecColor,
    glossShift: dyeA?.MaskGlossShift,
    debugMask: options.debugMask,
  })
}
