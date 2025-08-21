import PQueue from 'p-queue'
import { Observable } from 'rxjs'
import {
  Cache,
  Camera,
  Clock,
  LoaderUtils,
  LoadingManager,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Scene,
  Texture,
  Vector2,
} from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { shareReplayRefCount } from '~/utils'
import { GameService, GameServiceContainer } from '../../ecs'
import { GLTFNwMaterialExtension } from '../graphics/nw-material-extension'
import { GLTFSpecularGlossinessExtension } from '../graphics/pbr-specular-glossiness'
import { RendererProvider } from './renderer-provider'
import { SceneProvider } from './scene-provider'
import { getTexModUpdateFn } from '../graphics/tex-mod'
import { AnimationFile } from '../adb'
import { DDSTextureLoader } from '../graphics/dds-loader'

const resolveUrl = LoaderUtils.resolveURL
LoaderUtils.resolveURL = (url: string, path: string) => {
  return resolveUrl(url, '')
}

export interface ContentServiceOptions {
  rootUrl: string
  nwbtUrl: string
}

export interface ModelSource {
  url: string
  rootUrl?: string
}

export interface ModelAsset {
  source: string
  animationList?: AnimationFile[]
  gltf: GLTF
}

export class ContentProvider implements GameService {
  private loadedAssets = new Map<string, Observable<ModelAsset>>()
  private renderer: RendererProvider
  private scene: SceneProvider
  private clock: Clock

  private taskQueue: Array<() => void> = []
  private loadQueue = new PQueue({
    concurrency: 5,
    autoStart: true,
  })
  private compileQueue = new PQueue({
    concurrency: 5,
    autoStart: true,
  })
  private prerenderQueue = new TextureQueue()

  public game: GameServiceContainer

  public rootUrl: string
  public nwbtUrl: string

  public get nwbtFileUrl() {
    return `${this.nwbtUrl}/file/`
  }

  public constructor(options: ContentServiceOptions) {
    this.nwbtUrl = options.nwbtUrl
    this.rootUrl = options.rootUrl
    if (this.rootUrl && !this.rootUrl.endsWith('/')) {
      this.rootUrl = this.rootUrl + '/'
    }
    const manager = new LoadingManager()
    manager.setURLModifier((url: string) => {
      return url
    })
    Cache.enabled = true
  }

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.scene = game.get(SceneProvider)
    this.renderer = game.get(RendererProvider)
    this.renderer.onUpdate.add(this.update)
    this.clock = new Clock()
    this.clock.start()
  }

  public destroy(): void {
    this.renderer.onUpdate.remove(this.update)
    this.clock.stop()
  }

  private update = () => {
    this.prerenderQueue.update(this.renderer)
    const task = this.taskQueue.shift()
    if (task) {
      task()
    }
  }

  /**
   * Loads an asset by using cache. Subsequent calls with the same URL will return the same asset instance.
   * Asset is automatically disposed when all observers are unsubscribed.
   */
  public streamAsset(url: string, rootUrl?: string) {
    rootUrl = rootUrl || this.rootUrl
    const key = [rootUrl, url].join('/')
    if (!this.loadedAssets.has(key)) {
      this.loadedAssets.set(key, this.createStream(url, rootUrl))
    }
    return this.loadedAssets.get(key)
  }

  public compileAsync(gltf: GLTF) {
    return this.renderer.renderer.compileAsync(gltf.scene, this.scene.camera, this.scene.main)
  }

  /**
   * Loads an asset without caching. Asset must be disposed by caller.
   */
  public async loadAsset(url: string, rootUrl?: string, abort?: AbortController): Promise<ModelAsset> {
    const manager = new LoadingManager()
    manager.setURLModifier((url: string) => {
      if (rootUrl) {
        return [rootUrl.replace(/\/$/, ''), url.replace(/^\//, '')].join('/')
      }
      return url
    })
    manager.addHandler(/(\.dds$)|(\.dds\?)/i, new DDSTextureLoader(manager))

    const loader = new GLTFLoader(manager)
    loader.register((parser) => new GLTFNwMaterialExtension(parser))
    loader.register((parser) => new GLTFSpecularGlossinessExtension(parser))
    loader.setPath('/')
    const result = await this.loadQueue.add(async () => {
      return await loader.loadAsync(url)
    })
    const gltf = result || null

    await this.compileQueue.add(async () => {
      if (!abort?.signal.aborted && gltf) {
        await this.compileAsync(gltf)
      }
    })
    if (!abort?.signal.aborted && gltf) {
      await this.prerenderQueue.schedule(gltf.scene, abort)
    }

    const animations = gltf?.parser.json['extras']?.['animationList'] || []
    const asset = { gltf, source: url, animationList: animations }
    // resolve one per frame to avoid blocking the main thread
    return new Promise<ModelAsset>((resolve) => {
      this.scheduleTask(() => {
        this.postProcessAsset(asset)
        resolve(asset)
      })
    })
  }

  public modelSource(url: string, material: string, rootUrl: string): ModelSource | null {
    if (!url) {
      return null
    }
    switch (extName(url)) {
      case '.gltf':
      case '.glb':
        rootUrl ||= this.rootUrl
        break
      case '.cgf':
      case '.cdf':
      case '.caf':
        rootUrl ||= this.nwbtFileUrl
        url = url + '.glb'
        break
      default:
        console.warn('Unknown model type', url)
        return null
    }
    if (!rootUrl.endsWith('/')) {
      rootUrl = rootUrl + '/'
    }
    if (url.startsWith('/')) {
      url = url.substring(1)
    }
    if (material) {
      url += `?material=${material}`
    }
    return {
      url: url,
      rootUrl: rootUrl,
    }
  }

  /**
   * Adds a task to be executed on the next frame.
   */
  public scheduleTask(task: () => void): void {
    this.taskQueue.push(task)
  }

  private createStream(url: string, rootUrl: string) {
    return new Observable<ModelAsset>((sub) => {
      const abort = new AbortController()
      const value = this.loadAsset(url, rootUrl, abort).catch((err): ModelAsset => {
        if (err !== 'cancelled') {
          console.error('Failed to load asset', err)
        }
        return null
      })
      value.then(async (value) => {
        sub.next(value)
      })
      return () => {
        abort.abort('cancelled')
        value.then(disposeAsset)
      }
    }).pipe(shareReplayRefCount(1))
  }

  private postProcessAsset(asset: ModelAsset) {
    if (!asset?.gltf?.scene) {
      return
    }
    asset.gltf.scene.traverse((node) => {
      if (node instanceof Mesh) {
        if (Array.isArray(node.material)) {
          for (const material of node.material) {
            this.handleLoadedMaterial(material, asset)
          }
        } else if (node.material) {
          this.handleLoadedMaterial(node.material, asset)
        }
      }
    })
  }

  private handleLoadedMaterial(material: Material, asset: ModelAsset) {
    if (!(material instanceof MeshPhysicalMaterial)) {
      return
    }

    const animations = [
      this.getTextureAnimation(material, material.map, asset),
      this.getTextureAnimation(material, material.normalMap, asset),
      this.getTextureAnimation(material, material.specularColorMap, asset),
      this.getTextureAnimation(material, material.specularIntensityMap, asset),
    ].filter((it) => !!it)
    if (!animations.length) {
      return
    }
    const onBeforeRender = material.onBeforeRender
    material.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      for (const animation of animations) {
        animation(renderer)
      }
      onBeforeRender.call(material, renderer, scene, camera, geometry, material, group)
    }
  }

  private getTextureAnimation(mtl: Material, tex: Texture, asset: ModelAsset) {
    if (!tex || !mtl) {
      return null
    }
    const refId = tex.userData?.['refId']
    const mod = mtl.userData?.['mods']?.[refId]
    if (!refId || !mod) {
      return null
    }

    const result = getTexModUpdateFn(tex, mod)
    if (result) {
      tex.matrixAutoUpdate = false
    }
    return result
  }
}

function extName(url: string) {
  const index = url.lastIndexOf('.')
  if (index === -1) {
    return null
  }
  return url.substring(index)
}

function disposeAsset(asset: ModelAsset) {
  // TODO: dispose textures
  if (!asset?.gltf?.scene) {
    return
  }
  asset.gltf.scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          material.dispose()
        }
      } else if (object.material) {
        object.material.dispose()
      }
    }
  })
}

class TextureQueue {
  private queue: TextureTask[] = []

  public update(renderer: RendererProvider) {
    if (this.queue.length === 0) {
      return
    }

    let limit = 5
    while (limit > 0 && this.queue.length > 0) {
      limit--
      const texture = this.queue[0].textures.shift()
      if (texture) {
        renderer.renderer.initTexture(texture)
      }
      if (this.queue[0].textures.length === 0) {
        this.queue[0].resolve()
        this.queue.shift()
      }
    }
  }

  public schedule(asset: Object3D, abort?: AbortController): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({
        textures: getTextures(asset),
        abort,
        resolve,
      })
    })
  }
}

interface TextureTask {
  textures: Texture[]
  abort: AbortController
  resolve: () => void
}

function getTextures(object: Object3D) {
  const result: Texture[] = []
  object.traverse((node) => {
    if (node instanceof Mesh) {
      if (Array.isArray(node.material)) {
        for (const material of node.material) {
          getTexturesFromMaterial(material, result)
        }
      } else if (node.material) {
        getTexturesFromMaterial(node.material, result)
      }
    }
  })
  return result
}

function getTexturesFromMaterial(material: Material, result: Texture[]) {
  if (!material) {
    return
  }
  for (const key in material) {
    const value = material[key]
    if (value && value instanceof Texture) {
      result.push(value)
    }
  }
}
