import { BinaryReader } from './binary-reader'
import zlib from 'node:zlib'

const signature = 'AZCS'
const enum Compression {
  Zstd = 0x72fd505e,
  Zlib = 0x73887d3a,
}

export function isAzcsBuffer(data: Buffer) {
  return data.subarray(0, 4).toString() === signature
}

export async function inflateAzcs(data: Buffer) {
  const reader = new BinaryReader(data)
  reader.littleEndian = false

  if (reader.readString(signature.length) !== signature) {
    throw new Error('Invalid AZCS signature')
  }
  const compression: Compression = reader.readUInt32()
  const uncompressedSize = reader.readUInt64()

  if (compression === Compression.Zlib) {
    const numSeekPoints = reader.readUInt32()
    const rest = reader.slice(reader.length - reader.position - numSeekPoints * 16)
    return zlib.unzipSync(Buffer.from(rest))
  }
  throw new Error(`Unsupported compression: ${compression.toString(16)}`)
}
