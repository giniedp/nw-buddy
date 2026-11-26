import type { GltfSocketOffset, MaterialParams } from '@nw-buddy/viewer'
import type { ModelSource } from '../model-viewer/utils/model-source'
import type { ModelSocketInfo } from '../model-viewer/utils/vital-models'
import { GlbAttachment, GlbDocument, GltfJson, mergeGlbs, parseGlb, writeGlb } from './glb-merge'

/**
 * The model as the view shows it, for the nwbt export
 */
export interface ModelExport {
  source: ModelSource
  /**
   * The public material params of the view (the appearance's colors and dyes)
   */
  params: MaterialParams | null
  /**
   * The weapons a character holds
   */
  sockets?: ModelSocketInfo[]
  /**
   * Names of the playing animations, nwbt finds their clips in the model's animation list
   */
  animations: string[]
  /**
   * File name without extension
   */
  name: string
}

/**
 * The body of nwbt `POST /characters/compose` (`ComposeRequest`)
 */
export interface ComposeRequest {
  model: string
  material?: string
  overcoat?: string
  params?: MaterialParams
  skeleton?: string
  hidden?: string[]
  parts: Array<{
    name: string
    skin: string
    material: string
    clothFrom: string | null
    params: MaterialParams | null
  }>
  sockets: ComposeSocket[]
  animations: Array<{ name: string; file?: string }>
  name: string
}

export interface ComposeSocket {
  name: string
  offset: GltfSocketOffset
  models: Array<{ model: string; material?: string; params?: MaterialParams }>
}

/**
 * A file the view loads and the root its textures resolve from
 */
export interface ModelFile {
  url: string
  rootUrl: string
}

/**
 * The files of a model as the view shows it
 */
export interface ModelFiles {
  model: ModelFile
  /**
   * Models drawn along with it (the worn skins of a character)
   */
  parts?: ModelFile[]
  /**
   * Node names of the model and the parts that are not drawn
   */
  hidden?: string[]
  /**
   * The models on sockets of the model (weapons)
   */
  sockets?: Array<{ name: string; offset: GltfSocketOffset; models: ModelFile[] }>
}

/**
 * Where models on a socket sit, see the viewer lib's `socketPlacement`
 */
export type SocketPlacement = (
  gltf: GltfJson,
  name: string,
  offset: GltfSocketOffset,
) => { joint: string; matrix: number[] } | null

/**
 * The compose request of a model
 */
export function composeRequest(model: ModelExport): ComposeRequest {
  return {
    model: model.source.model,
    material: model.source.material ?? '',
    overcoat: model.source.overcoat ?? '',
    params: model.params ?? undefined,
    skeleton: model.source.skeleton ?? '',
    parts: [],
    sockets: (model.sockets ?? []).map(({ name, offset, models }) => {
      return { name, offset, models: models.map(({ source }) => composeModel(source)) }
    }),
    animations: model.animations.map((name) => ({ name })),
    name: model.name,
  }
}

function composeModel({ model, material }: ModelSource) {
  return { model, material: material ?? '' }
}

/**
 * The GLB of a model built by nwbt from the game files, with the options for Blender: DDS textures, specular workflow
 * with ior 1.5, y up
 */
export async function fetchNwbtGlb(nwbtUrl: string, request: ComposeRequest): Promise<Blob> {
  const res = await fetch(`${nwbtUrl}/characters/compose?yup=true&textures=dds&ior=1.5`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`)
  }
  return res.blob()
}

/**
 * Whether the models server has the GLB
 */
export async function hasModelFile(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * The uris of the external images of a GLB (data uris and buffer views left out)
 */
export function glbImageUris({ images }: GltfJson): string[] {
  const result: string[] = []
  for (const image of images ?? []) {
    if (image.uri && !image.uri.startsWith('data:') && !result.includes(image.uri)) {
      result.push(image.uri)
    }
  }
  return result
}

/**
 * A zip of the model as the view shows it, in one GLB, and the textures it names, at their uris. The uris resolve
 * against the models root, as the viewer loads them. Weapons that do not load are left out, as in the view.
 */
export async function zipModelFiles(files: ModelFiles, name: string, placement: SocketPlacement): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const glb = await fetchModel(files, placement)
  const zip = new JSZip()
  zip.file(`${name}.glb`, writeGlb(glb))
  for (const uri of glbImageUris(glb.json)) {
    zip.file(decodeURI(uri), await fetchBuffer(new URL(uri, files.model.rootUrl).href))
  }
  return zip.generateAsync({ type: 'blob' })
}

async function fetchModel(files: ModelFiles, placement: SocketPlacement): Promise<GlbDocument> {
  const model = await fetchGlb(files.model)
  if (!files.parts?.length && !files.hidden?.length && !files.sockets?.length) {
    return model
  }
  const parts = await Promise.all((files.parts ?? []).map((it) => fetchGlb(it)))
  const attachments: GlbAttachment[] = []
  for (const socket of files.sockets ?? []) {
    const place = placement(model.json, socket.name, socket.offset)
    if (!place) {
      continue
    }
    for (const file of socket.models) {
      try {
        attachments.push({ glb: await fetchGlb(file), ...place })
      } catch (err) {
        console.warn('socket model left out', socket.name, String(err))
      }
    }
  }
  return mergeGlbs(model, { parts, hidden: files.hidden, attachments })
}

async function fetchGlb({ url }: ModelFile): Promise<GlbDocument> {
  return parseGlb(await fetchBuffer(url))
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`)
  }
  return res.arrayBuffer()
}

/**
 * A file name from a display name: letters, digits, `-` and `_`
 */
export function downloadName(...parts: Array<string | null | undefined>): string {
  const name = parts
    .filter((it) => !!it)
    .join(' ')
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
  return name || 'model'
}
