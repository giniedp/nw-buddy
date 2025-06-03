import { BaseTexture, Nullable, Texture } from '@babylonjs/core'
import { GLTF2 } from '@babylonjs/loaders'

export const SHARED_TEXTURES_EXTENSION_NAME = 'NwShareTextures'

export interface ShareTextureOptions {
  enabled: boolean
  textures: Record<string, Promise<BaseTexture>>
}

export class ShareTexturesExtension implements GLTF2.IGLTFLoaderExtension {
  public static register() {
    GLTF2.registerGLTFExtension(SHARED_TEXTURES_EXTENSION_NAME, false, async (loader) => {
      return new ShareTexturesExtension(loader)
    })
  }

  public static options(options: ShareTextureOptions): Record<string, { enabled?: boolean }> {
    return { [SHARED_TEXTURES_EXTENSION_NAME]: options }
  }

  public name = SHARED_TEXTURES_EXTENSION_NAME
  public enabled = true
  public order = 200
  private loader: GLTF2.GLTFLoader
  private textures: Record<string, Promise<BaseTexture>> = {}
  private disposed = false

  public constructor(loader: GLTF2.GLTFLoader) {
    this.loader = loader
    const options = loader.parent.extensionOptions[SHARED_TEXTURES_EXTENSION_NAME] as any as ShareTextureOptions
    this.enabled = options?.enabled
    this.textures = options?.textures
  }

  _loadTextureAsync?(
    context: string,
    texture: GLTF2.ITexture,
    assign: (babylonTexture: BaseTexture) => void,
  ): Nullable<Promise<BaseTexture>> {
    if (!texture.name) {
      return null
    }

    const gltf = this.loader['_gltf']
    const image: GLTF2.IImage = GLTF2.ArrayItem.Get(`${context}/source`, gltf.images, texture.source)

    let sampler: GLTF2.ISampler = GLTF2.GLTFLoader.DefaultSampler
    if (texture.sampler) {
      sampler = GLTF2.ArrayItem.Get(`${context}/sampler`, gltf.samplers, texture.sampler)
    }
    const samplerData = this.loader['_loadSampler'](`/samplers/${sampler.index}`, sampler)
    if (!image.uri) {
      return null
    }

    this.textures[image.uri] ||= new Promise<Texture>((resolve, reject) => {

      const texture = new Texture(this.loader.rootUrl + image.uri, this.loader.babylonScene, {
        noMipmap: samplerData.noMipMaps,
        invertY: false,
        samplingMode: samplerData.samplingMode,
        onLoad: () => {
          if (!this.disposed) {
            resolve(texture)
          }
        },
        onError: (message?: string, exception?: any) => {
          if (!this.disposed) {
            reject(
              new Error(
                `${context}: ${exception && exception.message ? exception.message : message || 'Failed to load texture'}`,
              ),
            )
          }
        },
        mimeType: image.mimeType,
        loaderOptions: null,
        useSRGBBuffer: true,
      })
    })

    return this.textures[image.uri]
      .then((it) => it.clone())
      .then((it) => {
        assign(it)
        return it
      })
  }

  public dispose() {
    this.disposed = true
  }
}
