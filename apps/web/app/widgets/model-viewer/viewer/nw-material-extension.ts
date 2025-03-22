import { GLTF2 } from '@babylonjs/loaders'
import { BaseTexture, Mesh, Material } from '@babylonjs/core'

const NAME = 'NwMaterialExtension'
const EXTENSION_NAME = 'EXT_nw_material'
interface ExtensionData {
  params: Record<string, any>
  maskTexture: GLTF2.ITextureInfo
}

GLTF2.registerGLTFExtension(NAME, false, (loader) => {
  return new NwMaterialExtension(loader)
})

function getExtensionData(material: GLTF2.IMaterial): ExtensionData {
  return material?.extensions?.[EXTENSION_NAME]
}

export class NwMaterialExtension implements GLTF2.IGLTFLoaderExtension {
  public static getMaskTexture(object: any): BaseTexture | null {
    return object?.maskTexture
  }
  public static setMaskTexture(object: any, texture: BaseTexture | null) {
    object.maskTexture = texture
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

  async _loadMaterialAsync?(
    context: string,
    material: GLTF2.IMaterial,
    babylonMesh: Mesh | null,
    babylonDrawMode: number,
    assign: (babylonMaterial: Material) => void,
  ): Promise<Material> {
    const ext = getExtensionData(material)
    const params = ext?.params
    let maskTextureInfo = ext?.maskTexture as GLTF2.ITextureInfo
    let maskTexture: BaseTexture | null

    // HACK:
    //   calling loadTextureInfoAsync here produces an infinite loop, yet i can not find a way to load a texture otherwise
    //   abuse the mesh to hold the mask texture and prevent infinite loop
    const marker = 'skipMaskTexture'
    maskTexture = NwMaterialExtension.getMaskTexture(babylonMesh)

    if (!maskTexture && maskTextureInfo?.index >= 0 && !(babylonMesh as any)[marker]) {
      maskTexture = await this.loader
        .loadTextureInfoAsync(`${context}/maskTexture`, maskTextureInfo, (babylonTexture) => {
          babylonTexture.name = `${material.name}_mask`
        })
        .catch((err) => {
          console.error(err)
          return null
        })
      NwMaterialExtension.setMaskTexture(babylonMesh, maskTexture || null)
      Object.assign(babylonMesh as any, { [marker]: true })
    }

    return this.loader._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
      if (maskTexture) {
        NwMaterialExtension.setMaskTexture(babylonMaterial, maskTexture || null)
      }
      if (params) {
        NwMaterialExtension.setAppearance(babylonMaterial, params || null)
      }
      return assign(babylonMaterial)
    })
  }
}
