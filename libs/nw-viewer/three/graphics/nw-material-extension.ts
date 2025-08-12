import { Group, Material, Mesh, MeshPhysicalMaterial, ShaderChunk, ShaderLib, SkinnedMesh, SRGBColorSpace, Texture } from 'three'
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader'
import { GLTFLoaderPlugin } from 'three/examples/jsm/loaders/GLTFLoader.js'
import './shader-lib' // side effect, override shader chunks

const EXTENSION_NAME = 'EXT_nw_material'
interface ExtensionData {
  params?: Record<string, any>
  vertColors?: boolean
  maskTexture?: {
    index: number
    texCoord?: number | undefined
    extensions?: any
  }
  smoothTexture?: {
    index: number
    texCoord?: number | undefined
    extensions?: any
  }
}

export class GLTFNwMaterialExtension implements GLTFLoaderPlugin {
  public parser: GLTFParser
  public name: string
  constructor(parser: GLTFParser) {
    this.parser = parser
    this.name = EXTENSION_NAME
  }

  private getMaterialDef(index: number) {
    return this.parser.json.materials[index]
  }

  private getTextureDef(index: number) {
    return this.parser.json.textures[index]
  }

  private getData(materialIndex: number) {
    const materialDef = this.getMaterialDef(materialIndex)
    return materialDef?.extensions?.[this.name] as ExtensionData
  }
  public getMaterialType(materialIndex: number) {
    if (!this.getData(materialIndex)) {
      return null
    }
    return MeshPhysicalMaterial
  }

  public extendMaterialParams(materialIndex: number, materialParams: any) {
    const extension = this.getData(materialIndex)
    if (!extension) {
      return Promise.resolve()
    }

    const pending = []
    if (extension.smoothTexture?.index >= 0) {
      pending.push(
        this.parser.assignTexture(materialParams, 'specularIntensityMap', extension.smoothTexture, SRGBColorSpace),
      )
    }

    return Promise.all(pending)
  }

  public async loadMaterial(materialIndex: number): Promise<Material> {
    const extension = this.getData(materialIndex)
    return this.parser.loadMaterial(materialIndex).then((material) => {
      // materials are cloned for each mesh, and some properties are not copied
      // use userData to store them and restore them later when mesh is loaded
      material.userData ||= {}
      material.userData['vertexColors'] = extension?.vertColors || false
      material.userData['hasSmoothMap'] = !!extension?.smoothTexture
      material.userData['mtlDef'] = this.getMaterialDef(materialIndex)
      material.userData['mtlTextures'] = this.parser.json.textures
      return material
    })
  }

  public async loadMesh(meshIndex: number): Promise<Group | Mesh | SkinnedMesh> | null {
    return this.parser.loadMesh(meshIndex).then((res) => {
      res.traverse((it) => {
        if ('material' in it) {
          // restore parameters from suerData
          it.material['defines']['USE_SPECULAR_INTENSITYMAP_CHANNEL_R'] = ''
          it.material['defines']['USE_NORMALMAP_RG_UNSIGNED'] = ''
          it.material['vertexColors'] = !!it.material['userData']['vertexColors']
        }
      })
      return res
    })
  }
}
