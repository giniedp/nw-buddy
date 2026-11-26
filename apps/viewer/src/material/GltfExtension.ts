import type { AcquireTextureOptions, Texture, TextureOptions } from '@gglib/graphics'
import type { GLTF } from '@gglib/loaders'
import type { TexMod } from './TexMod'
import { nwMaterialFactory } from './nwMaterial'

/**
 * The JSON of the `EXT_nw_material` glTF extension (nwbt `extensions.ExtNwMaterial`)
 */
export interface NwMaterialExtensionData {
  attrs?: NwMaterialAttrs
  params?: Record<string, number | string>
  textures?: GLTF.TextureInfo[]
  vertexDeform?: VertexDeform
  maskTexture?: GLTF.TextureInfo
  smoothTexture?: GLTF.TextureInfo
  vertColors?: boolean
}

export interface NwTextureExtensionData {
  Map: TexMapName
  TexMod?: TexMod
  /**
   * The game file of the texture
   */
  File?: string
}

export interface NwMaterialAttrs {
  Name?: string
  GenMask?: string
  Shader?: string
  StringGenMask?: string
  MtlFlags?: number

  AlphaTest?: number
  CloakAmount?: number
  Opacity?: number
  Shininess?: number
  Diffuse?: number[] // r,g,b string
  Emissive?: number[] // r,g,b string
  Emittance?: number[] // r,g,b string
  Specular?: number[] // r,g,b string
}

export interface VertexDeform {
  Type: number
  DividerX: number
  DividerY: number
  NoiseScale: string
  WaveX: WaveX
}

export interface WaveX {
  Type: number
  Amp: number
  Level: number
  Phase: number
  Freq: number
}

export const EXT_nw_material = 'EXT_nw_material'
export const EXT_nw_tex = 'EXT_nw_tex'
export const EXT_nw_mtl_ref = 'EXT_nw_mtl_ref'

export interface NwMaterialRefExtensionData {
  /**
   * Path of the .mtl file
   */
  file: string
  /**
   * Index of the sub material in the material collection of the file
   */
  index: number
}

function isSameFile(containerUrl: string, file: string) {
  const a = containerUrl.split('?')[0].toLowerCase()
  const b = file.toLowerCase()
  return a.endsWith('/' + b) || a === b
}

/**
 * Loads the material by its source instead of building it from the embedded material data.
 *
 * @remarks
 * The material is loaded with the content loader, which caches by url. All models that reference
 * the same sub material get the same Material instance.
 * Resolves the whole material, so the embedded material data is not loaded.
 */
export const NwMaterialRefExtension: GLTF.GltfMaterialExtension = {
  name: EXT_nw_mtl_ref,
  resolve: (container, mtl) => {
    const ref = mtl.extensions[EXT_nw_mtl_ref] as NwMaterialRefExtensionData
    const url = `${ref.file}.glb`
    // the material document itself carries the references, it uses the embedded materials
    if (isSameFile(container.url, url)) {
      return undefined
    }
    // held until the model holds it: a cached material may lose its other owners meanwhile
    return (context) =>
      context.content.loadMaterial(url, { baseUrl: context.baseUrl, index: ref.index, scope: context.holdScope })
  },
}

export const NwMaterialExtension: GLTF.GltfMaterialExtension = {
  name: EXT_nw_material,
  handler: (container, node, mtl) => {
    const data = mtl.extensions[EXT_nw_material] as NwMaterialExtensionData
    // older exports have no original material
    if (!data?.attrs) {
      return
    }

    const props = node.data.properties as NwMaterialProps
    props.mods = {}
    props.textures = {}
    props.files = {}
    props.attrs = {
      ...(data.attrs || {}),
    }
    props.params = {
      ...(data.params || {}),
    }
    if (data.vertexDeform) {
      props.vertexDeform = JSON.parse(JSON.stringify(data.vertexDeform))
    }

    data.textures?.forEach((tex) => {
      if (tex.index < 0) {
        console.warn('Invalid texture index', tex.index, tex)
        return
      }
      const texNode = container.textureNode(tex.index, 'linear')
      const texData = tex.extensions[EXT_nw_tex] as NwTextureExtensionData
      if (texData.File) {
        props.files[texData.Map] = texData.File
      }
      container.graph.assign(node, texNode, (material, texture) => {
        const params = material.properties as NwMaterialProps
        params.textures[texData.Map] = texture
        if (texData.TexMod) {
          params.mods[texData.Map] = texData.TexMod
        }
      })
    })
    node.data.factory = nwMaterialFactory(data.attrs.Shader, data.attrs.StringGenMask)
  },
}

export type NwMaterialProps = {
  attrs: NwMaterialAttrs
  textures: Partial<Record<TexMapName, Texture | TextureOptions | AcquireTextureOptions>>
  /**
   * The game files of {@link textures}
   */
  files?: Partial<Record<TexMapName, string>>
  mods: Partial<Record<TexMapName, TexMod>>
  params: Record<string, number | string>
  vertexDeform: VertexDeform
}

export type TexMapName =
  | 'Bumpmap'
  | 'Custom'
  | 'Decal'
  | 'Detail'
  | 'Diffuse'
  | 'Emittance'
  | 'Environment'
  | 'Heightmap'
  | 'Occlusion'
  | 'Opacity'
  | 'SecondSmoothness'
  | 'Smoothness'
  | 'Specular'
  | 'Specular2'
  | 'SubSurface'
  | '[1] Custom'
  | '[2] Custom'
  | '[3] Custom'
  | '[4] Custom'
  | '[5] Custom'
  | '[5] Smoothness'
