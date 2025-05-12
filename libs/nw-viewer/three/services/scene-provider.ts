import {
  EquirectangularReflectionMapping,
  Frustum,
  Matrix4,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  Vector3,
} from 'three'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { Water } from 'three/examples/jsm/objects/Water.js'
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

  private renderList: RenderList
  private quadTree: QuadTree<Object3D>
  private raycaster = new Raycaster()
  private rayOrigin = new Vector2()

  private envMapUrl = 'https://assets.babylonjs.com/textures/parking.hdr'
  private envMapBackground = true
  private envMap: Texture = null
  private sky: Sky
  private water: Water

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
      4096, // far
    )
    this.camera.name = 'camera'
    this.sky = new Sky()
    this.sky.scale.setScalar(450000)
    this.main.add(this.sky)

    const params = {
      turbidity: 0.5,
      rayleigh: 0.6,
      mieCoefficient: 0.025,
      mieDirectionalG: 0.5,
    }
    // const gui = new GUI()
    // gui.add(params, 'turbidity', 0, 20, 0.1).onChange(() => {
    //   uniforms['turbidity'].value = params.turbidity
    // })
    // gui.add(params, 'rayleigh', 0, 4, 0.001).onChange(() => {
    //   uniforms['rayleigh'].value = params.rayleigh
    // })
    // gui.add(params, 'mieCoefficient', 0, 0.1, 0.001).onChange(() => {
    //   uniforms['mieCoefficient'].value = params.mieCoefficient
    // })
    // gui.add(params, 'mieDirectionalG', 0, 1, 0.001).onChange(() => {
    //   uniforms['mieDirectionalG'].value = params.mieDirectionalG
    // })
    const uniforms = this.sky.material.uniforms
    uniforms['turbidity'].value = params.turbidity
    uniforms['rayleigh'].value = params.rayleigh
    uniforms['mieCoefficient'].value = params.mieCoefficient
    uniforms['mieDirectionalG'].value = params.mieDirectionalG
    uniforms['sunPosition'].value.copy(new Vector3(1, 0.5, 0).normalize())
    // sun.setFromSphericalCoords( 1, phi, theta );
    // uniforms[ 'sunPosition' ].value.copy( sun );

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
    this.renderer.render(this.main, this.camera)
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
  }

  private resizeCamera(width: number, height: number) {
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
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
