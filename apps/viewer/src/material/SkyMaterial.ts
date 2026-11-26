import {
  CullState,
  DepthState,
  MaterialWithSchema,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { clamp, vec2, vec3, vec3$init, vec3$normalize, vec4, vec4$init, type IVec3 } from '@gglib/math'
import SkyMaterialSchema from './SkyMaterial.meta'
import WGSL from './SkyMaterial.wgsl'

export function skyShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Sky Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function skyEffectOptions(): EffectOptions {
  return {
    name: 'Sky Effect',
    meta: {},
    program: {
      shader: skyShaderOptions(),
      sharedBlocks: [],
    },
  }
}

export class SkyMaterial extends MaterialWithSchema(SkyMaterialSchema) {
  protected override configure(): void {
    super.configure({
      name: 'Sky Material',
      effect: skyEffectOptions(),
      meta: {},
    })
    this.SamplerLinear = SamplerState.LinearClamp
    this.SamplerPoint = SamplerState.PointClamp

    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.OutputAlpha = 1

    // Night sky base: deep blue-black at the horizon
    this.NightSkyColBase = vec3(0.308 * 0.3, 0.427 * 0.3, 0.555 * 0.3)
    this.NightSkyColDelta = vec3(0.0, 0.0, 0.0)
    this.NightSkyZenithColShift = vec2(42.9, 0.0)

    this.setSkylightParams(0.001, 0.00025, -0.99, 650, 570, 475, vec3(20))
  }

  public setMoonParams(latitude: number, longitude: number, size: number, direction: IVec3) {
    const moonLati = -Math.PI + (Math.PI * latitude) / 180.0
    const moonLong = 0.5 * Math.PI - (Math.PI * longitude) / 180.0

    const sinLonR = Math.sin(-0.5 * Math.PI)
    const cosLonR = Math.cos(-0.5 * Math.PI)
    const sinLatR = Math.sin(moonLati + 0.5 * Math.PI)
    const cosLatR = Math.cos(moonLati + 0.5 * Math.PI)
    const right = this.NightMoonTexGenRight || vec3()
    vec3$init(right, sinLonR * cosLatR, sinLonR * sinLatR, cosLonR)
    vec3$normalize(right)
    this.NightMoonTexGenRight = right

    const sinLonU = Math.sin(moonLong + 0.5 * Math.PI)
    const cosLonU = Math.cos(moonLong + 0.5 * Math.PI)
    const sinLatU = Math.sin(moonLati)
    const cosLatU = Math.cos(moonLati)
    const up = this.NightMoonTexGenUp || vec3()
    vec3$init(up, sinLonU * cosLatU, sinLonU * sinLatU, cosLonU)
    vec3$normalize(up)
    this.NightMoonTexGenUp = up

    const dirSize = this.NightMoonDirSize || vec4()
    // texgen scale of the moon, larger values make the moon smaller (CRESky.cpp)
    vec4$init(dirSize, direction.x, direction.y, direction.z, 25 - 24 * clamp(size, 0, 1))
    vec3$normalize(dirSize)
    this.NightMoonDirSize = dirSize
  }

  public setSkylightParams(
    km: number,
    kr: number,
    g: number,
    waveR: number,
    waveG: number,
    waveB: number,
    sunIntensity: IVec3,
  ) {
    this.MieScattering = km
    this.RayleighScattering = kr
    this.PhaseAsymmetry = g
    this.WaveLengthInv ||= vec3()
    this.WaveLengthInv.x = Math.pow(waveR * 0.001, -4)
    this.WaveLengthInv.y = Math.pow(waveG * 0.001, -4)
    this.WaveLengthInv.z = Math.pow(waveB * 0.001, -4)
    this.WaveLengthInv = this.WaveLengthInv
    this.SunIntensity ||= vec3()
    this.SunIntensity.x = sunIntensity.x
    this.SunIntensity.y = sunIntensity.y
    this.SunIntensity.z = sunIntensity.z
    this.SunIntensity = this.SunIntensity
  }
}
