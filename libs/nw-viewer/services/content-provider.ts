import { AssetContainer, LoadAssetContainerAsync } from '@babylonjs/core'
import '@babylonjs/loaders'
import { IGLTFLoaderData } from '@babylonjs/loaders'
import { Observable } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { GameHost, GameSystem } from '../ecs'
import { extractUuid } from '../utils'
import { SceneProvider } from './scene-provider'

export interface GltfAsset {
  document: IGLTFLoaderData
  container: AssetContainer
}

export type ContentSource = ContentSourceUrl | ContentSourceAssetId

export interface ContentSourceUrl {
  url: string
  rootUrl?: string
}

export interface ContentSourceAssetId {
  assetId: string
}

export type DebugShapeType = 'box' | 'sphere' | 'cylinder' | 'ground'

export class ContentProvider implements GameSystem {
  private scene: SceneProvider
  private loadedAssets = new Map<string, Observable<GltfAsset>>()
  private resolvedAssets = new Map<string, Promise<ContentSourceUrl>>()
  private loadedSlices = new Map<string, Promise<any>>()
  private options: ContentServiceOptions
  public game: GameHost

  public get rootUrl() {
    return this.options.rootUrl
  }

  public get nwbtUrl() {
    return this.options.nwbtUrl
  }

  public get nwbtFileUrl() {
    return `${this.nwbtUrl}/file/`
  }
  public constructor(options: ContentServiceOptions) {
    this.options = options
  }

  public initialize(game: GameHost): void {
    this.game = game
    this.scene = game.system(SceneProvider)
  }

  public destroy(): void {
    //
  }

  /**
   * Loads an asset and caches it. Subsequent calls with the same URL will return the same cached asset.
   * Asset is automatically disposed when all observers are unsubscribed.
   */
  public streamAsset(url: string, rootUrl?: string) {
    rootUrl = rootUrl || this.rootUrl
    const key = [url, rootUrl].join('/')
    if (!this.loadedAssets.has(key)) {
      this.loadedAssets.set(
        key,
        resource<GltfAsset>({
          load: async () => this.loadAsset(url, rootUrl),
          unload: (asset) => {
            if (asset) {
              asset.container.dispose()
            }
          },
          error: (err) => {
            console.error('Failed to load asset', err)
            return null
          },
        }).pipe(shareReplayRefCount(1)),
      )
    }
    return this.loadedAssets.get(key)
  }

  /**
   * Loads an asset and returns it. Asset is not cached and must be disposed manually.
   */
  public async loadAsset(url: string, rootUrl?: string) {
    let gltf: IGLTFLoaderData
    return LoadAssetContainerAsync(url, this.scene.main, {
      rootUrl: rootUrl,
      pluginOptions: {
        gltf: {
          onParsed: (data) => (gltf = data),
        },
      },
    }).then((asset) => {
      return {
        document: gltf,
        container: asset,
      }
    })
  }

  public async resolveModelUrl(options: ContentSourceUrl | ContentSourceAssetId): Promise<ContentSourceUrl> {
    if ('url' in options) {
      return options
    }
    const result = await this.resolveAssetId(options.assetId)
    if (!result?.url) {
      return null
    }
    const ext = extName(result.url)
    if (ext === '.cgf' || ext === '.cdf') {
      return {
        url: result.url + '.glb?link-textures=true',
        rootUrl: result.rootUrl,
      }
    }
    console.warn('Unknown model type', result.url, ext)
    return null
  }

  public async resolveAssetId(
    id: string,
    options?: {
      hint?: string
      name?: string
    },
  ): Promise<ContentSourceUrl> {
    id = extractUuid(id).toLowerCase()
    if (id === '00000000-0000-0000-0000-000000000000') {
      return null
    }
    let query: string[] = []
    if (options?.name) {
      query.push(`name=${options.name}`)
    }
    if (options?.hint) {
      query.push(`hint=${options.hint}`)
    }

    let url = id
    if (query.length) {
      url += '?' + query.join('&')
    }

    if (!this.resolvedAssets.has(url)) {
      this.resolvedAssets.set(
        url,
        fetch(`${this.nwbtUrl}/catalog/${url}`)
          .then((res) => {
            if (res.status < 200 || res.status >= 300) {
              throw new Error(`Failed to load asset id ${url}: ${res.status} ${res.statusText}`)
            }
            return res.json()
          })
          .then((res): ContentSourceUrl => {
            return {
              url: res.file,
              rootUrl: `${this.nwbtUrl}/file/`,
            }
          })
          .catch((err) => {
            console.error('Failed to load asset', err)
            return null
          }),
      )
    }
    return this.resolvedAssets.get(url)
  }

  public async fetchJson(url: string): Promise<any> {
    if (!this.loadedSlices.has(url)) {
      this.loadedSlices.set(
        url,
        fetch(url)
          .then((res) => res.json())
          .catch((err) => {
            console.error('Failed to load JSON', err)
            return null
          }),
      )
    }
    return this.loadedSlices.get(url)
  }
}

export interface ContentServiceOptions {
  rootUrl: string
  nwbtUrl: string
}

export function resource<T>(options: {
  load: () => Promise<T>
  unload: (value: T) => void
  error?: (err: Error) => T | null
}) {
  return new Observable<T>((sub) => {
    const value = options.load().catch((err) => options?.error?.(err) ?? null)
    value.then((value) => sub.next(value))
    return () => value.then(options.unload)
  })
}

function extName(url: string) {
  const index = url.lastIndexOf('.')
  if (index === -1) {
    return null
  }
  return url.substring(index)
}
