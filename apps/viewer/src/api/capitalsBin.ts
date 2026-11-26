import type { CapitalRuntimeData, ChunkRuntimeData, ViewerSlice } from './types'

/**
 * Header of the `capitals.bin` layout
 *
 * @remarks
 * The response is `u32 little endian header length | header JSON | slice JSONs back to back`. Each slice body is the
 * JSON of one {@link ViewerSlice}, the same as the values of `RegionCapitalsData.slices` in `capitals.json`.
 */
export interface RegionCapitalsBinHeader {
  /** Keyed by layer name. */
  capitals: Record<string, CapitalRuntimeData[]>
  /** Keyed by layer name. */
  chunks: Record<string, ChunkRuntimeData[]>
  /** Keyed by asset UUID_SUBID, `[offset, length]` of the slice JSON relative to the start of the slice bodies. */
  slices: Record<string, [number, number]>
}

/**
 * Capitals data of a region with slices that are parsed on first use
 */
export interface RegionCapitals {
  /** Keyed by layer name. */
  capitals: Record<string, CapitalRuntimeData[]>
  /** Keyed by layer name. */
  chunks: Record<string, ChunkRuntimeData[]>
  /** Keyed by asset UUID_SUBID. */
  slices: LazySliceSet
}

const decoder = new TextDecoder()

/**
 * Slices kept as raw JSON bytes, each one parsed the first time it is requested
 *
 * @remarks
 * The undecoded bytes are a single ArrayBuffer, which the GC does not traverse. Parsed slices stay cached for the
 * lifetime of the set.
 */
export class LazySliceSet {
  private bodies: Uint8Array
  private index: Record<string, [number, number]>
  private parsed = new Map<string, ViewerSlice>()

  public constructor(bodies: Uint8Array, index: Record<string, [number, number]>) {
    this.bodies = bodies
    this.index = index
  }

  public get(key: string): ViewerSlice | undefined {
    const cached = this.parsed.get(key)
    if (cached) {
      return cached
    }
    const range = this.index[key]
    if (!range) {
      return undefined
    }
    const offset = range[0]
    const slice = JSON.parse(decoder.decode(this.bodies.subarray(offset, offset + range[1]))) as ViewerSlice
    this.parsed.set(key, slice)
    return slice
  }

  /**
   * Number of slices in the set
   */
  public get size() {
    return Object.keys(this.index).length
  }

  /**
   * Number of slices parsed so far
   */
  public get parsedCount() {
    return this.parsed.size
  }
}

/**
 * Decodes a `capitals.bin` response. Parses the header only, slices are parsed on first use.
 */
export function decodeRegionCapitalsBin(buffer: ArrayBuffer): RegionCapitals {
  const headerLength = new DataView(buffer).getUint32(0, true)
  const header = JSON.parse(decoder.decode(new Uint8Array(buffer, 4, headerLength))) as RegionCapitalsBinHeader
  return {
    capitals: header.capitals,
    chunks: header.chunks,
    slices: new LazySliceSet(new Uint8Array(buffer, 4 + headerLength), header.slices),
  }
}
