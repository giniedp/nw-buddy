import type { NwMaterialAttrs, TexMapName, VertexDeform } from '../../material/GltfExtension'
import type { TexMod } from '../../material/TexMod'

/**
 * A parsed `.mtl` file
 */
export interface MtlDocument {
  /**
   * The sub materials, or the root material if the file has no sub materials.
   *
   * @remarks
   * Mesh subsets reference materials by index into this list (`MaterialId`).
   */
  materials: MtlMaterial[]
}

/**
 * A single material of an `.mtl` file
 *
 * @remarks
 * Mirrors the JSON of the nwbt `EXT_nw_material` glTF extension, so both sources produce the same material properties.
 */
export interface MtlMaterial {
  attrs: NwMaterialAttrs
  /**
   * `PublicParams` attributes, values are kept as strings
   */
  params: Record<string, string>
  textures: MtlTexture[]
  vertexDeform?: VertexDeform
}

export interface MtlTexture {
  Map: TexMapName
  File?: string
  AssetId?: string
  Filter?: number
  IsTileU?: number
  IsTileV?: number
  TexType?: number
  TexMod?: TexMod
}
