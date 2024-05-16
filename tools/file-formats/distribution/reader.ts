import * as fs from 'fs'
import * as path from 'path'
import { BinaryReader } from '../../utils/binary-reader'

export async function readDistributionFile(file: string){
  const tokens = path.basename(path.dirname(file)).split('_')
  const region = [Number(tokens[1]), Number(tokens[2])]
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer as any)

  let count = reader.readUShort()
  const slices: string[] = readStringArray(reader, count)
  const variants: string[] = readStringArray(reader, count)

  count = reader.readUInt()
  const indices: number[] = []
  const positions: number[][] = []
  for (let i = 0; i < count; i++) {
    indices.push(reader.readUShort())
  }
  for (let i = 0; i < count; i++) {
    const y = reader.readUShort()
    const x = reader.readUShort()
    positions.push([x, y])
  }
  return {
    region,
    slices: slices,
    variants: variants,
    indices: indices,
    positions: positions,
  }
}

function readStringArray(r: BinaryReader, count: number) {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const c = r.readByte()
    const v = String.fromCharCode(...r.readByteArray(c))
    result.push(v)
  }
  return result
}
