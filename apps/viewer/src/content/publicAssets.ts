/**
 * The url of a file of the viewer's own public folder (`public/`): the engine assets (`engineassets/`) that are always
 * needed, and vendor code (`vendor/vgmstream/`). These never come from the nwbt server.
 *
 * @remarks
 * Resolved against the build base and the module: the base is `/` for the dev server and the app (the origin root) and
 * `./` for the lib, where the public folder sits next to the bundle wherever the host serves it. Works in workers too.
 *
 * @param path - path inside the public folder, without a leading slash
 */
export function publicAssetUrl(path: string): string {
  // a concatenation, not a template literal: vite rewrites `new URL(<literal>, import.meta.url)` as an asset import
  const base = import.meta.env.BASE_URL
  return new URL(base + path, import.meta.url).href
}

/**
 * Game files that ship with the viewer, in `public/game/<path>` (DDS files with their mips merged). They are needed by
 * every scene and by the empty viewer: the engine textures, the default probe and the clouds dome of previews. They
 * keep their game paths, the content service resolves them to the copies (see {@link bundledGameFileUrl}), so they load
 * without the nwbt server.
 */
const BUNDLED_GAME_FILES = new Set([
  // engine textures (ContentService.loadEngineTextures)
  'engineassets/textures/noise3d.dds',
  'engineassets/textures/perlinnoise2d.dds',
  'engineassets/textures/water_gloss.dds',
  'engineassets/shading/waterfoam.dds',
  'engineassets/shading/waterfoam2_ddn.dds',
  'engineassets/textures/defaults/perlinnoise2d.dds',
  'engineassets/textures/perlinnoisederivatives.dds',
  'engineassets/textures/frozen/snow_spatter.dds',
  'engineassets/textures/frozen/frost_noise3.dds',
  'engineassets/textures/frozen/frost_noise4.dds',
  // the default probe (ProbeCubeLoader)
  'engineassets/shading/defaultprobe_cm.dds',
  'engineassets/shading/defaultprobe_cm_diff.dds',
  // the default probe as RGB9E5 KTX2 (CharacterViewer, devices without BC), converted from the DDS
  'engineassets/shading/defaultprobe_cm.ktx2',
  'engineassets/shading/defaultprobe_cm_diff.ktx2',
  // the clouds dome of previews (LevelSystem createCloudsDome)
  'objects/sky/skydome_a.cgf',
  'objects/sky/skydome_a.cgfheap',
  'objects/sky/testclouds_sky_a_mtl.mtl',
  'objects/sky/textures/clouds_mask_a.dds',
  'objects/sky/textures/clouds_mask_b.dds',
  'objects/sky/textures/clouds_mask_c.dds',
])

/**
 * Asset ids that the bundled files reference (lowercase guid, without braces and sub id) and their file paths, so they
 * resolve without the nwbt catalog: the clouds dome references its material by id
 */
const BUNDLED_ASSET_IDS = new Map<string, string>([
  ['87cb3bba-bb29-54d1-9114-18dbfc68febb', 'objects/sky/testclouds_sky_a_mtl.mtl'],
])

/**
 * The file path of an asset id that a bundled file references (`{guid}` or `{guid}:subId`), null if unknown
 */
export function bundledAssetIdPath(assetId: string): string | null {
  const guid = assetId
    .trim()
    .toLowerCase()
    .replace(/^\{/, '')
    .replace(/\}(:\d+)?$/, '')
  return BUNDLED_ASSET_IDS.get(guid) ?? null
}

/**
 * The url of the viewer's copy of a game file, null if it doesn't ship with the viewer, see {@link BUNDLED_GAME_FILES}
 *
 * @param path - game file path, relative to the game root, may have a query (e.g. `?merge=true`)
 */
export function bundledGameFileUrl(path: string): string | null {
  const file = path.split('?')[0].replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase()
  return BUNDLED_GAME_FILES.has(file) ? publicAssetUrl('game/' + file) : null
}

/**
 * Whether a url is a game file path of the nwbt server (relative, e.g. `objects/props/chest.cgf`), not an absolute
 * url (http, blob, data)
 */
export function isGameFilePath(url: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(url)
}
