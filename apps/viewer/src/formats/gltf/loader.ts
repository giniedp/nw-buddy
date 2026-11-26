import type { LoadContext } from '@gglib/content'
import { GLTF } from '@gglib/loaders'
import { NwMaterialExtension } from '../../material/GltfExtension'

/**
 * `glTF` in ASCII, the magic of a binary glTF (`.glb`), little endian
 */
const GLB_MAGIC = 0x46546c67

/**
 * The glTF extensions the viewer reads. The nwbt exports carry the original material in `EXT_nw_material` next to the
 * glTF PBR approximation (`KHR_materials_specular`, `KHR_materials_ior`): the viewer builds its game materials from it.
 */
const GLTF_EXTENSIONS = [
  NwMaterialExtension,
  GLTF.KhrMaterialsIor,
  GLTF.KhrMaterialsPbrSpecularGlossinessHandler,
  GLTF.KhrMaterialsSpecular,
  GLTF.KhrMaterialsEmissiveStrength,
  GLTF.KhrTextureBasisu,
  GLTF.MsftTextureDDS,
  GLTF.ExtTextureWebp,
]

/**
 * The glTF loader of the viewer: tells binary (`.glb`) from JSON (`.gltf`) files by their content, not by the url, so
 * urls without an extension load too (the object urls of dropped files, see ContentService.createObjectUrl).
 */
export class GltfLoader extends GLTF.Loader {
  public static override create = () => new GltfLoader()

  /**
   * Registers the extensions of {@link GLTF_EXTENSIONS}. The registry is global, registering again replaces them.
   */
  public static registerExtensions() {
    for (const extension of GLTF_EXTENSIONS) {
      GLTF.Loader.registerExtension(extension)
    }
  }

  protected override async loadDocument(url: string, context: LoadContext): Promise<GLTF.Document> {
    const data = await context.content.fetch(url, {
      responseType: 'arraybuffer',
      signal: context.signal,
    })
    const buffer = data.body
    if (buffer.byteLength >= 4 && new DataView(buffer).getUint32(0, true) === GLB_MAGIC) {
      return GLTF.parseBinary(buffer)
    }
    return JSON.parse(new TextDecoder().decode(buffer))
  }
}
