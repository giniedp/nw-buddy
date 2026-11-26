import { AssetType, type ContentLoader } from '@gglib/content'
import { DDS, HDR, KTX } from '@gglib/loaders'
import { publicAssetUrl } from '../content'
import { registerCgf } from '../formats/cgf'
import { GltfLoader } from '../formats/gltf'
import { registerMtl } from '../formats/mtl'
import { createViewerMaterial } from '../material'

/**
 * Registers the loaders and creators of the viewer's content, from `onInitialize`: DDS, HDR, KTX2, glTF (with the
 * extensions), the viewer materials and the game formats (`.mtl`, `.cgf`)
 */
export function registerViewerContent(content: ContentLoader) {
  content.registerLoader(DDS.Loader)
  content.registerLoader(HDR.Loader)
  // KTX2 (Basis Universal) images of glTF files, e.g. the models of the nw-buddy CDN. The transcoder runs in a
  // worker and loads its wasm from the viewer's public folder (vendor/basis).
  KTX.Loader.setDefaultOptions({ wasmUrl: publicAssetUrl('vendor/basis/basis_transcoder.wasm') })
  content.registerLoader(KTX.Loader)
  GltfLoader.registerExtensions()
  content.registerLoader(GltfLoader)
  // glTF materials become GltfMaterials, materials with a factory (.mtl files) stay as they ask
  content.registerCreator(AssetType.Material, createViewerMaterial)
  registerMtl(content)
  registerCgf(content)
}
