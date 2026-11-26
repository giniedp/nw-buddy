import type { Device, MaterialProperties, Texture } from '@gglib/graphics'
import { vec3, vec4, vec4$init, type IVec3, type IVec4 } from '@gglib/math'
import { lfmt } from '@gglib/utils'
import { BlackTextureKey, FlatNormalTextureKey, GrayTextureKey, WhiteTextureKey } from '../content'
import type { NwMaterialProps } from './GltfExtension'
import { getShaderFlags } from './common'

export function paramVec4(value: number[] | string, fallback: IVec4 = vec4.Zero): IVec4 {
  if (typeof value === 'string') {
    value = value.split(',').map(Number)
  }
  return {
    x: value?.[0] ?? fallback?.x ?? 0,
    y: value?.[1] ?? fallback?.y ?? 0,
    z: value?.[2] ?? fallback?.z ?? 0,
    w: value?.[3] ?? fallback?.w ?? 0,
  }
}

export function paramVec3(value: number[] | string, fallback: IVec3 = vec3.Zero): IVec3 {
  if (typeof value === 'string') {
    value = value.split(',').map(Number)
  }
  return {
    x: value?.[0] ?? fallback?.x ?? 0,
    y: value?.[1] ?? fallback?.y ?? 0,
    z: value?.[2] ?? fallback?.z ?? 0,
  }
}

export function paramValue(value: number | string, fallback: number = 0): number {
  // strict: `0 == ''` is true, a number 0 must not fall back
  if (value == null || value === '') {
    return fallback
  }
  if (typeof value === 'number') {
    return value
  }
  value = parseFloat(value)
  if (isNaN(value) || !isFinite(value)) {
    console.warn(`${value} could not be parsed into a number`)
    value = fallback
  }
  return value
}

export class MtlUtil {
  public knownMaps = new Set<string>()
  public knownMods = new Set<string>()
  public knownFlags = new Set<string>()
  public knowsDeform = false

  public name: string
  private log = lfmt.badge('#B07AA1', 'Illum')

  public constructor(
    name: string,
    options?: {
      knownMaps: string[]
      knownMods: string[]
      knownFlags: string[]
      knowsDeform?: boolean
    },
  ) {
    this.name = name
    this.log = lfmt.badge('#B07AA1', `🎨 ${name}`)
    this.addMaps(options?.knownMaps || [])
    this.addMods(options?.knownMods || [])
    this.addFlags(options?.knownFlags || [])
    this.knowsDeform = !!options?.knowsDeform
  }

  public addMaps(names: string[]) {
    for (const it of names) {
      this.knownMaps.add(it)
    }
  }

  public addMods(names: string[]) {
    for (const it of names) {
      this.knownMods.add(it)
    }
  }

  public addFlags(names: string[]) {
    for (const it of names) {
      this.knownFlags.add(it)
    }
  }

  public resolve<T>(properites: MaterialProperties) {
    properites ||= {}
    const props = properites as NwMaterialProps
    const attrs = props?.attrs || {}
    const params = (props?.params || {}) as unknown as T
    const texMaps = props?.textures || {}
    const texFiles = props?.files || {}
    const texMods = props?.mods || {}
    const shaderFlags = getShaderFlags(attrs?.StringGenMask)
    const deform = props.vertexDeform
    const deformWave0 = vec4(0)
    const deformWave1 = vec4(0)
    if (deform?.WaveX?.Type) {
      const wave = deform?.WaveX
      // deformWave0 : vec4f, // .x = Frequency .y = Phase .z = Amplitude .w = Level
      // deformWave1 : vec4f, // .x = 1.0 / DividerX
      vec4$init(deformWave0, wave.Freq, wave.Phase, wave.Amp, wave.Level)
      vec4$init(deformWave1, 1 / deform.DividerX, 1 / deform.DividerY, deform.Type, wave.Type)
    }

    for (const mapName in texMaps) {
      if (this.knownMaps.has(mapName)) {
        continue
      }
      this.knownMaps.add(mapName)
      console.warn(...this.log, `Unsupported map "${mapName}"`)
    }

    for (const modName in texMods) {
      if (this.knownMaps.has(modName)) {
        continue
      }
      this.knownMods.add(modName)
      console.warn(...this.log, `Unsupported modifier "${modName}"`)
    }

    for (const feature of shaderFlags) {
      if (!feature || this.knownFlags.has(feature)) {
        continue
      }
      this.knownFlags.add(feature)
      console.warn(...this.log, `Unsupported feature "${feature}"`)
    }

    if (deform?.Type && !this.knowsDeform) {
      this.knowsDeform = true
      console.warn(...this.log, 'Deform not supported', deform)
    }

    if (texMods?.Diffuse?.TexMod_TexGenType) {
      console.info(...this.log, 'TexMod_TexGenType', texMods?.Diffuse)
    }

    return {
      props,
      attrs,
      params,
      texMaps,
      texFiles,
      texMods,
      shaderFlags,
      deformWave0,
      deformWave1,
    }
  }
}

/**
 * The encoding of two normal maps for `decodeNormalMap` in the shaders: xy = scale, bias of the first, zw = of the
 * second. Signed formats (the game's BC5_SNORM, the flat normal default bound for a missing map) read as they are,
 * unsigned ones (KTX2 exports, png) are remapped from [0, 1].
 */
export function normalMapEncoding(first: unknown, second?: unknown): IVec4 {
  const encoding = vec4(1, 0, 1, 0)
  if (isUnsignedTexture(first)) {
    encoding.x = 2
    encoding.y = -1
  }
  if (isUnsignedTexture(second)) {
    encoding.z = 2
    encoding.w = -1
  }
  return encoding
}

/**
 * Whether a bound texture (or the options to create one) has an unsigned format. Missing ones are not: the flat
 * normal default is signed.
 */
function isUnsignedTexture(texture: unknown): boolean {
  const format = (texture as { format?: string } | null | undefined)?.format
  return !!format && !format.includes('snorm')
}

/**
 * Whether a game texture file is a normal map, by the game's naming (`_ddn`, `_ddna`)
 */
export function isNormalMapFile(file: string | null | undefined): boolean {
  return /_ddna?\.dds$/i.test(file ?? '')
}

export function getWhiteTexture(device: Device): Texture {
  return device.acquireTexture({ key: WhiteTextureKey, throwIfMissing: true })
}

/**
 * Tangent space normal map with the flat normal (0, 0, 1), the engine "FlatBump" texture
 */
export function getFlatNormalTexture(device: Device): Texture {
  return device.acquireTexture({ key: FlatNormalTextureKey, throwIfMissing: true })
}

export function getGrayTexture(device: Device): Texture {
  return device.acquireTexture({ key: GrayTextureKey, throwIfMissing: true })
}

/**
 * Black with alpha 0: neutral for layers that blend by their alpha (e.g. the skin decal layers)
 */
export function getTransparentTexture(device: Device): Texture {
  return device.acquireTexture({ key: BlackTextureKey, throwIfMissing: true })
}
