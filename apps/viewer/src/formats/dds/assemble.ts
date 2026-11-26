import { DDS } from '@gglib/loaders'

/**
 * A split mip file of a texture: `x.dds.N` (or `x.dds.Na` of the alpha texture) and its bytes
 */
export interface DdsSplitPart {
  /**
   * The `N` of the file name. With `S` parts, part `N` holds mip level `S - N`: the highest number is the largest
   * mip.
   */
  number: number
  data: Uint8Array
}

export const DdsAssembleErrorCode = {
  /**
   * A part number is missing, repeated or out of range, or there are more parts than mips
   */
  BadPart: 'bad-part',
  /**
   * A part does not hold exactly one mip level of every layer
   */
  SizeMismatch: 'size-mismatch',
  /**
   * The base file lacks mips that no part holds
   */
  Truncated: 'truncated',
} as const
export type DdsAssembleErrorCode = (typeof DdsAssembleErrorCode)[keyof typeof DdsAssembleErrorCode]

export class DdsAssembleError extends Error {
  public readonly code: DdsAssembleErrorCode
  public constructor(code: DdsAssembleErrorCode, message: string) {
    super(message)
    this.name = 'DdsAssembleError'
    this.code = code
  }
}

export interface AssembledDds {
  /**
   * A plain DDS file: the header of the base file, followed by every mip level of every layer (all mips of layer 0,
   * then layer 1, ...). Parse it with `DDS.parse`.
   */
  data: Uint8Array
  /**
   * The header of the assembled file
   */
  info: DDS.DdsInfo
  /**
   * Number of split parts that were merged in
   */
  parts: number
  /**
   * Small mips the header declares but the base file lacks. They are left out, and the mip count of the header is
   * lowered by this number.
   */
  dropped: number
}

/**
 * Bytes of one mip level of one layer (all depth slices of a volume)
 */
export function ddsLevelSize(info: DDS.DdsInfo, level: number): number {
  const width = Math.max(1, info.width >> level)
  const height = Math.max(1, info.height >> level)
  const depth = Math.max(1, info.depth >> level)
  return DDS.getSurfaceInfo(width, height, info.format).numBytes * depth
}

/**
 * Reassembles a split texture of New World into a plain DDS file.
 *
 * @remarks
 * New World splits large textures. The base file `x.dds` holds the full header (full size and mip count) followed by
 * the data of the small mips only, laid out as in a plain DDS (layer after layer). Each large mip is a separate
 * headerless file `x.dds.N`, holding that level of every layer, layer after layer. The alpha of a texture is a second
 * DDS `x.dds.a` with its own parts `x.dds.Na`, assembled the same way.
 *
 * Every level must come from exactly one source and every size must match, otherwise the texture is rejected, never
 * guessed. Some alpha textures have fewer small mips in the base than the header declares: then only the levels of the
 * parts are used and the rest is reported as {@link AssembledDds.dropped}. Trailing bytes after the chain are ignored.
 */
export function assembleDds(base: Uint8Array, parts: readonly DdsSplitPart[]): AssembledDds {
  const info = DDS.parseHeader(toArrayBuffer(base))
  const split = parts.length
  if (split > info.mipCount) {
    throw new DdsAssembleError(DdsAssembleErrorCode.BadPart, `${split} parts but only ${info.mipCount} mips`)
  }

  const layers = info.arraySize
  const baseData = base.subarray(info.headerSize)
  let mipCount = info.mipCount
  let dropped = 0
  let baseSize = 0
  for (let level = split; level < mipCount; level++) {
    baseSize += ddsLevelSize(info, level) * layers
  }
  if (baseData.length < baseSize) {
    if (split === 0) {
      throw new DdsAssembleError(
        DdsAssembleErrorCode.Truncated,
        `the file holds ${baseData.length} bytes of ${baseSize} and has no parts`,
      )
    }
    dropped = mipCount - split
    mipCount = split
    baseSize = 0
  }

  // the parts by level
  const byLevel: Uint8Array[] = new Array(split)
  for (const part of parts) {
    const level = split - part.number
    if (!Number.isInteger(part.number) || level < 0 || level >= split || byLevel[level]) {
      throw new DdsAssembleError(
        DdsAssembleErrorCode.BadPart,
        `part ${part.number} is out of range or repeated (${split} parts)`,
      )
    }
    const size = ddsLevelSize(info, level) * layers
    if (part.data.length !== size) {
      throw new DdsAssembleError(
        DdsAssembleErrorCode.SizeMismatch,
        `part ${part.number} (mip ${level}) has ${part.data.length} bytes, expected ${size}`,
      )
    }
    byLevel[level] = part.data
  }

  let total = info.headerSize + baseSize
  for (const data of byLevel) {
    total += data.length
  }
  const result = new Uint8Array(total)
  result.set(base.subarray(0, info.headerSize))
  if (dropped) {
    new DataView(result.buffer).setUint32(28, mipCount, true)
  }

  let at = info.headerSize
  let from = 0
  for (let layer = 0; layer < layers; layer++) {
    for (let level = 0; level < mipCount; level++) {
      const size = ddsLevelSize(info, level)
      if (level < split) {
        result.set(byLevel[level].subarray(layer * size, (layer + 1) * size), at)
      } else {
        result.set(baseData.subarray(from, from + size), at)
        from += size
      }
      at += size
    }
  }

  return {
    data: result,
    info: dropped ? { ...info, mipCount, header: { ...info.header, MipMapCount: mipCount } } : info,
    parts: split,
    dropped,
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength && bytes.buffer instanceof ArrayBuffer) {
    return bytes.buffer
  }
  return bytes.slice().buffer
}
