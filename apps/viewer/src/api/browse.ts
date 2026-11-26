/**
 * Client of the asset browser api of nwbt (`/browse/*`, commands/serve/browse.go in nw-buddy/tools/nwbt).
 * Only metadata: file contents come from `/files/<path>`. The exception is `/browse/slice`, see {@link getSlice}.
 */

import type { LevelIndex, ViewerSlice } from './types'

/**
 * Mirrors `catalog.TypeGroup` (nwbt formats/catalog/types.go)
 */
export type TypeGroup =
  | 'other'
  | 'texture'
  | 'geometry'
  | 'animation'
  | 'material'
  | 'slice'
  | 'script'
  | 'data'
  | 'ui'
  | 'audio'
  | 'video'
  | 'effects'
  | 'physics'
  | 'terrain'
  | 'ai'
  | 'config'
  | 'hidden'

/**
 * Mirrors `catalog.ContentFormat`: how a product is stored as far as known. Xml and json typed files may still be
 * binary object streams, the content decides.
 */
export type ContentFormat = 'binary' | 'xml' | 'json' | 'ini' | 'lua' | 'text' | 'chunks' | 'datasheet'

/**
 * Mirrors `browse.Type`. Its position in the list of {@link getTypes} is the type id of files.
 */
export interface AssetType {
  /**
   * Catalog type uuid, or `ext:<extension>` for files without a catalog type
   */
  key: string
  label: string
  group: TypeGroup
  format: ContentFormat
  /**
   * Parts of other assets (split texture mips), not listed unless asked for
   */
  hidden: boolean
  /**
   * False for types missing from nwbt's type table
   */
  known: boolean
  count: number
}

/**
 * Mirrors `browse.ListFile`
 */
export interface ListFile {
  name: string
  path: string
  size: number
  /**
   * Index into the list of {@link getTypes}
   */
  type: number
  inCatalog: boolean
}

/**
 * Mirrors `browse.ListResult`
 */
export interface ListResult {
  dir: string
  /**
   * Child folders that contain a selected file, sorted
   */
  dirs: string[]
  files: ListFile[]
  /**
   * Number of selected files in the folder, may be more than `files`
   */
  total: number
  truncated: boolean
}

/**
 * Mirrors `browse.SearchResult`
 */
export interface SearchResult {
  query: string
  files: ListFile[]
  total: number
}

/**
 * Mirrors `browse.CatalogInfo`
 */
export interface CatalogInfo {
  guid: string
  subId: number
  /**
   * Asset type uuid
   */
  type: string
  size: number
}

/**
 * Mirrors `browse.DdsPart`: a file of a split texture
 */
export interface DdsPart {
  path: string
  /**
   * The part number `N` of a split mip (`.dds.N`, `.dds.Na`), 0 for the alpha base file (`.dds.a`). It is not the mip
   * level: with `S` parts, part `N` holds level `S - N` (the highest number is the largest mip).
   */
  mip: number
  /**
   * Part of the alpha texture: `.dds.a` (a full dds with the small mips) and `.dds.Na`
   */
  alpha: boolean
}

/**
 * Mirrors `browse.Stat`: what the archive and the catalog know about a file
 */
export interface FileStat extends ListFile {
  compressedSize: number
  pak: string
  crc32: string
  modified: string
  catalog: CatalogInfo | null
  /**
   * The split parts of a `.dds`, empty for other files
   */
  parts: DdsPart[]
}

/**
 * Mirrors `serve.BrowseSlice`: a slice and every slice it spawns, as the viewer spawns them
 */
export interface BrowseSlice {
  /**
   * Key of the slice itself in `slices`, `guid_subId`
   */
  root: string
  slices: Record<string, ViewerSlice>
  /**
   * Mesh components over all slices, 0 means there is nothing to see in 3D
   */
  meshes: number
}

/**
 * Mirrors `browse.ColumnKind`: what the cells of a string column hold, inferred by nwbt from their values.
 * `key` is the first column, `ref` holds keys of other families (`refs`), `loc` localization keys (`@name`),
 * `asset` file paths (`exts`), `audio` audio trigger names (`Play_*`).
 */
export type SheetColumnKind = 'key' | 'ref' | 'loc' | 'asset' | 'audio'

/**
 * Mirrors `browse.SheetColumn`
 */
export interface SheetColumn {
  name: string
  /**
   * 1 string, 2 number, 3 boolean (`ColumnType` of formats/datasheet)
   */
  type: number
  kind?: SheetColumnKind
  /**
   * The referenced families, best match first
   */
  refs?: string[]
  /**
   * File extensions of an asset column, most common first
   */
  exts?: string[]
}

/**
 * Mirrors `browse.SheetInfo`: one datasheet file
 */
export interface SheetInfo {
  path: string
  /**
   * The sheet name of the header, e.g. `HouseItems`
   */
  name: string
  rows: number
  columns: number
}

/**
 * Mirrors `browse.SheetFamily`: the sheets of one row type (the family of the sheet header)
 */
export interface SheetFamily {
  name: string
  rows: number
  /**
   * In asset guid order, the order the game visits them
   */
  sheets: SheetInfo[]
  /**
   * The union of the sheets' columns by lowercase name, the first spelling
   */
  columns: SheetColumn[]
}

/**
 * The conversions of nwbt the browser uses, everything else is parsed in the frontend:
 * object streams as `xml` or `json`, and `lua` for compiled lua scripts (unluac on the server)
 */
export type TextConversion = 'xml' | 'json' | 'lua'

function typesParam(types: readonly number[]) {
  return types.length ? `&types=${types.join(',')}` : ''
}

/**
 * Client of one nwbt server: the asset browser api and the file urls of the app
 */
export class NwbtClient {
  /**
   * The nwbt server: empty for the same origin (vite proxy), see ContentService.nwbtUrl
   */
  public readonly baseUrl: string

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private async fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(this.baseUrl + url, { signal })
    if (!res.ok) {
      throw new Error(`${url}: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  /**
   * The asset types that occur in the archive. A file's `type` is an index into this list.
   */
  public getTypes(signal?: AbortSignal) {
    return this.fetchJson<AssetType[]>('/browse/types', signal)
  }

  /**
   * Child folders and files of a folder (`''` is the root). `types` selects type ids, empty selects every type that
   * is not hidden.
   */
  public listFolder(dir: string, types: readonly number[] = [], signal?: AbortSignal) {
    return this.fetchJson<ListResult>(`/browse/list?dir=${encodeURIComponent(dir)}${typesParam(types)}`, signal)
  }

  /**
   * Files whose path contains the query, or whose catalog asset has the asset id of the query. At most `limit`
   * files (the server's default is 500, its maximum 20000), `total` counts all.
   */
  public searchFiles(query: string, types: readonly number[] = [], signal?: AbortSignal, limit?: number) {
    const limitParam = limit ? `&limit=${limit}` : ''
    return this.fetchJson<SearchResult>(
      `/browse/search?q=${encodeURIComponent(query)}${typesParam(types)}${limitParam}`,
      signal,
    )
  }

  /**
   * The viewer slices of a `.dynamicslice` and the slices it spawns (`/browse/slice`). The one content conversion of
   * the browser API besides object streams and luac (user decision): the same Go code serves the levels.
   */
  public getSlice(path: string, signal?: AbortSignal) {
    return this.fetchJson<BrowseSlice>(`/browse/slice?path=${encodeURIComponent(path)}`, signal)
  }

  /**
   * The datasheets by family and the inferred kinds of their columns (`/browse/datasheets`). The first request makes
   * nwbt read every datasheet (a few seconds), later ones are served from memory.
   */
  public getDatasheets(signal?: AbortSignal) {
    return this.fetchJson<{ families: SheetFamily[] }>('/browse/datasheets', signal)
  }

  /**
   * The levels the viewer can open (`/levels/list.json`, the viewer's own level api)
   */
  public getLevels(signal?: AbortSignal) {
    return this.fetchJson<LevelIndex>('/levels/list.json', signal)
  }

  /**
   * Archive and catalog details of a file
   */
  public statFile(path: string, signal?: AbortSignal) {
    return this.fetchJson<FileStat>(`/browse/stat?path=${encodeURIComponent(path)}`, signal)
  }

  /**
   * A file converted to text by nwbt (`/files/<path>.<ext>`). Throws with the server's message if it fails.
   */
  public async convertedText(path: string, conversion: TextConversion, signal?: AbortSignal): Promise<string> {
    const res = await fetch(`${this.filesUrl(path)}.${conversion}`, { signal })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(text.trim() || `${res.status} ${res.statusText}`)
    }
    return text
  }

  /**
   * Url of a small picture of a game image, converted and resized by nwbt (`/files/<path>.webp?size=`). For UI
   * thumbnails only (the scenes dialog); textures under inspection are rendered by the engine (D6 of the pak
   * browser). The data names images `.png`, the archive has them as `.dds`: nwbt resolves that.
   */
  public thumbnailUrl(path: string, size: number) {
    const base = path.replace(/\.[a-z0-9]+$/i, '')
    return `${this.filesUrl(base)}.webp?size=${size}`
  }

  /**
   * Url of a file's raw content (`/files/<path>`). For a `.dds` the stored base file, not merged by the server.
   */
  public fileUrl(path: string) {
    const url = this.filesUrl(path)
    return path.endsWith('.dds') || path.endsWith('.dds.a') ? `${url}?merge=false` : url
  }

  /**
   * Url of a file or of a conversion of it (`/files/<path>`, e.g. `x.cgf.glb`), without query parameters
   */
  public filesUrl(path: string) {
    return `${this.baseUrl}/files/${path}`
  }
}
