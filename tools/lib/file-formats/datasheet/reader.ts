import * as fs from 'node:fs'
import { BinaryReader } from '../../utils/binary-reader'
import { ColumnType, Datasheet, DatasheetColumn, DatasheetRow } from './types'

export interface DatasheetHeader {
  signature: string
  idCrc: number
  idOffset: number
  typeCrc: number
  typeOffset: number
  stringsLength: number
  stringsOffset: number
  end: number
}

export function readDatasheetFile(file: string): Promise<Datasheet> {
  const buffer = fs.readFileSync(file)
  return parseDatasheet(buffer)
}

export async function parseDatasheet(data: Buffer): Promise<Datasheet> {
  const r = new BinaryReader(data)
  const header = parseHeader(r)
  r.seekAbsolute(header.end)
  r.seekRelative(2 * 4)
  const columnCount = r.readUInt32()
  const rowCount = r.readUInt32()
  r.seekRelative(4 * 4)

  function getString(offset: number) {
    const restore = r.position
    r.seekAbsolute(header.end + header.stringsOffset + offset)
    const value = r.readStringNT()
    r.seekAbsolute(restore)
    return value
  }

  const columns = r.readArray(columnCount, (r): DatasheetColumn => {
    const hash = r.readUInt32()
    const offset = r.readUInt32()
    const type = r.readUInt32()
    const name = getString(offset)
    return {
      type,
      name,
      hash,
    }
  })

  const rows: DatasheetRow[] = Array.from({ length: rowCount }, () => {
    return Array.from({ length: columnCount }, (_, i) => {
      const col = columns[i]
      switch (col.type) {
        case ColumnType.String: {
          r.seekRelative(4) // hash
          const offset = r.readUInt32()
          return getString(offset)
        }
        case ColumnType.Number: {
          r.seekRelative(4) // hash
          return r.readFloat32()
        }
        case ColumnType.Boolean: {
          r.seekRelative(4) // hash
          return !!r.readUInt32()
        }
        default: {
          throw new Error(`Unknown type ${col.type}`)
        }
      }
    })
  })

  const worksheet = r.readStringNT()
  return {
    header: columns,
    rows,
    type: getString(header.typeOffset),
    name: getString(header.idOffset),
  }
}

function parseHeader(r: BinaryReader): DatasheetHeader {
  const signature = r.readString(4)
  const idCrc = r.readUInt32()
  const idOffset = r.readUInt32()
  const typeCrc = r.readUInt32()
  const typeOffset = r.readUInt32()
  r.seekRelative(4)
  const stringsLength = r.readUInt32()
  r.seekRelative(7 * 4)
  const stringsOffset = r.readUInt32()

  return {
    signature,
    idCrc,
    idOffset,
    typeCrc,
    typeOffset,
    stringsLength,
    stringsOffset,
    end: r.position,
  }
}
