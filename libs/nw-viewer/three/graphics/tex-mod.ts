import { Matrix4, Texture, WebGLRenderer } from 'three'

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

export const enum RotateType {
  Disabled = 0,
  Fixed = 1,
  Constant = 2,
  Oscilated = 3,
}
export const enum OscillatorType {
  Disabled = 0,
  Fixed = 1,
  Constant = 2,
  Jitter = 3,
  Pan = 4,
  Stretch = 5,
  StretchRepeat = 6,
}

export const enum TexGenType {
  Stream = 0,
  World = 1,
  Camera = 2,
}

export const enum UpdateType {
  None = 0,
  Updated = 1,
  Animated = 2,
}

export interface TexMod {
  TileU?: number
  TileV?: number
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
}

const _m1 = new Matrix4()
const _m2 = new Matrix4()

function texModUpdate(timeInSeconds: number, mod: TexMod, memo: Record<string, any>, mat: number[]): UpdateType {
  if (!mod) {
    return UpdateType.None
  }

  const hasMods = !!mod.TexMod_UOscillatorType || !!mod.TexMod_VOscillatorType || !!mod.TexMod_RotateType
  const hasValues =
    mod.OffsetU || mod.OffsetV || mod.TileU != 1 || mod.TileV != 1 || mod.RotateU || mod.RotateV || mod.RotateW
  const isModified = hasMods || hasValues
  if (!isModified) {
    return UpdateType.None
  }

  const seconds = timeInSeconds
  const time = seconds * 1000
  const m = _m1.identity()
  const tmp = _m2.identity()

  // rotation modifier
  {
    switch (mod.TexMod_RotateType) {
      case RotateType.Disabled:
        break
      case RotateType.Fixed:
        m.identity().setPosition(-(mod.TexMod_URotateCenter || 0), -(mod.TexMod_VRotateCenter || 0), 0)

        if (mod.TexMod_URotateAmplitude) {
          m.premultiply(tmp.makeRotationX(mod.TexMod_URotateAmplitude))
        }
        if (mod.TexMod_VRotateAmplitude) {
          m.premultiply(tmp.makeRotationY(mod.TexMod_VRotateAmplitude))
        }
        if (mod.TexMod_WRotateAmplitude) {
          m.premultiply(tmp.makeRotationZ(mod.TexMod_WRotateAmplitude))
        }
        m.premultiply(tmp.identity().setPosition(mod.TexMod_URotateCenter || 0, mod.TexMod_VRotateCenter || 0, 0))
        break
      case RotateType.Constant:
        const fxAmp = (mod.TexMod_URotateAmplitude || 0) * time * Math.PI / 180 + (mod.TexMod_URotatePhase || 0)
        const fyAmp = (mod.TexMod_VRotateAmplitude || 0) * time * Math.PI / 180 + (mod.TexMod_VRotatePhase || 0)
        const fzAmp = (mod.TexMod_WRotateAmplitude || 0) * time * Math.PI / 180 + (mod.TexMod_WRotatePhase || 0)
        m.identity().setPosition(-(mod.TexMod_URotateCenter || 0), -(mod.TexMod_VRotateCenter || 0), 0)

        if (fxAmp) {
          m.premultiply(tmp.makeRotationX(fxAmp).transpose())
        }
        if (fyAmp) {
          m.premultiply(tmp.makeRotationY(fyAmp).transpose())
        }
        if (fzAmp) {
          m.premultiply(tmp.makeRotationZ(fzAmp).transpose())
        }
        m.premultiply(tmp.identity().setPosition(mod.TexMod_URotateCenter || 0, mod.TexMod_VRotateCenter || 0, 0))
        break
      case RotateType.Oscilated:
        m.identity().setPosition(-(mod.TexMod_URotateCenter || 0), -(mod.TexMod_VRotateCenter || 0), 0)

        const sx = time * (mod.TexMod_UOscillatorRate || 0)
        const sy = time * (mod.TexMod_VOscillatorRate || 0)
        const sz = 0

        const dx = (mod.TexMod_URotateAmplitude || 0) * Math.sin(2 * Math.PI * (sx - Math.floor(sx))) + (mod.TexMod_URotatePhase || 0)
        const dy = (mod.TexMod_VRotateAmplitude || 0) * Math.sin(2 * Math.PI * (sy - Math.floor(sy))) + (mod.TexMod_VRotatePhase || 0)
        const dz = (mod.TexMod_WRotateAmplitude || 0) * Math.sin(2 * Math.PI * (sz - Math.floor(sz))) + (mod.TexMod_WRotatePhase || 0)

        if (dx) {
          m.premultiply(tmp.makeRotationX(dx))
        }
        if (dy) {
          m.premultiply(tmp.makeRotationY(dy))
        }
        if (dz) {
          m.premultiply(tmp.makeRotationZ(dz))
        }
        m.premultiply(tmp.identity().setPosition(mod.TexMod_URotateCenter || 0, mod.TexMod_VRotateCenter || 0, 0))
    }
  }

  // oscilator modifier U
  {
    const uRate = mod.TexMod_UOscillatorRate || 0
    const uSeconds = uRate * seconds
    const uAmp = mod.TexMod_UOscillatorAmplitude || 0
    const uPhase = mod.TexMod_UOscillatorPhase || 0

    let value = m.elements[12]
    switch (mod.TexMod_UOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        value = uRate
        break
      case OscillatorType.Constant:
        value = uSeconds * uAmp
        break
      case OscillatorType.Jitter:
        let jitterTime = memo['_jitterTimeU'] ?? 0
        let jitter = memo['_jitterU'] ?? Math.random() * uAmp
        if (jitterTime < 1 || jitterTime > uSeconds + 1) {
          jitterTime = uPhase + Math.floor(uSeconds)
        }
        if (jitterTime > 1) {
          jitter = memo['_jitterU'] ?? Math.random() * uAmp
          jitterTime = uPhase + Math.floor(uSeconds)
        }
        memo['_jitterTimeU'] = jitterTime
        value = jitter
        break
      case OscillatorType.Pan:
        value = uAmp * Math.sin(2 * Math.PI * (uSeconds - Math.floor(uSeconds)))+ 2 * Math.PI * uPhase
        break
      case OscillatorType.Stretch:
        value = 1 + uAmp * Math.sin(2 * Math.PI * (uSeconds - Math.floor(uSeconds))) + 2 * Math.PI * uPhase
        break
      case OscillatorType.StretchRepeat:
        value = 1 + uAmp * Math.sin(0.5 * Math.PI * (uSeconds - Math.floor(uSeconds))) + 2 * Math.PI * uPhase
        break
    }
    m.elements[12] = value
  }

  // oscilator modifier V
  {
    const vRate = mod.TexMod_VOscillatorRate || 0
    const vSeconds = vRate * seconds
    const vAmp = mod.TexMod_VOscillatorAmplitude || 0
    const vPhase = mod.TexMod_VOscillatorPhase || 0

    let value = m.elements[13]
    switch (mod.TexMod_VOscillatorType) {
      case OscillatorType.Disabled:
        break
      case OscillatorType.Fixed:
        value = vRate
        break
      case OscillatorType.Constant:
        value = vSeconds * vAmp
        break
      case OscillatorType.Jitter:
        let jitterTime = memo['_jitterTimeU'] ?? 0
        let jitter = memo['_jitterU'] ?? Math.random() * vAmp
        if (jitterTime < 1 || jitterTime > vSeconds + 1) {
          jitterTime = vPhase + Math.floor(vSeconds)
        }
        if (jitterTime > 1) {
          jitter = memo['_jitterU'] ?? Math.random() * vAmp
          jitterTime = vPhase + Math.floor(vSeconds)
        }
        memo['_jitterTimeU'] = jitterTime
        value = jitter
        break
      case OscillatorType.Pan:
        value = vAmp * Math.sin(2 * Math.PI * (vSeconds - Math.floor(vSeconds))) + 2 * Math.PI * vPhase
        break
      case OscillatorType.Stretch:
        value = 1 + vAmp * Math.sin(2 * Math.PI * (vSeconds - Math.floor(vSeconds))) + 2 * Math.PI * vPhase
        break
      case OscillatorType.StretchRepeat:
        value = 1 + vAmp * Math.sin(0.5 * Math.PI * (vSeconds - Math.floor(vSeconds))) + 2 * Math.PI * vPhase
        break
    }
    m.elements[13] = value
  }

  if (hasValues) {
    if (mod.RotateU) {
      m.premultiply(tmp.makeRotationX(mod.RotateU || 0))
    }
    if (mod.RotateV) {
      m.premultiply(tmp.makeRotationY(mod.RotateV || 0))
    }
    if (mod.RotateW) {
      m.premultiply(tmp.makeRotationZ(mod.RotateW || 0))
    }
    tmp.identity()
    tmp.elements[0] = mod.TileU ?? 1
    tmp.elements[5] = mod.TileV ?? 1
    tmp.elements[12] = mod.OffsetU || 0
    tmp.elements[13] = mod.OffsetV || 0
    m.premultiply(tmp)
  }

  mat[0] = m.elements[0]
  mat[1] = m.elements[1]
  mat[2] = m.elements[3]

  mat[3] = m.elements[4]
  mat[4] = m.elements[5]
  mat[5] = m.elements[7]

  mat[6] = m.elements[12]
  mat[7] = m.elements[13]
  mat[8] = m.elements[15]

  return hasMods ? UpdateType.Animated : UpdateType.Updated
}

export function getTexModUpdateFn(tex: Texture, mod: TexMod): (r: WebGLRenderer) => void {
  tex.userData ||= {}
  if (!texModUpdate(performance.now() / 1000, mod, tex.userData, tex.matrix.elements)) {
    return null
  }
  return (r: WebGLRenderer) => {
    let frame: number
    if (r) {
      const info = r.info.render
      if (info) {
        frame = info.frame
      }
    }
    if (frame != null && frame == tex.userData['_frameUpdated']) {
      return
    }
    if (frame != null) {
      tex.userData['_frameUpdated'] = frame
    }
    texModUpdate(performance.now() / 1000, mod, tex.userData, tex.matrix.elements)
  }
}
