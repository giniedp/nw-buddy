import * as fs from 'fs'
import { BinaryReader } from '../../utils/binary-reader'
import { Vshapec } from './types'

export async function readVshapec(file: string): Promise<Vshapec> {
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer as any)

  const version = reader.readUInt()
  const vertexCount = reader.readUInt()
  const vertices: number[][] = []
  for (let i = 0; i < vertexCount; i++) {
    vertices.push([reader.readFloat(), reader.readFloat(), reader.readFloat()])
  }
  const propCount = reader.readUInt()
  const properties: Array<{ key: string; value: string }> = []
  for (let i = 0; i < propCount; i++) {
    const key = reader.readString(reader.readUInt())
    const value = reader.readString(reader.readUInt())
    properties.push({ key, value })
  }
  return {
    version,
    vertices,
    properties,
  }
}
