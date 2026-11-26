import {
  BlendState,
  CullState,
  DepthState,
  type EffectOptions,
  type MaterialOptions,
  MaterialWithSchema,
  SamplerState,
  type ShaderModuleOptions,
  TRUE,
} from '@gglib/graphics'
import { mat4Identity, vec4 } from '@gglib/math'
import { type FeatureFlag, getShaderConstants, InputBlocks, MaterialLayerMasks } from './common'
import SCHEMA from './GlassMaterial.meta'
import WGSL from './GlassMaterial.wgsl'
import { type NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import { MtlFlag } from './types'
import { MtlUtil, normalMapEncoding, paramValue, paramVec4, getWhiteTexture } from './utils'

export function glassShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Glass Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function glassEffectOptions(): EffectOptions {
  return {
    name: 'Glass Effect',
    meta: {},
    program: {
      shader: glassShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

interface PublicParams {
  BumpMapTile: string //            number
  BumpScale: string //              number
  TintColor: string //              vec3
  BackLightScale: string //         number
  TintCloudiness: string //         number
  IndirectColor: string //          vec3
  CloudinessReducesGloss: string // number
  RoughnessBoost: string //         number
  BlurAmount: string //             number
  RoughnessMaxFootprint: string //  number
  FogDensity: string //             number
  FogCutoffEnd: string //           number
  FogColor: string //               vec4
  DepthFixupThreshold: string //    number
  CloudinessMasksBlur: string //    number
  FresnelBias: string //            number
  FresnelScale: string //           number
}

const util = new MtlUtil('Glass', {
  knownMaps: ['Diffuse', 'Bumpmap', 'Specular', 'Environment', 'SecondSmoothness', 'Custom', 'Smoothness'],
  knownMods: ['Diffuse', 'Custom'],
  knownFlags: [
    'TINT_COLOR_MAP',
    'BILINEAR_FP16',
    'ENVIRONMENT_MAP',
    'TINT_MAP',
    'DIRT_MAP',
    'SPECULAR_MAP',
    'BLUR_REFRACTION',
    'SAA_FILTERING',
    'DEPTH_FOG',
    'DEPTH_FIXUP',
    'UNLIT',
  ],
})
export class GlassMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modCustom: TextureModifier | null
  declare private modDetail: TextureModifier | null
  declare private modEmittance: TextureModifier | null
  declare private modDecalEmissive: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Glass Material',
      effect: glassEffectOptions(),
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.layer = MaterialLayerMasks.Glass
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)

    // glass composes the refracted scene color itself, which is only available in the transparent pass
    this.isTransparent = true

    this.effect.cullState = CullState.CullBack
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.blendState = BlendState.Alpha

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      this.effect.cullState = CullState.None
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_ADDITIVE) {
      // never seen
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_NODRAW) {
      this.noRender = true
    }
    // CullMode = Back
    // ZEnable = true
    // ZWriteEnable = false
    // SrcBlend = ONE
    // DestBlend = ZERO
    // AlphaBlendEnable = false
  }

  private setDefaults() {
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SpecularColor = vec4(1, 1, 1, 1)
    this.EmissiveColor = vec4()

    this.BumpMapTile = 1.0
    this.BumpScale = 0.1
    this.TintColor = vec4(1.0, 1.0, 1.0, 1.0)
    this.BackLightScale = 0.5
    this.TintCloudiness = 0.0
    this.IndirectColor = vec4(0.25, 0.25, 0.25, 0.25)
    this.CloudinessReducesGloss = 0.5
    this.RoughnessBoost = 2.0
    this.BlurAmount = 0.5
    this.RoughnessMaxFootprint = 0.3
    this.FogDensity = 1.0
    this.FogCutoffEnd = 20.0
    this.FogColor = vec4(1.0, 1.0, 1.0, 1.0)
    this.DepthFixupThreshold = 0.05
    this.CloudinessMasksBlur = 0.0

    this.UvModDiffuse = mat4Identity()
    this.UvModCustom = mat4Identity()
    this.UvModDetail = mat4Identity()
    this.UvModEmittance = mat4Identity()
    this.UvModDecalEmissive = mat4Identity()

    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }

    // == EFTT_NORMALS
    // - normalMap
    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as any
    }

    // == EFTT_SPECULAR
    // - specularMap
    if (maps.Specular) {
      this.SpecularMap = maps.Specular as any
      this.EnabledSpecularMap = TRUE
    }

    // == EFTT_ENV
    // - envMap
    if (maps.Environment) {
      // TODO:
    }

    // == EFTT_DETAIL_OVERLAY
    // - detailMap
    if (maps.Detail) {
      this.DetailMap = maps.Detail as any
    }

    // == EFTT_SECOND_SMOOTHNESS
    // - translucencyMap
    if (maps.SecondSmoothness) {
      this.TranslucencyMap = maps.SecondSmoothness as any
    }

    // == EFTT_HEIGHT
    // - heightMap
    if (maps.Heightmap) {
      this.HeightMap = maps.Heightmap as any
    }

    // == EFTT_DECAL_OVERLAY
    // - decalMap
    // - emissiveIntensity
    if (maps.Decal) {
      this.DecalEmissiveMap = maps.Decal as any
    }

    // == EFTT_SUBSURFACE
    // - subsurfaceMap
    // - HeightMap2
    if (maps.SubSurface) {
      this.SubsurfaceMap = maps.SubSurface as any
    }

    // == EFTT_CUSTOM
    // - DiffuseMap2
    if (maps.Custom) {
      this.DiffuseMap2 = maps.Custom as any
    }

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    if (maps['[1] Custom']) {
      this.NormalMap2 = maps['[1] Custom'] as any
    }
    this.NormalMapEncoding = normalMapEncoding(maps.Bumpmap, maps['[1] Custom'])

    // == EFTT_OPACITY
    // - opacityMap
    // - BlendMap
    // - DecalOpacityMap
    if (maps.Opacity) {
      this.OpacityMap = maps.Opacity as any
    }

    // == EFTT_SMOOTHNESS
    // - smoothnessMap
    if (maps.Smoothness) {
      this.SmoothnessMap = maps.Smoothness as any
    } else {
      this.SmoothnessMap = getWhiteTexture(this.device)
    }

    // == EFTT_EMITTANCE
    // - emittanceMap
    if (maps.Emittance) {
      this.EmittanceMap = maps.Emittance as any
    }

    // == EFTT_OCCLUSION
    // - OcclusionMap
    if (maps.Occlusion) {
      this.OcclusionMap = maps.Occlusion as any
    }

    // == EFTT_SPECULAR_2
    // - SpecularMap2
    if (maps.Specular2) {
      // this.SpecularMap2 = tex.Specular2 as any
    }
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    if (TextureModifier.isModified(mods.Diffuse)) {
      this.modDiffuse = new TextureModifier(mods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }

    if (TextureModifier.isModified(mods.Custom)) {
      this.modCustom = new TextureModifier(mods.Custom)
      this.EnabledUvModCustom = TRUE
      this.updateModCustom(0)
    }

    if (TextureModifier.isModified(mods.Detail)) {
      this.modDetail = new TextureModifier(mods.Detail)
      this.EnabledUvModDetail = TRUE
      this.updateModDetail(0)
    }

    if (TextureModifier.isModified(mods.Emittance)) {
      this.modEmittance = new TextureModifier(mods.Emittance)
      this.EnabledUvModEmittance = TRUE
      this.updateModEmittance(0)
    }

    if (TextureModifier.isModified(mods.Decal)) {
      this.modDecalEmissive = new TextureModifier(mods.Decal)
      this.EnabledUvModDecalEmissive = TRUE
      this.updateModDecalEmissive(0)
    }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    this.SpecularColor = paramVec4(attrs.Specular, vec4.One)
    this.EmissiveColor = paramVec4(attrs.Emissive)
    this.EmissiveColor = paramVec4(attrs.Emittance)

    if (attrs.AlphaTest < 1) {
      // this.AlphaTestRef = attr.AlphaTest
      // this.EnabledAlphaTest = TRUE
    }

    if (attrs.Opacity < 1 || flags.has('DECAL')) {
      let opacity = attrs.Opacity ?? 1
      // this.DecalDiffuseOpacity = opacity
      this.DiffuseColor.w = opacity
      this.isTransparent = true
      // this.EnabledAlphaBlend = TRUE
      // this.effect.blendState = BlendState.Alpha
      // this.effect.depthState = DepthState.GreaterEqualNoWrite
    }

    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }

    if (flags.has('TINT_COLOR_MAP')) {
      this.EnabledTintColorMap = TRUE
    }
    if (flags.has('BILINEAR_FP16')) {
      this.EnabledBilinearFp16 = TRUE
    }
    if (flags.has('ENVIRONMENT_MAP')) {
      this.EnabledEnvironmentMap = TRUE
    }
    if (flags.has('TINT_MAP')) {
      this.EnabledTintMap = TRUE
    }
    if (flags.has('DIRT_MAP')) {
      this.EnabledDirtMap = TRUE
    }
    if (flags.has('SPECULAR_MAP')) {
      this.EnabledSpecularMap = TRUE
    }
    if (flags.has('BLUR_REFRACTION')) {
      this.EnabledBlurRefraction = TRUE
    }
    if (flags.has('SAA_FILTERING')) {
      this.EnabledSaaFiltering = TRUE
    }
    if (flags.has('DEPTH_FOG')) {
      this.EnabledDepthFog = TRUE
    }
    if (flags.has('DEPTH_FIXUP')) {
      this.EnabledDepthFixup = TRUE
    }
    if (flags.has('UNLIT')) {
      this.EnabledUnlit = TRUE
    }
  }

  private setPublicParams(para: PublicParams) {
    this.BumpMapTile = paramValue(para.BumpMapTile, this.BumpMapTile)
    this.BumpScale = paramValue(para.BumpScale, this.BumpScale)
    this.TintColor = paramVec4(para.TintColor, this.TintColor)
    this.BackLightScale = paramValue(para.BackLightScale, this.BackLightScale)
    this.TintCloudiness = paramValue(para.TintCloudiness, this.TintCloudiness)
    this.IndirectColor = paramVec4(para.IndirectColor, this.IndirectColor)
    this.CloudinessReducesGloss = paramValue(para.CloudinessReducesGloss, this.CloudinessReducesGloss)
    this.RoughnessBoost = paramValue(para.RoughnessBoost, this.RoughnessBoost)
    this.BlurAmount = paramValue(para.BlurAmount, this.BlurAmount)
    this.RoughnessMaxFootprint = paramValue(para.RoughnessMaxFootprint, this.RoughnessMaxFootprint)
    this.FogDensity = paramValue(para.FogDensity, this.FogDensity)
    this.FogCutoffEnd = paramValue(para.FogCutoffEnd, this.FogCutoffEnd)
    this.FogColor = paramVec4(para.FogColor, this.FogColor)
    this.DepthFixupThreshold = paramValue(para.DepthFixupThreshold, this.DepthFixupThreshold)
    this.CloudinessMasksBlur = paramValue(para.CloudinessMasksBlur, this.CloudinessMasksBlur)
    // this.FresnelBias = paramValue(para.FresnelBias, this.FresnelBias)
    // this.FresnelScale = paramValue(para.FresnelScale, this.FresnelScale)
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

    if (this.modCustom && this.modCustom.isAnimated) {
      this.updateModCustom(time)
    }

    if (this.modDetail && this.modDetail.isAnimated) {
      this.updateModDetail(time)
    }

    if (this.modEmittance && this.modEmittance.isAnimated) {
      this.updateModEmittance(time)
    }

    if (this.modDecalEmissive && this.modDecalEmissive.isAnimated) {
      this.updateModDecalEmissive(time)
    }
  }

  private updateModDiffuse(time: number) {
    this.modDiffuse.update(time)
    this.UvModDiffuse = this.modDiffuse.matrix
  }
  private updateModCustom(time: number) {
    this.modCustom.update(time)
    this.UvModCustom = this.modCustom.matrix
  }
  private updateModDetail(time: number) {
    this.modDetail.update(time)
    this.UvModDetail = this.modDetail.matrix
  }
  private updateModEmittance(time: number) {
    this.modEmittance.update(time)
    this.UvModEmittance = this.modEmittance.matrix
  }
  private updateModDecalEmissive(time: number) {
    this.modDecalEmissive.update(time)
    this.UvModDecalEmissive = this.modDecalEmissive.matrix
  }
}
