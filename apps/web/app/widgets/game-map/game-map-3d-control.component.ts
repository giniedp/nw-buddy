import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core'
import { CustomLayerInterface, CustomRenderMethodInput, Map } from 'maplibre-gl'
import {
  Camera,
  DirectionalLight,
  EquirectangularReflectionMapping,
  LoadingManager,
  Matrix4,
  Scene,
  WebGLRenderer,
} from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GameMapHost } from './game-map-host'
import { NW_MAP_REGION_SIZE, xToLong } from './map-projection'
import { removeLayer } from './map-utils'

const envMapUrl = 'https://assets.babylonjs.com/textures/parking.hdr'

@Component({
  selector: 'game-map-3d-control',
  template: '<button class="btn btn-sm btn-square" (click)="handleToggle()">3D</button>',
})
export class GameMap3dControl implements OnDestroy {
  private host = inject(GameMapHost)
  private isActive = signal(false)

  public mapId = input<string>()

  constructor() {
    effect(() => {
      if (!this.host.mapIsReady()) {
        return
      }
      if (this.isActive()) {
        this.host.map.addLayer(this.layer, 'hills')
      } else {
        removeLayer(this.host.map, this.layer.id)
      }
    })
  }

  public ngOnDestroy(): void {
    removeLayer(this.host.map, this.layer.id)
  }

  protected handleToggle() {
    this.isActive.set(!this.isActive())
  }

  private layer: CustomLayerInterface = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    prerender: (gl, options) => {
      this.onPrerender(gl, options)
    },
    render: (gl, options) => {
      this.onRender(gl, options)
    },
    onAdd: (map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext) => {
      this.onAdd(map, gl)
    },
    onRemove: (map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext) => {
      this.onAdd(map, gl)
    },
  }

  private camera: Camera
  private scene: Scene
  private loader: GLTFLoader
  private renderer: WebGLRenderer
  private map: Map

  private onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map

    this.camera = new Camera()
    this.scene = new Scene()

    // const light1 = new DirectionalLight(0xffffff, 2)
    // light1.position.set(0, -70, 100).normalize()
    // this.scene.add(light1)

    // const light2 = new DirectionalLight(0xffffff, 2)
    // light2.position.set(0, 70, 100).normalize()
    // this.scene.add(light2)

    const manager = new LoadingManager()
    this.loader = new GLTFLoader(manager)
    this.loader.setMeshoptDecoder(MeshoptDecoder)

    const earthRadius = 6371008.8
    const earthCircumference = 2 * Math.PI * earthRadius
    const metersPerDegreeLng = earthCircumference / 360
    const scale = xToLong(1) * metersPerDegreeLng

    // const geometry = new BoxGeometry(2048 * scale, 1, 2048 * scale)
    // const material = new MeshBasicMaterial({ color: 0x00ff00 })
    // const cube = new Mesh(geometry, material)
    // cube.position.set(1024 * scale, 0, -1024 * scale - 5 * 2048 * scale )
    // this.scene.add(cube)
    // ;[
    //   ...getRegionModels(this.mapId(), 0, 5),
    //   ...getRegionModels(this.mapId(), 2, 0),
    //   ...getRegionModels(this.mapId(), 4, 4),
    //   ...getRegionModels(this.mapId(), 4, 3),
    //   ...getRegionModels(this.mapId(), 4, 2),
    //   ...getRegionModels(this.mapId(), 4, 1),
    // ]
    getMapModels(this.mapId(), 7, 7).forEach((data) => {
      this.loader.load(data.url, (gltf) => {
        gltf.scene.rotateY(Math.PI)
        gltf.scene.scale.set(scale, scale, scale)
        this.scene.add(gltf.scene)
      })
    })

    new RGBELoader().load(envMapUrl, (texture) => {
      texture.mapping = EquirectangularReflectionMapping
      this.scene.environment = texture
      this.scene.environmentIntensity = 2
    })

    this.renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    })
    this.renderer.autoClear = false
  }

  private onRemove(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    //
  }
  private onPrerender(gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
    //
  }
  private onRender(gl: WebGLRenderingContext | WebGL2RenderingContext, options: CustomRenderMethodInput) {
    const modelMatrix = this.map.transform.getMatrixForModel([0, 0], 0)
    const m1 = new Matrix4().fromArray(options.defaultProjectionData.mainMatrix)
    const m2 = new Matrix4().fromArray(modelMatrix)

    this.camera.projectionMatrix = m1.multiply(m2)
    this.renderer.resetState()
    this.renderer.render(this.scene, this.camera)
    this.map.triggerRepaint()
  }
}

function getMapModels(mapId: string, regionsX: number, regionsY: number) {
  const result: Array<{ url: string; x: number; y: number }> = []
  for (let y = 0; y < regionsY; y++) {
    for (let x = 0; x < regionsX; x++) {
      result.push(...getRegionModels(mapId, x, y))
    }
  }
  return result
}

function getRegionModels(mapId: string, x: number, y: number) {
  const result: Array<{ url: string; x: number; y: number }> = []
  result.push({
    url: modelUrl(mapId, x, y, 'poi_impostors.glb'),
    x: x * NW_MAP_REGION_SIZE,
    y: y * NW_MAP_REGION_SIZE,
  })
  result.push({
    url: modelUrl(mapId, x, y, 'impostors.glb'),
    x: x * NW_MAP_REGION_SIZE,
    y: y * NW_MAP_REGION_SIZE,
  })
  return result
}

function modelUrl(mapId: string, x: number, y: number, file: string) {
  return `https://cdn.nw-buddy.de/world/${mapId}/regions/r_+${String(x).padStart(2, '0')}_+${String(y).padStart(2, '0')}/${file}`
}
