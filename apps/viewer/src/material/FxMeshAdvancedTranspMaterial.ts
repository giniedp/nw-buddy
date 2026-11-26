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
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import SCHEMA from './FxMeshAdvancedTranspMaterial.meta'
import WGSL from './FxMeshAdvancedTranspMaterial.wgsl'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier, type TexMod } from './TexMod'
import { MtlFlag } from './types'
import { MtlUtil, paramValue, paramVec4 } from './utils'

export function fxMeshAdvancedTranspShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'FX Mesh Advanced Transparent Shader',
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function fxMeshAdvancedTranspEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'FX Mesh Advanced Transparent Effect',
    meta: {},
    program: {
      shader: fxMeshAdvancedTranspShaderOptions(constants),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
      perInstanceDataBlock: 'instanceData',
    },
  }
}

type PublicParams = {
  COMPLEX_COL_TILE: string //       | number
  FadeOutEnd: string //             | number
  FadeOutStart: string //           | number
  FRESNEL_EXPONENT: string //       | number
  FRESNEL_IN_FALLOFF: string //     | number
  FRESNEL_IN_SDF_INF: string //     | number
  FRESNEL_IN_STRENGTH: string //    | number
  FRESNEL_INVERT: string //         | number
  FRESNEL_OUT_FALLOFF: string //    | number
  FRESNEL_OUT_SDF_INF: string //    | number
  FRESNEL_OUT_STRENGTH: string //   | number
  FRESNEL_SDF_INFLUENCE: string //  | number
  FRESNEL_SDF_MAP_EXP: string //    | number
  FRESNEL_SDF_MAP_MIX: string //    | number
  FRESNEL_STRENGTH: string //       | number
  GlobalAlphaFalloff: string //     | number
  GlobalAlphaFill: string //        | number
  GlobalAlphaFromSource: string //  | number
  GlobalAlphaStrength: string //    | number
  GlobalColorFalloff: string //     | number
  INTERSECT_FADE_DIST: string //    | number
  INTERSECT_FADE_FALLOFF: string // | number
  INTERSECT_FADE_INV: string //     | number
  INTERSECT_GLOW_DIST: string //    | number
  INTERSECT_GLOW_FALLOFF: string // | number
  INTERSECT_GLOW_INV: string //     | number
  PALETTE_FALLOFF: string //        | number
  PALETTE_PHASE: string //          | number
  PALETTE_SDF_INF: string //        | number
  PALETTE_SOURCE_BLEND: string //   | number
  PALETTE_SPEED: string //          | number
  PROC_GRAD_FREQ: string //         | number
  PROC_GRAD_INV: string //          | number
  PROC_GRAD_POS_X: string //        | number
  PROC_GRAD_POS_Y: string //        | number
  PROC_GRAD_POS_Z: string //        | number
  PROC_GRAD_TYPE: string //         | number
  SDF_2D_PHASE_X: string //         | number
  SDF_2D_PHASE_Y: string //         | number
  SDF_2D_SPEED_X: string //         | number
  SDF_2D_SPEED_Y: string //         | number
  SDF_2D_STRENGTH: string //        | number
  SDF_2D_TILE_X: string //          | number
  SDF_2D_TILE_Y: string //          | number
  SINEWAVE_AMP: string //           | number
  SINEWAVE_AXIS: string //          | number
  SINEWAVE_FREQ: string //          | number
  SINEWAVE_NORMAL: string //        | number
  SINEWAVE_PHASE: string //         | number
  SINEWAVE_SPEED: string //         | number
  SOURCE_2D_PHASE_X: string //      | number
  SOURCE_2D_PHASE_Y: string //      | number
  SOURCE_2D_SPEED_X: string //      | number
  SOURCE_2D_SPEED_Y: string //      | number
  SOURCE_2D_TILE_X: string //       | number
  SOURCE_2D_TILE_Y: string //       | number
}

const util = new MtlUtil('FxMeshAdvancedTransp', {
  knowsDeform: true,
  knownMaps: ['Specular', 'Detail', 'Heightmap', 'Custom'],
  knownMods: ['Diffuse'],
  knownFlags: [
    'USE_SDF_2D',
    'VERTCOLORS',
    'USE_PALETTE_MAP',
    'USE_INTERSECTION_FADE',
    'USE_OUTSIDE_FRESNEL_ALPHA',
    'USE_GLOW_FRESNEL',
    'USE_PROC_GRADS',
    'USE_COMPLEX_COL',
    'USE_INSIDE_FRESNEL_ALPHA',
    'USE_COMPLEX_COL_OVERLAY',
    'USE_INTERSECTION_GLOW',
    'VERT_DEFORM_SINWAVE',
    'USE_COMPLEX_COL_DODGE',
    'ENABLE_FADEOUT',
  ],
})
export class FxMeshAdvancedTranspMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    this.name = 'FX Mesh Advanced Transparent Material'
    this.meta = options

    const { attrs, params, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = util.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, fxMeshAdvancedTranspEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.CullBack
    this.effect.blendState = BlendState.Additive
    this.isTransparent = true
    // a two sided material overrides the cull mode of the technique (D3DFXPipeline: MTL_FLAG_2SIDED, RBSI_LOCKCULL)
    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      this.effect.cullState = CullState.None
    }

    this.layer = MaterialLayerMasks.FxMeshAdvanced
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)

    this.DeformWave0 = deformWave0
    this.DeformWave1 = deformWave1
  }

  private setDefaults() {
    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap
    this.SamplerSource = SamplerState.LinearWrap

    this.DiffuseColor = vec4(1)
    this.EmissiveColor = vec4(0)

    this.AnimAmplitudeWav0 = 0.0
    this.AnimAmplitudeWav2 = 0.0
    this.AnimFrequency = 0.0
    this.AnimPhase = 1.0
    // this.BendDetailBranchAmplitude = -
    this.BendDetailFrequency = 1.0
    this.BendDetailLeafAmplitude = 0.2
    this.ComplexColTile = 1.0
    this.DepthFixupThreshold = 0.05
    this.FadeOutEnd = 0.75
    this.FadeOutStart = 0.1
    this.FresnelExponent = 1.0
    this.FresnelInFalloff = 1.0
    this.FresnelInSdfInf = 0.0
    this.FresnelInStrength = 1.0
    this.FresnelInvert = 1.0
    this.FresnelOutFalloff = 1.0
    this.FresnelOutSdfInf = 0.0
    this.FresnelOutStrength = 1.0
    this.FresnelSdfInfluence = 0.0
    this.FresnelSdfMapExp = 1.0
    this.FresnelSdfMapMix = 0.0
    this.FresnelStrength = 1.0
    this.GlobalAlphaFalloff = 1.0
    this.GlobalAlphaFill = 1.0
    this.GlobalAlphaFromSource = 0.0
    this.GlobalAlphaStrength = 1.0
    this.GlobalColorFalloff = 1.0
    this.IntersectFadeDist = 2.0
    this.IntersectFadeFalloff = 1.0
    this.IntersectFadeInv = 0.0
    this.IntersectGlowDist = 2.0
    this.IntersectGlowFalloff = 1.0
    this.IntersectGlowInv = 0.0
    this.PaletteFalloff = 1.0
    this.PalettePhase = 0.0
    this.PaletteSdfInf = 0.0
    this.PaletteSourceBlend = 0.0
    this.PaletteSpeed = 1.0
    this.ProcGradFreq = 1.0
    this.ProcGradInv = 0.0
    this.ProcGradPosX = 0.0
    this.ProcGradPosY = 0.0
    this.ProcGradPosZ = 0.0
    this.ProcGradType = 0.0
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
      // this.EnabledSpecularMap = TRUE
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
    // - DiffuseMap2
    if (maps.Custom) {
      this.DiffuseMap2 = maps.Custom as any
    }

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    if (maps['[1] Custom']) {
      this.NormalMap2 = maps['[1] Custom'] as any
    }

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
    // _ModifyUV_1 uses the modifier of the first texture of the shader, $CustomMap (the source map) in fxmeshadvancedtransp.
    // It moves baseTC, so the SDF lookup moves along like in the original.
    if (!this.modDiffuse && TextureModifier.isModified(mods.Custom)) {
      // only the animated rotation of the source map applies, its static tiling, offset, rotation and oscillators would
      // move a single sprite (triangle_sdf of the oneway portal) off the plane
      this.modDiffuse = new TextureModifier(rotationOnly(mods.Custom))
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
      // a rotated single sprite (rings, glyphs, triangle) must not pull in the neighbor tiles outside of 0..1
      if (mods.Custom.TexMod_RotateType) {
        this.SamplerSource = SamplerState.LinearClamp
      }
    }
    // if (TextureModifier.isModified(mods.Heightmap)) {
    //   this.modDiffuse = new TextureModifier(mods.Heightmap)
    //   this.EnabledUvModDiffuse = TRUE
    //   this.updateModDiffuse(0)
    // }
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    // this.SpecularColor = paramColor(attrs.Specular, vec4.One)

    this.EmissiveColor = paramVec4(attrs.Emissive)
    this.EmissiveColor = paramVec4(attrs.Emittance)

    if (attrs.AlphaTest < 1) {
      //
    }

    if (attrs.Opacity < 1) {
      //
    }

    if (attrs.Shininess) {
      //
    }
  }

  private setPublicParams(params: PublicParams) {
    //  this.AnimAmplitudeWav0 = paramValue(params.AnimAmplitudeWav0, this.AnimAmplitudeWav0)
    //  this.AnimAmplitudeWav2 = paramValue(params.AnimAmplitudeWav2, this.AnimAmplitudeWav2)
    //  this.AnimFrequency = paramValue(params.AnimFrequency, this.AnimFrequency)
    //  this.AnimPhase = paramValue(params.AnimPhase, this.AnimPhase)
    //  this.BendDetailBranchAmplitude = paramValue(params.bendDetailBranchAmplitude, this.BendDetailBranchAmplitude)
    //  this.BendDetailFrequency = paramValue(params.bendDetailFrequency, this.BendDetailFrequency)
    //  this.BendDetailLeafAmplitude = paramValue(params.bendDetailLeafAmplitude, this.BendDetailLeafAmplitude)
    this.ComplexColTile = paramValue(params.COMPLEX_COL_TILE, this.ComplexColTile)
    //  this.DepthFixupThreshold = paramValue(params.DepthFixupThreshold, this.DepthFixupThreshold)
    this.FadeOutEnd = paramValue(params.FadeOutEnd, this.FadeOutEnd)
    this.FadeOutStart = paramValue(params.FadeOutStart, this.FadeOutStart)
    this.FresnelExponent = paramValue(params.FRESNEL_EXPONENT, this.FresnelExponent)
    this.FresnelInFalloff = paramValue(params.FRESNEL_IN_FALLOFF, this.FresnelInFalloff)
    this.FresnelInSdfInf = paramValue(params.FRESNEL_IN_SDF_INF, this.FresnelInSdfInf)
    this.FresnelInStrength = paramValue(params.FRESNEL_IN_STRENGTH, this.FresnelInStrength)
    this.FresnelInvert = paramValue(params.FRESNEL_INVERT, this.FresnelInvert)
    this.FresnelOutFalloff = paramValue(params.FRESNEL_OUT_FALLOFF, this.FresnelOutFalloff)
    this.FresnelOutSdfInf = paramValue(params.FRESNEL_OUT_SDF_INF, this.FresnelOutSdfInf)
    this.FresnelOutStrength = paramValue(params.FRESNEL_OUT_STRENGTH, this.FresnelOutStrength)
    this.FresnelSdfInfluence = paramValue(params.FRESNEL_SDF_INFLUENCE, this.FresnelSdfInfluence)
    this.FresnelSdfMapExp = paramValue(params.FRESNEL_SDF_MAP_EXP, this.FresnelSdfMapExp)
    this.FresnelSdfMapMix = paramValue(params.FRESNEL_SDF_MAP_MIX, this.FresnelSdfMapMix)
    this.FresnelStrength = paramValue(params.FRESNEL_STRENGTH, this.FresnelStrength)
    this.GlobalAlphaFalloff = paramValue(params.GlobalAlphaFalloff, this.GlobalAlphaFalloff)
    this.GlobalAlphaFill = paramValue(params.GlobalAlphaFill, this.GlobalAlphaFill)
    this.GlobalAlphaFromSource = paramValue(params.GlobalAlphaFromSource, this.GlobalAlphaFromSource)
    this.GlobalAlphaStrength = paramValue(params.GlobalAlphaStrength, this.GlobalAlphaStrength)
    this.GlobalColorFalloff = paramValue(params.GlobalColorFalloff, this.GlobalColorFalloff)
    this.IntersectFadeDist = paramValue(params.INTERSECT_FADE_DIST, this.IntersectFadeDist)
    this.IntersectFadeFalloff = paramValue(params.INTERSECT_FADE_FALLOFF, this.IntersectFadeFalloff)
    this.IntersectFadeInv = paramValue(params.INTERSECT_FADE_INV, this.IntersectFadeInv)
    this.IntersectGlowDist = paramValue(params.INTERSECT_GLOW_DIST, this.IntersectGlowDist)
    this.IntersectGlowFalloff = paramValue(params.INTERSECT_GLOW_FALLOFF, this.IntersectGlowFalloff)
    this.IntersectGlowInv = paramValue(params.INTERSECT_GLOW_INV, this.IntersectGlowInv)
    this.PaletteFalloff = paramValue(params.PALETTE_FALLOFF, this.PaletteFalloff)
    this.PalettePhase = paramValue(params.PALETTE_PHASE, this.PalettePhase)
    this.PaletteSdfInf = paramValue(params.PALETTE_SDF_INF, this.PaletteSdfInf)
    this.PaletteSourceBlend = paramValue(params.PALETTE_SOURCE_BLEND, this.PaletteSourceBlend)
    this.PaletteSpeed = paramValue(params.PALETTE_SPEED, this.PaletteSpeed)
    this.ProcGradFreq = paramValue(params.PROC_GRAD_FREQ, this.ProcGradFreq)
    this.ProcGradInv = paramValue(params.PROC_GRAD_INV, this.ProcGradInv)
    this.ProcGradPosX = paramValue(params.PROC_GRAD_POS_X, this.ProcGradPosX)
    this.ProcGradPosY = paramValue(params.PROC_GRAD_POS_Y, this.ProcGradPosY)
    this.ProcGradPosZ = paramValue(params.PROC_GRAD_POS_Z, this.ProcGradPosZ)
    this.ProcGradType = paramValue(params.PROC_GRAD_TYPE, this.ProcGradType)
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

/**
 * The animated rotation part of a texture modifier, without tiling, offsets, static rotation and oscillators
 */
function rotationOnly(mod: TexMod): TexMod {
  const result: TexMod = {}
  for (const key in mod) {
    if (/^TexMod_(RotateType|[UVW]Rotate(Center|Rate|Phase|Amplitude))$/.test(key)) {
      ;(result as any)[key] = (mod as any)[key]
    }
  }
  return result
}
