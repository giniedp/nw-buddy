import { AssetContainer, LoadAssetContainerAsync, Mesh } from '@babylonjs/core'
import '@babylonjs/loaders'
import { IGLTFLoaderData } from '@babylonjs/loaders'
import PQueue from 'p-queue'
import { Observable } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { GameService, GameServiceContainer } from '../ecs'
import { ShareTexturesExtension } from './content'
import { SceneProvider } from './scene-provider'

export interface GltfAsset {
  document: IGLTFLoaderData
  container: AssetContainer
}

export interface ContentServiceOptions {
  rootUrl: string
  nwbtUrl: string
}

export interface ModelSource {
  url: string
  rootUrl?: string
}

ShareTexturesExtension.register()
export class ContentProvider implements GameService {
  private scene: SceneProvider
  private loadedAssets = new Map<string, Observable<GltfAsset>>()

  private textures = {}
  private queue = new PQueue({
    concurrency: 6,
    autoStart: true,
  })

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
  }

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.scene = game.get(SceneProvider)
  }

  public destroy(): void {
    //
  }

  /**
   * Loads an asset by using cache. Subsequent calls with the same URL will return the same asset instance.
   * Asset is automatically disposed when all observers are unsubscribed.
   */
  public streamAsset(url: string, rootUrl?: string) {
    rootUrl = rootUrl || this.rootUrl
    const key = [url, rootUrl].join('/')
    if (!this.loadedAssets.has(key)) {
      this.loadedAssets.set(key, this.createStream(url, rootUrl))
    }
    return this.loadedAssets.get(key)
  }

  /**
   * Loads an asset without caching. Asset must be disposed by caller.
   */
  public async loadAsset(url: string, rootUrl?: string, abort?: AbortController) {
    if (!url) {
      return null
    }
    let gltf: IGLTFLoaderData
    return this.queue
      .add(
        () => {
          return LoadAssetContainerAsync(url, this.scene.main, {
            rootUrl: rootUrl,
            pluginOptions: {
              gltf: {
                onParsed: (data) => {
                  gltf = data
                },
                extensionOptions: {
                  ...ShareTexturesExtension.options({
                    enabled: true,
                    textures: this.textures,
                  }),
                },
              },
            },
          })
        },
        {
          signal: abort?.signal,
        },
      )
      .then(onAssetContainerLoaded)
      .then((asset): GltfAsset => {
        return {
          document: gltf,
          container: asset,
        }
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

  private createStream(url: string, rootUrl: string) {
    return new Observable<GltfAsset>((sub) => {
      const abort = new AbortController()
      const value = this.loadAsset(url, rootUrl, abort).catch((err): GltfAsset => {
        if (err !== 'cancelled') {
          console.error('Failed to load asset', err)
        }
        return null
      })
      value.then((value) => sub.next(value))
      return () => {
        abort.abort('cancelled')
        value.then((asset) => asset?.container?.dispose())
      }
    }).pipe(shareReplayRefCount(1))
  }
}

function extName(url: string) {
  const index = url.lastIndexOf('.')
  if (index === -1) {
    return null
  }
  return url.substring(index)
}

function onAssetContainerLoaded(asset: AssetContainer) {
  if (asset) {
    for (const mesh of asset.meshes) {
      mesh.cullingStrategy = Mesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
      // mesh.isPickable = false
      // mesh.freezeWorldMatrix()
    }
  }
  return asset
}
