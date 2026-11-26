// Shrinks the stage: drops textures the viewer does not sample (also all of the plain glTF materials) and models that
// are never on screen, resizes the original textures to what the editor camera needs (analysis.json) or to the sizes of
// config.json and encodes them as KTX2.
//   node tools/stage/shrink.mjs <stage.glb> <analysis.json> <dds export.glb> <out.glb>
import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { cpus, tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { readDdsFormats } from './dds-formats.mjs'
import { imageSize, readGlb, writeGlb } from './glb-json.mjs'

const sharp = createRequire(import.meta.url)('sharp')
const run = promisify(execFile)
const [input, analysisFile, ddsExport, output] = process.argv.slice(2)

// maxSize: no texture gets larger by the analysis
// minSize: no texture gets smaller by the analysis
// smallShare: below this share of the screen a model's textures are one mip lower than it needs
// sizes: image name (or its end, e.g. "jav_prp_rumjug_diff.dds") → its larger side in pixels, overrides the analysis
// fine: image names (or their ends) encoded with less loss
const {
  maxSize: MAX_SIZE,
  minSize: MIN_SIZE,
  smallShare: SMALL_SHARE,
  sizes: SIZES,
  fine: FINE,
} = JSON.parse(readFileSync(new URL('config.json', import.meta.url), 'utf8')).textures

const { json, bin } = readGlb(readFileSync(input))
const ddsFormats = readDdsFormats(ddsExport)
const analysis = JSON.parse(readFileSync(analysisFile, 'utf8')).materials

const imageOf = (texture) => json.textures[texture].source
const viewBytes = (index) => {
  const view = json.bufferViews[index]
  const start = view.byteOffset || 0
  return bin.subarray(start, start + view.byteLength)
}
const isNamed = (name, key) => name === key || name.endsWith(`/${key}`)

// 1. materials: no plain glTF textures, only the maps the shaders sample
function isSampled(map, flags) {
  const blend = flags.includes('%BLENDLAYER')
  switch (map) {
    case 'Detail':
      return flags.includes('%DETAIL_MAPPING')
    // parallax mapping is not implemented in the viewer
    case 'Heightmap':
      return false
    case 'Opacity':
      return blend || flags.includes('%DECAL') || flags.includes('%TRANSMITTANCE')
    case 'Custom':
      return blend || flags.includes('OVERLAY_MASK')
    default:
      return true
  }
}
function removeTextures(object) {
  for (const [key, value] of Object.entries(object)) {
    if (/Texture$/.test(key) && typeof value?.index === 'number') {
      delete object[key]
    } else if (value && typeof value === 'object') {
      removeTextures(value)
    }
  }
}
// the source texture of every material, before anything is removed
const diffuseOf = json.materials.map((mat) => {
  const map = mat.extensions.EXT_nw_material.textures?.find((it) => it.extensions.EXT_nw_tex.Map === 'Diffuse')
  return map ? json.images[imageOf(map.index)].name : ''
})
for (const mat of json.materials) {
  const nw = mat.extensions.EXT_nw_material
  const maps = nw.textures || []
  delete mat.extensions.EXT_nw_material
  removeTextures(mat)
  delete nw.smoothTexture
  delete nw.maskTexture
  if (nw.textures) {
    const flags = nw.attrs.StringGenMask || ''
    nw.textures = maps.filter((it) => nw.attrs.Shader !== 'Illum' || isSampled(it.extensions.EXT_nw_tex.Map, flags))
  }
  mat.extensions.EXT_nw_material = nw
}

// 2. primitives: what no view sees. Volumetric materials stay (their shaders move the vertices), and the light blockers
// (for screens wider than the analyzed views)
const dropMaterials = new Set()
json.materials.forEach((mat, index) => {
  const isUnseen = !analysis[index].seenPixels && mat.extensions.EXT_nw_material.attrs.Shader === 'Illum'
  if (isUnseen && !mat.extras?.nwBlocker) {
    dropMaterials.add(index)
    console.log('drop unseen', index, diffuseOf[index])
  }
})
for (const mesh of json.meshes) {
  mesh.primitives = mesh.primitives.filter((it) => !dropMaterials.has(it.material))
}
for (const node of json.nodes) {
  if (node.mesh != null && json.meshes[node.mesh].primitives.length === 0) {
    delete node.mesh
    if (node.extensions) {
      delete node.extensions.EXT_mesh_gpu_instancing
    }
  }
}

// 3. texture sizes
const users = json.images.map(() => [])
json.materials.forEach((mat, index) => {
  if (dropMaterials.has(index)) {
    return
  }
  const nw = mat.extensions.EXT_nw_material
  for (const tex of nw.textures || []) {
    const map = tex.extensions.EXT_nw_tex.Map
    const isLayer =
      (nw.attrs.StringGenMask || '').includes('%BLENDLAYER') && /^(Custom|\[1\] Custom|SecondSmoothness)$/.test(map)
    const tile = tex.extensions.EXT_nw_tex.TexMod?.TileU || (isLayer ? 2 : 1)
    users[imageOf(tex.index)].push({ index, map, tiling: Math.log2(tile), volumetric: nw.attrs.Shader !== 'Illum' })
  }
})

/**
 * How many mips of the original an image drops
 */
function mipsToDrop(index, info) {
  const list = users[index]
  const size = Math.max(info.width, info.height)
  const name = json.images[index].name
  const fixed = Object.entries(SIZES).find(([key]) => isNamed(name, key))
  if (fixed) {
    return Math.max(0, Math.round(Math.log2(size / fixed[1])))
  }
  const cap = Math.max(0, Math.ceil(Math.log2(size / MAX_SIZE)))
  if (list.some((it) => it.volumetric)) {
    return cap
  }
  let lod = Infinity
  let share = 0
  for (const user of list) {
    const mat = analysis[user.index]
    const own = mat.lod1 ?? mat.lodOut ?? 0
    lod = Math.min(lod, own + user.tiling + Math.log2(size / Math.max(mat.width, mat.height)))
    share = Math.max(share, mat.maxShare)
  }
  let drop = Math.floor(lod + 0.25)
  if (share < SMALL_SHARE) {
    drop = Math.max(drop, Math.floor(lod + 1))
  }
  return Math.max(
    cap,
    Math.min(drop, Math.floor(Math.log2(size / MIN_SIZE)), Math.log2(Math.min(info.width, info.height)) - 2),
  )
}

/**
 * The KTX2 kind of an image by the format of its DDS (nwbt formats/image/convert.go ktxFormatOfDDS, the viewer samples
 * the game textures as their DDS format says): BC5 normal maps, sRGB formats, one channel BC4 (the attached alpha of
 * normal maps), the others linear
 */
function ktxKind(name) {
  const format = ddsFormats.get(name)
  if (!format) {
    throw new Error(`no DDS format of ${name}`)
  }
  if (/^BC5|^ATI2/.test(format)) {
    return 'normal'
  }
  if (format.endsWith('_SRGB')) {
    return 'srgb'
  }
  if (/^BC4|^ATI1/.test(format)) {
    return 'r8'
  }
  return 'linear'
}
const KTX_FORMATS = { normal: 'R8G8B8_UNORM', srgb: 'R8G8B8A8_SRGB', r8: 'R8_UNORM', linear: 'R8G8B8A8_UNORM' }
// low detail maps, ETC1S if a texture is used for nothing else
const LOW_MAPS = new Set(['Smoothness', 'SecondSmoothness', '[5] Smoothness', 'Specular', 'Specular2', 'Occlusion'])

const linear = Float64Array.from({ length: 256 }, (_, i) => {
  const c = i / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
})
const encodeSrgb = (c) => Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055))

/**
 * Halves an image `steps` times with a box filter: colors in linear light, alpha on its own (it may hold other data)
 */
function halve(data, width, height, channels, isSrgb, steps) {
  const scale = 2 ** steps
  const w = width / scale
  const h = height / scale
  const out = Buffer.alloc(w * h * channels)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < channels; c++) {
        const isColor = isSrgb && c < 3
        let sum = 0
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const value = data[((y * scale + sy) * width + x * scale + sx) * channels + c]
            sum += isColor ? linear[value] : value
          }
        }
        const mean = sum / (scale * scale)
        out[(y * w + x) * channels + c] = isColor ? encodeSrgb(mean) : Math.round(mean)
      }
    }
  }
  return { data: out, w, h }
}

const replaced = new Map()
const dir = mkdtempSync(join(tmpdir(), 'stage-shrink-'))
const table = []
const jobs = json.images.map((image, index) => async () => {
  // only the images the game materials sample stay
  if (!users[index].length) {
    return
  }
  const source = viewBytes(image.bufferView)
  const info = imageSize(source)
  const drop = mipsToDrop(index, info)
  const kind = ktxKind(image.name)
  const pixels = await sharp(Buffer.from(source)).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = pixels.info
  const small = halve(pixels.data, width, height, channels, kind === 'srgb', drop)
  if (!Number.isInteger(small.w) || !Number.isInteger(small.h) || small.w % 4 || small.h % 4) {
    throw new Error(`${image.name}: ${width}x${height} does not halve ${drop} times to multiples of 4`)
  }
  const base = join(dir, String(index))
  let resized = sharp(small.data, { raw: { width: small.w, height: small.h, channels } })
  if (kind === 'r8') {
    resized = resized.extractChannel(0)
  }
  await resized.png().toFile(`${base}.png`)
  const isFine = FINE.some((it) => isNamed(image.name, it))
  const isLow = users[index].every((it) => LOW_MAPS.has(it.map))
  const args = ['create', '--threads', '1', '--generate-mipmap', '--format', KTX_FORMATS[kind]]
  if (isFine) {
    args.push('--encode', 'uastc', '--uastc-quality', '3', '--zstd', '18')
  } else if (isLow) {
    args.push('--encode', 'basis-lz', '--clevel', '4', '--qlevel', '255')
  } else {
    args.push('--encode', 'uastc', '--uastc-quality', '2', '--zstd', '18', '--uastc-rdo', '--uastc-rdo-l', '1')
  }
  if (kind === 'srgb') {
    args.push('--assign-oetf', 'srgb', '--assign-primaries', 'bt709')
  } else {
    args.push('--assign-oetf', 'linear', '--assign-primaries', 'none')
  }
  if (kind === 'normal') {
    args.push('--normalize')
  }
  await run('ktx', [...args, `${base}.png`, `${base}.ktx2`])
  const data = readFileSync(`${base}.ktx2`)
  replaced.set(image.bufferView, data)
  image.mimeType = 'image/ktx2'
  table.push({
    image: image.name.split('/').pop(),
    maps: [...new Set(users[index].map((it) => it.map))].join(),
    from: `${width}x${height}`,
    to: `${small.w}x${small.h}`,
    kind,
    encoding: `${isLow && !isFine ? 'etc1s' : 'uastc'}${isFine ? ' fine' : ''}`,
    kB: Math.round(data.length / 1000),
  })
})
let next = 0
await Promise.all(
  Array.from({ length: Math.max(1, cpus().length - 2) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next]
      next += 1
      await job()
    }
  }),
)
rmSync(dir, { recursive: true, force: true })
console.table(table.sort((a, b) => a.image.localeCompare(b.image)))

// 4. rebuild with what is still referenced
const compact = compactGlb()
writeFileSync(output, compact)
console.log(
  'out',
  output,
  (compact.length / 1e6).toFixed(2),
  'MB',
  json.images.length,
  'images',
  json.materials.length,
  'materials',
)

/**
 * Removes unreferenced meshes, materials, textures, images, accessors and buffer views and renumbers the rest
 */
function compactGlb() {
  // materials and meshes
  const keptMeshes = reindex(json.nodes.filter((it) => it.mesh != null).map((it) => it.mesh))
  json.nodes.forEach((it) => {
    if (it.mesh != null) {
      it.mesh = keptMeshes.get(it.mesh)
    }
  })
  json.meshes = pick(json.meshes, keptMeshes)
  const prims = json.meshes.flatMap((it) => it.primitives)
  const keptMaterials = reindex(prims.map((it) => it.material))
  prims.forEach((it) => {
    it.material = keptMaterials.get(it.material)
  })
  json.materials = pick(json.materials, keptMaterials)
  // textures: the maps of the game materials and the cubes of the probes
  const probes = json.nodes.map((it) => it.extras?.nwEnvProbe).filter((it) => !!it)
  const infos = json.materials.flatMap((it) => it.extensions.EXT_nw_material.textures || [])
  const keptTextures = reindex([
    ...infos.map((it) => it.index),
    ...probes.flatMap((it) => [it.cubemapTexture, it.cubemapDiffuseTexture]).filter((it) => it != null),
  ])
  infos.forEach((it) => {
    it.index = keptTextures.get(it.index)
  })
  for (const probe of probes) {
    for (const key of ['cubemapTexture', 'cubemapDiffuseTexture']) {
      if (probe[key] != null) {
        probe[key] = keptTextures.get(probe[key])
      }
    }
  }
  json.textures = pick(json.textures, keptTextures)
  const keptImages = reindex(json.textures.map((it) => it.source))
  json.textures.forEach((it) => {
    it.extensions = { ...it.extensions, KHR_texture_basisu: { source: keptImages.get(it.source) } }
    delete it.source
  })
  json.images = pick(json.images, keptImages)
  // accessors
  const instancing = json.nodes.map((it) => it.extensions?.EXT_mesh_gpu_instancing?.attributes).filter((it) => !!it)
  const holders = [...prims.map((it) => it.attributes), ...instancing]
  const keptAccessors = reindex([...holders.flatMap((it) => Object.values(it)), ...prims.map((it) => it.indices)])
  for (const holder of holders) {
    for (const key of Object.keys(holder)) {
      holder[key] = keptAccessors.get(holder[key])
    }
  }
  prims.forEach((it) => {
    it.indices = keptAccessors.get(it.indices)
  })
  json.accessors = pick(json.accessors, keptAccessors)
  // buffer views
  const viewHolders = [...json.accessors, ...json.images]
  const keptViews = reindex(viewHolders.map((it) => it.bufferView))
  const parts = []
  let length = 0
  const views = []
  for (const [from, to] of keptViews) {
    const data = replaced.get(from) || viewBytes(from)
    const padding = (4 - (length % 4)) % 4
    parts.push(Buffer.alloc(padding), data)
    length += padding
    views[to] = { ...json.bufferViews[from], byteOffset: length, byteLength: data.length }
    length += data.length
  }
  viewHolders.forEach((it) => {
    it.bufferView = keptViews.get(it.bufferView)
  })
  json.bufferViews = views
  json.buffers = [{ byteLength: length }]
  // extensions nothing uses any more
  const text = JSON.stringify({ ...json, extensionsUsed: null, extensionsRequired: null })
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    const list = [...new Set([...(json[key] || []), 'KHR_texture_basisu'])]
    json[key] = list.filter((it) => text.includes(`"${it}"`))
  }
  return writeGlb(json, Buffer.concat(parts))
}

function reindex(list) {
  const result = new Map()
  for (const index of [...new Set(list)].sort((a, b) => a - b)) {
    result.set(index, result.size)
  }
  return result
}

function pick(list, kept) {
  return [...kept.keys()].map((it) => list[it])
}
