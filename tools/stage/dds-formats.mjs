// DDS formats of the dds1k export's images by name (the KTX2 format of the web build follows them, as nwbt
// image.ktxFormatOfDDS)
import { readFileSync } from 'node:fs'

const DXGI = {
  28: 'R8G8B8A8_UNORM',
  29: 'R8G8B8A8_UNORM_SRGB',
  71: 'BC1_UNORM',
  72: 'BC1_UNORM_SRGB',
  74: 'BC2_UNORM',
  75: 'BC2_UNORM_SRGB',
  77: 'BC3_UNORM',
  78: 'BC3_UNORM_SRGB',
  80: 'BC4_UNORM',
  81: 'BC4_SNORM',
  83: 'BC5_UNORM',
  84: 'BC5_SNORM',
  87: 'B8G8R8A8_UNORM',
  91: 'B8G8R8A8_UNORM_SRGB',
  95: 'BC6H_UF16',
  98: 'BC7_UNORM',
  99: 'BC7_UNORM_SRGB',
}

/**
 * Image name → DXGI format name (or the FourCC of a legacy DDS) of a glb with DDS images
 */
export function readDdsFormats(file) {
  const data = readFileSync(file)
  const jsonLength = data.readUInt32LE(12)
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8'))
  const bin = 20 + jsonLength + 8
  const result = new Map()
  for (const image of json.images || []) {
    const view = json.bufferViews[image.bufferView]
    if (!view) {
      continue
    }
    const start = bin + (view.byteOffset || 0)
    const fourCC = data.subarray(start + 84, start + 88).toString('latin1')
    const format =
      fourCC === 'DX10' ? DXGI[data.readUInt32LE(start + 128)] || `DXGI_${data.readUInt32LE(start + 128)}` : fourCC
    result.set(image.name, format)
  }
  return result
}
