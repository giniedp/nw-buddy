import * as fs from 'fs'
import * as path from 'path'
import { BinaryReader } from '../../utils/binary-reader'

export async function readAssetcatalog(file: string): Promise<Record<string, string>> {
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer as any)

  const signature = reader.readString(4)
  const version = reader.readUInt32()
  const fileSize = reader.readUInt32()
  const field4 = reader.readUInt32()
  // console.table({ signature, version, fileSize, field4, position: reader.position })

  const posBlockUUID = reader.readUInt32() // UUID block
  const posBlockType = reader.readUInt32() // Type block
  const posBlockDirs = reader.readUInt32() // Dir block
  const posBlockFile = reader.readUInt32() // File block
  const fileSize2 = reader.readUInt32()
  const posBlock0 = reader.position

  // console.table({
  //   posBlockUUID,
  //   posBlockType,
  //   posBlockDirs,
  //   posBlockFile,
  //   fileSize2,
  //   position: reader.position,
  // })

  const assetInfoRefs: Array<{
    uuidIndex1: number
    subId1: number
    uuidIndex2: number
    subId2: number
    typeIndex: number
    field6: number
    fileSize: number
    field8: number
    dirOffset: number
    fileOffset: number
  }> = []
  const assetPathRefs: Array<{
    uuidIndex: number
    guidIndex: number
    subId: number
  }> = []
  const legacyAssetRefs: Array<{
    legacyGuidIndex: number
    legacySubId: number
    guidIndex: number
    subId: number
  }> = []

  reader.seekAbsolute(posBlock0)

  const count1 = reader.readUInt32()
  for (let i = 0; i < count1; i++) {
    assetInfoRefs.push({
      uuidIndex1: reader.readUInt32(),
      subId1: reader.readUInt32(),
      uuidIndex2: reader.readUInt32(),
      subId2: reader.readUInt32(),
      typeIndex: reader.readUInt32(),
      field6: reader.readUInt32(),
      fileSize: reader.readUInt32(),
      field8: reader.readUInt32(),
      dirOffset: reader.readUInt32(),
      fileOffset: reader.readUInt32(),
    })
  }

  const assetInfos = assetInfoRefs.map((info) => {
    reader.seekAbsolute(posBlockUUID + 16 * info.uuidIndex2)
    const assetId = reader.readUInt32()

    reader.seekAbsolute(posBlockUUID + 16 * info.typeIndex)
    const type = reader.readUInt32()

    reader.seekAbsolute(posBlockDirs + info.dirOffset)
    const dir = reader.readStringNT()

    reader.seekAbsolute(posBlockFile + info.fileOffset)
    const file = reader.readStringNT()

    return {
      assetId,
      type,
      dir,
      file,
    }
  })

  const result: Record<string, string> = {}
  for (const asset of assetInfos) {
    result[asset.assetId] = path.join(asset.dir, asset.file).replace(/\\/g, '/')
  }
  return result
}
