import { AssetType, ContentLoader, type AssetContainer, type AssetLoader, type LoadContext } from '@gglib/content'
import type { MaterialOptions, MaterialProperties, Texture } from '@gglib/graphics'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { isArchivePath, normalizeAssetPath, type AssetIdResolver } from '../../content/assetIds'
import type { NwMaterialProps, TexMapName } from '../../material/GltfExtension'
import { nwMaterialFactory } from '../../material/nwMaterial'
import { resolveStringGenMask } from './genMask'
import { parseMtl } from './parse'
import type { MtlDocument, MtlMaterial, MtlTexture } from './types'

/**
 * Registers the `.mtl` loader on a content loader
 *
 * @remarks
 * Registers on the instance, so it takes precedence over the Wavefront `.mtl` loader of `@gglib/loaders`.
 */
export function registerMtl(content: ContentLoader) {
  content.registerLoader(MtlLoader)
}

/**
 * Loads New World (CryEngine) `.mtl` material files
 */
export class MtlLoader implements AssetLoader {
  /**
   * Resolves texture asset ids, used for textures whose file path does not resolve. Set by the ContentService.
   */
  public static resolveAssetId: AssetIdResolver | null = null

  public static extensions = ['.mtl']
  public static mimeTypes: string[] = []
  public static create = () => new MtlLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(MtlLoader)
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'text',
      signal: context.signal,
    })
    return new MtlContainer(url, parseMtl(response.body))
  }
}

/**
 * Holds the materials of an `.mtl` file, one per sub material
 *
 * @remarks
 * Textures are loaded by their file path relative to the `baseUrl` of the load context (the nwbt file root)
 */
export class MtlContainer implements AssetContainer {
  public readonly url: string
  public readonly document: MtlDocument

  public constructor(url: string, document: MtlDocument) {
    this.url = url
    this.document = document
  }

  public count(asset: AssetType<any, any>): number {
    return asset === AssetType.Material ? this.document.materials.length : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number, context: LoadContext): Promise<any> {
    if (asset !== AssetType.Material) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
    const material = this.document.materials[index]
    if (!material) {
      throw new Error(
        `Material index ${index} out of bounds for ${this.url} with ${this.document.materials.length} materials`,
      )
    }
    return createMaterialOptions(material, context)
  }
}

async function createMaterialOptions(material: MtlMaterial, context: LoadContext): Promise<MaterialOptions> {
  const stringGenMask = await resolveStringGenMask(material.attrs, context)
  const props: NwMaterialProps = {
    attrs: { ...material.attrs, StringGenMask: stringGenMask },
    params: { ...material.params },
    vertexDeform: material.vertexDeform ? JSON.parse(JSON.stringify(material.vertexDeform)) : undefined,
    textures: {},
    files: {},
    mods: {},
  }
  await Promise.all(
    withNormalMapSmoothness(material.textures).map(async (tex) => {
      const texture = await loadMtlTexture(tex, context)
      if (!texture) {
        return
      }
      props.textures[tex.Map] = texture
      props.files[tex.Map] = tex.File
      if (tex.TexMod) {
        props.mods[tex.Map] = { ...tex.TexMod }
      }
    }),
  )
  return {
    name: material.attrs.Name,
    properties: props as unknown as MaterialProperties,
    factory: nwMaterialFactory(material.attrs.Shader, stringGenMask),
  }
}

/**
 * Loads the texture of a material, or returns null if it does not resolve (as nwbt drops such textures)
 *
 * @remarks
 * The file path is tried first. If it is no archive path (e.g. `C:/users/…` of the authoring machine) or does not load,
 * the asset id is resolved like nwbt does (47 of 535k references need it).
 */
async function loadMtlTexture(tex: MtlTexture, context: LoadContext): Promise<Texture | null> {
  if (isEngineTexture(tex)) {
    return null
  }
  let file = mtlTextureFile(tex)
  let texture = file ? await loadTextureFile(tex.Map, file, context) : null
  if (!texture && tex.AssetId && MtlLoader.resolveAssetId) {
    const resolved = await MtlLoader.resolveAssetId(tex.AssetId)
    const resolvedFile = resolved ? mtlTextureFile({ ...tex, File: resolved }) : null
    if (resolvedFile && resolvedFile !== file) {
      file = resolvedFile
      texture = await loadTextureFile(tex.Map, file, context)
    }
  }
  if (!texture) {
    console.warn('mtl texture not loaded', tex.File, tex.AssetId)
  }
  return texture
}

function loadTextureFile(map: TexMapName, file: string, context: LoadContext): Promise<Texture | null> {
  const load = (path: string) =>
    context.content.loadTexture(mtlTextureUrl(path), {
      baseUrl: context.baseUrl,
      color: 'linear',
      signal: context.signal,
      // held until the material holds it: a cached texture may lose its other owners meanwhile
      scope: context.holdScope,
    })
  // smoothness is stored in the attached alpha of the normal map (_ddna.dds.a), see nwbt LoadOrStoreMtlTexture.
  // A _ddna without one has no smoothness: its color is the normal.
  if (usesAttachedAlpha(map, file)) {
    return load(`${file}.a.dds`).catch(() => null)
  }
  return load(file).catch(() => null)
}

/**
 * The smoothness slot that takes the attached alpha of a normal map, by the normal map slot: the normal map
 * (EFTT_NORMALS) and the normal map of the blend layer (EFTT_CUSTOM_SECONDARY)
 */
const NORMAL_MAP_SMOOTHNESS: ReadonlyArray<[normalMap: TexMapName, smoothnessMap: TexMapName]> = [
  ['Bumpmap', 'Smoothness'],
  ['[1] Custom', 'SecondSmoothness'],
]

/**
 * The texture slots of a material as the engine binds them: a normal map with an attached alpha (`_ddna`) gives the
 * smoothness, also when the material names no smoothness texture or another one
 *
 * @remarks
 * Lumberyard `ShaderTemplate.cpp` ("Support for gloss in regular normal map"): when the normal map has an attached
 * alpha, the smoothness slot gets its name and loads the alpha. The slot keeps its own settings (tiling, TexMod).
 * 13.4k Illum sub materials name no smoothness texture, among them the POI impostors.
 */
export function withNormalMapSmoothness(textures: readonly MtlTexture[]): MtlTexture[] {
  const result = [...textures]
  for (const [normalMap, smoothnessMap] of NORMAL_MAP_SMOOTHNESS) {
    const normal = textures.find((it) => it.Map === normalMap)
    if (!normal || !hasAttachedAlpha(mtlTextureFile(normal) ?? '')) {
      continue
    }
    const index = result.findIndex((it) => it.Map === smoothnessMap)
    const slot: MtlTexture = { ...result[index], Map: smoothnessMap, File: normal.File, AssetId: normal.AssetId }
    if (index < 0) {
      result.push(slot)
    } else {
      result[index] = slot
    }
  }
  return result
}

/**
 * Whether the texture is bound by the engine at runtime: `$…` names and `nearest_cubemap` (TexType 7, nearest cube)
 */
function isEngineTexture(tex: MtlTexture) {
  const file = tex.File || ''
  return file.startsWith('$') || tex.TexType === NEAREST_CUBE || /^nearest_cubemap(.w+)?$/i.test(file)
}

/**
 * Texture type of engine bound environment probes (`TexType="7"`)
 */
const NEAREST_CUBE = 7

const SMOOTHNESS_MAPS: TexMapName[] = ['Smoothness', 'SecondSmoothness', '[5] Smoothness']

/**
 * Whether the texture slot binds the attached alpha (`.dds.a`) instead of the texture itself
 *
 * @remarks
 * nwbt binds the attached alpha for smoothness slots if it exists. We can not check the existence without a request,
 * but normal maps with smoothness (`_ddna`) have it: 10113 of 10114 in the game files.
 */
function usesAttachedAlpha(map: TexMapName, file: string) {
  return SMOOTHNESS_MAPS.includes(map) && hasAttachedAlpha(file)
}

/**
 * Whether a texture has an attached alpha (`x.dds.a`): normal maps with smoothness (`_ddna`)
 */
function hasAttachedAlpha(file: string) {
  return /_ddna(_lod\d+)?\.dds$/.test(file)
}

/**
 * Returns the normalized `.dds` file path of a material texture, or null for engine textures and empty references
 *
 * @remarks
 * Texture references point to source files (`.tif`), the game files have the compiled `.dds` next to them.
 * Asset id only references are not resolved, they are rare (47 of 535k references, mostly characters).
 */
export function mtlTextureFile(tex: MtlTexture): string | null {
  let file = tex.File?.trim()
  // absolute paths of the authoring machine (e.g. `C:/users/…`) are not in the archive, only the asset id resolves them
  if (!file || isEngineTexture(tex) || !isArchivePath(file)) {
    return null
  }
  file = normalizeAssetPath(file)
  const ext = /\.[^./]*$/.exec(file)?.[0]
  if (ext !== '.dds') {
    file = (ext ? file.slice(0, -ext.length) : file) + '.dds'
  }
  return file
}

/**
 * The url under which nwbt serves a material texture with merged mips, same as the image uris in its glTF files
 */
function mtlTextureUrl(file: string) {
  return `${file}?merge=true&size=${MATERIAL_TEXTURE_SIZE}`
}
