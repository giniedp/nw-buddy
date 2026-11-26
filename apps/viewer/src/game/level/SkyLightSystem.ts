import { EcsGame, TimeSystem } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { IblSampler, NishitaSkyEffect } from '@gglib/effects'
import { Device, FALSE, getMipmapCount, Texture, TextureUsage, TRUE } from '@gglib/graphics'
import { mat4GetTranslation, vec2Equals, vec3, vec3$initFrom, vec3Equals, vec4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import type { AssetReference } from '../../api'
import { ViewerConfig } from '../../config'
import { InputSlots } from '../../material'
import { TimeOfDay } from './TimeOfDay'
import { TimeOfDayComponent } from './TimeOfDayComponent'
import type { TimeOfDayPreset } from './TimeOfDayPreset'

export class SkyLightSystem extends GameSystem {
  private game: EcsGame
  private time: TimeSystem
  private renderer: Renderer
  private todQuery: GameQuery
  /**
   * The presets of the active time of day zones this frame, reused
   */
  private zonePresets = new Set<TimeOfDayPreset>()
  private config: ViewerConfig
  /**
   * x = exposure of the film mapping when the eye adaptation is off (config `exposure: fixed`)
   */
  private filmExposure = vec4(1, 0, 0, 0)
  /**
   * EV min, max, auto compensation of the time of day, w = 1 enables the eye adaptation
   */
  private eyeAdaptation = vec4(0)

  public device: Device
  public timeOfDay = new TimeOfDay()
  public fxSky: NishitaSkyEffect
  public fxIbl: IblSampler
  public skyDomeTexture: Texture
  /**
   * Skybox slice of the highest priority TimeOfDay POI that contains the camera
   */
  public activeSky: AssetReference | null = null

  public get mieScatteringMap() {
    return this.fxSky.mieScatteringMap
  }

  public get rayleighScatteringMap() {
    return this.fxSky.rayleighScatteringMap
  }

  public get reflectionMap() {
    return this.fxIbl.envMapGGX
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.time = world.getSystem(TimeSystem)
    this.todQuery = world.query({ scope: 'active', required: [TimeOfDayComponent] })
    this.device = world.getSystem(Device)
    this.renderer = world.getSystem(Renderer)
    // read by the SunShaftsPass, not bound by materials
    if (!this.renderer.inputs.hasBlock('sunShafts')) {
      this.renderer.inputs.createBlock('sunShafts')
    }
    // read by the FilmMappingPass, not bound by materials
    if (!this.renderer.inputs.hasBlock('filmMapping')) {
      this.renderer.inputs.createBlock('filmMapping')
    }
    this.config = world.getSystem(ViewerConfig)
    this.fxSky = new NishitaSkyEffect(this.device, {})
    // materials only read the GGX map (EnvMap), it is re-filtered every frame
    this.fxIbl = new IblSampler(this.device, { lambert: false, charlie: false })
    this.skyDomeTexture = this.device.createRenderTarget({
      type: '2d',
      width: 2048,
      height: 1024,
      mipLevelCount: getMipmapCount(2048, 1024, 1),
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    })
  }
  public override update(time: number, dt: number): void {
    const view = this.game.scene.getView(0).camera
    const cam = mat4GetTranslation(view.world)

    let sky: TimeOfDayComponent = null
    const zones = this.zonePresets
    zones.clear()
    for (const entity of this.todQuery) {
      const it = entity.component(TimeOfDayComponent)
      zones.add(it.preset)
      if (it.isPointInside(cam)) {
        this.timeOfDay.scheduleAdd(it.preset, it.config.priority, it.config.blendTime)
        // POIs without a skybox keep the sky of a lower priority POI (assumption, not verified against the game)
        if (it.config.sky && (!sky || (it.config.priority ?? 0) > (sky.config.priority ?? 0))) {
          sky = it
        }
      } else {
        this.timeOfDay.scheduleRemove(it.preset)
      }
    }
    this.activeSky = sky?.config.sky ?? null
    // zones that left the query (unloaded) blend out too
    this.timeOfDay.scheduleRemoveMissing(zones)

    this.timeOfDay.update(dt, this.time.game.delta, view)
  }

  private renderVersion = 0
  private pendingVersion = 0

  public override render(time: number, dt: number): void {
    // intentionally rendered each frame
    if (this.fxSky.isValid) {
      let changed = false

      // the sky scatters the actual sun, also at night when the sun light is the moon (sunPosOrig in TimeOfDay.cpp)
      const skySun = this.timeOfDay.skySunDirection
      const latitude = Math.acos(-skySun.z)
      const longitude = Math.atan2(-skySun.y, -skySun.x)

      this.fxSky.textureOut = this.skyDomeTexture
      if (this.fxSky.sunLatitude !== latitude) {
        this.fxSky.sunLatitude = latitude
        changed = true
      }
      if (this.fxSky.sunLongitude !== longitude) {
        this.fxSky.sunLongitude = longitude
        changed = true
      }
      if (this.fxSky.mieScattering !== this.timeOfDay.skyKM) {
        this.fxSky.mieScattering = this.timeOfDay.skyKM
        changed = true
      }
      if (this.fxSky.rayleighScattering !== this.timeOfDay.skyKR) {
        this.fxSky.rayleighScattering = this.timeOfDay.skyKR
        changed = true
      }
      if (this.fxSky.phaseAsymmetry !== this.timeOfDay.skyG) {
        this.fxSky.phaseAsymmetry = this.timeOfDay.skyG
        changed = true
      }

      if (this.fxSky.waveLength.x !== this.timeOfDay.skyWaveR) {
        this.fxSky.waveLength.x = this.timeOfDay.skyWaveR
        changed = true
      }
      if (this.fxSky.waveLength.y !== this.timeOfDay.skyWaveG) {
        this.fxSky.waveLength.y = this.timeOfDay.skyWaveG
        changed = true
      }
      if (this.fxSky.waveLength.z !== this.timeOfDay.skyWaveB) {
        this.fxSky.waveLength.z = this.timeOfDay.skyWaveB
        changed = true
      }

      if (!vec3Equals(this.fxSky.sunIntensity, this.timeOfDay.skySunIntensity)) {
        vec3$initFrom(this.fxSky.sunIntensity, this.timeOfDay.skySunIntensity)
        changed = true
      }

      if (!vec3Equals(this.fxSky.nightSkyColorBase, this.timeOfDay.nightSkyHorizonColor)) {
        vec3$initFrom(this.fxSky.nightSkyColorBase, this.timeOfDay.nightSkyHorizonColor)
        changed = true
      }

      if (!vec3Equals(this.fxSky.nightSkyColorDelta, this.timeOfDay.nightSkyColorDelta)) {
        vec3$initFrom(this.fxSky.nightSkyColorDelta, this.timeOfDay.nightSkyColorDelta)
        changed = true
      }

      if (!vec2Equals(this.fxSky.nightSkyColorShift, this.timeOfDay.nightSkyZenithColorShift)) {
        this.fxSky.nightSkyColorShift.x = this.timeOfDay.nightSkyZenithColorShift.x
        this.fxSky.nightSkyColorShift.y = this.timeOfDay.nightSkyZenithColorShift.y
        changed = true
      }

      if (!vec3Equals(this.fxSky.groundColor, this.timeOfDay.fogColor)) {
        vec3$initFrom(this.fxSky.groundColor, this.timeOfDay.fogColor)
        changed = true
      }

      if (changed) {
        this.pendingVersion = this.renderVersion++
      }
    }

    if (this.fxSky.isValid && this.fxIbl.isReady && this.pendingVersion !== this.renderVersion) {
      this.renderVersion = this.pendingVersion
      this.fxSky.render(this.device.renderPass)
      this.fxIbl.update(this.skyDomeTexture)
    }

    const tod = this.timeOfDay
    const inputs = this.renderer.inputs
    const sunColor = inputs.get(InputSlots.Global.SunColor) || vec4(0)
    sunColor.x = tod.sunColor.x
    sunColor.y = tod.sunColor.y
    sunColor.z = tod.sunColor.z
    sunColor.w = tod.sunSpecularMultiplier
    inputs.set(InputSlots.Global.SunColor, sunColor)
    inputs.set(InputSlots.Global.SunDirection, tod.sunDirection)
    inputs.set(InputSlots.Global.WindDirection, tod.windDirection)
    inputs.set(InputSlots.Global.ParticleBrightness, tod.particleBrightness)

    const scaledBottomFogColor = inputs.get(InputSlots.Global.BottomFogColor) || vec3()
    scaledBottomFogColor.x = tod.fogColor.x * tod.fogMultiplier
    scaledBottomFogColor.y = tod.fogColor.y * tod.fogMultiplier
    scaledBottomFogColor.z = tod.fogColor.z * tod.fogMultiplier
    inputs.set(InputSlots.Global.BottomFogColor, scaledBottomFogColor)

    const scaledTopFogColor = inputs.get(InputSlots.Global.TopFogColor) || vec3()
    scaledTopFogColor.x = tod.fogTopColor.x * tod.fogTopMultiplier
    scaledTopFogColor.y = tod.fogTopColor.y * tod.fogTopMultiplier
    scaledTopFogColor.z = tod.fogTopColor.z * tod.fogTopMultiplier
    inputs.set(InputSlots.Global.TopFogColor, scaledTopFogColor)

    inputs.set(InputSlots.Global.TopFogDensity, tod.fogTopDensity)
    inputs.set(InputSlots.Global.BottomFogDensity, tod.fogDensity)
    inputs.set(InputSlots.Global.TopFogHeight, tod.fogTopHeight)
    inputs.set(InputSlots.Global.BottomFogHeight, tod.fogHeight)
    inputs.set(InputSlots.Global.FogHeightOffset, tod.fogHeightOffset)

    inputs.set(InputSlots.Global.CloudShadingSunColor, tod.cloudshadingCustomSunColor)
    inputs.set(InputSlots.Global.CloudShadingSkyColor, tod.cloudshadingCustomSkyColor)

    inputs.set(InputSlots.FilmMapping.ColorBalance, tod.hdrColorBalance)
    inputs.set(InputSlots.FilmMapping.FilmCurve, tod.hdrFilmCurve)
    this.filmExposure.x = this.config.value.fixedExposure
    inputs.set(InputSlots.FilmMapping.Exposure, this.filmExposure)
    this.eyeAdaptation.x = tod.hdrEyeAdaptation.x
    this.eyeAdaptation.y = tod.hdrEyeAdaptation.y
    this.eyeAdaptation.z = tod.hdrEyeAdaptation.z
    this.eyeAdaptation.w = this.config.value.exposure === 'auto' ? 1 : 0
    inputs.set(InputSlots.FilmMapping.EyeAdaptation, this.eyeAdaptation)
    // HDRBloomColor = bloom amount * 0.3 (GetHDRSetupParams) / 8 (D3DHDRRender.cpp)
    inputs.set(InputSlots.FilmMapping.Bloom, (tod.hdrBloomAmount * 0.3) / 8)

    inputs.set(InputSlots.SunShafts.Params, tod.sunShaftsParams)
    inputs.set(InputSlots.SunShafts.Color, tod.sunShaftsColor)

    inputs.set(InputSlots.Global.VolumetricFogParams, tod.fogParams)
    inputs.set(InputSlots.Global.VolumetricFogRampParams, tod.fogRampParams)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientParams, tod.fogColGradParams)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientBase, tod.fogColGradBase)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientDelta, tod.fogColGradDelta)
    inputs.set(InputSlots.Global.VolumetricFogColorGradientRadial, tod.fogColGradRadial)

    inputs.set(InputSlots.Global.EnvMap, this.fxIbl.envMapGGX)

    // see Ocean.cpp, ocean fog color is tinted by the sun, density is converted to log2 base
    const oceanFog = inputs.get(InputSlots.Global.OceanFogColorDensity) || vec4(0)
    oceanFog.x = tod.sunColor.x * tod.oceanFogColor.x
    oceanFog.y = tod.sunColor.y * tod.oceanFogColor.y
    oceanFog.z = tod.sunColor.z * tod.oceanFogColor.z
    oceanFog.w = tod.oceanFogDensity * Math.LOG2E
    inputs.set(InputSlots.Global.OceanFogColorDensity, oceanFog)

    // volumetric fog 2 (sGetVolumetricFog* in D3DHWShader.cpp)
    // the scattering color is the sun color times the atmosphere fog albedo, also used by APPLY_FOG_COLOR
    inputs.set(InputSlots.Global.FogScatteringColor, tod.volFog2ScatteringColor)
    inputs.set(InputSlots.Global.FogScatteringSecondaryColor, tod.volFog2ScatteringSecondaryColor)
    inputs.set(InputSlots.Global.VolFog2HeightDensity, tod.volFog2HeightDensity)
    inputs.set(InputSlots.Global.VolFog2Ramp, tod.volFog2Ramp)
    inputs.set(InputSlots.Global.VolFog2Scattering, tod.volFog2Scattering)
    inputs.set(InputSlots.Global.VolFog2Blend, tod.volFog2Blend)
    inputs.set(InputSlots.Global.VolFog2Zenith, tod.volFog2Zenith)
    inputs.set(InputSlots.Global.VolFog2Entity, tod.volFog2Entity)
    // fallback without a baked global probe (previews), EnvProbeInputs writes the probe in-scattering.
    // Particles still use it as their ambient.
    inputs.set(InputSlots.Global.VolFog2Ambient, tod.fogColGradBase)
    // config `volumetricFog`, off uses the legacy fog
    inputs.set(InputSlots.Global.VolFog2Enabled, this.config.value.fog === 'off' ? FALSE : TRUE)
  }

  public destroy(): void {
    this.fxIbl.dispose()
    this.fxSky.dispose()
    this.skyDomeTexture.dispose()
  }
}
