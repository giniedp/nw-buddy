// https://www.cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/35259544
// https://github.com/aws/lumberyard/blob/413ecaf24d7a534801cac64f50272fe3191d278f/dev/Code/CryEngine/RenderDll/Common/Shaders/ShaderCore.cpp#L2692
//
// rotateType
// 0 => no change
//   Rotator is deactivated.
// 1 => fixed
//   Static rotation with no animation. Similar to the rotation function of the tiling menu.
// 2 => constant
//   Rotation is constant, rotating/shifting in one direction and back
// 3 => oscilated
//   Rotation oscillates from the minimum, to the maximum, and back:
//
// oscillatorType
// 0 => no change
//   Oscillator is deactivated.
// 1 => fixed
//   Fixed moving is a static oscillation with no animation.
// 2 => constant
//   Texture shifts endlessly in the adjusted direction:
// 3 => jitter
//   Texture shifts endlessly in the adjusted direction with jittering added. Has a stroboscope effect:
// 4 => pan
//   exture shifts in the adjusted direction until the maximum amplitude is reached and back until the minimum amplitude is reached. Comparable to a pendulum movement:
// 5 => stretch moving
//   Similar to pan moving, but different in that the texture is stretched and not shifted to the adjusted direction until the maximum amplitude is reached and back until the minimum amplitude is reached:
// 6 => stretch repeat
//   Similar to stretch moving with the difference that the texture stretching restarts at 0 when the maximum amplitude is reached:
//
// Rate - Defines the number of complete rotation cycles per unit of time. Or in the case of oscillating rotation, defines the rate of change of direction.
// Phase - The phase of an oscillation or wave is the fraction of a complete cycle corresponding to an offset in the displacement from a specified reference point in time t = 0.
// Amplitude - Defines the maximum value of an oscillation/wave.
// CenterU and CenterV - Centers the texture on the model in U and V direction separately.

import {
  DEGREE_TO_RAD,
  mat4,
  type Mat4,
  mat4$initIdentity,
  mat4$initRotationX,
  mat4$initRotationY,
  mat4$initRotationZ,
  mat4$initTranslationXYZ,
  mat4$premultiply,
  mat4$transpose,
  mat4Identity,
} from '@gglib/math'
import { brand, type Brand } from '@gglib/utils'

export type RotateType = Brand<number, 'RotateType'>
export const RotateType = {
  Disabled: brand<RotateType>(0),
  Fixed: brand<RotateType>(1),
  Constant: brand<RotateType>(2),
  Oscilated: brand<RotateType>(3),
}

export type OscillatorType = Brand<number, 'OscillatorType'>
export const OscillatorType = {
  Disabled: brand<OscillatorType>(0),
  Fixed: brand<OscillatorType>(1),
  Constant: brand<OscillatorType>(2),
  Jitter: brand<OscillatorType>(3),
  Pan: brand<OscillatorType>(4),
  Stretch: brand<OscillatorType>(5),
  StretchRepeat: brand<OscillatorType>(6),
}

export type TexGenType = Brand<number, 'TexGenType'>
export const TexGenType = {
  Stream: brand<TexGenType>(0),
  World: brand<TexGenType>(1),
  Camera: brand<TexGenType>(2),
}

export type TexMod = {
  OffsetU?: number
  OffsetV?: number
  RotateU?: number
  RotateV?: number
  RotateW?: number
  TexMod_bTexGenProjected?: number
  TexMod_RotateType?: RotateType
  TexMod_TexGenType?: TexGenType
  TexMod_UOscillatorAmplitude?: number
  TexMod_UOscillatorPhase?: number
  TexMod_UOscillatorRate?: number
  TexMod_UOscillatorType?: number
  TexMod_URotateAmplitude?: number
  TexMod_URotateCenter?: number
  TexMod_URotatePhase?: number
  TexMod_URotateRate?: number
  TexMod_VOscillatorAmplitude?: number
  TexMod_VOscillatorPhase?: number
  TexMod_VOscillatorRate?: number
  TexMod_VOscillatorType?: number
  TexMod_VRotateAmplitude?: number
  TexMod_VRotateCenter?: number
  TexMod_VRotatePhase?: number
  TexMod_VRotateRate?: number
  TexMod_WRotateAmplitude?: number
  TexMod_WRotatePhase?: number
  TexMod_WRotateRate?: number
  TileU?: number
  TileV?: number
}

const _m2 = mat4()

function hasMods(mod: TexMod): boolean {
  return !!mod.TexMod_UOscillatorType || !!mod.TexMod_VOscillatorType || !!mod.TexMod_RotateType
}

function hasValues(mod: TexMod): boolean {
  return !!(mod.OffsetU || mod.OffsetV || mod.TileU != 1 || mod.TileV != 1 || mod.RotateU || mod.RotateV || mod.RotateW)
}

export class TextureModifier {
  public static isModified(mod: TexMod): boolean {
    return !!mod && (hasMods(mod) || hasValues(mod))
  }

  private jitterU: number = Math.random()
  private jitterV: number = Math.random()
  private jitterTimeU: number = 0
  private jitterTimeV: number = 0

  private time = null
  private mat: Mat4 = mat4Identity()
  private mod: TexMod

  public isAnimated: boolean

  private hasMods: boolean
  private hasValues: boolean

  public constructor(mod: TexMod) {
    this.mod = mod
    if (!mod) {
      throw new Error('TexMod is required')
    }

    this.hasMods = hasMods(mod)
    this.hasValues = hasValues(mod)
    this.isAnimated = this.hasMods
  }

  public get matrix(): Mat4 {
    return this.mat
  }

  public update(time: number): void {
    if (this.time === time) {
      return
    }
    this.time = time
    const mod = this.mod

    const hasMods = this.hasMods
    const hasValues = this.hasValues
    const isModified = hasMods || hasValues

    if (!isModified) {
      return
    }

    const m = mat4$initIdentity(this.mat)
    const tmp = mat4$initIdentity(_m2)
    const seconds = time

    this.applyRotation(m, tmp, time)
    this.applyOscillatorU(m, seconds)
    this.applyOscillatorV(m, seconds)

    if (hasValues) {
      // CreateRotationX(degrees to radians)
      premultiplyRotation(m, tmp, AXIS_X, DEGREE_TO_RAD * (mod.RotateU || 0), true)
      premultiplyRotation(m, tmp, AXIS_Y, DEGREE_TO_RAD * (mod.RotateV || 0), true)
      premultiplyRotation(m, tmp, AXIS_Z, DEGREE_TO_RAD * (mod.RotateW || 0), true)

      mat4$initIdentity(tmp)
      tmp[0] = mod.TileU ?? 1
      tmp[5] = mod.TileV ?? 1
      tmp[12] = mod.OffsetU || 0
      tmp[13] = mod.OffsetV || 0
      mat4$premultiply(m, tmp)
    }
  }

  /**
   * Port of the rotation part of `SEfResTexture::UpdateWithModifier` (ShaderCore.cpp).
   *
   * The engine builds the matrix for row vectors (`uv * M`), the viewer for column vectors (`M * uv`). Each factor X
   * of the engine chain becomes X transposed here, multiplied in the same order with premultiply.
   */
  private applyRotation(m: Mat4, tmp: Mat4, time: number): void {
    const mod = this.mod
    // unset centers default to the texture center, sprites of the oneway portal (glyph_sdf, triangle_sdf) set none or only U
    const centerU = mod.TexMod_URotateCenter ?? 0.5
    const centerV = mod.TexMod_VRotateCenter ?? 0.5

    switch (mod.TexMod_RotateType) {
      case RotateType.Disabled:
        break

      case RotateType.Fixed: {
        // CreateRotationX(degrees to radians)
        mat4$initTranslationXYZ(m, -centerU, -centerV, 0)
        premultiplyRotation(m, tmp, AXIS_X, DEGREE_TO_RAD * (mod.TexMod_URotateAmplitude || 0), true)
        premultiplyRotation(m, tmp, AXIS_Y, DEGREE_TO_RAD * (mod.TexMod_VRotateAmplitude || 0), true)
        premultiplyRotation(m, tmp, AXIS_Z, DEGREE_TO_RAD * (mod.TexMod_WRotateAmplitude || 0), true)
        mat4$premultiply(m, mat4$initTranslationXYZ(tmp, centerU, centerV, 0))
        break
      }

      case RotateType.Constant: {
        // the engine scales the time to milliseconds here (fTime *= 1000), the amplitude is degrees per millisecond.
        // CreateRotationX(a).GetTransposed()
        const ms = time * 1000
        mat4$initTranslationXYZ(m, -centerU, -centerV, 0)
        premultiplyRotation(
          m,
          tmp,
          AXIS_X,
          DEGREE_TO_RAD * (mod.TexMod_URotateAmplitude || 0) * ms + (mod.TexMod_URotatePhase || 0),
          false,
        )
        premultiplyRotation(
          m,
          tmp,
          AXIS_Y,
          DEGREE_TO_RAD * (mod.TexMod_VRotateAmplitude || 0) * ms + (mod.TexMod_VRotatePhase || 0),
          false,
        )
        premultiplyRotation(
          m,
          tmp,
          AXIS_Z,
          DEGREE_TO_RAD * (mod.TexMod_WRotateAmplitude || 0) * ms + (mod.TexMod_WRotatePhase || 0),
          false,
        )
        mat4$premultiply(m, mat4$initTranslationXYZ(tmp, centerU, centerV, 0))
        break
      }

      case RotateType.Oscilated: {
        // amplitude * sin(2 PI * (frac(time * rate) + phase)), the engine passes the amplitude without conversion
        const angle = (amp: number, rate: number, phase: number) => {
          const s = time * (rate || 0)
          return (amp || 0) * Math.sin(2 * Math.PI * (s - Math.floor(s) + (phase || 0)))
        }
        mat4$initTranslationXYZ(m, -centerU, -centerV, 0)
        premultiplyRotation(
          m,
          tmp,
          AXIS_X,
          angle(mod.TexMod_URotateAmplitude, mod.TexMod_URotateRate, mod.TexMod_URotatePhase),
          true,
        )
        premultiplyRotation(
          m,
          tmp,
          AXIS_Y,
          angle(mod.TexMod_VRotateAmplitude, mod.TexMod_VRotateRate, mod.TexMod_VRotatePhase),
          true,
        )
        premultiplyRotation(
          m,
          tmp,
          AXIS_Z,
          angle(mod.TexMod_WRotateAmplitude, mod.TexMod_WRotateRate, mod.TexMod_WRotatePhase),
          true,
        )
        mat4$premultiply(m, mat4$initTranslationXYZ(tmp, centerU, centerV, 0))
        break
      }
    }
  }

  private applyOscillatorU(m: Mat4, seconds: number): void {
    const mod = this.mod
    const rate = mod.TexMod_UOscillatorRate || 0
    const t = rate * seconds
    const amp = mod.TexMod_UOscillatorAmplitude || 0
    const phase = mod.TexMod_UOscillatorPhase || 0

    // ShaderCore.cpp: Pan, Fixed, Constant and Jitter set the translation (TexMatrix(3, 0)),
    // Stretch and StretchRepeat set the scale (TexMatrix(0, 0)). The phase is part of the sine argument.

    let translate = m[12]
    let scale = m[0]

    switch (mod.TexMod_UOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        translate = rate
        break
      case OscillatorType.Constant:
        translate = t * amp
        break
      case OscillatorType.Pan:
        translate = amp * Math.sin(2 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.Stretch:
        scale = 1 + amp * Math.sin(2 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.StretchRepeat:
        scale = 1 + amp * Math.sin(0.5 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.Jitter:
        if (this.jitterTimeU < 1 || this.jitterTimeU > t + 1) {
          this.jitterTimeU = phase + Math.floor(t)
        }
        if (t - this.jitterTimeU > 1) {
          this.jitterU = Math.random() * amp
          this.jitterTimeU = phase + Math.floor(t)
        }
        translate = this.jitterU
        break
    }

    m[12] = translate
    m[0] = scale
  }

  private applyOscillatorV(m: Mat4, seconds: number): void {
    const mod = this.mod
    const rate = mod.TexMod_VOscillatorRate || 0
    const t = rate * seconds
    const amp = mod.TexMod_VOscillatorAmplitude || 0
    const phase = mod.TexMod_VOscillatorPhase || 0

    let translate = m[13]
    let scale = m[5]

    switch (mod.TexMod_VOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        translate = rate
        break
      case OscillatorType.Constant:
        translate = t * amp
        break
      case OscillatorType.Pan:
        translate = amp * Math.sin(2 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.Stretch:
        scale = 1 + amp * Math.sin(2 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.StretchRepeat:
        scale = 1 + amp * Math.sin(0.5 * Math.PI * (t - Math.floor(t)) + 2 * Math.PI * phase)
        break
      case OscillatorType.Jitter:
        if (this.jitterTimeV < 1 || this.jitterTimeV > t + 1) {
          this.jitterTimeV = phase + Math.floor(t)
        }
        if (t - this.jitterTimeV > 1) {
          this.jitterV = Math.random() * amp
          this.jitterTimeV = phase + Math.floor(t)
        }
        translate = this.jitterV
        break
    }

    m[13] = translate
    m[5] = scale
  }
}

const AXIS_X = 0
const AXIS_Y = 1
const AXIS_Z = 2

/**
 * Multiplies a rotation onto the matrix: m = R * m, or R transposed if `transpose` is set
 */
function premultiplyRotation(m: Mat4, tmp: Mat4, axis: number, angle: number, transpose: boolean) {
  if (!angle) {
    return
  }
  if (axis === AXIS_X) {
    mat4$initRotationX(tmp, angle)
  } else if (axis === AXIS_Y) {
    mat4$initRotationY(tmp, angle)
  } else {
    mat4$initRotationZ(tmp, angle)
  }
  mat4$premultiply(m, transpose ? mat4$transpose(tmp) : tmp)
}
