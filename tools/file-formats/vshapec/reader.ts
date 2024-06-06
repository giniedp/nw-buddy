import * as fs from 'fs'
import { BinaryReader } from '../../utils/binary-reader'
import { Vshapec } from './types'

export async function readVshapec(file: string): Promise<Vshapec> {
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer as any)

  const version = reader.readUInt32()
  const vertexCount = reader.readUInt32()
  const vertices: number[][] = []
  for (let i = 0; i < vertexCount; i++) {
    vertices.push([reader.readFloat32(), reader.readFloat32(), reader.readFloat32()])
  }
  const propCount = reader.readUInt32()
  const properties: Array<{ key: string; value: string }> = []
  for (let i = 0; i < propCount; i++) {
    const key = reader.readString(reader.readUInt32())
    const value = reader.readString(reader.readUInt32())
    properties.push({ key, value })
  }
  return {
    version,
    vertices,
    properties,
  }
}
