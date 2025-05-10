import { N8AOPass } from 'n8ao'
import {
  Color,
  EquirectangularReflectionMapping,
  Frustum,
  HalfFloatType,
  Matrix4,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  Box3,
  Vector3,
  Box3Helper,
  FogExp2,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GameEntity, GameService, GameServiceContainer } from '../../ecs'
import { IVec2 } from '../../math'
import { QuadTree } from '../../math/quad-tree'
import { CameraComponent } from '../components/camera-component'
import { TransformComponent } from '../components/transform-component'
import { ThreeWASDComponent } from '../components/wasd-component'
import { RendererProvider } from './renderer-provider'

export class SceneProvider implements GameService {
  public game: GameServiceContainer
  public renderer: RendererProvider
  public main: Scene

  public camera: PerspectiveCamera
  private cameraEntity: GameEntity
  private cameraViewMatrix = new Matrix4()
  private cameraProjectionMatrix = new Matrix4()
  private cameraFrustum = new Frustum()

  private composer: EffectComposer
  private renderPass: RenderPass
  private n8aoPass: any
  private bloomPass: UnrealBloomPass
  private smaaPass: SMAAPass
  private outputPass: OutputPass

  private renderList: RenderList
  private quadTree: QuadTree<Object3D>
  private raycaster = new Raycaster()
  private rayOrigin = new Vector2()

  private envMapUrl = 'https://assets.babylonjs.com/textures/parking.hdr'
  private envMapBackground = true
  private envMap: Texture = null

  public initialize(game: GameServiceContainer) {
    this.game = game
    this.renderer = game.get(RendererProvider)
    this.main = new Scene()
    window['three_scene'] = this.main

    this.renderList = new RenderList()
    this.camera = new PerspectiveCamera(
      60, // fov
      2, // aspect
      0.1, // near
      10000, // far
    )
    this.camera.name = 'camera'
    this.createComposer()
    this.loadEnvMap(this.envMapUrl)

    this.renderer.onResize.add(this.onResize)
    this.renderer.onUpdate.add(this.onUpdate)
    this.renderer.onDraw.add(this.onDraw)

    this.cameraEntity = game
      .createEntity()
      .addComponent(new TransformComponent({ node: this.camera }))
      .addComponent(new CameraComponent(this.camera))
      .addComponent(new ThreeWASDComponent())
      //.addComponent(new OrbitComponent())
      .initialize(game)
      .activate()
  }

  public loadEnvMap(url: string) {
    this.envMapUrl = url
    if (!url) {
      this.updateEnvMap(null, false)
      return
    }
    new RGBELoader().load(url, (texture) => {
      this.updateEnvMap(texture, this.envMapBackground)
      if (this.envMap) {
        this.envMap.dispose()
      }
      this.envMap = texture
    })
  }

  public setEnvMapBackground(enabled: boolean) {
    this.envMapBackground = enabled
    this.updateEnvMap(this.envMap, enabled)
  }

  public destroy(): void {
    this.renderer.onDraw.remove(this.onDraw)
    this.renderer.onUpdate.remove(this.onUpdate)
    this.renderer.onResize.remove(this.onResize)
  }

  public installQuadTree(min: IVec2, max: IVec2) {
    this.quadTree = createQuadTree(min, max, 64)
    // this.quadTree.walk((node) => {
    //   const box = new Box3(
    //     new Vector3(node.min.x, node.min.y, node.min.z),
    //     new Vector3(node.max.x, node.max.y, node.max.z),
    //   )
    //   const boxHelper = new Box3Helper(box)
    //   this.main.add(boxHelper)
    // })
  }

  public uninstallQuadTree() {
    this.quadTree = null
  }

  private updateEnvMap(texture: Texture, showBackground: boolean) {
    if (texture) {
      texture.mapping = EquirectangularReflectionMapping
    }
    this.main.background = showBackground ? texture : null
    this.main.backgroundBlurriness = 0.5
    this.main.backgroundIntensity = 1.2
    this.main.environment = texture

    this.renderList.background = showBackground ? texture : null
    this.renderList.backgroundBlurriness = 0.5
    this.renderList.backgroundIntensity = 1.2
    this.renderList.environment = texture
  }

  private onUpdate = (dt: number) => {
    if (this.renderer.mouse.leftButtonJustPressed) {
      this.rayOrigin.set(this.renderer.mouse.state.normalizedX * 2 - 1, this.renderer.mouse.state.normalizedY * -2 + 1)
      this.raycaster.setFromCamera(this.rayOrigin, this.camera)

      const intersection = this.raycaster.intersectObject(this.main)
      if (intersection.length > 0) {
        console.log('pick result', intersection)
      }
    }
  }

  private onDraw = (dt: number) => {
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.main, this.camera)
    }

    // if (!this.quadTree) {
    //   this.renderer.render(this.main, this.camera)
    //   return
    // }
    // this.renderList.clear()
    // this.updateCameraFrustum()
    // this.collectTreeNodes(this.quadTree)
    // this.renderer.render(this.renderList, this.camera)
  }

  private collectTreeNodes(tree: QuadTree<Object3D>) {
    if (!this.cameraFrustum.intersectsBox(tree as any)) {
      return
    }
    for (const entry of tree.entries) {
      this.renderList.add(entry.value)
    }
    for (const child of tree.children) {
      this.collectTreeNodes(child)
    }
  }

  private updateCameraFrustum() {
    this.cameraViewMatrix.copy(this.camera.matrixWorldInverse)
    this.cameraProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.cameraViewMatrix)
    this.cameraFrustum.setFromProjectionMatrix(this.cameraProjectionMatrix)
  }

  private onResize = (width: number, height: number) => {
    this.resizeCamera(width, height)
    this.resizeComposer(width, height)
  }

  private resizeCamera(width: number, height: number) {
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  private createComposer(scene: Scene = this.main, camera: PerspectiveCamera = this.camera) {
    const width = this.renderer.clientWidth
    const height = this.renderer.clientHeight
    this.composer = new EffectComposer(this.renderer.renderer)
    // this.renderPass = new RenderPass(scene, camera)
    this.composer.setPixelRatio(window.devicePixelRatio)
    // this.composer.setPixelRatio(1) // use this with SSAA

    // https://github.com/N8python/n8ao
    this.n8aoPass = new N8AOPass(scene, camera, width, height)
    // this.n8aoPass = new N8AOPass(scene, camera, width, height)
    this.n8aoPass.configuration.aoRadius = 0.5
    this.n8aoPass.configuration.distanceFalloff = 2.0
    this.n8aoPass.configuration.intensity = 2.0
    this.n8aoPass.configuration.color = new Color(0, 0, 0)
    this.n8aoPass.configuration.gammaCorrection = false

    // this.n8aoPass.setDisplayMode("Split AO")
    // this.n8aoPass.setDisplayMode('Split')
    // this.n8aoPass.setDisplayMode('Combined')
    this.n8aoPass.setQualityMode('Ultra')

    this.smaaPass = new SMAAPass()

    this.bloomPass = new UnrealBloomPass(
      new Vector2(width, height),
      0.25, // strength
      0.05, // radius
      0.85, // threshold
    )

    // https://threejs.org/examples/?q=ssaa#webgl_postprocessing_ssaa
    // this.ssaaPass = new SSAARenderPass(scene, camera)
    // this.ssaaPass.sampleLevel = 1
    this.outputPass = new OutputPass()

    // https://threejs.org/examples/?q=tone#webgl_tonemapping
    this.renderer.renderer.toneMapping = NeutralToneMapping
    // this.renderer.renderer.toneMapping = ACESFilmicToneMapping
    // this.renderer.renderer.toneMapping = LinearToneMapping
    // this.renderer.renderer.toneMapping = CineonToneMapping
    this.renderer.renderer.toneMappingExposure = 1.2
    // None: NoToneMapping,
    // Linear: LinearToneMapping,
    // Reinhard: ReinhardToneMapping,
    // Cineon: CineonToneMapping,
    // ACESFilmic: ACESFilmicToneMapping,
    // AgX: AgXToneMapping,
    // Neutral: NeutralToneMapping,
    // Custom: CustomToneMapping

    if (this.renderPass) {
      this.composer.addPass(this.renderPass)
    }
    if (this.n8aoPass) {
      this.composer.addPass(this.n8aoPass)
    }

    if (this.bloomPass) {
      this.composer.addPass(this.bloomPass)
    }
    // if (this.ssaaPass) {
    //   this.composer.addPass(this.ssaaPass)
    // }
    if (this.smaaPass) {
      this.composer.addPass(this.smaaPass)
    }
    if (this.outputPass) {
      this.composer.addPass(this.outputPass)
    }
  }

  private resizeComposer(width: number, height: number) {
    this.composer?.setSize(width, height)
    this.renderPass?.setSize(width, height)
    this.n8aoPass?.setSize(width, height)
    this.smaaPass?.setSize(width, height)
    this.bloomPass?.setSize(width, height)
    this.outputPass?.setSize(width, height)
  }
}

export class RenderList extends Scene {
  override matrixAutoUpdate: boolean = false
  override matrixWorldAutoUpdate: boolean = false

  private childIndexMap = new Map<Object3D, number>()
  override add(object: Object3D) {
    if (this.childIndexMap.has(object)) {
      return this
    }
    const index = this.children.length
    this.childIndexMap.set(object, index)
    this.children.push(object)
    return this
  }

  override remove(object: Object3D) {
    const index = this.childIndexMap.get(object)
    if (index === undefined) {
      return this
    }
    if (index !== this.children.length - 1) {
      const lastObject = this.children[this.children.length - 1]
      this.children[index] = lastObject
      this.childIndexMap.set(lastObject, index)
    }
    this.children.pop()
    this.childIndexMap.delete(object)
    return this
  }

  override clear() {
    this.children.length = 0
    this.childIndexMap.clear()
    return this
  }
}

function createQuadTree<T>(min: IVec2, max: IVec2, leafSize: number) {
  leafSize = nextPowerOfTwo(leafSize)
  max.x = nextPowerOfTwo(max.x, leafSize)
  max.y = nextPowerOfTwo(max.y, leafSize)
  const size = Math.abs(max.x - min.x)
  const maxDepth = Math.log2(size) - Math.log2(leafSize)
  return QuadTree.create<T>(
    {
      x: min.x,
      y: 0,
      z: min.y,
    },
    {
      x: max.x,
      y: 2048,
      z: max.y,
    },
    maxDepth,
  )
}

function nextPowerOfTwo(num: number, min: number = 1) {
  const negate = num < 0
  num = Math.abs(num)
  let result = 1
  while (result < num) {
    result *= 2
  }
  if (result < min) {
    result = min
  }
  if (negate) {
    result = -result
  }
  return result
}
