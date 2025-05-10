import { GLTF2 } from '@babylonjs/loaders'
import { BaseTexture, Mesh, Material } from '@babylonjs/core'

const NAME = 'NwMaterialExtension'
const EXTENSION_NAME = 'EXT_nw_material'
interface ExtensionData {
  params: Record<string, any>
  maskTexture: GLTF2.ITextureInfo
  smoothTexture: GLTF2.ITextureInfo
}

export interface NwMaterialExtensionOptions {
  enabled: boolean
}

function getExtensionData(material: GLTF2.IMaterial): ExtensionData {
  return material?.extensions?.[EXTENSION_NAME]
}

export class NwMaterialExtension implements GLTF2.IGLTFLoaderExtension {
  public static register() {
    GLTF2.registerGLTFExtension(NAME, false, (loader) => {
      return new NwMaterialExtension(loader)
    })
  }
  public static options(options: NwMaterialExtensionOptions): Record<string, { enabled?: boolean }> {
    return { [NAME]: options }
  }

  public static getMaskTexture(object: any): BaseTexture | null {
    return object?.maskTexture
  }
  public static setMaskTexture(object: any, texture: BaseTexture | null) {
    object.maskTexture = texture
  }

  public static getSmoothTexture(object: any): BaseTexture | null {
    return object?.smoothTexture
  }
  public static setSmoothTexture(object: any, texture: BaseTexture | null) {
    object.smoothTexture = texture
  }

  public static getAppearance(object: any): any | null {
    return object?.dyeAppearance
  }
  public static setAppearance(object: any, value: any | null) {
    object.dyeAppearance = value
  }

  public name: string = NAME
  public enabled: boolean = true
  public order = 200
  private loader: GLTF2.GLTFLoader
  public constructor(loader: GLTF2.GLTFLoader) {
    this.loader = loader
  }

  public dispose(): void {
    this.loader = null!
  }

  _loadMaterialAsync?(
    context: string,
    material: GLTF2.IMaterial,
    babylonMesh: Mesh | null,
    babylonDrawMode: number,
    assign: (babylonMaterial: Material) => void,
  ): Promise<Material> {
    // HACK:
    //   we are calling _loadMaterialAsync recursively. To aviod infinite loop,
    //   we need to set a flag on the babylonMesh to indicate that we are loading the material
    const loadKey = `__${NAME}_IS_LOADING`
    if (babylonMesh[loadKey]) {
      return null
    }
    babylonMesh[loadKey] = true

    return new Promise<Material>(async (resolve, reject) => {
      const ext = getExtensionData(material)
      const params = ext?.params

      let maskTextureInfo = ext?.maskTexture as GLTF2.ITextureInfo
      let maskTexture: BaseTexture // = NwMaterialExtension.getMaskTexture(babylonMesh)

      let smoothTextureInfo = ext?.smoothTexture as GLTF2.ITextureInfo
      let smoothTexture: BaseTexture // = NwMaterialExtension.getSmoothTexture(babylonMesh)

      if (!maskTexture && maskTextureInfo?.index >= 0) {
        maskTexture = await this.loader
          .loadTextureInfoAsync(`${context}/maskTexture`, maskTextureInfo, (babylonTexture) => {
            babylonTexture.name = `${material.name}_mask`
          })
          .catch((err) => {
            console.error(err)
            return null
          })
      }

      if (!smoothTexture && smoothTextureInfo?.index >= 0) {
        smoothTexture = await this.loader
          .loadTextureInfoAsync(`${context}/smoothTexture`, smoothTextureInfo, (babylonTexture) => {
            if (babylonTexture.hasAlpha) {
              console.log('smoothTexture', smoothTextureInfo, babylonTexture)
            }
            babylonTexture.name = `${material.name}_smooth`
          })
          .catch((err) => {
            console.error(err)
            return null
          })
      }

      return this.loader
        ._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
          if (maskTexture) {
            NwMaterialExtension.setMaskTexture(babylonMaterial, maskTexture || null)
          }
          if (smoothTexture) {
            NwMaterialExtension.setSmoothTexture(babylonMaterial, smoothTexture || null)
          }
          if (params) {
            NwMaterialExtension.setAppearance(babylonMaterial, params || null)
          }
          babylonMaterial['NwMaterialPlugin']?.onLoaded()
          assign(babylonMaterial)
          return
        })
        .then(resolve)
        .catch(reject)
    })
  }
}
