import { BinaryReader } from "../../utils/binary-reader"
import fs from 'node:fs'

export async function readLuacFile(file: string) {
  const data = await fs.promises.readFile(file)
  return parseLuac(data)
}

const magic = [0x04, 0x00]
const sig = [0x1B, 0x4C, 0x75, 0x61]

export async function parseLuac(data: Buffer) {
  const reader = new BinaryReader(data)
  const skipMagic = reader.withRestore((r) => {
    const bytes = r.readBytes(2)
    return bytes[0] === magic[0] && bytes[1] === magic[1]
  })
  if (skipMagic) {
    reader.seekRelative(magic.length)
  }
  const hasSig = reader.withRestore((r) => {
    const bytes = r.readBytes(4)
    return bytes[0] === sig[0] && bytes[1] === sig[1] && bytes[2] === sig[2] && bytes[3] === sig[3]
  })
  if (!hasSig) {
    throw new Error('Invalid luac file')
  }
  return data.subarray(reader.position)
}
