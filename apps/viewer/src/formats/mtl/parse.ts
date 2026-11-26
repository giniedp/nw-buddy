import type { NwMaterialAttrs, TexMapName, VertexDeform } from '../../material/GltfExtension'
import type { TexMod } from '../../material/TexMod'
import type { MtlDocument, MtlMaterial, MtlTexture } from './types'

// Parsing mirrors nw-buddy tools/nwbt/formats/mtl (xml unmarshal + EXT_nw_material json),
// so .mtl files and glTF materials produce the same material properties.

const NUMBER_ATTRS = ['AlphaTest', 'CloakAmount', 'Opacity', 'Shininess'] as const
const LIST_ATTRS = ['Diffuse', 'Emissive', 'Emittance', 'Specular'] as const
const STRING_ATTRS = ['GenMask', 'Name', 'Shader', 'StringGenMask'] as const
const TEXTURE_INT_ATTRS = ['Filter', 'IsTileU', 'IsTileV', 'TexType'] as const
// TexMod attributes that are omitted when 0
const TEXMOD_ENUM_ATTRS = ['TexMod_RotateType', 'TexMod_TexGenType']

/**
 * Parses the xml of an `.mtl` file
 */
export function parseMtl(xml: string): MtlDocument {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Invalid mtl xml: ${error.textContent}`)
  }
  const root = doc.documentElement
  if (root?.tagName !== 'Material') {
    throw new Error(`Invalid mtl xml: expected root element 'Material' but was '${root?.tagName}'`)
  }
  // same as Document.Collection() in nwbt: the sub materials, or the root material if there are none
  const subMaterials = child(root, 'SubMaterials')
  const materials = subMaterials ? children(subMaterials, 'Material') : [root]
  return {
    materials: materials.map(readMaterial),
  }
}

function readMaterial(el: Element): MtlMaterial {
  return {
    attrs: readAttrs(el),
    params: readParams(child(el, 'PublicParams')),
    textures: children(child(el, 'Textures'), 'Texture').map(readTexture),
    vertexDeform: readVertexDeform(child(el, 'VertexDeform')),
  }
}

function readAttrs(el: Element): NwMaterialAttrs {
  const attrs: NwMaterialAttrs = {}
  for (const name of STRING_ATTRS) {
    const value = el.getAttribute(name)
    if (value) {
      attrs[name] = value
    }
  }
  for (const name of NUMBER_ATTRS) {
    const value = readNumber(el, name)
    if (value != null) {
      attrs[name] = value
    }
  }
  for (const name of LIST_ATTRS) {
    const value = readList(el, name)
    if (value?.length) {
      attrs[name] = value
    }
  }
  const flags = readNumber(el, 'MtlFlags')
  if (flags != null) {
    attrs.MtlFlags = Math.trunc(flags)
  }
  return attrs
}

function readParams(el: Element | null): Record<string, string> {
  const params: Record<string, string> = {}
  if (el) {
    for (const attr of Array.from(el.attributes)) {
      params[attr.name] = attr.value
    }
  }
  return params
}

function readTexture(el: Element): MtlTexture {
  const tex: MtlTexture = {
    Map: (el.getAttribute('Map') || '') as TexMapName,
  }
  const file = el.getAttribute('File')
  if (file) {
    tex.File = file
  }
  const assetId = el.getAttribute('AssetId')
  if (assetId) {
    tex.AssetId = assetId
  }
  for (const name of TEXTURE_INT_ATTRS) {
    const value = readNumber(el, name)
    if (value != null) {
      tex[name] = Math.trunc(value)
    }
  }
  const mod = child(el, 'TexMod')
  if (mod) {
    tex.TexMod = readTexMod(mod)
  }
  return tex
}

function readTexMod(el: Element): TexMod {
  const mod: Record<string, number> = {}
  for (const attr of Array.from(el.attributes)) {
    const value = Number(attr.value)
    if (!Number.isFinite(value)) {
      continue
    }
    if (TEXMOD_ENUM_ATTRS.includes(attr.name) && !value) {
      continue
    }
    mod[attr.name] = value
  }
  return mod as TexMod
}

function readVertexDeform(el: Element | null): VertexDeform | undefined {
  if (!el) {
    return undefined
  }
  const deform: Record<string, any> = {}
  for (const name of ['Type', 'DividerX', 'DividerY']) {
    const value = readNumber(el, name)
    if (value) {
      deform[name] = value
    }
  }
  const noiseScale = readList(el, 'NoiseScale')
  if (noiseScale?.length) {
    deform['NoiseScale'] = noiseScale
  }
  const wave = child(el, 'WaveX')
  deform['WaveX'] = {
    Type: readNumber(wave, 'Type') ?? 0,
    Amp: readNumber(wave, 'Amp') ?? 0,
    Level: readNumber(wave, 'Level') ?? 0,
    Phase: readNumber(wave, 'Phase') ?? 0,
    Freq: readNumber(wave, 'Freq') ?? 0,
  }
  return deform as VertexDeform
}

function readNumber(el: Element | null, name: string): number | null {
  const value = el?.getAttribute(name)
  if (value == null || value.trim() === '') {
    return null
  }
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

function readList(el: Element, name: string): number[] | null {
  const value = el.getAttribute(name)
  if (value == null) {
    return null
  }
  return value
    .split(',')
    .map((it) => it.trim())
    .filter((it) => it !== '')
    .map(Number)
    .filter((it) => Number.isFinite(it))
}

function child(el: Element | null, tag: string): Element | null {
  if (!el) {
    return null
  }
  for (const it of Array.from(el.children)) {
    if (it.tagName === tag) {
      return it
    }
  }
  return null
}

function children(el: Element | null, tag: string): Element[] {
  if (!el) {
    return []
  }
  return Array.from(el.children).filter((it) => it.tagName === tag)
}
