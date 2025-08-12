import BinaryReader from "../core/binary-reader"

export interface Header {
  Size: number // uint32
  Flags: number // uint32
  Height: number // uint32
  Width: number // uint32
  PitchOrLinearSize: number // uint32
  Depth: number // uint32
  MipMapCount: number // uint32
  Reserved: number[] // [11]uint32
  PixelFormat: PixelFormat
  Caps: number // uint32
  Caps2: number // uint32
  Caps3: number // uint32
  Caps4: number // uint32
  Reserved6: number // uint32
  // DX10 header
  DxgiFormat: DXGI_FORMAT // uint32
  ResourceDimension: number // uint32
  MiscFlag: number // uint32
  ArraySize: number // uint32
  MiscFlags2: number // uint32
}

export interface PixelFormat {
  Size: number // uint32
  Flags: number // uint32
  FourCC: string // [4]byte
  RGBBitCount: number // uint32
  RBitMask: number // uint32
  GBitMask: number // uint32
  BBitMask: number // uint32
  ABitMask: number // uint32
}

export enum DXGI_FORMAT {
  DXGI_FORMAT_UNKNOWN = 0,
  DXGI_FORMAT_R32G32B32A32_TYPELESS = 1,
  DXGI_FORMAT_R32G32B32A32_FLOAT = 2,
  DXGI_FORMAT_R32G32B32A32_UINT = 3,
  DXGI_FORMAT_R32G32B32A32_SINT = 4,
  DXGI_FORMAT_R32G32B32_TYPELESS = 5,
  DXGI_FORMAT_R32G32B32_FLOAT = 6,
  DXGI_FORMAT_R32G32B32_UINT = 7,
  DXGI_FORMAT_R32G32B32_SINT = 8,
  DXGI_FORMAT_R16G16B16A16_TYPELESS = 9,
  DXGI_FORMAT_R16G16B16A16_FLOAT = 10,
  DXGI_FORMAT_R16G16B16A16_UNORM = 11,
  DXGI_FORMAT_R16G16B16A16_UINT = 12,
  DXGI_FORMAT_R16G16B16A16_SNORM = 13,
  DXGI_FORMAT_R16G16B16A16_SINT = 14,
  DXGI_FORMAT_R32G32_TYPELESS = 15,
  DXGI_FORMAT_R32G32_FLOAT = 16,
  DXGI_FORMAT_R32G32_UINT = 17,
  DXGI_FORMAT_R32G32_SINT = 18,
  DXGI_FORMAT_R32G8X24_TYPELESS = 19,
  DXGI_FORMAT_D32_FLOAT_S8X24_UINT = 20,
  DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS = 21,
  DXGI_FORMAT_X32_TYPELESS_G8X24_UINT = 22,
  DXGI_FORMAT_R10G10B10A2_TYPELESS = 23,
  DXGI_FORMAT_R10G10B10A2_UNORM = 24,
  DXGI_FORMAT_R10G10B10A2_UINT = 25,
  DXGI_FORMAT_R11G11B10_FLOAT = 26,
  DXGI_FORMAT_R8G8B8A8_TYPELESS = 27,
  DXGI_FORMAT_R8G8B8A8_UNORM = 28,
  DXGI_FORMAT_R8G8B8A8_UNORM_SRGB = 29,
  DXGI_FORMAT_R8G8B8A8_UINT = 30,
  DXGI_FORMAT_R8G8B8A8_SNORM = 31,
  DXGI_FORMAT_R8G8B8A8_SINT = 32,
  DXGI_FORMAT_R16G16_TYPELESS = 33,
  DXGI_FORMAT_R16G16_FLOAT = 34,
  DXGI_FORMAT_R16G16_UNORM = 35,
  DXGI_FORMAT_R16G16_UINT = 36,
  DXGI_FORMAT_R16G16_SNORM = 37,
  DXGI_FORMAT_R16G16_SINT = 38,
  DXGI_FORMAT_R32_TYPELESS = 39,
  DXGI_FORMAT_D32_FLOAT = 40,
  DXGI_FORMAT_R32_FLOAT = 41,
  DXGI_FORMAT_R32_UINT = 42,
  DXGI_FORMAT_R32_SINT = 43,
  DXGI_FORMAT_R24G8_TYPELESS = 44,
  DXGI_FORMAT_D24_UNORM_S8_UINT = 45,
  DXGI_FORMAT_R24_UNORM_X8_TYPELESS = 46,
  DXGI_FORMAT_X24_TYPELESS_G8_UINT = 47,
  DXGI_FORMAT_R8G8_TYPELESS = 48,
  DXGI_FORMAT_R8G8_UNORM = 49,
  DXGI_FORMAT_R8G8_UINT = 50,
  DXGI_FORMAT_R8G8_SNORM = 51,
  DXGI_FORMAT_R8G8_SINT = 52,
  DXGI_FORMAT_R16_TYPELESS = 53,
  DXGI_FORMAT_R16_FLOAT = 54,
  DXGI_FORMAT_D16_UNORM = 55,
  DXGI_FORMAT_R16_UNORM = 56,
  DXGI_FORMAT_R16_UINT = 57,
  DXGI_FORMAT_R16_SNORM = 58,
  DXGI_FORMAT_R16_SINT = 59,
  DXGI_FORMAT_R8_TYPELESS = 60,
  DXGI_FORMAT_R8_UNORM = 61,
  DXGI_FORMAT_R8_UINT = 62,
  DXGI_FORMAT_R8_SNORM = 63,
  DXGI_FORMAT_R8_SINT = 64,
  DXGI_FORMAT_A8_UNORM = 65,
  DXGI_FORMAT_R1_UNORM = 66,
  DXGI_FORMAT_R9G9B9E5_SHAREDEXP = 67,
  DXGI_FORMAT_R8G8_B8G8_UNORM = 68,
  DXGI_FORMAT_G8R8_G8B8_UNORM = 69,
  DXGI_FORMAT_BC1_TYPELESS = 70,
  DXGI_FORMAT_BC1_UNORM = 71,
  DXGI_FORMAT_BC1_UNORM_SRGB = 72,
  DXGI_FORMAT_BC2_TYPELESS = 73,
  DXGI_FORMAT_BC2_UNORM = 74,
  DXGI_FORMAT_BC2_UNORM_SRGB = 75,
  DXGI_FORMAT_BC3_TYPELESS = 76,
  DXGI_FORMAT_BC3_UNORM = 77,
  DXGI_FORMAT_BC3_UNORM_SRGB = 78,
  DXGI_FORMAT_BC4_TYPELESS = 79,
  DXGI_FORMAT_BC4_UNORM = 80,
  DXGI_FORMAT_BC4_SNORM = 81,
  DXGI_FORMAT_BC5_TYPELESS = 82,
  DXGI_FORMAT_BC5_UNORM = 83,
  DXGI_FORMAT_BC5_SNORM = 84,
  DXGI_FORMAT_B5G6R5_UNORM = 85,
  DXGI_FORMAT_B5G5R5A1_UNORM = 86,
  DXGI_FORMAT_B8G8R8A8_UNORM = 87,
  DXGI_FORMAT_B8G8R8X8_UNORM = 88,
  DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM = 89,
  DXGI_FORMAT_B8G8R8A8_TYPELESS = 90,
  DXGI_FORMAT_B8G8R8A8_UNORM_SRGB = 91,
  DXGI_FORMAT_B8G8R8X8_TYPELESS = 92,
  DXGI_FORMAT_B8G8R8X8_UNORM_SRGB = 93,
  DXGI_FORMAT_BC6H_TYPELESS = 94,
  DXGI_FORMAT_BC6H_UF16 = 95,
  DXGI_FORMAT_BC6H_SF16 = 96,
  DXGI_FORMAT_BC7_TYPELESS = 97,
  DXGI_FORMAT_BC7_UNORM = 98,
  DXGI_FORMAT_BC7_UNORM_SRGB = 99,
  DXGI_FORMAT_AYUV = 100,
  DXGI_FORMAT_Y410 = 101,
  DXGI_FORMAT_Y416 = 102,
  DXGI_FORMAT_NV12 = 103,
  DXGI_FORMAT_P010 = 104,
  DXGI_FORMAT_P016 = 105,
  DXGI_FORMAT_420_OPAQUE = 106,
  DXGI_FORMAT_YUY2 = 107,
  DXGI_FORMAT_Y210 = 108,
  DXGI_FORMAT_Y216 = 109,
  DXGI_FORMAT_NV11 = 110,
  DXGI_FORMAT_AI44 = 111,
  DXGI_FORMAT_IA44 = 112,
  DXGI_FORMAT_P8 = 113,
  DXGI_FORMAT_A8P8 = 114,
  DXGI_FORMAT_B4G4R4A4_UNORM = 115,
  DXGI_FORMAT_P208 = 130,
  DXGI_FORMAT_V208 = 131,
  DXGI_FORMAT_V408 = 132,
  DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE = 189,
  DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE = 190,
  DXGI_FORMAT_FORCE_UINT = 0xffffffff,
}

export function parse(buffer: ArrayBuffer) {
  const reader = new BinaryReader(buffer)
  const header = readHeader(reader)
  const data = reader.slice(reader.remaining)
  const isCubemap = !!(header.Caps2 & DDS_CUBEMAP)
  const isDx10 = header.PixelFormat.FourCC === 'DX10'
  const format = isDx10 ? header.DxgiFormat : getDXGIFormat(header.PixelFormat)
  const images = readImages({
    width: header.Width,
    height: header.Height,
    depth: header.Depth || 1,
    data: data,
    arraySize: isCubemap ? 6 : 1,
    mipCount: header.MipMapCount,
    format: format,
  })
  return {
    header,
    width: header.Width,
    height: header.Height,
    depth: header.Depth,
    format,
    isCubemap,
    images,
  }
}

function readHeader(reader: BinaryReader): Header {
  const magic = reader.readString(4) // "DDS "
  if (magic !== 'DDS ') {
    throw new Error('Invalid DDS file format')
  }
  const header: Header = {
    Size: reader.readUInt(),
    Flags: reader.readUInt(),
    Height: reader.readUInt(),
    Width: reader.readUInt(),
    PitchOrLinearSize: reader.readUInt(),
    Depth: reader.readUInt(),
    MipMapCount: reader.readUInt(),
    Reserved: [
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt(),
      reader.readUInt()
    ],
    PixelFormat: {
      Size: reader.readUInt(),
      Flags: reader.readUInt(),
      FourCC: reader.readString(4),
      RGBBitCount: reader.readUInt(),
      RBitMask: reader.readUInt(),
      GBitMask: reader.readUInt(),
      BBitMask: reader.readUInt(),
      ABitMask: reader.readUInt(),
    },
    Caps: reader.readUInt(),
    Caps2: reader.readUInt(),
    Caps3: reader.readUInt(),
    Caps4: reader.readUInt(),
    Reserved6: reader.readUInt(),
    // DX10 header
    DxgiFormat: null,
    ResourceDimension: null,
    MiscFlag: null,
    ArraySize: null,
    MiscFlags2: null,
  }

  if (header.PixelFormat.FourCC === 'DX10') {
    header.DxgiFormat = reader.readUInt() as DXGI_FORMAT
    header.ResourceDimension = reader.readUInt()
    header.MiscFlag = reader.readUInt()
    header.ArraySize = reader.readUInt()
    header.MiscFlags2 = reader.readUInt()
  }

  return header
}

function getSurfaceInfo(width: number, height: number, fmt: DXGI_FORMAT) {
  let numBytes = 0
  let rowBytes = 0
  let numRows = 0

  let bc = false
  let packed = false
  let planar = false
  let bpe = 0
  switch (fmt) {
    case DXGI_FORMAT.DXGI_FORMAT_UNKNOWN:
      throw new Error('Unknown DXGI_FORMAT')

    case DXGI_FORMAT.DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_SNORM:
      bc = true
      bpe = 8
      break

    case DXGI_FORMAT.DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM_SRGB:
      bc = true
      bpe = 16
      break

    case DXGI_FORMAT.DXGI_FORMAT_R8G8_B8G8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_G8R8_G8B8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_YUY2:
      packed = true
      bpe = 4
      break

    case DXGI_FORMAT.DXGI_FORMAT_Y210:
    case DXGI_FORMAT.DXGI_FORMAT_Y216:
      packed = true
      bpe = 8
      break

    case DXGI_FORMAT.DXGI_FORMAT_NV12:
    case DXGI_FORMAT.DXGI_FORMAT_420_OPAQUE:
      if (height % 2 != 0) {
        // Requires a height alignment of 2.
        throw new Error('invalid')
      }
      planar = true
      bpe = 2
      break

    case DXGI_FORMAT.DXGI_FORMAT_P208:
      planar = true
      bpe = 2
      break

    case DXGI_FORMAT.DXGI_FORMAT_P010:
    case DXGI_FORMAT.DXGI_FORMAT_P016:
      if (height % 2 != 0) {
        // Requires a height alignment of 2.
        throw new Error('invalid')
      }
      planar = true
      bpe = 4
      break

    default:
      break
  }

  if (bc) {
    let numBlocksWide = 0
    if (width > 0) {
      numBlocksWide = Math.max(1, Math.ceil(width / 4))
    }
    let numBlocksHigh = 0
    if (height > 0) {
      numBlocksHigh = Math.max(1, Math.ceil(height / 4))
    }
    rowBytes = numBlocksWide * bpe
    numRows = numBlocksHigh
    numBytes = rowBytes * numBlocksHigh
  } else if (packed) {
    rowBytes = Math.ceil(width / 2) * bpe
    numRows = height
    numBytes = rowBytes * height
  } else if (fmt == DXGI_FORMAT.DXGI_FORMAT_NV11) {
    rowBytes = Math.ceil(width / 4) * 4
    numRows = height * 2 // Direct3D makes this simplifying assumption, although it is larger than the 4:1:1 data
    numBytes = rowBytes * numRows
  } else if (planar) {
    rowBytes = Math.ceil(width / 2) * bpe
    numBytes = rowBytes * height + rowBytes * Math.ceil(height / 2)
    numRows = height + Math.ceil(height / 2)
  } else {
    const bpp = getBitsPerPixel(fmt)
    if (!bpp) {
      throw new Error('Unsupported DXGI_FORMAT: ' + fmt)
    }

    rowBytes = Math.ceil((width * bpp) / 8)
    numRows = height
    numBytes = rowBytes * height
  }

  return {
    numBytes,
    rowBytes,
    numRows,
  }
}

function getBitsPerPixel(fmt: DXGI_FORMAT) {
  switch (fmt) {
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32A32_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32A32_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32A32_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32A32_SINT:
      return 128

    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32B32_SINT:
      return 96

    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G32_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32G8X24_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_D32_FLOAT_S8X24_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_X32_TYPELESS_G8X24_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_Y416:
    case DXGI_FORMAT.DXGI_FORMAT_Y210:
    case DXGI_FORMAT.DXGI_FORMAT_Y216:
      return 64

    case DXGI_FORMAT.DXGI_FORMAT_R10G10B10A2_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R10G10B10A2_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R10G10B10A2_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R11G11B10_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16G16_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_D32_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R32_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_R32_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R32_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R24G8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_D24_UNORM_S8_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R24_UNORM_X8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_X24_TYPELESS_G8_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R9G9B9E5_SHAREDEXP:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8_B8G8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_G8R8_G8B8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8X8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8X8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_AYUV:
    case DXGI_FORMAT.DXGI_FORMAT_Y410:
    case DXGI_FORMAT.DXGI_FORMAT_YUY2:
      return 32

    case DXGI_FORMAT.DXGI_FORMAT_P010:
    case DXGI_FORMAT.DXGI_FORMAT_P016:
      return 24

    case DXGI_FORMAT.DXGI_FORMAT_R8G8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8G8_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_R16_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R16_FLOAT:
    case DXGI_FORMAT.DXGI_FORMAT_D16_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R16_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R16_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_B5G6R5_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_B5G5R5A1_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_A8P8:
    case DXGI_FORMAT.DXGI_FORMAT_B4G4R4A4_UNORM:
      return 16

    case DXGI_FORMAT.DXGI_FORMAT_NV12:
    case DXGI_FORMAT.DXGI_FORMAT_420_OPAQUE:
    case DXGI_FORMAT.DXGI_FORMAT_NV11:
      return 12

    case DXGI_FORMAT.DXGI_FORMAT_R8_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_R8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8_UINT:
    case DXGI_FORMAT.DXGI_FORMAT_R8_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_R8_SINT:
    case DXGI_FORMAT.DXGI_FORMAT_A8_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC5_SNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT.DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_AI44:
    case DXGI_FORMAT.DXGI_FORMAT_IA44:
    case DXGI_FORMAT.DXGI_FORMAT_P8:
      return 8

    case DXGI_FORMAT.DXGI_FORMAT_R1_UNORM:
      return 1

    case DXGI_FORMAT.DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT.DXGI_FORMAT_BC4_SNORM:
      return 4

    default:
      return 0
  }
}

const DDS_CUBEMAP = 0x00000200 // DDSCAPS2_CUBEMAP
const DDS_FOURCC = 0x00000004 // DDPF_FOURCC
const DDS_RGB = 0x00000040 // DDPF_RGB
const DDS_LUMINANCE = 0x00020000 // DDPF_LUMINANCE
const DDS_ALPHA = 0x00000002 // DDPF_ALPHA
const DDS_BUMPDUDV = 0x00080000 // DDPF_BUMPDUDV

function isBitmask(ddpf: PixelFormat, r: number, g: number, b: number, a: number) {
  return ddpf.RBitMask === r && ddpf.GBitMask === g && ddpf.BBitMask === b && ddpf.ABitMask === a
}

function getDXGIFormat(ddpf: PixelFormat): DXGI_FORMAT {
  if (ddpf.Flags & DDS_RGB) {
    // Note that sRGB formats are written using the "DX10" extended header

    switch (ddpf.RGBBitCount) {
      case 32:
        if (isBitmask(ddpf, 0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_UNORM
        }

        if (isBitmask(ddpf, 0x00ff0000, 0x0000ff00, 0x000000ff, 0xff000000)) {
          return DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_UNORM
        }

        if (isBitmask(ddpf, 0x00ff0000, 0x0000ff00, 0x000000ff, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_B8G8R8X8_UNORM
        }

        // No DXGI format maps to ISBITMASK(0x000000ff,0x0000ff00,0x00ff0000,0) aka D3DFMT_X8B8G8R8

        // Note that many common DDS reader/writers (including D3DX) swap the
        // the RED/BLUE masks for 10:10:10:2 formats. We assume
        // below that the 'backwards' header mask is being used since it is most
        // likely written by D3DX. The more robust solution is to use the 'DX10'
        // header extension and specify the DXGI_FORMAT_R10G10B10A2_UNORM format directly

        // For 'correct' writers, this should be 0x000003ff,0x000ffc00,0x3ff00000 for RGB data
        if (isBitmask(ddpf, 0x3ff00000, 0x000ffc00, 0x000003ff, 0xc0000000)) {
          return DXGI_FORMAT.DXGI_FORMAT_R10G10B10A2_UNORM
        }

        // No DXGI format maps to ISBITMASK(0x000003ff,0x000ffc00,0x3ff00000,0xc0000000) aka D3DFMT_A2R10G10B10

        if (isBitmask(ddpf, 0x0000ffff, 0xffff0000, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R16G16_UNORM
        }

        if (isBitmask(ddpf, 0xffffffff, 0, 0, 0)) {
          // Only 32-bit color channel format in D3D9 was R32F
          return DXGI_FORMAT.DXGI_FORMAT_R32_FLOAT // D3DX writes this out as a FourCC of 114
        }
        break

      case 24:
        // No 24bpp DXGI formats aka D3DFMT_R8G8B8
        break

      case 16:
        if (isBitmask(ddpf, 0x7c00, 0x03e0, 0x001f, 0x8000)) {
          return DXGI_FORMAT.DXGI_FORMAT_B5G5R5A1_UNORM
        }
        if (isBitmask(ddpf, 0xf800, 0x07e0, 0x001f, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_B5G6R5_UNORM
        }

        // No DXGI format maps to ISBITMASK(0x7c00,0x03e0,0x001f,0) aka D3DFMT_X1R5G5B5

        if (isBitmask(ddpf, 0x0f00, 0x00f0, 0x000f, 0xf000)) {
          return DXGI_FORMAT.DXGI_FORMAT_B4G4R4A4_UNORM
        }

        // NVTT versions 1.x wrote this as RGB instead of LUMINANCE
        if (isBitmask(ddpf, 0x00ff, 0, 0, 0xff00)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8_UNORM
        }
        if (isBitmask(ddpf, 0xffff, 0, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R16_UNORM
        }

        // No DXGI format maps to ISBITMASK(0x0f00,0x00f0,0x000f,0) aka D3DFMT_X4R4G4B4

        // No 3:3:2:8 or paletted DXGI formats aka D3DFMT_A8R3G3B2, D3DFMT_A8P8, etc.
        break

      case 8:
        // NVTT versions 1.x wrote this as RGB instead of LUMINANCE
        if (isBitmask(ddpf, 0xff, 0, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8_UNORM
        }

        // No 3:3:2 or paletted DXGI formats aka D3DFMT_R3G3B2, D3DFMT_P8
        break

      default:
        return DXGI_FORMAT.DXGI_FORMAT_UNKNOWN
    }
  } else if (ddpf.Flags & DDS_LUMINANCE) {
    switch (ddpf.RGBBitCount) {
      case 16:
        if (isBitmask(ddpf, 0xffff, 0, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R16_UNORM // D3DX10/11 writes this out as DX10 extension
        }
        if (isBitmask(ddpf, 0x00ff, 0, 0, 0xff00)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8_UNORM // D3DX10/11 writes this out as DX10 extension
        }
        break

      case 8:
        if (isBitmask(ddpf, 0xff, 0, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8_UNORM // D3DX10/11 writes this out as DX10 extension
        }

        // No DXGI format maps to ISBITMASK(0x0f,0,0,0xf0) aka D3DFMT_A4L4

        if (isBitmask(ddpf, 0x00ff, 0, 0, 0xff00)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8_UNORM // Some DDS writers assume the bitcount should be 8 instead of 16
        }
        break

      default:
        return DXGI_FORMAT.DXGI_FORMAT_UNKNOWN
    }
  } else if (ddpf.Flags & DDS_ALPHA) {
    if (8 == ddpf.RGBBitCount) {
      return DXGI_FORMAT.DXGI_FORMAT_A8_UNORM
    }
  } else if (ddpf.Flags & DDS_BUMPDUDV) {
    switch (ddpf.RGBBitCount) {
      case 32:
        if (isBitmask(ddpf, 0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_SNORM // D3DX10/11 writes this out as DX10 extension
        }
        if (isBitmask(ddpf, 0x0000ffff, 0xffff0000, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R16G16_SNORM // D3DX10/11 writes this out as DX10 extension
        }

        // No DXGI format maps to ISBITMASK(0x3ff00000, 0x000ffc00, 0x000003ff, 0xc0000000) aka D3DFMT_A2W10V10U10
        break

      case 16:
        if (isBitmask(ddpf, 0x00ff, 0xff00, 0, 0)) {
          return DXGI_FORMAT.DXGI_FORMAT_R8G8_SNORM // D3DX10/11 writes this out as DX10 extension
        }
        break

      default:
        return DXGI_FORMAT.DXGI_FORMAT_UNKNOWN
    }

    // No DXGI format maps to DDPF_BUMPLUMINANCE aka D3DFMT_L6V5U5, D3DFMT_X8L8V8U8
  } else if (ddpf.Flags & DDS_FOURCC) {
    if ('DXT1' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM
    }
    if ('DXT3' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM
    }
    if ('DXT5' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM
    }

    // While pre-multiplied alpha isn't directly supported by the DXGI formats,
    // they are basically the same as these BC formats so they can be mapped
    if ('DXT2' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM
    }
    if ('DXT4' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM
    }

    if ('ATI1' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC4_UNORM
    }
    if ('BC4U' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC4_UNORM
    }
    if ('BC4S' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC4_SNORM
    }

    if ('ATI2' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM
    }
    if ('BC5U' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM
    }
    if ('BC5S' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_BC5_SNORM
    }

    // BC6H and BC7 are written using the "DX10" extended header

    if ('RGBG' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_R8G8_B8G8_UNORM
    }
    if ('GRGB' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_G8R8_G8B8_UNORM
    }

    if ('YUY2' == ddpf.FourCC) {
      return DXGI_FORMAT.DXGI_FORMAT_YUY2
    }

    const fourCC =
      ddpf.FourCC.charCodeAt(0) +
      (ddpf.FourCC.charCodeAt(1) << 8) +
      (ddpf.FourCC.charCodeAt(2) << 16) +
      (ddpf.FourCC.charCodeAt(3) << 24)

    // Check for D3DFORMAT enums being set here
    switch (fourCC) {
      case 36: // D3DFMT_A16B16G16R16
        return DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_UNORM

      case 110: // D3DFMT_Q16W16V16U16
        return DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_SNORM

      case 111: // D3DFMT_R16F
        return DXGI_FORMAT.DXGI_FORMAT_R16_FLOAT

      case 112: // D3DFMT_G16R16F
        return DXGI_FORMAT.DXGI_FORMAT_R16G16_FLOAT

      case 113: // D3DFMT_A16B16G16R16F
        return DXGI_FORMAT.DXGI_FORMAT_R16G16B16A16_FLOAT

      case 114: // D3DFMT_R32F
        return DXGI_FORMAT.DXGI_FORMAT_R32_FLOAT

      case 115: // D3DFMT_G32R32F
        return DXGI_FORMAT.DXGI_FORMAT_R32G32_FLOAT

      case 116: // D3DFMT_A32B32G32R32F
        return DXGI_FORMAT.DXGI_FORMAT_R32G32B32A32_FLOAT

      // No DXGI format maps to D3DFMT_CxV8U8

      default:
        return DXGI_FORMAT.DXGI_FORMAT_UNKNOWN
    }
  }

  return DXGI_FORMAT.DXGI_FORMAT_UNKNOWN
}

function readImages({
  width,
  height,
  depth,
  mipCount,
  arraySize,
  format,
  data,
}: {
  width: number
  height: number
  depth: number
  mipCount: number
  arraySize: number
  format: DXGI_FORMAT
  data: ArrayBuffer
}) {
  let position = 0
  const mipmaps: Array<{ faces: Array<Uint8Array<ArrayBuffer>> }> = []

  for (let j = 0; j < arraySize; j++) {
    let w = width
    let h = height
    let d = depth
    for (let i = 0; i < mipCount; i++) {
      const numBytes = getSurfaceInfo(w, h, format).numBytes
      const size = numBytes * d
      mipmaps[i] ||= { faces: [] }
      mipmaps[i].faces.push(new Uint8Array(data, position, size))
      position += size

      w = w >> 1
      h = h >> 1
      d = d >> 1
      if (w == 0) {
        w = 1
      }
      if (h == 0) {
        h = 1
      }
      if (d == 0) {
        d = 1
      }
    }
  }

  return mipmaps
}
