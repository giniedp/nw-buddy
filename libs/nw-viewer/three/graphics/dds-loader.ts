import {
  CompressedPixelFormat,
  CompressedTexture,
  CompressedTextureMipmap,
  FileLoader,
  Loader,
  LoadingManager,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { DXGI_FORMAT, parse as parseDds } from './dds-format'

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc/
const enum WEBGL_compressed_texture_s3tc {
  COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0,
  COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83f1,
  COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83f2,
  COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83f3,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc_srgb/
const enum WEBGL_compressed_texture_s3tc_srgb {
  COMPRESSED_SRGB_S3TC_DXT1_EXT = 0x8c4c,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 0x8c4d,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 0x8c4e,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 0x8c4f,
}

// https://registry.khronos.org/webgl/extensions/EXT_texture_compression_bptc/
const enum EXT_texture_compression_bptc {
  COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8e8c,
  COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = 0x8e8d,
  COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT = 0x8e8e,
  COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8e8f,
}

// https://registry.khronos.org/webgl/extensions/EXT_texture_compression_rgtc/
const enum EXT_texture_compression_rgtc {
  COMPRESSED_RED_RGTC1_EXT = 0x8dbb,
  COMPRESSED_SIGNED_RED_RGTC1_EXT = 0x8dbc,
  COMPRESSED_RED_GREEN_RGTC2_EXT = 0x8dbd,
  COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT = 0x8dbe,
}

function injectCompressedFormats(renderer: WebGLRenderer) {
  const ctx = renderer.getContext()
  const formats: number[] = []
  if (ctx.getExtension('WEBGL_compressed_texture_s3tc')) {
    formats.push(
      WEBGL_compressed_texture_s3tc.COMPRESSED_RGB_S3TC_DXT1_EXT,
      WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
      WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
      WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT,
    )
  }
  if (ctx.getExtension('WEBGL_compressed_texture_s3tc_srgb')) {
    formats.push(
      WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_S3TC_DXT1_EXT,
      WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
      WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
      WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
    )
  }
  if (ctx.getExtension('EXT_texture_compression_bptc')) {
    formats.push(
      EXT_texture_compression_bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
      EXT_texture_compression_bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
      EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
      EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
    )
  }
  if (ctx.getExtension('EXT_texture_compression_rgtc')) {
    formats.push(
      EXT_texture_compression_rgtc.COMPRESSED_RED_RGTC1_EXT,
      EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
      EXT_texture_compression_rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
      EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
    )
  }
  for (const format of formats) {
    ctx[format] = format
  }
}

export class DDSTextureLoader extends Loader<unknown, string> {
  public static injectFormats = injectCompressedFormats

  constructor(manager: LoadingManager) {
    super(manager)
  }

  public override load(
    url: string,
    onLoad: (data: unknown) => void,
    onProgress: (event: ProgressEvent) => void,
    onError: (err: unknown) => void,
  ) {
    const loader = new FileLoader(this.manager)
    loader.setResponseType('arraybuffer')
    loader.load(
      url,
      (buffer) => {
        try {
          const texture = this.parse(url, buffer as ArrayBuffer)
          onLoad && onLoad(texture)
        } catch (e) {
          console.error(e)
          onError && onError(e)
        }
      },
      onProgress,
      onError,
    )
  }

  parse(url: string, arrayBuffer: ArrayBuffer) {
    let format: CompressedPixelFormat = null
    let srgb = false
    let extension: string

    const dds = parseDds(arrayBuffer)
    const mipmaps = dds.images.map((it, lvl): CompressedTextureMipmap => {
      const divisor = Math.pow(2, lvl)
      return {
        data: it.faces[0],
        width: dds.width / divisor,
        height: dds.height / divisor,
      }
    })
    switch (dds.format) {
      case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM: {
        format = WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT
        extension = 'WEBGL_compressed_texture_s3tc'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC1_UNORM_SRGB: {
        srgb = true
        format = WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT as any
        extension = 'WEBGL_compressed_texture_s3tc_srgb'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM: {
        format = WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT
        extension = 'WEBGL_compressed_texture_s3tc'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC2_UNORM_SRGB: {
        srgb = true
        format = WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT as any
        extension = 'WEBGL_compressed_texture_s3tc_srgb'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM: {
        format = WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
        extension = 'WEBGL_compressed_texture_s3tc'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC3_UNORM_SRGB: {
        srgb = true
        format = WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT as any
        extension = 'WEBGL_compressed_texture_s3tc_srgb'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC4_UNORM: {
        format = EXT_texture_compression_rgtc.COMPRESSED_RED_RGTC1_EXT
        extension = 'EXT_texture_compression_rgtc'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC4_SNORM: {
        format = EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT
        extension = 'EXT_texture_compression_rgtc'
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC5_UNORM: {
        extension = 'EXT_texture_compression_rgtc'
        format = EXT_texture_compression_rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC5_SNORM: {
        extension = 'EXT_texture_compression_rgtc'
        format = EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM: {
        extension = 'EXT_texture_compression_bptc'
        format = EXT_texture_compression_bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT
        break
      }
      case DXGI_FORMAT.DXGI_FORMAT_BC7_UNORM_SRGB: {
        extension = 'EXT_texture_compression_bptc'
        format = EXT_texture_compression_bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT as any
        srgb = true
        break
      }
    }

    if (!format) {
      throw new Error(`Unsupported DDS format: ${dds.format}`)
    }

    if (!mipmaps.length) {
      throw new Error("no mipmaps loaded")
    }

    const texture = new CompressedTexture(mipmaps, dds.width, dds.height, format)
    texture.mipmaps = mipmaps
    texture.needsUpdate = true
    texture.generateMipmaps = false
    if (srgb) {
      texture.colorSpace = SRGBColorSpace
    }

    return texture
  }
}
