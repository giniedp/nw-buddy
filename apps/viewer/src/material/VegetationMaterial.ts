import {
  BlendState,
  CullState,
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
import { vec4 } from '@gglib/math'
import { IMPOSTOR_FADE_RANGE, IMPOSTOR_VISIBILITY_START } from '../constants'
import type { NwMaterialProps } from './GltfExtension'
import { TextureModifier } from './TexMod'
import SCHEMA from './VegetationMaterial.meta'
import WGSL from './VegetationMaterial.wgsl'
import {
  createDebugEffect,
  type FeatureFlag,
  getShaderConstants,
  InputBlocks,
  MaterialLayerMasks,
  NwRenderVariant,
  setDitherFadeConstants,
} from './common'
import { MtlFlag } from './types'
import { getWhiteTexture, MtlUtil, normalMapEncoding, paramValue, paramVec4 } from './utils'

/**
 * @param fragmentEntry - `fs_gbuffer` (default, vegetation is only drawn into the GBuffer) or `fs_debug`
 */
export function vegetationShaderOptions(
  constants: Record<string, number>,
  fragmentEntry: string = 'fs_gbuffer',
): ShaderModuleOptions {
  return {
    name: `Vegetation Shader (${fragmentEntry})`,
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
      fragmentEntry,
    },
    glsl: null,
  }
}

export function vegetationEffectOptions(constants: Record<string, number>, fragmentEntry?: string): EffectOptions {
  return {
    name: 'New World Effect',
    meta: {},
    program: {
      shader: vegetationShaderOptions(constants, fragmentEntry),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

interface PublicParams {
  bendDetailLeafAmplitude: string //   2316 1
  BlendTerrainCol: string //           2316 1
  BlendTerrainColDist: string //       2316 1
  bendDetailBranchAmplitude: string // 2316 1
  bendDetailFrequency: string //       2316 1
  IndirectColor: string //             2316 4
  BackDiffuseMultiplier: string //     2281 1
  TransmittanceColor: string //        2281 4
  CapOpacityFalloff: string //         2279 1
  NormalViewDependency: string //      2272 1
  EmittanceMapGamma: string //         2218 1
  DissolvePercentage: string //        112  1
  DissolveColor: string //             112  4
  DissolveEdgeThickness: string //     112  1
  VertexAlphaBlendFactor: string //    71   4
  BlendMaskTiling: string //           10   4
  BackViewDep: string //               9    4
}

const util = new MtlUtil('Vegetation', {
  knowsDeform: true,
  knownMaps: ['Diffuse', 'Bumpmap', 'Specular', 'Smoothness', 'Opacity', 'Emittance'],
  knownMods: ['Diffuse'],
  knownFlags: ['LEAVES', 'VERTCOLORS', 'GRASS', 'EMITTANCE_MAP', 'SPECULAR_MAP', 'NORMAL_MAP', 'DETAIL_BENDING'],
})

export class VegetationMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modCustom: TextureModifier | null
  declare private modDetail: TextureModifier | null
  declare private modEmittance: TextureModifier | null
  declare private modDecalEmissive: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Vegetation Material',
      effect: null,
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = util.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)
    if (shaderFlags.has('IS_GDE_IMPOSTOR')) {
      setDitherFadeConstants(shaderConst, {
        mode: 'in',
        start: IMPOSTOR_VISIBILITY_START - IMPOSTOR_FADE_RANGE,
        end: IMPOSTOR_VISIBILITY_START,
      })
    }

    // no forward effect: vegetation is drawn into the GBuffer and lit by the deferred lighting
    const gbuffer = new Effect(this.device, vegetationEffectOptions(shaderConst, 'fs_gbuffer'))
    gbuffer.cullState = CullState.CullBack
    gbuffer.blendState = BlendState.Opaque
    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED) {
      gbuffer.cullState = CullState.None
    }
    if (shaderFlags.has('LEAVES')) {
      gbuffer.cullState = CullState.None
    }
    if (shaderFlags.has('GRASS')) {
      gbuffer.cullState = CullState.None
    }
    this.setEffect(RenderVariant.GBuffer, gbuffer)
    this.setEffect(
      NwRenderVariant.Debug,
      createDebugEffect(this.device, vegetationEffectOptions(shaderConst, 'fs_debug'), gbuffer),
    )

    this.layer = MaterialLayerMasks.Vegetation
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
    // ModificatorVT.cfi defaults
    this.BendDetailFrequency = 1.0
    this.BendDetailLeafAmplitude = 0.2
    this.BendDetailBranchAmplitude = -0.5

    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SpecularColor = vec4(0, 0, 0, 1)
    this.EmissiveColor = vec4(0, 0, 0, 1)

    this.TransmittanceColor = vec4(1.0, 1.0, 0.6, 1.0)
    this.CapOpacityFalloff = 1.0
    this.NormalViewDependency = 0.5
    this.BackDiffuseMultiplier = 1.0
    this.BlendTerrainCol = 0.0
    this.BlendTerrainColDist = 0.5
    this.DetailBumpScale = 0.5
    this.DetailDiffuseScale = 0.5
    this.DetailGlossScale = 0.5
    this.EmittanceMapGamma = 1.0
    this.BlendTerrainColInfo = vec4(0, 0, 0, 0) // .xy = terrain UV offset, .z = UV scale, .w = blend distance
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
    this.NormalMapEncoding = normalMapEncoding(maps.Bumpmap, maps['[1] Custom'])

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
      // -- not used
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
      // -- not used
    }

    // == EFTT_CUSTOM
    // - DiffuseMap2
    if (maps.Custom) {
      this.DiffuseMap2 = maps.Custom as any
    }

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    if (maps['[1] Custom']) {
      // -- not used
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
      // -- not used
    }

    // == EFTT_SPECULAR_2
    // - SpecularMap2
    if (maps.Specular2) {
      // -- not used
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
    this.DiffuseColor = paramVec4(attrs.Diffuse, vec4(1))
    this.SpecularColor = paramVec4(attrs.Specular, vec4(1))
    this.EmissiveColor = paramVec4(attrs.Emissive)
    this.EmissiveColor = paramVec4(attrs.Emittance)
    if (attrs.AlphaTest < 1) {
      this.AlphaTestRef = attrs.AlphaTest
      this.EnabledAlphaTest = TRUE
    }

    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
  }

  private setPublicParams(para: PublicParams) {
    this.BlendTerrainCol = paramValue(para.BlendTerrainCol, this.BlendTerrainCol)
    this.BlendTerrainColDist = paramValue(para.BlendTerrainColDist, this.BlendTerrainColDist)
    this.BendDetailFrequency = paramValue(para.bendDetailFrequency, this.BendDetailFrequency)
    this.BendDetailLeafAmplitude = paramValue(para.bendDetailLeafAmplitude, this.BendDetailLeafAmplitude)
    this.BendDetailBranchAmplitude = paramValue(para.bendDetailBranchAmplitude, this.BendDetailBranchAmplitude)

    const authoredLeaf = para.bendDetailLeafAmplitude != null && paramValue(para.bendDetailLeafAmplitude, 0) !== 0
    const authoredBranch = para.bendDetailBranchAmplitude != null && paramValue(para.bendDetailBranchAmplitude, 0) !== 0
    this.ReceiveWind = authoredLeaf || authoredBranch ? 1 : 0
    // para.IndirectColor
    this.BackDiffuseMultiplier = paramValue(para.BackDiffuseMultiplier, this.BackDiffuseMultiplier)
    this.TransmittanceColor = paramVec4(para.TransmittanceColor, this.TransmittanceColor)
    this.CapOpacityFalloff = paramValue(para.CapOpacityFalloff, this.CapOpacityFalloff)
    this.NormalViewDependency = paramValue(para.NormalViewDependency, this.NormalViewDependency)
    this.EmittanceMapGamma = paramValue(para.EmittanceMapGamma, this.EmittanceMapGamma)
    // para.DissolvePercentage
    // para.DissolveColor
    // para.DissolveEdgeThickness
    // para.VertexAlphaBlendFactor
    // para.BlendMaskTiling
    this.NormalViewDependency = paramValue(para.BackViewDep, this.NormalViewDependency)
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
