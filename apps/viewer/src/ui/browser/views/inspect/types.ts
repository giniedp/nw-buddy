import type { ChunkFile } from '../../../../formats/cgf/chunks'

/**
 * A chunk file with its bytes and the `.cgfheap` of a model
 */
export interface LoadedChunkFile {
  bytes: Uint8Array
  chunks: ChunkFile
  /**
   * The heap of a model, null when there is none
   */
  heapPath: string | null
  heapSize: number
}

export interface InspectModeState {
  /**
   * The chunks could not be read
   */
  readonly loadError: string | null
  /**
   * The chunks are read
   */
  readonly ready: boolean
  /**
   * Signature, version, chunk count and sizes as one line
   */
  readonly summary: string
  /**
   * The `.cgfheap` of the model, null when there is none
   */
  readonly heapPath: string | null
  /**
   * The index of the selected chunk in the chunk table
   */
  selected: number
}
