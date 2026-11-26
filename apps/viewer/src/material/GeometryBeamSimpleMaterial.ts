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
import { vec4 } from '@gglib/math'
import { Noise3DKey } from '../content'
import SCHEMA from './GeometryBeamSimpleMaterial.meta'
import WGSL from './GeometryBeamSimpleMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import { MtlUtil, paramValue, paramVec4 } from './utils'

export function geometryBeamSimpleShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Geometry Beam Simple Shader',
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function geometryBeamSimpleEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Geometry Beam Simple Effect',
    meta: {},
    program: {
      shader: geometryBeamSimpleShaderOptions(constants),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  baseUVScale: string //               number
  FinalMultiplier: string //           number
  EndColor: string //                  vec4
  SoftIntersectionFactor: string //    number
  StartColor: string //                vec4
  fadingFeaturing: string //           number
  AmbStrength: string //               number
  dustUVScale: string //               number
  turbStrength: string //              number
  dustTimeScale: string //             number
  turbRatio: string //                 number
  uvRot: string //                     number
  BackgroudAlphaNoiseSpeedY: string // number
  BackgroudAlphaNoiseSpeedX: string // number
  BackgroudAlphaNoiseSpeedZ: string // number
  uvVigFeaturing: string //            number
  viewDependencyFactor: string //      number
  VolumetricScale: string //           number
  //
  SunColorInfluence: string
}

const util = new MtlUtil('GeometryBeamSimple', {
  knownMaps: ['Diffuse', 'Specular', 'Bumpmap', 'Smoothness'],
  knownMods: ['Diffuse'],
  knownFlags: [
    'NOISE',
    'UV_VIGNETTING',
    'GRADIENT_ALPHA',
    'VERTICAL_GRADIENT',
    'RECEIVE_SHADOWS',
    'APPLY_SUN_COLOR',
    'applyFog_COLOR',
  ],
})

export class GeometryBeamSimpleMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    this.name = 'Geometry Beam Simple Material'
    this.meta = options

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, geometryBeamSimpleEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.AdditiveAlpha
    this.isTransparent = true

    this.layer = MaterialLayerMasks.GeometryBeam
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
  }

  private setDefaults() {
    this.Noise3DTex = this.device.acquireTexture({ key: Noise3DKey, throwIfMissing: true })
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SamplerLinear = SamplerState.LinearWrap

    this.StartColor = vec4(1.0, 1.0, 1.0, 1.0)
    this.EndColor = vec4(1.0, 1.0, 1.0, 1.0)
    this.FinalMultiplier = 1.0
    this.SoftIntersectionFactor = 1.0
    this.ViewDependencyFactor = 2.0
    this.FadingFeaturing = 0.55
    this.AmbStrength = 0.12
    this.BaseUVScale = 1.0
    this.DustUVScale = 0.6
    this.DustTimeScale = 1.0
    this.TurbStrength = 1.0
    this.TurbRatio = 0.55
    this.UvRot = 0.0
    this.BackgroundAlphaNoiseSpeedX = 0.1
    this.BackgroundAlphaNoiseSpeedY = 0.05
    this.BackgroundAlphaNoiseSpeedZ = 0.15
    this.UvVigFeaturing = 4.0
    this.VolumetricScale = 0.7
    this.SunColorInfluence = 0.5
    this.FogColorInfluence = 0.0
    // this.FadeOutDistande = 0.2
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    // NAME       count modCount
    // Diffuse     19    19
    // Bumpmap     2     0
    // Specular    5     0
    // Smoothness  2     0
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }

    if (maps.Specular) {
      this.SpecularMap = maps.Specular as any
    }

    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as any
    }

    if (maps.Smoothness) {
      this.SmoothnessMap = maps.Bumpmap as any
    }
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    if (TextureModifier.isModified(mods.Diffuse)) {
      this.modDiffuse = new TextureModifier(mods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
  }

  private setPublicParams(params: PublicParams) {
    this.AmbStrength = paramValue(params.AmbStrength, this.AmbStrength)
    this.BackgroundAlphaNoiseSpeedX = paramValue(params.BackgroudAlphaNoiseSpeedX, this.BackgroundAlphaNoiseSpeedX)
    this.BackgroundAlphaNoiseSpeedY = paramValue(params.BackgroudAlphaNoiseSpeedY, this.BackgroundAlphaNoiseSpeedY)
    this.BackgroundAlphaNoiseSpeedZ = paramValue(params.BackgroudAlphaNoiseSpeedZ, this.BackgroundAlphaNoiseSpeedZ)
    this.EndColor = paramVec4(params.EndColor, this.EndColor)
    // this.FadeOutDistande = paramValue(para.FadeOutDistance, this.FadeOutDistande)
    this.FinalMultiplier = paramValue(params.FinalMultiplier, this.FinalMultiplier)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.StartColor = paramVec4(params.StartColor, this.StartColor)
    this.SunColorInfluence = paramValue(params.SunColorInfluence, this.SunColorInfluence)
    this.BaseUVScale = paramValue(params.baseUVScale, this.BaseUVScale)
    this.DustTimeScale = paramValue(params.dustTimeScale, this.DustTimeScale)
    this.DustUVScale = paramValue(params.dustUVScale, this.DustUVScale)
    this.FadingFeaturing = paramValue(params.fadingFeaturing, this.FadingFeaturing)
    this.TurbRatio = paramValue(params.turbRatio, this.TurbRatio)
    this.TurbStrength = paramValue(params.turbStrength, this.TurbStrength)
    this.UvRot = paramValue(params.uvRot, this.UvRot)
    this.ViewDependencyFactor = paramValue(params.viewDependencyFactor, this.ViewDependencyFactor)
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
