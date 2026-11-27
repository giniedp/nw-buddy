import type { ResourceScope, Texture } from '@gglib/graphics'
import {
  clamp,
  lerp,
  mat4,
  mat4$initIdentity,
  mat4$rotateX,
  mat4$rotateY,
  mat4$rotateZ,
  mat4GetTranslationZ,
  vec2,
  vec3,
  vec3$applyMat4Rotation,
  vec3$init,
  vec3$initFrom,
  vec3$multiplyScalar,
  vec3$negate,
  vec3Copy,
  vec3Lerp,
  vec3MultiplyScalar,
  vec3Normalize,
  vec4,
  type IVec3,
} from '@gglib/math'
import type { CameraData } from '@gglib/render'
import type { LevelInfo, TimeOfDay as TimeOfDayData } from '../../api'
import type { ContentService } from '../../content'
import { TodParams, type TodParam } from './TimeOfDayParams'

/**
 * Zenith fade curve exponent as observed in GPA captures (PerFrame_VolumetricFogDistributionParams.w),
 * see TimeOfDay volFog2Zenith
 */
const ZENITH_FADE_CURVE_EXPONENT = 32.1111
import { TimeOfDayPreset } from './TimeOfDayPreset'

/**
 * A phase of the day, see {@link TimeOfDay.phase}
 */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

export type TimeOfDayLayer = {
  priority: number
  blendWeight: number
  blendTarget: number
  /**
   * Seconds to blend fully in or out, 0 switches at once (TimeOfDayPOIConfig.BlendTime)
   */
  blendDuration: number
  preset: TimeOfDayPreset
}
const MAX_TIME = (24 * 60 - 1) / 60.0
/**
 * Hours of a day. New World maps the hour onto the curves as `hour / 24` (CTimeOfDay::UpdateValues), Lumberyard divides
 * by 23.983334
 */
const HOURS_PER_DAY = 24
/**
 * Layers below this weight do not take part in the blend (TimeOfDayPOIModifier MIN_WEIGHT)
 */
export const MIN_LAYER_WEIGHT = 0.01

export class TimeOfDay {
  public sunColor = vec3(1, 0.71085715, 0.5335781)
  public sunDirection = vec3Normalize(vec3(-1, -1, -10))
  /**
   * Direction of the actual sun for the sky (same convention as sunDirection).
   * Unlike sunDirection it does not switch to the moon at night (sunPosOrig in CTimeOfDay::UpdateEnvLighting).
   */
  public skySunDirection = vec3Normalize(vec3(-1, -1, -10))
  /**
   * Sun intensity of the sky scattering (SKYLIGHT_SUN_INTENSITY * SKYLIGHT_SUN_INTENSITY_MULTIPLIER)
   */
  public skySunIntensity = vec3(20, 20, 20)
  public sunMultiplier = 1.0
  public sunSpecularMultiplier = 1.0
  public envProbeMultiplier = vec3(1)
  public envProbeDiffuseMultiplier = 1.0
  public envProbeSpecularMultiplier = 1.0
  /**
   * rgb = color balance, a = saturation
   */
  public hdrColorBalance = vec4(1)
  /**
   * x = shoulder, y = midtones, z = toe, w = whitepoint
   */
  public hdrFilmCurve = vec4(1)
  /**
   * x = EV min, y = EV max, z = EV auto compensation (HDREyeAdaptation of the EV mode, the mode of the game)
   */
  public hdrEyeAdaptation = vec4(0)
  /**
   * HDR "Bloom amount" (Global_User_HDRBloom), the film mapping blends the bloom by amount * 0.3 / 8
   */
  public hdrBloomAmount = 0
  public sunIsMoon = false

  public cloudshadingCustomSkyColor = vec3(0)
  public cloudshadingCustomSunColor = vec3(0)
  public cloudshadingCustomColor = vec3(0)

  /**
   * Sun shafts (Sun Rays Effect, TimeOfDay.cpp and CSunShafts):
   * x = active, y = rays attenuation, z = shafts amount, w = rays amount
   */
  public sunShaftsParams = vec4(0)
  /**
   * SunShafts_SunCol of the HDR final pass: lerp(custom color, normalized sun color, influence) * rays amount
   */
  public sunShaftsColor = vec4(0)
  private sunRaysCustomColor = vec3(1)

  public skyKM = 0.0025
  public skyKR = 0.0025
  public skyG = 0.76
  public skyWaveR = 650
  public skyWaveG = 570
  public skyWaveB = 475

  public nightSkyHorizonColor = vec3()
  public nightSkyZenithColor = vec3()
  public nightSkyZenithColorShift = vec2()
  public nightSkyColorDelta = vec3()

  public nightSkyMoonColor = vec3()
  public nightSkyMoonInnerCorona = vec4()
  public nightSkyMoonOuterCorona = vec4()
  public moonDirection = vec3Normalize(vec3(-1, -1, -10))

  public fogColor = vec3(0.21678638, 0.41612425, 0.79515541)
  public fogMultiplier = 0.97500086
  public fogHeight = 0
  public fogDensity = 0.050000004
  public fogTopColor = vec3(0.17437994, 0.42185885, 0.76625574)
  public fogTopMultiplier = 0.97500086
  public fogTopHeight = 400
  public fogTopDensity = 0.020000001
  public fogRadialColor = vec3(0.17437994, 0.42185885, 0.76625574)
  public fogRadialMultiplier = 0.97500086

  public fogParams = vec4(0)
  public fogRampParams = vec4(0)
  public fogColGradBase = vec4(0) // base color
  public fogColGradDelta = vec4(0) // base color - end color
  public fogColGradParams = vec4(0)
  public fogColGradRadial = vec4(0)

  // volumetric fog 2, see VolFog2Params in material/volumetricFog2.wgsl.ts
  public volFog2HeightDensity = vec4(0)
  public volFog2Ramp = vec4(0)
  public volFog2Scattering = vec4(0)
  public volFog2Blend = vec4(0)
  // x = zenith fade factor, y = zenith fade curve (exponent), see VolFog2Params
  public volFog2Zenith = vec4(0)
  /**
   * Global wind (PerFrame_WindDirection): xyz = wind vector of the time of day, w = its length (the wind speed)
   */
  public windDirection = vec4(-2.5, 2.0, 0.5, 0)

  /**
   * New World: particle brightness of the time of day (`Particle Brightness Multiplier`), scaled per particle effect by
   * its TOD brightness influence, see the particle shader
   */
  public particleBrightness = 1
  public volFog2ScatteringColor = vec4(0)
  public volFog2ScatteringSecondaryColor = vec4(0)
  private volFog2Albedo = vec3()
  /**
   * Fog albedo for entities (E3DPARAM_VOLFOG2_COLOR), tints the global probe in-scattering (D3DVolumetricFog.cpp)
   */
  public volFog2EntityAlbedo = vec3(1)
  /**
   * Froxel fog in-scattering of the entities: rgb = fog albedo (VOLFOG2_COLOR), w = anisotropy k (VOLFOG2_ANISOTROPIC)
   */
  public volFog2Entity = vec4(1, 1, 1, 0.6)

  public fogHeightOffset = 0.5

  // ocean fog color (premultiplied with its multiplier) and density
  public oceanFogColor = vec3(29 / 255, 102 / 255, 141 / 255)
  public oceanFogDensity = 0.2

  public base: TimeOfDayPreset
  public poiLayers: TimeOfDayLayer[] = []
  public time: number = 12
  public timeStart: number = 0
  public timeEnd: number = 24
  public timeAnimSpeed: number = 0
  public sunRotationLatitude: number = 0
  public sunRotationLongitude: number = 90
  public moonRotationLatitude: number = 240
  public moonRotationLongitude: number = 45
  public moonSize: number = 1.0
  public moonTexture: Texture
  public animate: boolean = false
  public enablePoiLayers: boolean = true
  public dawnStart = 350.0 / 60.0
  public dawnEnd = 360.0 / 60.0
  public duskStart = 12.0 + 360.0 / 60.0
  public duskEnd = 12.0 + 370.0 / 60.0

  /**
   * The phase of the day at the current {@link time}, by the dawn and dusk of the mission (the phases of
   * TimeOfDayConstraintComponent: dawn, day, dusk, night)
   */
  public get phase(): DayPhase {
    if (this.time < this.dawnStart || this.time >= this.duskEnd) {
      return 'night'
    }
    if (this.time < this.dawnEnd) {
      return 'dawn'
    }
    if (this.time < this.duskStart) {
      return 'day'
    }
    return 'dusk'
  }

  public constructor(base?: TimeOfDayPreset) {
    this.reset()
    if (base) {
      this.base = base
    }
  }

  public async setLevelInfo(
    info: LevelInfo,
    ctx: { content: ContentService; scope: ResourceScope; signal: AbortSignal },
  ) {
    this.reset(info.mission?.timeOfDay || null)

    // #region set lighting
    const lighting = info.mission?.environment?.lighting
    if (lighting) {
      this.sunRotationLatitude = lighting.sunRotation
      this.sunRotationLongitude = lighting.longitude

      this.dawnStart = (lighting.dawnTime - lighting.dawnDuration * 0.5) / 60.0
      this.dawnEnd = (lighting.dawnTime + lighting.dawnDuration * 0.5) / 60.0
      this.duskStart = 12.0 + (lighting.duskTime - lighting.duskDuration * 0.5) / 60.0
      this.duskEnd = 12.0 + (lighting.duskTime + lighting.duskDuration * 0.5) / 60.0
      if (this.dawnEnd > this.duskStart) {
        this.duskEnd += this.dawnEnd - this.duskStart
        this.duskStart = this.dawnEnd
      }
    }
    // #endregion

    // #region set moon
    // the texture of the previous level went with its scope
    this.moonTexture = null
    const moon = info.mission?.environment?.moon
    if (moon) {
      this.moonRotationLatitude = moon.latitude
      this.moonRotationLongitude = moon.longitude
      this.moonSize = moon.size

      const moonTexture = await ctx.content.loadTexture(moon.texture, ctx.scope)
      ctx.signal.throwIfAborted()

      this.moonTexture = moonTexture
    }

    // #endregion
  }

  /**
   * Sets the level's own time of day and drops the POI layers: they belong to the zones of the previous level
   */
  public reset(data?: TimeOfDayData) {
    this.base = new TimeOfDayPreset(data)
    this.poiLayers.length = 0
    this.time = 12
    this.timeStart = 0
    this.timeEnd = 24
    this.timeAnimSpeed = 0
    if (data) {
      this.time = data.time
      this.timeStart = data.timeStart
      this.timeEnd = data.timeEnd
      this.timeAnimSpeed = data.timeAnimSpeed
    }
    this.sunRotationLatitude = 0
    this.sunRotationLongitude = 90
    this.dawnStart = 350.0 / 60.0
    this.dawnEnd = 360.0 / 60.0
    this.duskStart = 12.0 + 360.0 / 60.0
    this.duskEnd = 12.0 + 370.0 / 60.0
  }

  private interpolate() {
    const t = this.time / HOURS_PER_DAY
    this.base.interpolate(t)
    for (const layer of this.poiLayers) {
      layer.preset.interpolate(t)
    }
  }

  /**
   * Value of a variable, blended like the game's TimeOfDayPOIModifier: the level keeps
   * `1 - min(sum of weights, 1)`, every layer adds its value times its weight, the highest priority first, each weight
   * cut so that the total never passes 1. Values are clamped to their range before the blend, like the curves.
   */
  public getParamValue(param: TodParam<number>): number {
    const base = clamp(this.base.variables[param.name].value, param.min, param.max)
    if (!this.enablePoiLayers || !this.poiLayers.length) {
      return base
    }
    let total = this.levelShare()
    let value = base * total
    for (const layer of this.poiLayers) {
      if (total >= 1) {
        break
      }
      if (layer.blendWeight < MIN_LAYER_WEIGHT) {
        continue
      }
      const weight = cappedWeight(layer.blendWeight, total)
      total += layer.blendWeight
      value += clamp(layer.preset.variables[param.name].value, param.min, param.max) * weight
    }
    return value
  }

  /**
   * Share of the level's own time of day in the blend, see {@link getParamValue}
   */
  private levelShare(): number {
    let sum = 0
    for (const layer of this.poiLayers) {
      if (layer.blendWeight >= MIN_LAYER_WEIGHT) {
        sum += layer.blendWeight
      }
    }
    return 1 - Math.min(sum, 1)
  }

  private updateSunShaftsParams() {
    const shaftsAmount = clamp(this.getParamValue(TodParams.SUN_SHAFTS_VISIBILITY), 0.0, 0.3)
    const raysAmount = this.getParamValue(TodParams.SUN_RAYS_VISIBILITY)
    const raysAttenuation = this.getParamValue(TodParams.SUN_RAYS_ATTENUATION)
    const sunColorInfluence = this.getParamValue(TodParams.SUN_RAYS_SUNCOLORINFLUENCE)
    this.getParamColor(TodParams.SUN_RAYS_CUSTOMCOLOR, this.sunRaysCustomColor)

    // SunShafts_Active, CSunShafts::IsVisible also requires a sun color
    const sunColorLen = Math.hypot(this.sunColor.x, this.sunColor.y, this.sunColor.z)
    const isActive = (shaftsAmount > 0.05 || raysAmount > 0.05) && sunColorLen * sunColorLen >= 0.01

    this.sunShaftsParams.x = isActive ? 1 : 0
    this.sunShaftsParams.y = clamp(raysAttenuation, 0.0, 10.0)
    this.sunShaftsParams.z = shaftsAmount
    this.sunShaftsParams.w = clamp(raysAmount, 0.0, 10.0)

    const invLen = sunColorLen > 0 ? 1 / sunColorLen : 0
    const custom = this.sunRaysCustomColor
    const color = this.sunShaftsColor
    color.x = lerp(custom.x, this.sunColor.x * invLen, sunColorInfluence) * raysAmount
    color.y = lerp(custom.y, this.sunColor.y * invLen, sunColorInfluence) * raysAmount
    color.z = lerp(custom.z, this.sunColor.z * invLen, sunColorInfluence) * raysAmount
    color.w = 1
  }

  /**
   * Color of a variable, blended like {@link getParamValue}. Channels are clamped to 0..1 before the blend, like the
   * curves (CTimeOfDay::UpdateValues).
   */
  public getParamColor(param: TodParam<IVec3>, out: IVec3) {
    const base = this.base.variables[param.name].value
    out.x = clamp(base.x, 0, 1)
    out.y = clamp(base.y, 0, 1)
    out.z = clamp(base.z, 0, 1)
    if (!this.enablePoiLayers || !this.poiLayers.length) {
      return
    }
    let total = this.levelShare()
    out.x *= total
    out.y *= total
    out.z *= total
    for (const layer of this.poiLayers) {
      if (total >= 1) {
        break
      }
      if (layer.blendWeight < MIN_LAYER_WEIGHT) {
        continue
      }
      const weight = cappedWeight(layer.blendWeight, total)
      total += layer.blendWeight
      const value = layer.preset.variables[param.name].value
      out.x += clamp(value.x, 0, 1) * weight
      out.y += clamp(value.y, 0, 1) * weight
      out.z += clamp(value.z, 0, 1) * weight
    }
  }

  /**
   * Blends a layer in. Layers are kept the highest priority first, and on equal priority the newest first, like the
   * game's modifier (new zones join at the front, the priority sort is stable).
   *
   * @param duration - seconds to blend fully in or out, 0 switches at once
   */
  public scheduleAdd(preset: TimeOfDayPreset, priority: number, duration: number) {
    const layer = this.poiLayers.find((it) => it.preset === preset)
    if (layer) {
      layer.blendTarget = 1
      return
    }
    this.poiLayers.unshift({
      preset,
      priority,
      blendWeight: 0,
      blendTarget: 1,
      blendDuration: Math.max(duration ?? 0, 0),
    })
    this.poiLayers.sort(prioritySort)
  }

  public scheduleRemove(preset: TimeOfDayPreset) {
    const layer = this.poiLayers.find((it) => it.preset === preset)
    if (layer) {
      layer.blendTarget = 0
    }
  }

  /**
   * Blends out the layers whose zone is gone (its entity was deactivated or destroyed, e.g. a region or level unloaded
   * while the camera was inside). Such a zone no longer reports the camera leaving it.
   *
   * @param present - the presets of the zones that still exist
   */
  public scheduleRemoveMissing(present: ReadonlySet<TimeOfDayPreset>) {
    for (const layer of this.poiLayers) {
      if (!present.has(layer.preset)) {
        layer.blendTarget = 0
      }
    }
  }

  /**
   * @param blendDt - wall clock seconds for the POI blends, they converge to their target even while the game clock
   *   is paused or fixed
   * @param animationDt - game clock seconds for the animated time of day
   */
  public update(blendDt: number, animationDt: number, camera: CameraData) {
    this.removeLayers()
    this.updateWeights(blendDt)
    if (this.animate) {
      this.tickTime(animationDt)
    }
    this.interpolate()

    this.updateDayNight()
    this.updateMoonDirection()
    this.updateSunDirection()
    this.updateVariables(camera)
    this.updateWind()
  }

  /**
   * New World: the time of day sets the global wind (SetWind), PerFrame_WindDirection.w is its length
   */
  private updateWind() {
    const wind = this.windDirection
    wind.x = this.getParamValue(TodParams.WIND_X)
    wind.y = this.getParamValue(TodParams.WIND_Y)
    wind.z = this.getParamValue(TodParams.WIND_Z)
    wind.w = Math.hypot(wind.x, wind.y, wind.z)
    this.particleBrightness = this.getParamValue(TodParams.PARTICLE_BRIGHTNESS)
  }

  /**
   * Removes the layers that blended out, in place and keeping the order
   */
  private removeLayers() {
    const layers = this.poiLayers
    let kept = 0
    for (let i = 0; i < layers.length; i++) {
      const it = layers[i]
      if (it.blendWeight <= 0 && it.blendTarget <= 0) {
        continue
      }
      layers[kept++] = it
    }
    layers.length = kept
  }

  /**
   * Moves each weight toward its target, linearly over the blend duration (TransitionBlend::step), at once without one
   */
  private updateWeights(dt: number) {
    for (const it of this.poiLayers) {
      if (it.blendDuration <= 0) {
        it.blendWeight = it.blendTarget
        continue
      }
      const rate = dt / it.blendDuration
      const delta = it.blendTarget - it.blendWeight
      const step = Math.sign(delta) * Math.min(Math.abs(delta), rate)
      it.blendWeight = clamp(it.blendWeight + step, 0, 1)
    }
  }

  private tickTime(dt: number) {
    let time = this.time + dt * this.timeAnimSpeed
    if (this.timeStart <= 0.05 && this.timeEnd >= 23.5) {
      if (time > this.timeEnd) {
        time = this.timeStart
      }
      if (time < this.timeStart) {
        time = this.timeEnd
      }
    } else if (Math.abs(this.timeStart - this.timeEnd) <= 0.05) {
      if (time > MAX_TIME) {
        time -= MAX_TIME
      } else if (time < 0.0) {
        time += MAX_TIME
      }
    } else {
      if (time > this.timeEnd) {
        time = this.timeEnd
      }
      if (time < this.timeStart) {
        time = this.timeStart
      }
    }
    this.time = time
  }

  private updateDayNight() {
    // The ratio between night and day for adjusting luminance.   Day = 1, Night = 0, transitions = [0..1]
    let midDayIndicator = 1
    // The ratio [0..1] relative to high noon which represents maximum luminance.
    let dayNightIndicator = 1
    let sunMultiplier = 1
    // let sunIntensityMultiplier = 1
    let sunIsMoon = false

    if (this.time < this.dawnStart || this.time >= this.duskEnd) {
      // night time
      midDayIndicator = 0
      dayNightIndicator = 0
      this.sunMultiplier = sunMultiplier
      this.sunIsMoon = true
      return
    }

    const noonTime = 12
    if (this.time <= noonTime) {
      const dawnToNoon = noonTime - this.dawnStart
      midDayIndicator = (this.time - this.dawnStart) / dawnToNoon
    } else {
      const noonToDusk = this.duskEnd - noonTime
      midDayIndicator = (this.time - noonTime) / noonToDusk
    }
    midDayIndicator = Math.cos(0.5 * midDayIndicator * Math.PI)

    if (this.time < this.dawnEnd) {
      const b = 0.5 * (this.dawnStart + this.dawnEnd)
      if (this.time < b) {
        // fade out moon
        sunMultiplier *= (b - this.time) / (b - this.dawnStart)
        sunIsMoon = true
      } else {
        // fade in sun
        sunMultiplier *= (this.time - b) / (this.dawnEnd - b)
      }
      dayNightIndicator = (this.time - this.dawnStart) / (this.dawnEnd - this.dawnStart)
    } else if (this.time < this.duskStart) {
      // day
      dayNightIndicator = 1
    } else if (this.time < this.duskEnd) {
      const b = 0.5 * (this.duskStart + this.duskEnd)

      if (this.time < b) {
        // fade out sun
        sunMultiplier *= (b - this.time) / (b - this.duskStart)
      } else {
        // fade in moon
        const t = (this.time - b) / (this.duskEnd - b)
        sunMultiplier *= (this.time - b) / (this.duskEnd - b)
        sunIsMoon = true
      }

      dayNightIndicator = (this.duskEnd - this.time) / (this.duskEnd - this.duskStart)
    }

    this.sunMultiplier = sunMultiplier
    this.sunIsMoon = sunIsMoon
  }

  private updateSunDirection() {
    const PI = Math.PI
    let timeAng = ((this.time + 12.0) / MAX_TIME) * PI * 2.0
    let sunRot = (PI * -this.sunRotationLatitude) / 180.0
    let longitude = 0.5 * PI - (PI * this.sunRotationLongitude) / 180.0

    vec3$init(this.sunDirection, 0, 1, 0)
    const sunPos = this.sunDirection
    mat4$initIdentity(mat4.$0)
    mat4$rotateY(mat4.$0, sunRot)
    mat4$rotateX(mat4.$0, longitude)
    mat4$rotateZ(mat4.$0, timeAng)
    vec3$applyMat4Rotation(sunPos, mat4.$0)

    const h = sunPos.z
    sunPos.z = sunPos.y
    sunPos.y = -h
    vec3$negate(sunPos)
    // the sky always uses the actual sun position, the light switches to the moon at night
    vec3$initFrom(this.skySunDirection, sunPos)

    if (this.sunIsMoon) {
      vec3Copy(this.moonDirection, this.sunDirection)
      vec3$negate(sunPos)
    }
  }

  private updateMoonDirection() {
    const moonLati = -Math.PI + (Math.PI * this.moonRotationLatitude) / 180.0
    const moonLong = 0.5 * Math.PI - (Math.PI * this.moonRotationLongitude) / 180.0

    const sinLon = Math.sin(moonLong)
    const cosLon = Math.cos(moonLong)
    const sinLat = Math.sin(moonLati)
    const cosLat = Math.cos(moonLati)

    vec3$init(this.moonDirection, sinLon * cosLat, sinLon * sinLat, cosLon)
    if (this.sunIsMoon) {
      vec3$initFrom(this.sunDirection, this.moonDirection)
      vec3$negate(this.sunDirection)
    }
  }

  private updateVariables(view: CameraData) {
    const sunIntensity = this.getParamValue(TodParams.SUN_INTENSITY) * this.sunMultiplier
    this.getParamColor(TodParams.SUN_COLOR, this.sunColor)
    convertIlluminanceToLightColor(this.sunColor, sunIntensity)
    this.sunSpecularMultiplier = this.getParamValue(TodParams.SUN_SPECULAR_MULTIPLIER)

    this.getParamColor(TodParams.ENV_PROBE_MULTIPLIER, this.envProbeMultiplier)
    this.envProbeDiffuseMultiplier = this.getParamValue(TodParams.ENV_PROBE_DIFFUSE_MULTIPLIER)
    this.envProbeSpecularMultiplier = this.getParamValue(TodParams.ENV_PROBE_SPECULAR_MULTIPLIER)

    // C3DEngine::GetHDRSetupParams
    this.getParamColor(TodParams.HDR_COLORGRADING_COLOR_BALANCE, this.hdrColorBalance)
    this.hdrColorBalance.w = this.getParamValue(TodParams.HDR_COLORGRADING_COLOR_SATURATION)
    this.hdrFilmCurve.x = this.getParamValue(TodParams.HDR_FILMCURVE_SHOULDER_SCALE)
    this.hdrFilmCurve.y = this.getParamValue(TodParams.HDR_FILMCURVE_LINEAR_SCALE)
    this.hdrFilmCurve.z = this.getParamValue(TodParams.HDR_FILMCURVE_TOE_SCALE)
    this.hdrFilmCurve.w = this.getParamValue(TodParams.HDR_FILMCURVE_WHITEPOINT)
    this.hdrEyeAdaptation.x = this.getParamValue(TodParams.HDR_EYEADAPTATION_EV_MIN)
    this.hdrEyeAdaptation.y = this.getParamValue(TodParams.HDR_EYEADAPTATION_EV_MAX)
    this.hdrEyeAdaptation.z = this.getParamValue(TodParams.HDR_EYEADAPTATION_EV_AUTO_COMPENSATION)
    this.hdrBloomAmount = this.getParamValue(TodParams.HDR_BLOOM_AMOUNT)

    // HDR sky lighting, independent of the sun light fading at dawn and dusk
    this.getParamColor(TodParams.SKYLIGHT_SUN_INTENSITY, this.skySunIntensity)
    vec3$multiplyScalar(
      this.skySunIntensity,
      Math.max(this.getParamValue(TodParams.SKYLIGHT_SUN_INTENSITY_MULTIPLIER), 0),
    )

    this.skyKM = this.getParamValue(TodParams.SKYLIGHT_KM) * 1e-4 // downscaling from ui friendly value
    this.skyKR = this.getParamValue(TodParams.SKYLIGHT_KR) * 1e-4 // downscaling from ui friendly value
    this.skyG = this.getParamValue(TodParams.SKYLIGHT_G)
    this.skyWaveR = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_R)
    this.skyWaveG = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_G)
    this.skyWaveB = this.getParamValue(TodParams.SKYLIGHT_WAVELENGTH_B)

    {
      const scale = this.getParamValue(TodParams.NIGHSKY_HORIZON_COLOR_MULTIPLIER)
      this.getParamColor(TodParams.NIGHSKY_HORIZON_COLOR, this.nightSkyHorizonColor)
      this.nightSkyHorizonColor.x *= scale
      this.nightSkyHorizonColor.y *= scale
      this.nightSkyHorizonColor.z *= scale
    }

    {
      const scale = this.getParamValue(TodParams.NIGHSKY_ZENITH_COLOR_MULTIPLIER)
      this.getParamColor(TodParams.NIGHSKY_ZENITH_COLOR, this.nightSkyZenithColor)
      this.nightSkyZenithColor.x *= scale
      this.nightSkyZenithColor.y *= scale
      this.nightSkyZenithColor.z *= scale
    }

    // the night sky gradient is horizon color + delta * gradient, the gradient increases towards the zenith (D3DRenderRE.cpp)
    this.nightSkyColorDelta.x = this.nightSkyZenithColor.x - this.nightSkyHorizonColor.x
    this.nightSkyColorDelta.y = this.nightSkyZenithColor.y - this.nightSkyHorizonColor.y
    this.nightSkyColorDelta.z = this.nightSkyZenithColor.z - this.nightSkyHorizonColor.z

    const nightSkyZenithColorShift = this.getParamValue(TodParams.NIGHSKY_ZENITH_SHIFT)
    const nightSkyZenithGradient = -0.1
    this.nightSkyZenithColorShift.x = 1 / (nightSkyZenithColorShift - nightSkyZenithGradient)
    this.nightSkyZenithColorShift.y = -nightSkyZenithGradient / (nightSkyZenithColorShift - nightSkyZenithGradient)

    this.getParamColor(TodParams.NIGHSKY_MOON_COLOR, this.nightSkyMoonColor)
    vec3$multiplyScalar(this.nightSkyMoonColor, this.getParamValue(TodParams.NIGHSKY_MOON_COLOR_MULTIPLIER))

    // corona colors are scaled by their multipliers (TimeOfDay.cpp), the scale is converted as in D3DRenderRE.cpp
    this.getParamColor(TodParams.NIGHSKY_MOON_INNERCORONA_COLOR, this.nightSkyMoonInnerCorona)
    vec3$multiplyScalar(
      this.nightSkyMoonInnerCorona,
      this.getParamValue(TodParams.NIGHSKY_MOON_INNERCORONA_COLOR_MULTIPLIER),
    )
    this.nightSkyMoonInnerCorona.w = 1.0 + 1000.0 * this.getParamValue(TodParams.NIGHSKY_MOON_INNERCORONA_SCALE)

    this.getParamColor(TodParams.NIGHSKY_MOON_OUTERCORONA_COLOR, this.nightSkyMoonOuterCorona)
    vec3$multiplyScalar(
      this.nightSkyMoonOuterCorona,
      this.getParamValue(TodParams.NIGHSKY_MOON_OUTERCORONA_COLOR_MULTIPLIER),
    )
    this.nightSkyMoonOuterCorona.w = 1.0 + 1000.0 * this.getParamValue(TodParams.NIGHSKY_MOON_OUTERCORONA_SCALE)

    this.getParamColor(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR, this.cloudshadingCustomColor)
    const csCustomSunColorMult = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_MULTIPLIER)
    vec3$multiplyScalar(this.cloudshadingCustomColor, csCustomSunColorMult)

    const csSunlightMultiplier = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_MULTIPLIER)
    vec3MultiplyScalar(this.sunColor, csSunlightMultiplier, this.cloudshadingCustomSunColor)

    const csCustomSunColorInfluence = this.getParamValue(TodParams.CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_INFLUENCE)
    vec3Lerp(
      this.cloudshadingCustomSunColor,
      this.cloudshadingCustomColor,
      csCustomSunColorInfluence,
      this.cloudshadingCustomSunColor,
    )

    this.updateSunShaftsParams()

    this.updateVolumetricFogParams(view)
    this.updateVolumetricFog2Params(view)
    this.updateVolumetricFogRampParams()
    this.updateFogColorGradientConstants()
    this.updateFogColorGradientParams()
    this.updateFogColorGradientRadial(view)

    this.getParamColor(TodParams.OCEANFOG_COLOR, this.oceanFogColor)
    vec3MultiplyScalar(this.oceanFogColor, this.getParamValue(TodParams.OCEANFOG_COLOR_MULTIPLIER), this.oceanFogColor)
    this.oceanFogDensity = this.getParamValue(TodParams.OCEANFOG_DENSITY)
  }

  private updateVolumetricFogParams(view: CameraData) {
    let globalDensity = this.getParamValue(TodParams.VOLFOG_GLOBAL_DENSITY)
    const finalDensityClamp = this.getParamValue(TodParams.VOLFOG_FINAL_DENSITY_CLAMP)

    const fogHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT)
    const fogDensity = clamp(this.getParamValue(TodParams.VOLFOG_DENSITY), 1e-5, 1.0)

    let fogHeight2 = this.getParamValue(TodParams.VOLFOG_HEIGHT2)
    const fogDensity2 = clamp(this.getParamValue(TodParams.VOLFOG_DENSITY2), 1e-5, 1.0)
    fogHeight2 = fogHeight2 < fogHeight + 1.0 ? fogHeight + 1.0 : fogHeight2

    const ha = fogHeight
    const hb = fogHeight2

    const da = fogDensity
    const db = fogDensity2

    const ga = Math.log(da)
    const gb = Math.log(db)

    const c = (gb - ga) / (hb - ha)
    const o = ga - c * ha

    const viewHeight = mat4GetTranslationZ(view.world)
    const co = clamp(c * viewHeight + o, -50.0, 50.0) // Avoiding FPEs at extreme ranges

    globalDensity *= 0.01 // multiply by 1/100 to scale value editor value back to a reasonable range

    this.fogParams.x = c
    this.fogParams.y = 1.44269502 * globalDensity * Math.exp(co) // log2(e) = 1.44269502
    this.fogParams.z = globalDensity
    this.fogParams.w = 1.0 - clamp(finalDensityClamp, 0.0, 1.0)
  }

  private updateVolumetricFogRampParams() {
    let rampStart = this.getParamValue(TodParams.VOLFOG_RAMP_START)
    let rampEnd = this.getParamValue(TodParams.VOLFOG_RAMP_END)
    let rampInfluence = this.getParamValue(TodParams.VOLFOG_RAMP_INFLUENCE)

    rampStart = rampStart < 0 ? 0 : rampStart // start
    // POI presets may leave the ramp end at 0. The game renders with volumetric fog 2, where this ramp is unused,
    // but here the clamp below would turn it into a hard step at the ramp start (a visible band around the camera)
    if (rampEnd <= rampStart) {
      rampInfluence = 0
    }
    rampEnd = rampEnd < rampStart + 0.1 ? rampStart + 0.1 : rampEnd // end
    rampInfluence = clamp(rampInfluence, 0.0, 1.0) // influence

    const invRampDist = 1.0 / (rampEnd - rampStart)
    this.fogRampParams.x = invRampDist
    this.fogRampParams.y = -rampStart * invRampDist
    this.fogRampParams.z = rampInfluence
    this.fogRampParams.w = -rampInfluence + 1.0
  }

  private updateFogColorGradientConstants() {
    this.getParamColor(TodParams.FOG_COLOR, this.fogColor)
    this.fogMultiplier = this.getParamValue(TodParams.FOG_COLOR_MULTIPLIER)

    this.getParamColor(TodParams.FOG_COLOR2, this.fogTopColor)
    this.fogTopMultiplier = this.getParamValue(TodParams.FOG_COLOR2_MULTIPLIER)

    this.fogColGradBase.x = this.fogColor.x * this.fogMultiplier
    this.fogColGradBase.y = this.fogColor.y * this.fogMultiplier
    this.fogColGradBase.z = this.fogColor.z * this.fogMultiplier

    // top - base, see sGetFogColorGradientConstants in D3DHWShader.cpp
    this.fogColGradDelta.x = this.fogTopColor.x * this.fogTopMultiplier - this.fogColGradBase.x
    this.fogColGradDelta.y = this.fogTopColor.y * this.fogTopMultiplier - this.fogColGradBase.y
    this.fogColGradDelta.z = this.fogTopColor.z * this.fogTopMultiplier - this.fogColGradBase.z
  }

  /**
   * Volumetric fog 2 parameters, see sGetVolumetricFog* in D3DHWShader.cpp
   */
  private updateVolumetricFog2Params(view: CameraData) {
    // sGetVolumetricFogHeightDensityParams
    let globalDensity = this.getParamValue(TodParams.VOLFOG2_GLOBAL_DENSITY)
    const finalDensityClamp = this.getParamValue(TodParams.VOLFOG2_FINAL_DENSITY_CLAMP)
    const clampTransmittance = finalDensityClamp > 0.9999999 ? 1.0 : finalDensityClamp
    const visibility = this.getParamValue(TodParams.VOLFOG2_GLOBAL_FOG_VISIBILITY)

    const ha = this.getParamValue(TodParams.VOLFOG2_HEIGHT)
    let hb = this.getParamValue(TodParams.VOLFOG2_HEIGHT2)
    hb = hb < ha + 1.0 ? ha + 1.0 : hb
    const db = clamp(this.getParamValue(TodParams.VOLFOG2_DENSITY2), 1e-5, 1.0)
    let da = clamp(this.getParamValue(TodParams.VOLFOG2_DENSITY), 1e-5, 1.0)
    da = Math.abs(db - da) < 0.00001 ? da + 0.00001 : da

    const ga = Math.log(da)
    const gb = Math.log(db)
    const c = (gb - ga) / (hb - ha)
    const o = ga - c * ha
    const viewHeight = mat4GetTranslationZ(view.world)
    const co = clamp(c * viewHeight + o, -50.0, 50.0)
    globalDensity *= 0.01

    this.volFog2HeightDensity.x = c
    this.volFog2HeightDensity.y = 1.44269502 * globalDensity * Math.exp(co)
    this.volFog2HeightDensity.z = visibility
    this.volFog2HeightDensity.w = 1.0 - clamp(clampTransmittance, 0.0, 1.0)

    // sGetVolumetricFogHeightDensityRampParams
    const rampStart = Math.max(0, this.getParamValue(TodParams.VOLFOG2_RAMP_START))
    let rampEnd = this.getParamValue(TodParams.VOLFOG2_RAMP_END)
    rampEnd = rampEnd < rampStart + 0.1 ? rampStart + 0.1 : rampEnd
    const t0 = 1.0 / (rampEnd - rampStart)
    this.volFog2Ramp.x = rampStart
    this.volFog2Ramp.y = rampEnd
    this.volFog2Ramp.z = t0
    this.volFog2Ramp.w = rampStart * t0

    // sGetVolumetricFogScatteringParams, anisotropy of the atmosphere
    const k1 = clampAnisotropy(this.getParamValue(TodParams.VOLFOG2_ANISOTROPIC1))
    this.volFog2Scattering.x = this.getParamValue(TodParams.VOLFOG2_INSCATTER)
    this.volFog2Scattering.y = Math.max(this.getParamValue(TodParams.VOLFOG2_EXTINCTION), 0.0001)
    this.volFog2Scattering.z = k1
    this.volFog2Scattering.w = 1.0 - k1 * k1

    // sGetVolumetricFogScatteringBlendParams
    this.volFog2Blend.x = this.getParamValue(TodParams.VOLFOG2_BLEND_FACTOR)
    this.volFog2Blend.y = this.getParamValue(TodParams.VOLFOG2_BLEND_MODE)

    // PerFrame_VolumetricFogDistributionParams.xw (New World): zenith fade factor and curve.
    // The engine maps the authored curve to an exponent on the CPU, every GPA capture shows 32.11 for the authored 0.56
    // of the skybox preset. The mapping is unknown, so the observed exponent is used as long as fading is enabled.
    this.volFog2Zenith.x = this.getParamValue(TodParams.VOLFOG2_ZENITH_FADE_FACTOR)
    this.volFog2Zenith.y = ZENITH_FADE_CURVE_EXPONENT
    // sGetVolumetricFogDistanceParams.w: end of the froxel ray-marching, the analytical fog continues beyond
    this.volFog2Zenith.z = Math.max(this.getParamValue(TodParams.VOLFOG2_RANGE), 0.0001)

    // sGetVolumetricFogScatteringColor / SecondaryColor: sun color * albedo, anisotropy of the sun radial lobe
    const k2 = clampAnisotropy(this.getParamValue(TodParams.VOLFOG2_ANISOTROPIC2))
    this.getParamColor(TodParams.VOLFOG2_COLOR1, this.volFog2Albedo)
    this.volFog2ScatteringColor.x = this.sunColor.x * this.volFog2Albedo.x
    this.volFog2ScatteringColor.y = this.sunColor.y * this.volFog2Albedo.y
    this.volFog2ScatteringColor.z = this.sunColor.z * this.volFog2Albedo.z
    this.volFog2ScatteringColor.w = k2
    this.getParamColor(TodParams.VOLFOG2_COLOR2, this.volFog2Albedo)
    this.volFog2ScatteringSecondaryColor.x = this.sunColor.x * this.volFog2Albedo.x
    this.volFog2ScatteringSecondaryColor.y = this.sunColor.y * this.volFog2Albedo.y
    this.volFog2ScatteringSecondaryColor.z = this.sunColor.z * this.volFog2Albedo.z
    this.volFog2ScatteringSecondaryColor.w = 1.0 - k2 * k2
    this.getParamColor(TodParams.VOLFOG2_COLOR, this.volFog2EntityAlbedo)
    // froxel injection constants (D3DVolumetricFog.cpp): ExponentialHeightFogColor = the entities albedo,
    // InjectInscatteringParams.x = the entities anisotropy (E3DPARAM_VOLFOG2_SCATTERING_PARAMS.z), clamped
    this.volFog2Entity.x = this.volFog2EntityAlbedo.x
    this.volFog2Entity.y = this.volFog2EntityAlbedo.y
    this.volFog2Entity.z = this.volFog2EntityAlbedo.z
    this.volFog2Entity.w = clampAnisotropy(this.getParamValue(TodParams.VOLFOG2_ANISOTROPIC))
  }

  private updateFogColorGradientParams() {
    const fogHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT)
    let fogTopHeight = this.getParamValue(TodParams.VOLFOG_HEIGHT2)
    fogTopHeight = fogTopHeight < fogHeight + 1.0 ? fogHeight + 1.0 : fogTopHeight

    let colorHeightOffset = this.getParamValue(TodParams.VOLFOG_HEIGHT_OFFSET)
    let radialSize = this.getParamValue(TodParams.VOLFOG_RADIAL_SIZE)
    let radialLobe = this.getParamValue(TodParams.VOLFOG_RADIAL_LOBE)

    colorHeightOffset = clamp(colorHeightOffset, -1.0, 1.0)
    radialSize = -Math.exp((1.0 - clamp(radialSize, 0.0, 1.0)) * 14.0) * 1.44269502 // log2(e) = 1.44269502;
    radialLobe = 1.0 / clamp(radialLobe, 1.0 / 21.0, 1.0) - 1.0

    const invDist = 1.0 / (fogTopHeight - fogHeight)

    this.fogColGradParams.x = invDist
    this.fogColGradParams.y = -fogHeight * invDist - colorHeightOffset
    this.fogColGradParams.z = radialSize
    this.fogColGradParams.w = radialLobe
  }

  private updateFogColorGradientRadial(view: CameraData) {
    this.getParamColor(TodParams.FOG_RADIAL_COLOR, this.fogRadialColor)
    this.fogRadialMultiplier = this.getParamValue(TodParams.FOG_RADIAL_COLOR_MULTIPLIER)
    this.fogColGradRadial.x = this.fogRadialColor.x * this.fogRadialMultiplier
    this.fogColGradRadial.y = this.fogRadialColor.y * this.fogRadialMultiplier
    this.fogColGradRadial.z = this.fogRadialColor.z * this.fogRadialMultiplier
    this.fogColGradRadial.w = 1.0 / view.far
  }
}

/**
 * The weight a layer adds when the blend already holds `total`: cut so that the total never passes 1
 */
export function cappedWeight(weight: number, total: number): number {
  return Math.max(0, Math.min(weight, 1 - total))
}

/**
 * Highest priority first, a stable sort keeps the newest first on equal priority
 */
function prioritySort(a: { priority: number }, b: { priority: number }) {
  return b.priority - a.priority
}

export function createTimeOfDay(): TimeOfDay {
  return new TimeOfDay()
}

const RENDERER_LIGHT_UNIT_SCALE = 10000.0
function convertIlluminanceToLightColor(colorRGB: IVec3, illuminance: number) {
  illuminance /= RENDERER_LIGHT_UNIT_SCALE

  const lum = colorRGB.x * 0.212671 + colorRGB.y * 0.71516 + colorRGB.z * 0.072169
  const scale = lum > 0 ? illuminance / lum : 1
  vec3$multiplyScalar(colorRGB, scale)
  vec3$multiplyScalar(colorRGB, 1 / Math.PI)
}

/**
 * Keeps the Schlick anisotropy within (-1, 1), see sGetVolumetricFogScatteringParams
 */
function clampAnisotropy(k: number) {
  return Math.abs(k) > 0.99999 ? (k < 0 ? -0.99999 : 0.99999) : k
}
