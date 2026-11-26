import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  type EffectOptions,
  type MaterialOptions,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  ShaderConstants,
  type ShaderModuleOptions,
  TRUE,
} from '@gglib/graphics'
import { mat4Identity, vec2, vec4 } from '@gglib/math'
import { IMPOSTOR_FADE_RANGE, IMPOSTOR_VISIBILITY_START } from '../constants'
import { type NwMaterialProps } from './GltfExtension'
import SCHEMA from './IllumMaterial.meta'
import WGSL from './IllumMaterial.wgsl'
import PROJECTED_DECAL_WGSL from './IllumProjectedDecal.wgsl'
import { TextureModifier } from './TexMod'
import {
  createDebugEffect,
  createEmissiveEffect,
  type FeatureFlag,
  getShaderConstants,
  hasEmittance,
  InputBlocks,
  MaterialLayerMasks,
  NwRenderVariant,
  setDitherFadeConstants,
} from './common'

import type { MaterialParams, ParamsMaterial } from './appearance'
import { MtlFlag } from './types'
import {
  getFlatNormalTexture,
  getGrayTexture,
  getWhiteTexture,
  MtlUtil,
  normalMapEncoding,
  paramValue,
  paramVec3,
  paramVec4,
} from './utils'

/**
 * Fragment entry points of the Illum shader per render variant
 */
const ILLUM_FRAGMENT_ENTRY = {
  forward: 'fs_main',
  gbuffer: 'fs_gbuffer',
  gbufferDecal: 'fs_gbuffer_decal',
  emissive: 'fs_emissive',
  debug: 'fs_debug',
} as const

export function illumShaderOptions(
  constants: Record<string, number>,
  fragmentEntry: string = ILLUM_FRAGMENT_ENTRY.forward,
): ShaderModuleOptions {
  return {
    name: `Illum Shader (${fragmentEntry})`,
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
      fragmentEntry,
    },
    glsl: null,
  }
}

export function illumEffectOptions(constants: Record<string, number>, fragmentEntry?: string): EffectOptions {
  return {
    name: 'Illum Effect',
    meta: {},
    program: {
      shader: illumShaderOptions(constants, fragmentEntry),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
      perInstanceDataBlock: 'instanceData',
    },
  }
}

/**
 * Fragment entry points of the projected decal shader (IllumProjectedDecal.wgsl.ts)
 */
const PROJECTED_DECAL_FRAGMENT_ENTRY = {
  gbuffer: 'fs_decal',
  emissive: 'fs_decal_emissive',
} as const

/**
 * Effect of a projected decal box (DecalComponent) with the material block of the Illum shader
 */
function projectedDecalEffectOptions(constants: Record<string, number>, fragmentEntry: string): EffectOptions {
  return {
    name: 'Illum Projected Decal Effect',
    meta: {},
    program: {
      shader: {
        name: `Illum Projected Decal Shader (${fragmentEntry})`,
        wgsl: {
          source: PROJECTED_DECAL_WGSL,
          fragmentConstants: ShaderConstants.get(constants),
          vertexConstants: ShaderConstants.get(constants),
          vertexEntry: 'vs_decal',
          fragmentEntry,
        },
        glsl: null,
      },
      sharedBlocks: [InputBlocks.Global, InputBlocks.View],
      perInstanceTransformBlock: 'object',
      perInstanceDataBlock: 'instanceData',
    },
  }
}

interface PublicParams {
  BackDiffuseMultiplier: string //      | number | 1361  |
  BlendFactor: string //                | number | 27121 |
  BlendFalloff: string //               | number | 27121 |
  BlendLayer2Diffuse: string //         | vec3   | 27100 |
  BlendLayer2Smoothness: string //      | number | 27099 |
  BlendLayer2Specular: string //        | number | 27121 |
  BlendLayer2Tiling: string //          | number | 27121 |
  BlendMaskTiling: string //            | number | 27121 |
  ColorMaskAlphaInf: string //          | number | 4445  |
  ColorMaskOverride: string //          | number | 4445  |
  ColorMaskStrength: string //          | number | 4445  |
  DecalAlphaMult: string //             | number | 1597  |
  DecalDiffuseOpacity: string //        | number | 1597  |
  DecalFalloff: string //               | number | 1597  |
  DepthFixupThreshold: string //        | number | 19    |
  DetailBumpScale: string //            | number | 26130 |
  DetailDiffuseScale: string //         | number | 26130 |
  DetailGlossScale: string //           | number | 26130 |
  DissolveColor: string //              | vec4   | 1208  |
  DissolveEdgeThickness: string //      | number | 1208  |
  DissolvePercentage: string //         | number | 1208  |
  EmittanceMapGamma: string //          | number | 81849 |
  FresnelBias: string //                | number | 22    |
  FresnelPower: string //               | number | 10    |
  FresnelScale: string //               | number | 22    |
  GlossFromDiffuseAmount: string //     | number | 22    |
  GlossFromDiffuseBrightness: string // | number | 22    |
  GlossFromDiffuseContrast: string //   | number | 22    |
  GlossFromDiffuseOffset: string //     | number | 22    |
  HeightBias: string //                 | number | 8591  |
  IndirectColor: string //              | vec3   | 90411 |
  Mask_A_Color: string //               | vec3   | 260   |
  Mask_A_Gloss: string //               | number | 9904  |
  Mask_A_GlossShift: string //          | number | 9527  |
  Mask_A_SpecColor_Override: string //  | number | 9398  |
  Mask_A_SpecColor: string //           | vec4   | 9644  |
  Mask_A_SpecColorOverride: string //   | number | 246   |
  Mask_A: string //                     | number | 117   |
  Mask_B_Color: string //               | vec3   | 9904  |
  Mask_B_Override: string //            | number | 9644  |
  Mask_B: string //                     | number | 9644  |
  Mask_G_Color: string //               | vec3   | 9904  |
  Mask_G_Override: string //            | number | 9644  |
  Mask_G: string //                     | number | 9644  |
  Mask_R_Color: string //               | vec3   | 9904  |
  Mask_R_Override: string //            | number | 9644  |
  Mask_R: string //                     | number | 9644  |
  NormalViewDependency: string //       | number | 1347  |
  ObmDisplacement: string //            | number | 2485  |
  PomDisplacement: string //            | number | 8381  |
  Rim_Blend_Center_Alpha: string //     | number | 2     |
  Rim_Blend_Center_Color: string //     | vec4   | 2     |
  Rim_Blend_Color_Blend: string //      | number | 2     |
  Rim_Blend_Fill_Alpha: string //       | number | 2     |
  Rim_Blend_Fill_Color: string //       | vec4   | 2     |
  Rim_Blend_Fill_Width: string //       | number | 2     |
  Rim_Blend_Major_Alpha: string //      | number | 2     |
  Rim_Blend_Major_Color: string //      | vec4   | 2     |
  Rim_Blend_Major_Width: string //      | number | 2     |
  Rim_Blend_Smoothness: string //       | number | 2     |
  Rim_Center_Color: string //           | vec4   | 515   |
  Rim_Center_Intensity: string //       | number | 515   |
  Rim_Color_Blend: string //            | number | 515   |
  Rim_Fill_Color: string //             | vec4   | 515   |
  Rim_Fill_Intensity: string //         | number | 515   |
  Rim_Fill_Width: string //             | number | 515   |
  Rim_Major_Color: string //            | vec4   | 515   |
  Rim_Major_Intensity: string //        | number | 515   |
  Rim_Major_Width: string //            | number | 515   |
  Rim_Smoothness: string //             | number | 515   |
  RoughnessBoost: string //             | number | 2362  |
  RoughnessMaxFootprint: string //      | number | 2362  |
  SelfShadowStrength: string //         | number | 8591  |
  SSSIndex: string //                   | number | 88792 |
  SSSSpecularCutoff: string //          | number | 531   |
  TessellationDispBias: string //       | number | 42    |
  TessellationFaceCull: string //       | number | 45    |
  TessellationFactor: string //         | number | 45    |
  TessellationFactorMax: string //      | number | 45    |
  TessellationFactorMin: string //      | number | 45    |
  TessellationHeightScale: string //    | number | 42    |
  TransmittanceColor: string //         | vec4   | 1347  |
  // not public params: CryEngine's material params of the Emittance (MaterialHelpers.cpp), e.g. of an appearance row
  emissive_color?: string
  emissive_intensity?: string
}

const illum = new MtlUtil('Illum', {
  knowsDeform: true,
  knownMaps: [
    '[1] Custom',
    'Bumpmap',
    'Custom',
    'Decal',
    'Detail',
    'Diffuse',
    'Emittance',
    'Heightmap',
    'Occlusion',
    'Opacity',
    'SecondSmoothness',
    'Smoothness',
    'Specular',
    'Specular2',
  ],
  knownMods: ['Diffuse', 'Custom', 'Decal', 'Detail', 'Emittance'],
  knownFlags: [
    'BLENDLAYER',
    'COLOR_SAMPLER_OVERLAY_MASK',
    'DECAL',
    'FX_DISSOLVE',
    'RIM_DIFFUSE_LIGHTING',
    'RIM_SPEC_LIGHTING',
    'DETAIL_MAPPING',
    'EMISSIVE_DECAL',
    'EMITTANCE_MAP',
    'NORMAL_MAP',
    'OCCLUSION_MAP',
    'OFFSET_BUMP_MAPPING',
    'OVERLAY_MASK',
    'PARALLAX_OCCLUSION_MAPPING',
    'SAA_FILTERING',
    'ALLOW_SPECULAR_ANTIALIASING',
    'SPECULAR_MAP',
    'TRANSMITTANCE',
    'VERTCOLORS',
  ],
})

/**
 * Color write mask of the decal targets: RGB, the .w channels of the surface below are kept (game: color mask RGB)
 */
const DECAL_WRITE_MASK = GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE

export class IllumMaterial extends MaterialWithSchema(SCHEMA) implements ParamsMaterial {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modCustom: TextureModifier | null
  declare private modDetail: TextureModifier | null
  declare private modEmittance: TextureModifier | null
  declare private modDecalEmissive: TextureModifier | null
  // shader constants of the feature flags, for effects created on demand (ensureProjectedDecalEffects)
  declare private shaderConstants: Record<string, number>
  // %RIM_DIFFUSE_LIGHTING or %RIM_SPEC_LIGHTING after the flag validation
  declare private hasRimLighting: boolean

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Illum Material',
      effect: null,
      meta: options,
    })

    const { params, attrs, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = illum.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`

    // #if %BLENDLAYER
    //   #if %DIRTLAYER
    //     #undefine %DIRTLAYER
    //   #endif
    //   #if %DECAL
    //     #undefine %DECAL
    //   #endif
    //   #if %RIM_DIFFUSE_LIGHTING
    //     #undefine %RIM_DIFFUSE_LIGHTING
    //   #endif
    //   #if %RIM_SPEC_LIGHTING
    //     #undefine %RIM_SPEC_LIGHTING
    //   #endif
    //   #if %RIM_BLEND
    //     #undefine %RIM_BLEND
    //   #endif
    //   #if %OVERLAY_MASK
    //     #undefine %OVERLAY_MASK
    //   #endif
    //   #if %COLOR_SAMPLER_OVERLAY_MASK
    //     #undefine %COLOR_SAMPLER_OVERLAY_MASK
    //   #endif
    // #endif
    if (shaderFlags.has('BLENDLAYER')) {
      shaderFlags.delete('DIRTLAYER')
      shaderFlags.delete('DECAL')
      shaderFlags.delete('RIM_DIFFUSE_LIGHTING')
      shaderFlags.delete('RIM_SPEC_LIGHTING')
      shaderFlags.delete('RIM_BLEND')
      shaderFlags.delete('OVERLAY_MASK')
      shaderFlags.delete('COLOR_SAMPLER_OVERLAY_MASK')
    }

    // %SPECULAR_MAP follows the bound Specular texture, not the authored flag (Illum.ext DependencySet/DependencyReset
    // = $TEX_Specular, applied by CShaderMan::mfModifyGenFlags). Legacy materials name it %SPEC_MAP, which is dropped.
    if (texMaps.Specular) {
      shaderFlags.add('SPECULAR_MAP')
    } else {
      shaderFlags.delete('SPECULAR_MAP')
    }

    // #if %DECAL
    //   #if %SUBSURFACE_SCATTERING
    //     #undefine %SUBSURFACE_SCATTERING
    //   #endif
    // #endif
    if (shaderFlags.has('DECAL')) {
      shaderFlags.delete('SUBSURFACE_SCATTERING')
    }

    // #if %NORMAL_MAP && %DETAIL_MAPPING && %FX_DISSOLVE && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING && %ALLOW_SPECULAR_ANTIALIASING && %TRANSMITTANCE
    // 	#undefine %TRANSMITTANCE
    // #endif
    // #if %NORMAL_MAP && %SPECULAR_MAP && %DETAIL_MAPPING && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING
    // 	#undefine %DETAIL_MAPPING
    // #endif
    // #if %NORMAL_MAP && %DETAIL_MAPPING && %BLENDLAYER && %EMITTANCE_MAP && %SUBSURFACE_SCATTERING && %ALLOW_SPECULAR_ANTIALIASING && %TRANSMITTANCE
    // 	#undefine %TRANSMITTANCE
    // #endif

    // SAA_FILTERING is a runtime flag of the engine (r_SpecularAntialiasing), materials opt in with ALLOW_SPECULAR_ANTIALIASING
    // see illumvalidations.cfi
    if (shaderFlags.has('ALLOW_SPECULAR_ANTIALIASING')) {
      shaderFlags.add('SAA_FILTERING')
    } else {
      shaderFlags.delete('SAA_FILTERING')
    }

    const shaderConst = getShaderConstants(shaderFlags)
    this.shaderConstants = shaderConst
    if (shaderFlags.has('IS_POI_IMPOSTOR')) {
      setDitherFadeConstants(shaderConst, {
        mode: 'in',
        start: IMPOSTOR_VISIBILITY_START,
        end: IMPOSTOR_VISIBILITY_START + IMPOSTOR_FADE_RANGE,
      })
    }

    this.setEffect(RenderVariant.Forward, new Effect(this.device, illumEffectOptions(shaderConst)))
    this.effect.cullState = CullState.CullBack
    this.effect.blendState = BlendState.Opaque
    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      this.effect.cullState = CullState.None
    }

    this.layer = MaterialLayerMasks.Illum
    this.hasRimLighting = shaderFlags.has('RIM_DIFFUSE_LIGHTING') || shaderFlags.has('RIM_SPEC_LIGHTING')
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
    this.DeformWave0 = deformWave0
    this.DeformWave1 = deformWave1

    if (shaderFlags.has('DECAL')) {
      // %DECAL: blended into the GBuffer by the MeshDecalPass, like the game's ZPass decal list (plan 7.5):
      // one SRC_ALPHA / INV_SRC_ALPHA blend on A, B and C, color mask RGB, depth test without write, the depth offset is
      // in the vertex shader (DECAL_Z_*). The forward effect is not listed (the item is opaque and has a GBuffer effect).
      const decal = new Effect(this.device, {
        ...illumEffectOptions(shaderConst, ILLUM_FRAGMENT_ENTRY.gbufferDecal),
        renderBlends: [BlendState.Alpha, BlendState.Alpha, BlendState.Alpha],
        renderMasks: [DECAL_WRITE_MASK, DECAL_WRITE_MASK, DECAL_WRITE_MASK],
      })
      decal.cullState = this.effect.cullState
      decal.depthState = DepthState.GreaterEqualNoWrite
      this.setEffect(RenderVariant.GBuffer, decal)
      this.isTransparent = false
      this.layer = MaterialLayerMasks.MeshDecal
    } else if (!this.isTransparent && this.EnabledAlphaBlend !== TRUE) {
      // opaque surfaces also write the gbuffer, blended surfaces stay forward
      const gbuffer = new Effect(this.device, illumEffectOptions(shaderConst, ILLUM_FRAGMENT_ENTRY.gbuffer))
      gbuffer.cullState = this.effect.cullState
      gbuffer.blendState = BlendState.Opaque
      this.setEffect(RenderVariant.GBuffer, gbuffer)
      this.setEffect(
        NwRenderVariant.Debug,
        createDebugEffect(this.device, illumEffectOptions(shaderConst, ILLUM_FRAGMENT_ENTRY.debug), gbuffer),
      )
      // rim lighting is added to the emittance in the game's additive glow pass
      if (hasEmittance(this.EmissiveColor) || this.hasRimLighting) {
        this.setEffect(
          NwRenderVariant.Emissive,
          createEmissiveEffect(this.device, illumEffectOptions(shaderConst, ILLUM_FRAGMENT_ENTRY.emissive), gbuffer),
        )
      }
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_ADDITIVE) {
      // never seen
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_NODRAW) {
      this.noRender = true
    }

    if (!(attrs.MtlFlags & MtlFlag.MTL_FLAG_NOSHADOW) && !attrs.Opacity) {
      // shadow proxy
      // https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/21268752
      this.noRender = true
    }
  }

  /**
   * Registers the effects of a projected decal box (DecalComponent, plan 7.7) on first use. The game's deferred decal
   * pass takes any material, not only %DECAL ones (e.g. the ruin destruction decals are plain Illum materials), so
   * they are created on demand instead of for every Illum material.
   *
   * - {@link NwRenderVariant.ProjectedDecal}: blended into the GBuffer by the DecalPass with the per target alpha of
   *   the mesh decals, stencil tested on the decal receivers by the pass
   * - {@link NwRenderVariant.ProjectedDecalEmissive}: with emittance, ONE / ONE onto the lit color
   *   (FX_DeferredDecalsEmissive, no stencil test)
   *
   * Back faces with a reversed-z less-equal test: the scene lies in front of the far side of the box, also with the
   * camera inside the box (the game draws front faces and switches to back faces with GREATER when the near plane
   * cuts the box).
   */
  public ensureProjectedDecalEffects() {
    if (this.getEffect(NwRenderVariant.ProjectedDecal)) {
      return
    }
    const projected = new Effect(this.device, {
      ...projectedDecalEffectOptions(this.shaderConstants, PROJECTED_DECAL_FRAGMENT_ENTRY.gbuffer),
      renderBlends: [BlendState.Alpha, BlendState.Alpha, BlendState.Alpha],
      renderMasks: [DECAL_WRITE_MASK, DECAL_WRITE_MASK, DECAL_WRITE_MASK],
    })
    projected.cullState = CullState.CullFront
    projected.depthState = DepthState.LessEqualNoWrite
    this.setEffect(NwRenderVariant.ProjectedDecal, projected)
    if (hasEmittance(this.EmissiveColor)) {
      const emissive = new Effect(
        this.device,
        projectedDecalEffectOptions(this.shaderConstants, PROJECTED_DECAL_FRAGMENT_ENTRY.emissive),
      )
      emissive.cullState = CullState.CullFront
      emissive.depthState = DepthState.LessEqualNoWrite
      emissive.blendState = BlendState.AdditivePure
      this.setEffect(NwRenderVariant.ProjectedDecalEmissive, emissive)
    }
  }

  private setDefaults() {
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SpecularColor = vec4(1, 1, 1, 1)
    this.EmissiveColor = vec4()
    this.DetailTiling = vec2(1, 1)

    this.EmittanceMapGamma = 1.0
    this.ObmDisplacement = 0.004
    this.DepthFixupThreshold = 0.05
    this.PomDisplacement = 0.025

    this.HeightBias = 1.0
    this.SelfShadowStrength = 3.0

    this.DetailBumpScale = 0.5
    this.DetailDiffuseScale = 0.5
    this.DetailGlossScale = 0.5
    this.BackDiffuseMultiplier = 1.0

    this.SssIndex = 0
    this.DecalFalloff = 1.0
    this.DecalAlphaMult = 1.0
    this.DecalDiffuseOpacity = 1.0

    this.SssSpecularCutoff = 1.0
    this.NormalViewDependency = 0.0

    this.TransmittanceColor = vec4(1, 1, 0.6, 1.0)
    this.RoughnessBoost = 2.0
    this.RoughnessMaxFootprint = 0.3
    this.DissolvePercentage = 0
    this.DissolveEdgeThickness = 0
    this.DissolveColor = vec4(1, 1, 1, 1)

    this.BlendMaskTiling = 1.0
    this.BlendFactor = 8.0
    this.BlendLayer2Tiling = 1.0
    this.BlendFalloff = 32
    this.BlendLayer2Smoothness = 10
    this.BlendLayer2Specular = vec4(0.23, 0.23, 0.23, 0)
    this.BlendLayer2Diffuse = vec4(1, 1, 1, 1)

    this.RimMajorColor = vec4(1, 1, 1, 1)
    this.RimMajorIntensity = 1
    this.RimMajorWidth = 1
    this.RimFillIntensity = 0.4
    this.RimFillWidth = 1
    this.RimFillColor = vec4(1, 1, 1, 1)
    this.RimSmoothness = 1
    this.RimColorBlend = 0.1
    this.RimCenterColor = vec4(1, 1, 1, 1)
    this.RimCenterIntensity = 0

    this.UvModDiffuse = mat4Identity()
    this.UvModCustom = mat4Identity()
    this.UvModDetail = mat4Identity()
    this.UvModEmittance = mat4Identity()
    this.UvModDecalEmissive = mat4Identity()

    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap
  }

  /**
   * Binds the texture maps. Unset slots get the neutral texture of the engine (TextureManager.cpp texSlotSemantics),
   * the device default texture is a checker pattern that would show up in the shading.
   *
   * Textures sample in the format of their DDS file like in the game: an sRGB tagged file is created in its sRGB
   * format (Lumberyard D3DTexture.cpp, m_bIsSRGB), the shader's sRGBLookup only picks a view of typeless textures
   * (FT_USAGE_ALLOWREADSRGB, render targets)
   */
  private setTextures(maps: NwMaterialProps['textures']) {
    maps ||= {}
    const white = getWhiteTexture(this.device)
    const gray = getGrayTexture(this.device)
    const flatNormal = getFlatNormalTexture(this.device)

    // == EFTT_DIFFUSE
    // - diffuseMap
    // - diffuseMap_Decal
    this.DiffuseMap = (maps.Diffuse as any) || white

    // == EFTT_NORMALS
    // - normalMap
    this.NormalMap = (maps.Bumpmap as any) || flatNormal

    // == EFTT_SPECULAR
    // - specularMap
    this.SpecularMap = (maps.Specular as any) || white

    // == EFTT_ENV
    // - envMap
    if (maps.Environment) {
      // TODO:
    }

    // == EFTT_DETAIL_OVERLAY
    // - detailMap
    this.DetailMap = (maps.Detail as any) || gray

    // == EFTT_SECOND_SMOOTHNESS
    // - translucencyMap
    this.TranslucencyMap = (maps.SecondSmoothness as any) || white

    // == EFTT_HEIGHT
    // - heightMap
    this.HeightMap = (maps.Heightmap as any) || white

    // == EFTT_DECAL_OVERLAY
    // - decalMap
    // - emissiveIntensity
    // engine default of the slot is gray (TextureManager.cpp), the emissive intensity then is 0.5
    this.DecalEmissiveMap = (maps.Decal as any) || gray

    // == EFTT_SUBSURFACE
    // - subsurfaceMap
    // - HeightMap2
    this.SubsurfaceMap = (maps.SubSurface as any) || white

    // == EFTT_CUSTOM
    // - DiffuseMap2 (BLENDLAYER)
    // - MaskTex (OVERLAY_MASK / COLOR_SAMPLER_OVERLAY_MASK, CharacterMasking.cfi)
    this.DiffuseMap2 = (maps.Custom as any) || white

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    // - RimMapTex (.r), engine default FlatBump: EngineAssets/Textures/White_ddn.dds is BC5_SNORM, its red samples at
    //   most 1/127, so a rim material without a rim map has practically no rim (the viewer's flat normal, .r = 0)
    this.NormalMap2 = (maps['[1] Custom'] as any) || flatNormal
    this.NormalMapEncoding = normalMapEncoding(maps.Bumpmap, maps['[1] Custom'])

    // == EFTT_OPACITY
    // - opacityMap
    // - BlendMap
    // - DecalOpacityMap
    if (maps.Opacity) {
      this.OpacityMap = maps.Opacity as any
    } else {
      // DecalOpacityMap defaults to white, the decal alpha then comes from the diffuse alpha (and vertex alpha)
      this.OpacityMap = getWhiteTexture(this.device)
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
    } else {
      // engine default of the slot is white (TextureManager.cpp)
      this.EmittanceMap = getWhiteTexture(this.device)
    }

    // == EFTT_OCCLUSION
    // - OcclusionMap
    this.OcclusionMap = (maps.Occlusion as any) || white

    // == EFTT_SPECULAR_2
    // - SpecularMap2
    this.SpecularMap2 = (maps.Specular2 as any) || white
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    if (!mods) {
      return
    }

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
    if (attrs.Diffuse) {
      // older mtl files store colors with 3 components, w must default to 1 (opacity)
      this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    }

    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular, vec4.One)
    }

    if (attrs.Emissive) {
      this.EmissiveColor = paramVec4(attrs.Emissive)
    }

    if (attrs.Emittance) {
      this.EmissiveColor = paramVec4(attrs.Emittance)
    }

    if (attrs.AlphaTest < 1) {
      this.AlphaTestRef = attrs.AlphaTest
      this.EnabledAlphaTest = TRUE
    }

    if (attrs.Opacity < 1 || flags.has('DECAL')) {
      let opacity = attrs.Opacity ?? 1
      // DecalDiffuseOpacity is a public param with default 1 (illum.cfx), the opacity is in DiffuseColor.w
      this.DiffuseColor.w = opacity
      // decals always blend (illum.cfx %DECAL: ZWriteEnable = false), the alpha test only discards faint pixels
      this.isTransparent = !this.EnabledAlphaTest || flags.has('DECAL')
      this.EnabledAlphaBlend = TRUE
      this.effect.blendState = BlendState.Alpha
      this.effect.depthState = DepthState.GreaterEqualNoWrite
      if (flags.has('DECAL')) {
        // the forward effect is kept for reference only (decals render in the GBuffer, see the constructor),
        // the depth offset is in the vertex shader (DECAL_Z_*)
        // keep the linear depth of the surface below (render target 1), AO, fog and soft particles read it
        this.effect.renderMasks = [null, 0]
      }
    }

    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
  }

  /**
   * Replaces public params of this material (e.g. the mask colors of an appearance), see {@link ParamsMaterial}
   */
  public setParams(params: MaterialParams) {
    this.setPublicParams(params as unknown as PublicParams)
  }

  private setPublicParams(params: PublicParams) {
    // this.IndirectColor = paramColor(para.IndirectColor, this.IndirectColor)
    this.SssIndex = paramValue(params.SSSIndex, this.SssIndex)
    this.EmittanceMapGamma = paramValue(params.EmittanceMapGamma, this.EmittanceMapGamma)
    this.BlendMaskTiling = paramValue(params.BlendMaskTiling, this.BlendMaskTiling)
    this.BlendFactor = paramValue(params.BlendFactor, this.BlendFactor)
    this.BlendFalloff = paramValue(params.BlendFalloff, this.BlendFalloff)
    this.BlendLayer2Tiling = paramValue(params.BlendLayer2Tiling, this.BlendLayer2Tiling)
    this.BlendLayer2Specular = paramVec4(params.BlendLayer2Specular, this.BlendLayer2Specular)
    this.BlendLayer2Diffuse = paramVec4(params.BlendLayer2Diffuse, this.BlendLayer2Diffuse)
    this.BlendLayer2Smoothness = paramValue(params.BlendLayer2Smoothness, this.BlendLayer2Smoothness)
    this.DetailGlossScale = paramValue(params.DetailGlossScale, this.DetailGlossScale)
    this.DetailBumpScale = paramValue(params.DetailBumpScale, this.DetailBumpScale)
    this.DetailDiffuseScale = paramValue(params.DetailDiffuseScale, this.DetailDiffuseScale)
    // TODO: Mask params
    this.SelfShadowStrength = paramValue(params.SelfShadowStrength, this.SelfShadowStrength)
    this.HeightBias = paramValue(params.HeightBias, this.HeightBias)
    this.PomDisplacement = paramValue(params.PomDisplacement, this.PomDisplacement)
    this.ColorMaskOverride = paramValue(params.ColorMaskOverride, this.ColorMaskOverride)
    this.ColorMaskStrength = paramValue(params.ColorMaskStrength, this.ColorMaskStrength)
    this.ColorMaskAlphaInf = paramValue(params.ColorMaskAlphaInf, this.ColorMaskAlphaInf)
    this.ObmDisplacement = paramValue(params.ObmDisplacement, this.ObmDisplacement)
    this.RoughnessBoost = paramValue(params.RoughnessBoost, this.RoughnessBoost)
    this.RoughnessMaxFootprint = paramValue(params.RoughnessMaxFootprint, this.RoughnessMaxFootprint)
    this.DecalDiffuseOpacity = paramValue(params.DecalDiffuseOpacity, this.DecalDiffuseOpacity)
    this.DecalFalloff = paramValue(params.DecalFalloff, this.DecalFalloff)
    this.DecalAlphaMult = paramValue(params.DecalAlphaMult, this.DecalAlphaMult)
    this.BackDiffuseMultiplier = paramValue(params.BackDiffuseMultiplier, this.BackDiffuseMultiplier)
    this.NormalViewDependency = paramValue(params.NormalViewDependency, this.NormalViewDependency)
    this.TransmittanceColor = paramVec4(params.TransmittanceColor, this.TransmittanceColor)
    this.DissolveColor = paramVec4(params.DissolveColor, this.DissolveColor)
    this.DissolveEdgeThickness = paramValue(params.DissolveEdgeThickness, this.DissolveEdgeThickness)
    this.DissolvePercentage = paramValue(params.DissolvePercentage, this.DissolvePercentage)
    this.SssSpecularCutoff = paramValue(params.SSSSpecularCutoff, this.SssSpecularCutoff)
    this.RimMajorWidth = paramValue(params.Rim_Major_Width, this.RimMajorWidth)
    this.RimMajorIntensity = paramValue(params.Rim_Major_Intensity, this.RimMajorIntensity)
    this.RimMajorColor = paramVec4(params.Rim_Major_Color, this.RimMajorColor)
    this.RimSmoothness = paramValue(params.Rim_Smoothness, this.RimSmoothness)

    this.RimCenterIntensity = paramValue(params.Rim_Center_Intensity, this.RimCenterIntensity)
    this.RimFillIntensity = paramValue(params.Rim_Fill_Intensity, this.RimFillIntensity)
    this.RimCenterColor = paramVec4(params.Rim_Center_Color, this.RimCenterColor)
    this.RimFillWidth = paramValue(params.Rim_Fill_Width, this.RimFillWidth)
    this.RimFillColor = paramVec4(params.Rim_Fill_Color, this.RimFillColor)
    this.RimColorBlend = paramValue(params.Rim_Color_Blend, this.RimColorBlend)
    // this.TessellationFactorMax = paramValue(para.TessellationFactorMax, this.TessellationFactorMax)
    // this.TessellationFaceCull = paramValue(para.TessellationFaceCull, this.TessellationFaceCull
    // this.TessellationFactor = paramValue(para.TessellationFactor, this.TessellationFactor)
    // this.TessellationFactorMin = paramValue(para.TessellationFactorMin, this.TessellationFactorMin)
    // this.TessellationDispBias = paramValue(para.TessellationDispBias, this.TessellationDispBias)
    // this.TessellationHeightScale = paramValue(para.TessellationHeightScale, this.TessellationHeightScale)
    // this.FresnelScale = paramValue(para.FresnelScale, this.FresnelScale)
    // this.FresnelBias = paramValue(para.FresnelBias, this.FresnelBias
    // this.GlossFromDiffuseBrightness = paramValue(para.GlossFromDiffuseBrightness, this.GlossFromDiffuseBrightness)
    // this.GlossFromDiffuseOffset = paramValue(para.GlossFromDiffuseOffset, this.GlossFromDiffuseOffset)
    // this.GlossFromDiffuseAmount = paramValue(para.GlossFromDiffuseAmount, this.GlossFromDiffuseAmount)
    // this.GlossFromDiffuseContrast = paramValue(para.GlossFromDiffuseContrast, this.GlossFromDiffuseContrast)
    this.DepthFixupThreshold = paramValue(params.DepthFixupThreshold, this.DepthFixupThreshold)

    // this.FresnelPower = paramValue(para.FresnelPower, this.FresnelPower)
    // this.RimBlendFillColor = paramColor(para.Rim_Blend_Fill_Color, this.RimBlendFillColor)
    // this.RimBlendMajorAlpha = paramValue(para.Rim_Blend_Major_Alpha, this.RimBlendMajorAlpha

    // this.RimBlendMajorWidth = paramValue(para.Rim_Blend_Major_Width, this.RimBlendMajorWidth)
    // this.RimBlendFillAlpha = paramValue(para.Rim_Blend_Fill_Alpha, this.RimBlendFillAlpha)
    // this.RimBlendColorBlend = paramValue(para.Rim_Blend_Color_Blend, this.RimBlendColorBlend

    // this.RimBlendMajorColor = paramColor(para.Rim_Blend_Major_Color, this.RimBlendMajorColor)
    // this.RimBlendCenterColor = paramColor(para.Rim_Blend_Center_Color, this.RimBlendCenterColor)
    // this.RimBlendFillWidth = paramValue(para.Rim_Blend_Fill_Width, this.RimBlendFillWidth

    // this.RimBlendCenterAlpha = paramValue(para.Rim_Blend_Center_Alpha, this.RimBlendCenterAlpha)
    // this.RimBlendSmoothness = paramValue(para.Rim_Blend_Smoothness, this.RimBlendSmoothness)
    // the Emittance color and intensity (PerMaterial_EmissiveColor xyz, w), see appearanceParams
    if (params.emissive_color != null || params.emissive_intensity != null) {
      const color = paramVec3(params.emissive_color, this.EmissiveColor)
      const intensity = paramValue(params.emissive_intensity, this.EmissiveColor.w)
      this.EmissiveColor = vec4(color.x, color.y, color.z, intensity)
    }
    this.MaskR = paramValue(params.Mask_R, this.MaskR)
    this.MaskROverride = paramValue(params.Mask_R_Override, this.MaskROverride)
    this.MaskRColor = paramVec3(params.Mask_R_Color, this.MaskRColor)
    this.MaskG = paramValue(params.Mask_G, this.MaskG)
    this.MaskGOverride = paramValue(params.Mask_G_Override, this.MaskGOverride)
    this.MaskGColor = paramVec3(params.Mask_G_Color, this.MaskGColor)
    this.MaskB = paramValue(params.Mask_B, this.MaskB)
    this.MaskBOverride = paramValue(params.Mask_B_Override, this.MaskBOverride)
    this.MaskBColor = paramVec3(params.Mask_B_Color, this.MaskBColor)
    // Mask_A and Mask_A_Color are in old mtl files only, CharacterMasking.cfi reads Mask_A_Gloss / Mask_A_SpecColor
    this.MaskAGloss = paramValue(params.Mask_A_Gloss, this.MaskAGloss)
    this.MaskAGlossShift = paramValue(params.Mask_A_GlossShift, this.MaskAGlossShift)
    this.MaskASpecColor = paramVec3(params.Mask_A_SpecColor, this.MaskASpecColor)
    this.MaskASpecColorOverride = paramValue(params.Mask_A_SpecColor_Override, this.MaskASpecColorOverride)
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
