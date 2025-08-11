import {
  AbstractMesh,
  AnimationGroup,
  ArcRotateCamera,
  AssetContainer,
  Color3,
  Color4,
  CubeTexture,
  DefaultRenderingPipeline,
  Engine,
  ImportMeshAsync,
  ISceneLoaderAsyncResult,
  IShadowLight,
  LoadAssetContainerAsync,
  PBRMaterial,
  PointLight,
  Quaternion,
  Scalar,
  Scene,
  ShadowGenerator,
  Skeleton,
  Tags,
  Tools,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { DyeColorData } from '@nw-data/generated'

import { IGLTFLoaderData } from '@babylonjs/loaders'
import { NwMaterialExtension, NwMaterialPlugin, updateNwMaterial } from '@nw-viewer/babylon/extensions'
import { getModelUrl } from '../utils/get-model-url'

export type TransmogModelSlot = 'level' | 'player' | 'head' | 'chest' | 'hands' | 'legs' | 'feet'
export type TransmogViewer = ReturnType<typeof createTransmogViewer>
export interface TransmogViewerContext {
  playerSkeleton: Skeleton
  models: Record<TransmogModelSlot, TransmogViewerModel>
  animationList: Array<{ name: string; file: string }>
  animationAssets: Record<string, Promise<AssetContainer>>
  animation: AnimationGroup
  skyEnabled: boolean
  envTexture: string
  envRotation: number
  timeOfDay: number
}
export interface TransmogViewerModel extends ISceneLoaderAsyncResult {
  slot: TransmogModelSlot
}

const IGNORED_MESHES = ['xray', 'head1_primitive1', , 'head1_primitive2']
export function createTransmogViewer(canvas: HTMLCanvasElement) {
  NwMaterialPlugin.register()

  const { scene, engine, camera, pipeline } = createScene(canvas)
  bindCandleLightFlicker(scene)
  bindGlowLayerPulse(scene, pipeline)
  bindCameraCenter(scene, camera)
  bindTimeOfDay(scene)

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
      const isIgnored = IGNORED_MESHES.some((it) => mesh.name?.toLowerCase()?.includes(it))
      if (isIgnored) {
        mesh.setEnabled(true)
      } else {
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

function createScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true)
  engine.getCaps().parallelShaderCompile = null
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio)

  const scene = new Scene(engine)
  scene.clearColor = new Color4(0, 0, 0, 1)
  scene.fogEnabled = true
  scene.fogColor = new Color3(0.192, 0.745, 1)
  scene.fogMode = 2
  scene.fogDensity = 0.01

  // scene.fogColor = new Color3(0, 0, 0)
  // scene.fogMode = 3
  // scene.fogStart = 4
  // scene.fogEnd = 10

  const camera = new ArcRotateCamera(
    'camera',
    (100 * Math.PI) / 180,
    (75 * Math.PI) / 180,
    2.5,
    new Vector3(0, 0.9, 0),
    scene,
  )
  camera.minZ = 0.1
  camera.maxZ = 100
  camera.wheelPrecision = 100
  camera.lowerRadiusLimit = 0.25
  camera.upperRadiusLimit = 3
  camera.panningAxis = new Vector3(0, 1, 0)
  camera.panningDistanceLimit = 0.8
  camera.panningOriginTarget = new Vector3(0, 1, 0)
  camera.attachControl(canvas, true)

  const envHdri = CubeTexture.CreateFromPrefilteredData(
    // 'https://playground.babylonjs.com/textures/environment.env',
    'https://playground.babylonjs.com/textures/parking.env',
    scene,
  )
  envHdri.rotationY = Math.PI
  envHdri.name = 'env'
  envHdri.gammaSpace = false
  scene.environmentTexture = envHdri
  scene.environmentIntensity = 0.001

  const pipeline = new DefaultRenderingPipeline('fx', true, scene, [camera], true)
  pipeline.fxaaEnabled = true
  pipeline.bloomEnabled = true
  pipeline.imageProcessingEnabled = true
  pipeline.imageProcessing.contrast = 1.2
  pipeline.imageProcessing.exposure = 1
  pipeline.grainEnabled = false
  pipeline.depthOfFieldEnabled = false
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
      envRotation: 0,
      skyEnabled: true,
      envTexture: 'https://playground.babylonjs.com/textures/parking.env',
      animationList: [],
      animationAssets: {},
      animation: null,
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

  let rootUrl = ''
  if (!isLevel && !isPlayer) {
    const source = getModelUrl(url)
    rootUrl = source.rootUrl
    url = source.modelUrl
  }

  let data: IGLTFLoaderData = null
  const loaded = await ImportMeshAsync(url, scene, {
    rootUrl,
    pluginOptions: {
      gltf: {
        onParsed: (loadedData) => {
          if (isPlayer) {
            data = loadedData
          }
        },
      },
    },
  })

  if (isPlayer) {
    context.animationList = data.json['extras']?.['animationList'] || []
  }

  context.models[slot] = {
    slot,
    ...loaded,
  }

  for (const mesh of loaded.meshes) {
    const isIgnored = IGNORED_MESHES.some((it) => mesh.name === it)
    if (isIgnored) {
      mesh.setEnabled(false)
      mesh.isVisible = false
    } else {
      Tags.AddTagsTo(mesh, slot)
    }
    mesh.receiveShadows = isLevel
  }
  for (const light of loaded.lights) {
    light.setEnabled(false)
  }

  if (isLevel) {
    for (const mesh of loaded.meshes) {
      if (mesh.material instanceof PBRMaterial) {
        mesh.material.environmentIntensity = 0
        if (mesh.material.transparencyMode) {
          mesh.material.needDepthPrePass = true
        }
      }
    }
    for (const light of scene.lights) {
      light.setEnabled(true)
      switch (light.name) {
        case 'Main': {
          light.intensity = 50
          light.shadowEnabled = true
          createShadowGenerator(light as any)
          break
        }
        case 'Fill1': {
          light.intensity = 5
          light.shadowEnabled = false
          break
        }
        case 'Fill2': {
          light.intensity = 10
          light.shadowEnabled = false
          break
        }
        case 'Candle': {
          light.intensity = 1
          light.shadowEnabled = false
          break
        }
      }
    }
    addShadowCaster(scene, context.models.player?.meshes)
    addShadowCaster(scene, context.models.head?.meshes)
    addShadowCaster(scene, context.models.chest?.meshes)
    addShadowCaster(scene, context.models.hands?.meshes)
    addShadowCaster(scene, context.models.legs?.meshes)
    addShadowCaster(scene, context.models.feet?.meshes)
    addShadowCaster(scene, loaded.meshes)
  } else {
    for (const mesh of loaded.meshes) {
      if (mesh.material) {
        mesh.material.fogEnabled = false
      }
    }
    addShadowCaster(scene, loaded.meshes)
  }

  if (isPlayer) {
    context.playerSkeleton = loaded.skeletons[0]
    const camera = scene.activeCamera as ArcRotateCamera
    camera.focusOn(loaded.meshes, true)
    camera.panningOriginTarget.set(camera.target.x, camera.panningOriginTarget.y, camera.target.z)
    camera.target.set(camera.target.x, camera.target.y + 0.25, camera.target.z)
  }
  if (isGear) {
    for (const model of Object.values(context.models)) {
      for (const mesh of model?.meshes || []) {
        mesh.skeleton = context.playerSkeleton
      }
    }
  }

  updatePositions(scene)
  playAnimation(scene, 'unarmed_idle')
  // playAnimation(scene, 'archetype_beast_patrol_idle')
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
  Quaternion.RotationAxisToRef(Vector3.Up(), Math.PI, rotation)

  for (const model of Object.values(context.models)) {
    if (!model) {
      continue
    }
    const root = model.meshes[0]
    if (!root) {
      continue
    }
    if (model.slot !== 'level') {
      root.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
      root.position.set(position.x, position.y, position.z)
    }
  }
}

function createShadowGenerator(light: IShadowLight) {
  const result = new ShadowGenerator(2048, light)
  result.bias = 0.0001
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
  const intensityMax = 1
  const updateMin = 100
  const updateMax = 150
  const tweenTime = 60

  let nextUpdate = 0
  let intensity = intensityMin

  scene.registerBeforeRender(() => {
    const light = scene.getLightByName('Candle') as PointLight
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
  const maxIntensity = 1

  let targetIntensity = 0
  scene.registerBeforeRender(() => {
    const step = scene.getEngine().getTimeStep()
    const target = Math.max(0.001, Math.min(1, context.timeOfDay))

    targetIntensity = Scalar.Lerp(minIntensity, maxIntensity, target)

    scene.environmentIntensity = Scalar.Lerp(scene.environmentIntensity, targetIntensity, step / tweenTime)
    scene.clearColor.r = 0
    scene.clearColor.g = 0
    scene.clearColor.b = 0
    scene.clearColor.a = 0
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

async function playAnimation(scene: Scene, name: string) {
  return
  const context = getContext(scene)
  const spec = context.animationList.find((it) => it.name === name)
  if (!spec) {
    return
  }
  const url = `https://cdn.nw-buddy.de/models/${spec.file}`
  if (!(name in context.animationAssets)) {
    context.animationAssets[name] = LoadAssetContainerAsync(url, scene, {})
  }
  context.animation?.stop()
  context.animation = null

  const asset = await context.animationAssets[name]
  const target = context.models.player.transformNodes
  context.animation = buildAnimationGroup(name, asset, target)
  context.animation.start(true)
}

function buildAnimationGroup(name: string, animationAsset: AssetContainer, target: Array<Node | TransformNode>) {
  const oldGroup = animationAsset?.animationGroups[0]
  if (!oldGroup) {
    return null
  }
  const transformNodes = getTransformNodes(target)
  const scene = transformNodes[0].getScene()
  const newGroup = new AnimationGroup(name, scene, 1, oldGroup.playOrder)
  newGroup['_from'] = oldGroup.from
  newGroup['_to'] = oldGroup.to
  newGroup['_speedRatio'] = oldGroup.speedRatio
  newGroup['_loopAnimation'] = oldGroup.loopAnimation
  newGroup['_isAdditive'] = oldGroup.isAdditive
  newGroup['_enableBlending'] = oldGroup.enableBlending
  newGroup['_blendingSpeed'] = oldGroup.blendingSpeed
  newGroup.metadata = oldGroup.metadata
  newGroup.mask = oldGroup.mask

  for (const anim of oldGroup.targetedAnimations) {
    const oldTarget = anim.target
    if (!(oldTarget instanceof TransformNode)) {
      continue
    }
    const controlId = getMeta(oldTarget.metadata, 'controllerId')
    const targetNodes = transformNodes.filter((it) => getMeta(it.metadata, 'controllerId') === controlId)
    for (const target of targetNodes) {
      newGroup.addTargetedAnimation(anim.animation, target)
    }
  }
  return newGroup
}

function getMeta<T>(extra: any, key: string) {
  return extra?.['gltf']?.['extras']?.[key]
}

function getTransformNodes(nodes: Array<Node | TransformNode>, result: TransformNode[] = []) {
  if (!nodes) {
    return result
  }
  for (const node of nodes) {
    if (node instanceof TransformNode) {
      result.push(node)
    }
    const children = node['_children']
    getTransformNodes(children, result)
  }
  return result
}
