import fs from 'node:fs'
import { BinaryReader } from '../../utils/binary-reader'
import { glob } from '../../utils/file-utils'
import { DDSHeader } from './types'

export async function readDdsFile(file: string) {
  const data = await fs.promises.readFile(file)
  const reader = new BinaryReader(data.buffer as any)
  const header = readHeader(reader)
  const isDX10 = header.pixelFormat.fourCC === 'DX10'
  const headerDX10 = isDX10 ? readDx10Header(reader) : null
  const headerSize = reader.position // isDX10 ? 0x94 : 0x80
  const mips = await glob(file + '.*', {
    caseSensitiveMatch: false,
  })
  // some dds images are split into multiple files and have the ending
  // - .dds.1
  // - .dds.2
  // ... etc.
  // Those are actually mipmaps that can be stitched to the given input file
  const mipFiles = mips
    .filter((it) => !!it.match(/\.\d$/))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\.(\d+)$/)[1])
      const bNum = parseInt(b.match(/\.(\d+)$/)[1])
      return bNum - aNum
    })

  // Some files have additional mipmaps
  // - .dds.1a
  // - .dds.2a
  // They can be stitched to the same header file, but as a separate texture
  const mipFilesAlpha = mips
    .filter((it) => !!it.match(/\.\da$/))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\.(\d+)a$/)[1])
      const bNum = parseInt(b.match(/\.(\d+)a$/)[1])
      return bNum - aNum
    })
  return {
    file,
    header,
    headerDX10,
    headerSize,
    mipFiles,
    mipFilesAlpha,
  }
}

function readHeader(r: BinaryReader): DDSHeader {
  const magic = r.readString(4)
  if (magic !== 'DDS ') {
    throw new Error('Invalid DDS file')
  }
  const header = {
    size: r.readUInt32(),
    flags: r.readUInt32(),
    height: r.readUInt32(),
    width: r.readUInt32(),
    pitchOrLinearSize: r.readUInt32(),
    depth: r.readUInt32(),
    mipMapCount: r.readUInt32(),
    reserved: r.readUInt32Array(11),
    pixelFormat: {
      size: r.readUInt32(),
      flags: r.readUInt32(),
      fourCC: r.readString(4),
      rgbBitCount: r.readUInt32(),
      rBitMask: r.readUInt32(),
      gBitMask: r.readUInt32(),
      bBitMask: r.readUInt32(),
      aBitMask: r.readUInt32(),
    },
    caps: r.readUInt32(),
    caps2: r.readUInt32(),
    caps3: r.readUInt32(),
    caps4: r.readUInt32(),
    reserved6: r.readUInt32(),
  }
  return header
}

function readDx10Header(r: BinaryReader) {
  return {
    dxgiFormat: r.readUInt32(),
    resourceDimension: r.readUInt32(),
    miscFlag: r.readUInt32(),
    arraySize: r.readUInt32(),
    miscFlags2: r.readUInt32(),
  }
}
