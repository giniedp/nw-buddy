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
import SCHEMA from './FxMeshAdvancedMaterial.meta'
import WGSL from './FxMeshAdvancedMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import {
  createDebugEffect,
  createEmissiveEffect,
  getShaderConstants,
  hasEmittance,
  InputBlocks,
  MaterialLayerMasks,
  NwRenderVariant,
  type FeatureFlag,
} from './common'
import { MtlFlag } from './types'
import { getWhiteTexture, MtlUtil, normalMapEncoding, paramValue, paramVec4 } from './utils'

export function fxMeshAdvancedShaderOptions(
  constants: Record<string, number>,
  fragmentEntry: string = 'fs_main',
): ShaderModuleOptions {
  return {
    name: `FX Mesh Advanced Shader (${fragmentEntry})`,
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
      fragmentEntry,
    },
    glsl: null,
  }
}

export function fxMeshAdvancedEffectOptions(constants: Record<string, number>, fragmentEntry?: string): EffectOptions {
  return {
    name: 'FX Mesh Advanced Effect',
    meta: {},
    program: {
      shader: fxMeshAdvancedShaderOptions(constants, fragmentEntry),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  DISSOLVE_FRESNEL_FALLOFF: string // number
  DISSOLVE_FRESNEL_INVERT: string //  number
  DISSOLVE_PERCENT: string //         number
  EmissiveScaleIntensity: string //   number
  FRESNEL_EXPONENT: string //         number
  FRESNEL_INVERT: string //           number
  FRESNEL_STRENGTH: string //         number
  FX_NORMAL_STRENGTH: string //       number
  FX_NORMAL_TILE_X: string //         number
  FX_NORMAL_TILE_Y: string //         number
  IndirectColor: string //            vec4
  PALETTE_FALLOFF: string //          number
  PALETTE_PHASE: string //            number
  PALETTE_SDF_INF: string //          number
  PALETTE_SOURCE_BLEND: string //     number
  PALETTE_SPEED: string //            number
  SDF_2D_PHASE_X: string //           number
  SDF_2D_PHASE_Y: string //           number
  SDF_2D_SPEED_X: string //           number
  SDF_2D_SPEED_Y: string //           number
  SDF_2D_STRENGTH: string //          number
  SDF_2D_TILE_X: string //            number
  SDF_2D_TILE_Y: string //            number
  SINEWAVE_AMP: string //             number
  SINEWAVE_AXIS: string //            number
  SINEWAVE_FREQ: string //            number
  SINEWAVE_NORMAL: string //          number
  SINEWAVE_PHASE: string //           number
  SINEWAVE_SPEED: string //           number
  SOURCE_2D_PHASE_X: string //        number
  SOURCE_2D_PHASE_Y: string //        number
  SOURCE_2D_SPEED_X: string //        number
  SOURCE_2D_SPEED_Y: string //        number
  SOURCE_2D_TILE_X: string //         number
  SOURCE_2D_TILE_Y: string //         number
  SSSIndex: string //                 number
  STENCIL_INVERT: string //           number
  STENCIL_NORMAL_INFLUENCE: string // number
  STENCIL_OFFSET_X: string //         number
  STENCIL_OFFSET_Y: string //         number
  SUB_SURFACE_CLARITY: string //      number
  SUB_SURFACE_COLOR: string //        vec4
  SUB_SURFACE_DETAIL_BLEND: string // number
  SUB_SURFACE_DETAIL_POW: string //   number
  SUB_SURFACE_DIR_X: string //        number
  SUB_SURFACE_DIR_Y: string //        number
  SUB_SURFACE_DIR_Z: string //        number
  SUB_SURFACE_FALLOFF: string //      number
  SUB_SURFACE_PARALLAX: string //     number
  SUB_SURFACE_THRESHOLD: string //    number
  SUB_SURFACE_TILE: string //         number
}

const util = new MtlUtil('FxMeshAdvanced', {
  knownMaps: [
    'Diffuse',
    'Bumpmap',
    'Specular',
    'Detail',
    'Smoothness',
    'Opacity',
    'Heightmap',
    'Emittance',
    'Decal',
    'Custom',
  ],
  knownMods: ['Diffuse', 'Emittance', 'Decal'],
  knownFlags: [
    'NORMAL_MAP',
    'EMITTANCE_MAP',
    'GLOW_FRESNEL',
    'SIGNED_DISTANCE_FIELD_2D',
    'SPECULAR_MAP',
    'VERT_DEFORM_SINWAVE',
    'VERTCOLORS',
    // ZPass only (opaque), see FxMeshAdvancedMaterial.wgsl
    'USE_FX_NORMAL_PARAMS',
    'USE_ADVANCED_DISSOLVE',
    'USE_FRESNEL_DISSOLVE_MASK',
    'USE_STENCIL_DISSOLVE_MASK',
    'FX_ADVANCED_SS',
    'FX_SS_CUSTOM_DIR',
    // SSS index in the GBuffer, not encoded yet (material parity plan 3.5)
    'SUBSURFACE_SCATTERING',
  ],
})

export class FxMeshAdvancedMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modCustom: TextureModifier | null
  declare private modDetail: TextureModifier | null
  declare private modEmittance: TextureModifier | null
  declare private modDecalEmissive: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    this.name = 'FX Mesh Advanced Material'
    this.meta = options

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, fxMeshAdvancedEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqual
    this.effect.cullState = CullState.CullBack
    this.effect.blendState = BlendState.Opaque
    if (attrs.Opacity < 1) {
      this.isTransparent = true
      this.effect.blendState = BlendState.Alpha
      this.effect.cullState = CullState.Disabled
    }
    // a two sided material overrides the cull mode of the technique (D3DFXPipeline: MTL_FLAG_2SIDED, RBSI_LOCKCULL)
    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      this.effect.cullState = CullState.None
    }
    if (!this.isTransparent) {
      const gbuffer = new Effect(this.device, fxMeshAdvancedEffectOptions(shaderConst, 'fs_gbuffer'))
      gbuffer.cullState = this.effect.cullState
      gbuffer.blendState = BlendState.Opaque
      this.setEffect(RenderVariant.GBuffer, gbuffer)
      this.setEffect(
        NwRenderVariant.Debug,
        createDebugEffect(this.device, fxMeshAdvancedEffectOptions(shaderConst, 'fs_debug'), gbuffer),
      )
    }

    this.layer = MaterialLayerMasks.FxMeshAdvanced
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)

    // the emittance is known after the attributes are applied
    const gbuffer = this.getEffect(RenderVariant.GBuffer)
    if (gbuffer && hasEmittance(this.EmissiveColor)) {
      this.setEffect(
        NwRenderVariant.Emissive,
        createEmissiveEffect(this.device, fxMeshAdvancedEffectOptions(shaderConst, 'fs_emissive'), gbuffer),
      )
    }
  }

  private setDefaults() {
    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap

    this.DiffuseColor = vec4(1)
    this.SpecularColor = vec4(1)
    this.EmissiveColor = vec4(0)

    this.EmittanceMapGamma = 1.0

    this.Indirectcolor = vec4([0.25, 0.25, 0.25, 0.25])
    this.Emissivescaleintensity = 1.0
    this.Sssindex = 0

    this.Animamplitudewav0 = 0.0
    this.Animamplitudewav2 = 0.0
    this.Animfrequency = 0.0
    this.Animphase = 1.0

    this.DissolveFresnelFalloff = 1.0
    this.DissolveFresnelInvert = 0.0
    this.DissolvePercent = 0.0

    this.FresnelExponent = 1.0
    this.FresnelInvert = 1.0
    this.FresnelStrength = 1.0

    this.FxNormalStrength = 0.5
    this.FxNormalTileX = 1.0
    this.FxNormalTileY = 1.0

    this.PaletteFalloff = 1.0
    this.PalettePhase = 0.0
    this.PaletteSdfInf = 0.0
    this.PaletteSourceBlend = 0.0
    this.PaletteSpeed = 1.0

    this.Sdf2dPhaseX = 0.0
    this.Sdf2dPhaseY = 0.0
    this.Sdf2dSpeedX = 0.0
    this.Sdf2dSpeedY = 0.0
    this.Sdf2dStrength = 0.1
    this.Sdf2dTileX = 1.0
    this.Sdf2dTileY = 1.0

    this.SinewaveAmp = 0.1
    this.SinewaveAxis = 0
    this.SinewaveFreq = 1.0
    this.SinewaveNormal = 0
    this.SinewavePhase = 0.1
    this.SinewaveSpeed = 0.1

    this.Source2dPhaseX = 0.0
    this.Source2dPhaseY = 0.0
    this.Source2dSpeedX = 0.0
    this.Source2dSpeedY = 0.0
    this.Source2dTileX = 1.0
    this.Source2dTileY = 1.0

    this.StencilInvert = 0.0
    this.StencilNormalInfluence = 0.0
    this.StencilOffsetX = 0.0
    this.StencilOffsetY = 0.0

    this.SubSurfaceClarity = 1.0
    this.SubSurfaceColor = vec4([0.5, 0.7, 1.0, 1.0])
    this.SubSurfaceDetailBlend = 0.0
    this.SubSurfaceDetailPow = 1.0
    this.SubSurfaceDirX = 0.0
    this.SubSurfaceDirY = 0.0
    this.SubSurfaceDirZ = 0.0
    this.SubSurfaceFalloff = 2.0
    this.SubSurfaceParallax = -0.2
    this.SubSurfaceThreshold = 2.0
    this.SubSurfaceTile = 1.0
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    // == EFTT_DIFFUSE
    // - diffuseMap
    // - diffuseMap_Decal
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
      // this.SubsurfaceMap = tex.SubSurface as any
    }

    // == EFTT_CUSTOM
    // - maskTex (dissolve stencil)
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
      // this.OcclusionMap = tex.Occlusion as any
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
    // the emissive map and the emissive intensity map each have their own modifier (_ModifyEmittanceUV,
    // _ModifyEmissiveMultiplierUV). The shader reads no other modified slot.
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

    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular, vec4.One)
    }
    if (attrs.Shininess) {
      // PerMaterial_SpecularColor.w = smoothness
      this.SpecularColor.w = attrs.Shininess / 255
    }

    if (attrs.Emissive) {
      this.EmissiveColor = paramVec4(attrs.Emissive)
    }

    if (attrs.Emittance) {
      this.EmissiveColor = paramVec4(attrs.Emittance)
    }

    if (attrs.AlphaTest < 1) {
      //
    }

    if (attrs.Opacity < 1) {
      this.DiffuseColor.w = attrs.Opacity
    }
  }

  private setPublicParams(params: PublicParams) {
    // this.Animamplitudewav0 = paramValue(params.AnimAmplitudeWav0, this.Animamplitudewav0)
    // this.Animamplitudewav2 = paramValue(params.Animamplitudewav2, this.Animamplitudewav2)
    // this.Animfrequency = paramValue(params.Animfrequency, this.Animfrequency)
    // this.Animphase = paramValue(params.Animphase, this.Animphase)
    // this.BendDetailBranchAmplitude = paramValue(params.bendDetailBranchAmplitude, this.BendDetailBranchAmplitude)
    // this.BendDetailFrequency = paramValue(params.bendDetailFrequency, this.BendDetailFrequency)
    // this.BendDetailLeafAmplitude = paramValue(params.bendDetailLeafAmplitude, this.BendDetailLeafAmplitude)
    // this.DepthFixupThreshold = paramValue(params.DepthFixupThreshold, this.DepthFixupThreshold)
    this.DissolveFresnelFalloff = paramValue(params.DISSOLVE_FRESNEL_FALLOFF, this.DissolveFresnelFalloff)
    this.DissolveFresnelInvert = paramValue(params.DISSOLVE_FRESNEL_INVERT, this.DissolveFresnelInvert)
    this.DissolvePercent = paramValue(params.DISSOLVE_PERCENT, this.DissolvePercent)
    this.Emissivescaleintensity = paramValue(params.EmissiveScaleIntensity, this.Emissivescaleintensity)
    this.FresnelExponent = paramValue(params.FRESNEL_EXPONENT, this.FresnelExponent)
    this.FresnelInvert = paramValue(params.FRESNEL_INVERT, this.FresnelInvert)
    this.FresnelStrength = paramValue(params.FRESNEL_STRENGTH, this.FresnelStrength)
    this.FxNormalStrength = paramValue(params.FX_NORMAL_STRENGTH, this.FxNormalStrength)
    this.FxNormalTileX = paramValue(params.FX_NORMAL_TILE_X, this.FxNormalTileX)
    this.FxNormalTileY = paramValue(params.FX_NORMAL_TILE_Y, this.FxNormalTileY)
    this.Indirectcolor = paramVec4(params.IndirectColor, this.Indirectcolor)
    this.PaletteFalloff = paramValue(params.PALETTE_FALLOFF, this.PaletteFalloff)
    this.PalettePhase = paramValue(params.PALETTE_PHASE, this.PalettePhase)
    this.PaletteSdfInf = paramValue(params.PALETTE_SDF_INF, this.PaletteSdfInf)
    this.PaletteSourceBlend = paramValue(params.PALETTE_SOURCE_BLEND, this.PaletteSourceBlend)
    this.PaletteSpeed = paramValue(params.PALETTE_SPEED, this.PaletteSpeed)
    // this.ProcGradFreq = paramValue(params.PROC_GRAD_FREQ, this.ProcGradFreq)
    // this.ProcGradInv = paramValue(params.PROC_GRAD_INV, this.ProcGradInv)
    // this.ProcGradPosX = paramValue(params.PROC_GRAD_POS_X, this.ProcGradPosX)
    // this.ProcGradPosY = paramValue(params.PROC_GRAD_POS_Y, this.ProcGradPosY)
    // this.ProcGradPosZ = paramValue(params.PROC_GRAD_POS_Z, this.ProcGradPosZ)
    // this.ProcGradType = paramValue(params.PROC_GRAD_TYPE, this.ProcGradType)
    this.Sdf2dPhaseX = paramValue(params.SDF_2D_PHASE_X, this.Sdf2dPhaseX)
    this.Sdf2dPhaseY = paramValue(params.SDF_2D_PHASE_Y, this.Sdf2dPhaseY)
    this.Sdf2dSpeedX = paramValue(params.SDF_2D_SPEED_X, this.Sdf2dSpeedX)
    this.Sdf2dSpeedY = paramValue(params.SDF_2D_SPEED_Y, this.Sdf2dSpeedY)
    this.Sdf2dStrength = paramValue(params.SDF_2D_STRENGTH, this.Sdf2dStrength)
    this.Sdf2dTileX = paramValue(params.SDF_2D_TILE_X, this.Sdf2dTileX)
    this.Sdf2dTileY = paramValue(params.SDF_2D_TILE_Y, this.Sdf2dTileY)
    this.SinewaveAmp = paramValue(params.SINEWAVE_AMP, this.SinewaveAmp)
    this.SinewaveAxis = paramValue(params.SINEWAVE_AXIS, this.SinewaveAxis)
    this.SinewaveFreq = paramValue(params.SINEWAVE_FREQ, this.SinewaveFreq)
    this.SinewaveNormal = paramValue(params.SINEWAVE_NORMAL, this.SinewaveNormal)
    this.SinewavePhase = paramValue(params.SINEWAVE_PHASE, this.SinewavePhase)
    this.SinewaveSpeed = paramValue(params.SINEWAVE_SPEED, this.SinewaveSpeed)
    this.Source2dPhaseX = paramValue(params.SOURCE_2D_PHASE_X, this.Source2dPhaseX)
    this.Source2dPhaseY = paramValue(params.SOURCE_2D_PHASE_Y, this.Source2dPhaseY)
    this.Source2dSpeedX = paramValue(params.SOURCE_2D_SPEED_X, this.Source2dSpeedX)
    this.Source2dSpeedY = paramValue(params.SOURCE_2D_SPEED_Y, this.Source2dSpeedY)
    this.Source2dTileX = paramValue(params.SOURCE_2D_TILE_X, this.Source2dTileX)
    this.Source2dTileY = paramValue(params.SOURCE_2D_TILE_Y, this.Source2dTileY)
    this.Sssindex = paramValue(params.SSSIndex, this.Sssindex)
    this.StencilInvert = paramValue(params.STENCIL_INVERT, this.StencilInvert)
    this.StencilNormalInfluence = paramValue(params.STENCIL_NORMAL_INFLUENCE, this.StencilNormalInfluence)
    this.StencilOffsetX = paramValue(params.STENCIL_OFFSET_X, this.StencilOffsetX)
    this.StencilOffsetY = paramValue(params.STENCIL_OFFSET_Y, this.StencilOffsetY)
    this.SubSurfaceClarity = paramValue(params.SUB_SURFACE_CLARITY, this.SubSurfaceClarity)
    this.SubSurfaceColor = paramVec4(params.SUB_SURFACE_COLOR, this.SubSurfaceColor)
    this.SubSurfaceDetailBlend = paramValue(params.SUB_SURFACE_DETAIL_BLEND, this.SubSurfaceDetailBlend)
    this.SubSurfaceDetailPow = paramValue(params.SUB_SURFACE_DETAIL_POW, this.SubSurfaceDetailPow)
    this.SubSurfaceDirX = paramValue(params.SUB_SURFACE_DIR_X, this.SubSurfaceDirX)
    this.SubSurfaceDirY = paramValue(params.SUB_SURFACE_DIR_Y, this.SubSurfaceDirY)
    this.SubSurfaceDirZ = paramValue(params.SUB_SURFACE_DIR_Z, this.SubSurfaceDirZ)
    this.SubSurfaceFalloff = paramValue(params.SUB_SURFACE_FALLOFF, this.SubSurfaceFalloff)
    this.SubSurfaceParallax = paramValue(params.SUB_SURFACE_PARALLAX, this.SubSurfaceParallax)
    this.SubSurfaceThreshold = paramValue(params.SUB_SURFACE_THRESHOLD, this.SubSurfaceThreshold)
    this.SubSurfaceTile = paramValue(params.SUB_SURFACE_TILE, this.SubSurfaceTile)
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
    // this.modCustom.update(time)
    // this.UvModCustom = this.modCustom.matrix
  }
  private updateModDetail(time: number) {
    // this.modDetail.update(time)
    // this.UvModDetail = this.modDetail.matrix
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
