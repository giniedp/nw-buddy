import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { CatalogInfo, DdsPart } from '../../../../api/browse'
import { formatBytes, formatBytesExact } from '../../../common/format'
import type { ContentKind } from '../../../../api/files'
import type { AssetViewProps, ViewContext } from '../registry'
import type { DetailRow, DetailsViewState } from './types'

const KIND_LABEL: Record<ContentKind, string> = {
  text: 'Text',
  objectstream: 'Binary object stream',
  'objectstream-xml': 'XML object stream',
  binary: 'Binary',
}

export type DetailsViewStore = ReturnType<typeof createDetailsViewStore>

/**
 * The rows of the details view, from the stat of the file and the context of the tab
 */
export function createDetailsViewStore(props: AssetViewProps) {
  const file = createMemo(() => fileRows(props.ctx))
  const catalog = createMemo(() => catalogRows(props.ctx.stat.catalog))
  const parts = createMemo(() => props.ctx.stat.parts.map(partRow))

  const [state] = createStore<DetailsViewState>({
    get file() {
      return file()
    },
    get catalog() {
      return catalog()
    },
    get parts() {
      return parts()
    },
  })

  return { state }
}

export function fileRows(ctx: Pick<ViewContext, 'stat' | 'type' | 'kind'>): DetailRow[] {
  const stat = ctx.stat
  return [
    { label: 'Path', value: stat.path },
    { label: 'Type', value: ctx.type?.label ?? '' },
    { label: 'Content', value: KIND_LABEL[ctx.kind] },
    { label: 'Size', value: formatBytesExact(stat.size) },
    { label: 'Packed', value: formatBytes(stat.compressedSize) },
    { label: 'Pak', value: stat.pak },
    { label: 'CRC32', value: stat.crc32 },
    { label: 'Modified', value: stat.modified },
  ]
}

export function catalogRows(catalog: CatalogInfo | null): DetailRow[] | null {
  if (!catalog) {
    return null
  }
  return [
    { label: 'Asset id', value: assetId(catalog) },
    { label: 'Type id', value: catalog.type },
  ]
}

/**
 * `guid`, or `guid:subId` with the sub id in hex
 */
export function assetId(catalog: CatalogInfo): string {
  if (!catalog.subId) {
    return catalog.guid
  }
  return `${catalog.guid}:${catalog.subId.toString(16)}`
}

/**
 * A split part of a texture: which mip or alpha part, and its file name
 */
export function partRow(part: DdsPart): DetailRow {
  return { label: partLabel(part), value: part.path.slice(part.path.lastIndexOf('/') + 1) }
}

function partLabel(part: DdsPart): string {
  if (!part.alpha) {
    return `Mip ${part.mip}`
  }
  if (part.mip) {
    return `Alpha mip ${part.mip}`
  }
  return 'Alpha'
}
