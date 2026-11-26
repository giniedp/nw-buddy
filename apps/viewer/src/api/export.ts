import type { AudioNames } from '../audio/preview/names'
import type { NwbtClient } from './browse'
import { audioExportActions } from './exportAudio'

/**
 * Export options, the values of `ExportConfig` (config/ExportConfig.ts)
 */
export interface ExportOptions {
  /**
   * Model textures: png (converted, any glTF viewer) or dds (the original files, for Blender; nwbt writes normal maps
   * as RGB with z)
   */
  textures: string
  textureSize: string
  yUp: boolean
  /**
   * Specular as ior 1.5 with a scaled specular color (same F0) instead of ior 0, which Blender does not render
   */
  blenderSpecular: boolean
  quantize: boolean
  allLods: boolean
  keepNoDraw: boolean
}

/**
 * The options of the converted exports of a file (the "export" actions), in display order. Only the options that
 * apply.
 * - textures: the png size
 * - models: all options
 * - materials, characters, slices (converted to glb): all but the LODs
 * - other files (only downloads): none
 */
export function exportOptionNames(path: string): Array<keyof ExportOptions> {
  if (/\.dds(\.a)?$/.test(path)) {
    return ['textureSize']
  }
  if (/\.(cgf|skin)$/.test(path)) {
    return ['textures', 'textureSize', 'yUp', 'blenderSpecular', 'quantize', 'allLods', 'keepNoDraw']
  }
  if (/\.(mtl|cdf|dynamicslice)$/.test(path)) {
    return ['textures', 'textureSize', 'yUp', 'blenderSpecular', 'quantize', 'keepNoDraw']
  }
  return []
}

/**
 * A download of an asset, raw or converted by nwbt
 */
export interface ExportAction {
  id: string
  /**
   * export: converted by nwbt, uses the export options. download: the files as stored, no options.
   */
  group: 'export' | 'download'
  label: string
  title: string
  /**
   * The nwbt url of the file, null for a file made in the page (see {@link ExportAction.create})
   */
  url: string | null
  /**
   * Makes the file in the page instead of fetching it, e.g. audio decoded with vgmstream.
   * `onProgress` gets done and total steps.
   */
  create?: (onProgress?: (done: number, total: number) => void, signal?: AbortSignal) => Promise<Blob>
  /**
   * File name of the download when the server sends none
   */
  fileName: string
  /**
   * Parameters too long for the url (e.g. the animations of a character): the download POSTs them as a form, nwbt
   * reads them as part of the query
   */
  form?: Record<string, string>
  /**
   * Shown with the action, e.g. that the export gets large
   */
  warning?: string
}

/**
 * Animations in a character export above which the dialog warns about the file size and the conversion time
 */
export const EXPORT_ANIMATIONS_WARNING = 100

/**
 * The server and the state the export actions use
 */
export interface ExportContext {
  nwbt: NwbtClient
  audioNames: AudioNames
}

/**
 * An animation clip a character export includes: its name in the character's set (the glTF animation name) and its
 * `.caf` file
 */
export interface ExportAnimation {
  name: string
  file: string
}

/**
 * The exports and downloads of a file, by asset type:
 * - `.dds`, `.dds.a`: export png; download the pak file, the assembled dds (merged mips)
 * - `.cgf`, `.skin`:
 *   - export glb, glTF zip (png or the original DDS textures for Blender)
 *   - download the raw zip (model, heap, LODs, material, textures as stored), the file
 * - `.mtl`, `.cdf`, `.dynamicslice`: export glb; download the file. A `.cdf` glb includes the given animations.
 * - `.musicsheetc`: export json (converted by nwbt); download the file
 * - all other files: download the file
 */
export function exportActions(
  context: ExportContext,
  path: string,
  options: ExportOptions,
  material?: string,
  animations: ExportAnimation[] = [],
): ExportAction[] {
  // a converted file, uses the export options
  const exportAs = (...args: ActionArgs) => action(context.nwbt, 'export', ...args)
  // a file as stored, no options
  const download = (...args: ActionArgs) => action(context.nwbt, 'download', ...args)
  const name = path.split('/').pop() ?? path
  const stem = name.replace(/\.[^.]+$/, '')
  const size = options.textureSize === 'full' ? null : options.textureSize
  const raw = download('raw', 'File', 'The stored file', path, {}, name)

  if (/\.dds(\.a)?$/.test(path)) {
    const alpha = path.endsWith('.a')
    const pngName = alpha ? `${name.replace(/\.dds\.a$/, '')}_a.png` : `${stem}.png`
    return [
      exportAs('png', 'PNG', 'Converted to png, the first face of a cubemap', `${path}.png`, { size }, pngName),
      download('dds-raw', 'DDS (pak file)', 'The stored file, only the smallest mips', path, { merge: 'false' }, name),
      download('dds-merged', 'DDS', 'All mips merged into one file', path, { merge: 'true' }, name),
    ]
  }

  // dds: the original DDS textures, Blender reads them from glTF (not other glTF viewers)
  const dds = options.textures === 'dds'
  const model = {
    yup: options.yUp ? '' : null,
    size,
    quantize: options.quantize ? '1' : null,
    lod: options.allLods ? 'all' : null,
    nodraw: options.keepNoDraw ? 'keep' : null,
    textures: dds ? 'dds' : 'embed',
    // the glTF default ior, nwbt scales the specular color by its inverse reflectance
    ior: options.blenderSpecular ? '1.5' : null,
  }
  if (/\.(cgf|skin)$/.test(path)) {
    // the material of the entity, when it overrides the model's own
    const mtl = { material: material || null }
    return [
      exportAs(
        'glb',
        'GLB',
        'One glTF file with embedded textures',
        `${path}.glb`,
        { ...mtl, ...model },
        `${stem}.glb`,
      ),
      exportAs(
        'gltf-zip',
        'glTF zip',
        'gltf + bin + texture files',
        `${path}.gltf.zip`,
        { ...mtl, ...model },
        `${stem}.gltf.zip`,
      ),
      download(
        'raw-zip',
        'Raw zip',
        'Model, heap, LODs, material and textures as stored',
        `${path}.raw.zip`,
        mtl,
        `${stem}.raw.zip`,
      ),
      raw,
    ]
  }
  if (/\.cdf$/.test(path)) {
    const count = animations.length
    const label = count ? `GLB with ${count} animation${count === 1 ? '' : 's'}` : 'GLB'
    const title = 'One glTF file with embedded textures: the skinned parts, the skeleton and the selected animations'
    const glb = exportAs('glb', label, title, `${path}.glb`, model, `${stem}.glb`)
    if (count) {
      glb.form = { animations: JSON.stringify(animations) }
    }
    if (count > EXPORT_ANIMATIONS_WARNING) {
      glb.warning = `${count} animations make a large file and take long to convert.`
    }
    return [glb, raw]
  }
  if (/\.(mtl|dynamicslice)$/.test(path)) {
    return [exportAs('glb', 'GLB', 'One glTF file with embedded textures', `${path}.glb`, model, `${stem}.glb`), raw]
  }
  if (/\.(wem|bnk)$/.test(path)) {
    return [...audioExportActions(context, path), raw]
  }
  if (/\.musicsheetc$/.test(path)) {
    const title = 'The music sheet as json: difficulty, notes with key, track and time'
    return [exportAs('json', 'JSON', title, `${path}.json`, {}, `${stem}.json`), raw]
  }
  return [raw]
}

type ActionArgs = [
  id: string,
  label: string,
  title: string,
  file: string,
  query: Record<string, string | null>,
  fileName: string,
]

function action(
  nwbt: NwbtClient,
  group: ExportAction['group'],
  ...[id, label, title, file, query, fileName]: ActionArgs
): ExportAction {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      params.set(key, value)
    }
  }
  params.set('download', '1')
  // `yup` is a flag without value
  const search = params.toString().replace(/(^|&)yup=(&|$)/, '$1yup$2')
  return { id, group, label, title, url: `${nwbt.filesUrl(file)}?${search}`, fileName }
}

/**
 * Downloads the url into a file: fetches it with progress, then saves the blob through an `<a download>`.
 *
 * @param onProgress - loaded bytes and the total from Content-Length (0 when unknown)
 */
export async function downloadExport(
  item: ExportAction,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (item.create) {
    saveBlob(await item.create(onProgress, signal), item.fileName)
    return
  }
  let init: RequestInit = { signal }
  if (item.form) {
    init = { signal, method: 'POST', body: new URLSearchParams(item.form) }
  }
  const res = await fetch(item.url!, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.trim().slice(0, 200)}` : ''}`)
  }
  const total = Number(res.headers.get('content-length') || 0)
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let loaded = 0
  const reader = res.body?.getReader()
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      chunks.push(value)
      loaded += value.byteLength
      onProgress?.(loaded, total)
    }
  }
  const blob = new Blob(chunks, { type: res.headers.get('content-type') || 'application/octet-stream' })
  saveBlob(blob, dispositionFileName(res.headers.get('content-disposition')) ?? item.fileName)
}

/**
 * Saves a blob as a file through an `<a download>`
 */
export function saveBlob(blob: Blob, fileName: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  // the click starts the download synchronously, the url is only needed until then
  setTimeout(() => URL.revokeObjectURL(link.href), 0)
}

/**
 * The file name of a `Content-Disposition` header, e.g. `attachment; filename=x.glb`
 */
export function dispositionFileName(header: string | null): string | null {
  const match = header ? /filename="?([^";]+)"?/i.exec(header) : null
  return match ? match[1] : null
}
