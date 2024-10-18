import * as fs from 'fs'
import * as path from 'path'
import { BinaryReader } from '../../utils/binary-reader'

export async function readDistributionFile(file: string) {
  const tokens = path.basename(path.dirname(file)).split('_')
  const region = [Number(tokens[1]), Number(tokens[2])]
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data)

  let count = reader.readUInt16()
  const slices: string[] = readStringArray(reader, count)
  const variants: string[] = readStringArray(reader, count)

  count = reader.readUInt32()
  const indices: number[] = []
  const positions: number[][] = []
  for (let i = 0; i < count; i++) {
    indices.push(reader.readUInt16())
  }
  for (let i = 0; i < count; i++) {
    const y = reader.readUInt16()
    const x = reader.readUInt16()
    positions.push([x, y])
  }
  reader.seekRelative(count * 4)
  reader.seekRelative(count)

  count = reader.readUInt32()
  const positions2: number[][] = []
  for (let i = 0; i < count; i++) {
    const y = reader.readUInt16()
    const x = reader.readUInt16()
    positions2.push([x, y])
  }
  const types2 = reader.readUInt8Array(count)

  count = reader.readUInt32()
  const positions3: number[][] = []
  for (let i = 0; i < count; i++) {
    const y = reader.readUInt16()
    const x = reader.readUInt16()
    positions3.push([x, y])
  }
  const types3 = reader.readUInt8Array(count)

  return {
    region,
    slices: slices,
    variants: variants,
    indices: indices,
    positions: positions,
    positions2,
    types2,
    positions3,
    types3,
  }
}

function readStringArray(r: BinaryReader, count: number) {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const c = r.readInt8()
    const v = String.fromCharCode(...r.readInt8Array(c))
    result.push(v)
  }
  return result
}
