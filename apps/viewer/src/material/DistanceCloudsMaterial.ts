import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  ShaderConstants,
  TRUE,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { Noise2DKey } from '../content'
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import Schema from './DistanceCloudsMaterial.meta'
import DISTANCE_CLOUDS_SHADER from './DistanceCloudsMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import { vec4 } from '@gglib/math'
import { MtlUtil, paramValue, paramVec4 } from './utils'

export function distanceCloudsOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Distance Clouds Shader',
    wgsl: {
      source: DISTANCE_CLOUDS_SHADER,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function distanceCloudsEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Distance Clouds Effect',
    meta: {},
    program: {
      shader: distanceCloudsOptions(constants),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  SkyColorMultiplier: string
  StepSize: string
  SunColorMultiplier: string
  Attenuation: string
  AlphaSaturation: string
  ShadowSkydomeSize: string
  ShadowFadingInclinationFactor: string
  ShadowPower: string
  MaxShadowDensity: string
  MinShadowDensity: string
  ShadowFadingRadiusFactor: string
  Exposure: string
  Opacity: string
  SpriteSheet_Columns: string
  SpriteSheet_NumFrames: string
  SpriteSheet_Rows: string
  SpriteSheet_Duration: string
}

const util = new MtlUtil('DistanceClouds', {
  knownMaps: ['Diffuse'],
  knownMods: ['Diffuse'],
  knownFlags: ['SIMPLE', 'ADVANCED', 'SPRITESHEET_MATERIAL', 'LOCAL_WEATHER'],
})

export class DistanceCloudsMaterial extends MaterialWithSchema(Schema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    this.name = 'Distance Clouds Material'
    this.meta = options

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, distanceCloudsEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    // SrcBlend = SrcAlpha, DestBlend = InvSrcAlpha
    this.effect.blendState = BlendState.Alpha
    this.isTransparent = true

    this.layer = MaterialLayerMasks.DistanceClouds
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
  }

  private setDefaults() {
    this.Noise2DTex = this.device.acquireTexture({ key: Noise2DKey, throwIfMissing: true })
    this.SamplerLinear = SamplerState.LinearWrap

    // EngineAssets/Textures/perlinNoise2D.dds
    this.AlphaMultiplier = 1.0
    this.AlphaSaturation = 2.0
    this.Attenuation = 0.6
    this.CloudHeight = 0.3
    this.DensitySky = 4.5
    this.DensitySun = 1.5
    this.FadingNoiseOffset = 0.0
    this.FadingNoiseTilingSize = 1000.0
    this.HorizonBendingHeight = 0.2
    this.SkyHeight = 1000.0
    this.Exposure = 1.0
    this.MaxShadowDensity = 1.0
    this.MinShadowDensity = 0.0
    this.Opacity = 1.0
    this.SimpleOpacity = 1.0
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.ShadowFadingInclinationFactor = 10
    this.ShadowFadingRadiusFactor = 10
    this.ShadowPower = 1.0
    this.ShadowSkydomeSize = 1000.0
    this.SkyColorMultiplier = 1.5
    this.SpriteSheetColumns = 1.0
    this.SpriteSheetDuration = 1.0
    this.SpriteSheetNumFrames = 1.0
    this.SpriteSheetRows = 1.0
    this.StepSize = 0.004
    this.SunColorMultiplier = 4.0
    this.WeatherRadius = 2500.0
    this.WeatherSmoothRadius = -1500.0
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    // NAME       count modCount
    // Diffuse     61    6
    // Bumpmap     2     0
    // Decal       1     1
    // Opacity     2     0
    // Smoothness  2     0
    // Emittance   3     2
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }
  }

  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  private setModifiers(mods: NwMaterialProps['mods']) {
    if (TextureModifier.isModified(mods.Diffuse)) {
      this.modDiffuse = new TextureModifier(mods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    // GetInstance_Opacity: PerMaterial_DiffuseColor.w, the material opacity
    if (attrs.Opacity != null) {
      this.Opacity = Number(attrs.Opacity)
    }
    // PerMaterial_DiffuseColor, read by %SIMPLE only
    if (attrs.Diffuse) {
      this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    }
  }

  private setPublicParams(params: PublicParams) {
    this.SkyColorMultiplier = paramValue(params.SkyColorMultiplier, this.SkyColorMultiplier)
    this.StepSize = paramValue(params.StepSize, this.StepSize)
    this.SunColorMultiplier = paramValue(params.SunColorMultiplier, this.SunColorMultiplier)
    this.Attenuation = paramValue(params.Attenuation, this.Attenuation)
    this.AlphaSaturation = paramValue(params.AlphaSaturation, this.AlphaSaturation)
    this.ShadowSkydomeSize = paramValue(params.ShadowSkydomeSize, this.ShadowSkydomeSize)
    this.ShadowFadingInclinationFactor = paramValue(
      params.ShadowFadingInclinationFactor,
      this.ShadowFadingInclinationFactor,
    )
    this.ShadowPower = paramValue(params.ShadowPower, this.ShadowPower)
    this.MaxShadowDensity = paramValue(params.MaxShadowDensity, this.MaxShadowDensity)
    this.MinShadowDensity = paramValue(params.MinShadowDensity, this.MinShadowDensity)
    this.ShadowFadingRadiusFactor = paramValue(params.ShadowFadingRadiusFactor, this.ShadowFadingRadiusFactor)
    this.Exposure = paramValue(params.Exposure, this.Exposure)
    // the public Opacity is the %SIMPLE alpha factor, General uses the material opacity (GetInstance_Opacity)
    this.SimpleOpacity = paramValue(params.Opacity, this.SimpleOpacity)
    this.SpriteSheetColumns = paramValue(params.SpriteSheet_Columns, this.SpriteSheetColumns)
    this.SpriteSheetNumFrames = paramValue(params.SpriteSheet_NumFrames, this.SpriteSheetNumFrames)
    this.SpriteSheetRows = paramValue(params.SpriteSheet_Rows, this.SpriteSheetRows)
    this.SpriteSheetDuration = paramValue(params.SpriteSheet_Duration, this.SpriteSheetDuration)
  }

  private frame: number
  public update(time: number, delta: number, frame: number) {
    if (this.frame === frame) {
      return
    }
    this.frame = frame

    if (this.modDiffuse && this.modDiffuse.isAnimated) {
      this.updateModDiffuse(time)
    }
  }

  private updateModDiffuse(time: number) {
    this.modDiffuse.update(time)
    this.UvModDiffuse = this.modDiffuse.matrix
  }
}
