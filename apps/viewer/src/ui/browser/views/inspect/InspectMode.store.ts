import type { GridApi } from 'ag-grid-community'
import { createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  describeChunk,
  hex,
  readChunkFile,
  type ByteRange,
  type ChunkEntry,
  type ChunkField,
} from '../../../../formats/cgf/chunks'
import type { ViewerApp } from '../../../app/ViewerApp'
import { formatBytes } from '../../../common/format'
import type { AssetViewProps } from '../registry'
import type { InspectModeState, LoadedChunkFile } from './types'

export type InspectModeStore = ReturnType<typeof createInspectModeStore>

/**
 * The state and actions of the inspect mode: reads the chunks of the file (and finds the heap of a model), selects a
 * chunk in the table and decodes it, shows byte ranges in the Hex mode.
 *
 * @remarks
 * The views of the selected chunk (`ChunkPane.tsx`) get this store.
 */
export function createInspectModeStore(props: AssetViewProps) {
  const app = props.ctx.app
  const path = createMemo(() => props.ctx.path)
  const [loaded] = createResource(path, (it) => loadChunkFile(app, it))
  // reading a failed resource throws: guard every read
  const file = createMemo(() => (loaded.error ? undefined : loaded()))
  const chunks = createMemo(() => file()?.chunks.chunks ?? [])
  const byId = createMemo(() => new Map(chunks().map((it) => [it.id, it])))

  const [state, setState] = createStore<InspectModeState>({
    get loadError() {
      return loaded.error ? String(loaded.error?.message ?? loaded.error) : null
    },
    get ready() {
      return !!file()
    },
    get summary() {
      return summary()
    },
    get heapPath() {
      return file()?.heapPath ?? null
    },
    selected: 0,
  })
  const summary = createMemo(() => {
    const it = file()
    return it ? describeFile(it, it.bytes.length) : ''
  })
  const selected = createMemo(() => chunks()[state.selected] ?? null)
  const detail = createMemo(() => {
    const it = file()
    const chunk = selected()
    if (!it || !chunk) {
      return null
    }
    return describeChunk(it.bytes, chunk)
  })

  let grid: GridApi<ChunkEntry> | undefined

  /**
   * Selects a chunk, also in the table, and scrolls the table to it
   */
  const select = (chunk: ChunkEntry | undefined) => {
    if (!chunk) {
      return
    }
    setState('selected', chunk.index)
    const node = grid?.getRowNode(String(chunk.index))
    node?.setSelected(true)
    if (node?.rowIndex != null) {
      grid?.ensureIndexVisible(node.rowIndex)
    }
  }

  return {
    state,
    /**
     * The chunk table, the rows of the grid. Not part of the state: ag-grid gets the plain objects.
     */
    chunks,
    /**
     * The selected chunk
     */
    selected,
    /**
     * The fields and lists of the selected chunk
     */
    detail,
    /**
     * The chunk a field links to
     */
    chunkById(id: number) {
      return byId().get(id)
    },
    /**
     * The byte range a field describes, null when there is none or it is in a heap the model does not have
     */
    rangeOf(field: ChunkField): ByteRange | null {
      const range = field.bytes
      if (!range || (range.heap && !state.heapPath)) {
        return null
      }
      return range
    },
    /**
     * The longest type name, for the width of the column
     */
    longestType() {
      return Math.max(...chunks().map((it) => it.typeName.length), 4)
    },
    setGrid(api: GridApi<ChunkEntry>) {
      grid = api
      select(selected() ?? undefined)
    },
    /**
     * A row of the table was clicked: the grid selects it itself
     */
    rowClicked(chunk: ChunkEntry | undefined) {
      if (chunk) {
        setState('selected', chunk.index)
      }
    },
    selectId(id: number) {
      select(byId().get(id))
    },
    /**
     * Shows a range of the file, or of its heap, in the Hex mode
     */
    openBytes(range: ByteRange) {
      const target = range.heap ? state.heapPath : path()
      if (target) {
        app.tabs.showBytes(target, { offset: range.offset, length: range.length })
      }
    },
  }
}

/**
 * Reads a chunk file and finds the `.cgfheap` of a model
 */
export async function loadChunkFile(app: ViewerApp, path: string): Promise<LoadedChunkFile> {
  const bytes = await app.files.contentBytes(path)
  // the heap of a model, if there is one. Searched: a stat of a missing file is a 404 in the console.
  const heapPath = `${path}heap`
  const found = await app.nwbt.searchFiles(heapPath, [], undefined, 4).catch(() => null)
  const heap = found?.files.find((it) => it.path === heapPath) ?? null
  return { bytes, chunks: readChunkFile(bytes), heapPath: heap?.path ?? null, heapSize: heap?.size ?? 0 }
}

/**
 * Signature, version, chunk count, size and heap size of a chunk file as one line
 */
export function describeFile(file: Pick<LoadedChunkFile, 'chunks' | 'heapPath' | 'heapSize'>, size: number) {
  const parts = [
    `${file.chunks.signature} ${hex(file.chunks.version, 3)}`,
    `${file.chunks.chunks.length} chunks`,
    formatBytes(size),
  ]
  if (file.heapPath) {
    parts.push(`heap ${formatBytes(file.heapSize)}`)
  }
  return parts.join(' · ')
}
