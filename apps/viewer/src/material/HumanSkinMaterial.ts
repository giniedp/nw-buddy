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
  TRUE,
} from '@gglib/graphics'
import { mat4Identity, vec4 } from '@gglib/math'
import { type NwMaterialProps } from './GltfExtension'
import SCHEMA from './HumanSkinMaterial.meta'
import WGSL from './HumanSkinMaterial.wgsl'
import { TextureModifier } from './TexMod'
import {
  createDebugEffect,
  createEmissiveEffect,
  getShaderConstants,
  hasEmittance,
  InputBlocks,
  MaterialLayerMasks,
  NwRenderVariant,
} from './common'
import type { MaterialParams, ParamsMaterial } from './appearance'
import { MtlFlag } from './types'
import {
  getFlatNormalTexture,
  getGrayTexture,
  getTransparentTexture,
  getWhiteTexture,
  isNormalMapFile,
  MtlUtil,
  normalMapEncoding,
  paramValue,
  paramVec3,
  paramVec4,
} from './utils'

/**
 * Fragment entry points of the HumanSkin shader per render variant
 */
const SKIN_FRAGMENT_ENTRY = {
  forward: 'fs_main',
  gbuffer: 'fs_gbuffer',
  emissive: 'fs_emissive',
  debug: 'fs_debug',
} as const

function skinEffectOptions(constants: Record<string, number>, fragmentEntry: string): EffectOptions {
  return {
    name: 'HumanSkin Effect',
    meta: {},
    program: {
      shader: {
        name: `HumanSkin Shader (${fragmentEntry})`,
        wgsl: {
          source: WGSL,
          fragmentConstants: ShaderConstants.get(constants),
          vertexConstants: ShaderConstants.get(constants),
          fragmentEntry,
        },
        glsl: null,
      },
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
      perInstanceDataBlock: 'instanceData',
    },
  }
}

interface PublicParams {
  Melanin: string
  SSSIndex: string
  TranslucencyMultiplier: string
  EmittanceMapGamma: string
  TattooColor: string
  ScarColor: string
  FacialMarkingColor: string
  ScarNormalStrength: string
  ScarTissue: string
  Mask_R: string
  Mask_R_Color: string
  Mask_R_Override: string
  Mask_G: string
  Mask_G_Color: string
  Mask_G_Override: string
  Mask_B: string
  Mask_B_Color: string
  Mask_B_Override: string
  Mask_A_Gloss: string
  Mask_A_GlossShift: string
  Mask_A_SpecColor: string
  Mask_A_SpecColor_Override: string
  DissolveColor: string
  DissolveEdgeThickness: string
  DissolvePercentage: string
  Rim_Major_Color: string
  Rim_Major_Intensity: string
  Rim_Major_Width: string
  Rim_Fill_Color: string
  Rim_Fill_Intensity: string
  Rim_Fill_Width: string
  Rim_Color_Blend: string
  Rim_Smoothness: string
  Rim_Center_Color: string
  Rim_Center_Intensity: string
}

const skin = new MtlUtil('HumanSkin', {
  knownMaps: [
    'Diffuse',
    'Bumpmap',
    'Specular',
    'Smoothness',
    'Opacity',
    'Emittance',
    'Decal',
    'Custom',
    '[2] Custom',
    '[3] Custom',
    '[4] Custom',
    '[5] Custom',
    '[5] Smoothness',
    // declared by humanskin.cfx (SUBSURFACEMAP) but not read
    'SubSurface',
    // rim map (RimLighting.cfi)
    '[1] Custom',
  ],
  knownMods: ['Diffuse'],
  knownFlags: [
    'TEMP_SKIN',
    'NORMAL_MAP',
    'SPECULAR_MAP',
    'OVERLAY_MASK',
    'HAS_DECAL_LAYERS',
    'SUBSURFACE_SCATTERING_MASK',
    'TRANSPARENT_ZPREPASS',
    'EMITTANCE_MAP',
    'FX_DISSOLVE',
    'RIM_DIFFUSE_LIGHTING',
    'RIM_SPEC_LIGHTING',
    // legacy names, not read by humanskin.cfx
    'BUMP_MAP',
    'SPEC_MAP',
  ],
})

/**
 * Character skin and fur (humanskin.cfx), opaque and deferred, see {@link HumanSkinMaterial.wgsl}
 */
export class HumanSkinMaterial extends MaterialWithSchema(SCHEMA) implements ParamsMaterial {
  declare private modDiffuse: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'HumanSkin Material',
      effect: null,
      meta: options,
    })

    const { params, attrs, texMaps, texFiles, texMods, shaderFlags } = skin.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`

    const constants = getShaderConstants(shaderFlags)
    this.setEffect(
      RenderVariant.Forward,
      new Effect(this.device, skinEffectOptions(constants, SKIN_FRAGMENT_ENTRY.forward)),
    )
    this.effect.cullState = attrs.MtlFlags & MtlFlag.MTL_FLAG_2SIDED ? CullState.None : CullState.CullBack
    this.effect.blendState = BlendState.Opaque
    this.layer = MaterialLayerMasks.Illum

    this.setDefaults()
    this.setTextures(texMaps, texFiles)
    this.setAttributes(attrs)
    this.setPublicParams(params)
    if (TextureModifier.isModified(texMods?.Diffuse)) {
      this.modDiffuse = new TextureModifier(texMods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }

    // the skin is always opaque: GBuffer (ZPass), emissive glow and debug variants like Illum
    const gbuffer = new Effect(this.device, skinEffectOptions(constants, SKIN_FRAGMENT_ENTRY.gbuffer))
    gbuffer.cullState = this.effect.cullState
    gbuffer.blendState = BlendState.Opaque
    this.setEffect(RenderVariant.GBuffer, gbuffer)
    this.setEffect(
      NwRenderVariant.Debug,
      createDebugEffect(this.device, skinEffectOptions(constants, SKIN_FRAGMENT_ENTRY.debug), gbuffer),
    )
    // rim lighting is added to the emittance in the game's additive glow pass
    const rim = shaderFlags.has('RIM_DIFFUSE_LIGHTING') || shaderFlags.has('RIM_SPEC_LIGHTING')
    if (hasEmittance(this.EmissiveColor) || rim) {
      this.setEffect(
        NwRenderVariant.Emissive,
        createEmissiveEffect(this.device, skinEffectOptions(constants, SKIN_FRAGMENT_ENTRY.emissive), gbuffer),
      )
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_NODRAW) {
      this.noRender = true
    }
  }

  private setDefaults() {
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SpecularColor = vec4(1, 1, 1, 1)
    this.EmissiveColor = vec4()
    this.Melanin = 0
    this.SssIndex = 1.2
    this.TranslucencyMultiplier = 0
    this.EmittanceMapGamma = 1
    this.TattooColor = vec4(1, 1, 1, 1)
    this.ScarColor = vec4(1, 1, 1, 1)
    this.FacialMarkingColor = vec4(1, 1, 1, 1)
    this.ScarNormalStrength = 1
    this.ScarTissue = 1
    this.MaskAGlossShift = 0.5
    this.DissolveColor = vec4(1, 1, 1, 1)
    this.RimMajorColor = vec4(1, 1, 1, 1)
    this.RimMajorIntensity = 1
    this.RimMajorWidth = 1
    this.RimFillColor = vec4(1, 1, 1, 1)
    this.RimFillIntensity = 0.4
    this.RimFillWidth = 1
    this.RimColorBlend = 0.1
    this.RimSmoothness = 1
    this.RimCenterColor = vec4(1, 1, 1, 1)
    this.RimCenterIntensity = 0
    this.UvModDiffuse = mat4Identity()
    this.SamplerLinear = SamplerState.LinearWrap
  }

  /**
   * Unset slots get the engine defaults (TextureManager.cpp texSlotSemantics). The customization layers
   * ($CustomMap3..6) are New World slots without a known default, they blend by their alpha and default to transparent.
   */
  private setTextures(maps: NwMaterialProps['textures'], files: NwMaterialProps['files']) {
    maps ||= {}
    const white = getWhiteTexture(this.device)
    const gray = getGrayTexture(this.device)
    const flatNormal = getFlatNormalTexture(this.device)
    const transparent = getTransparentTexture(this.device)
    this.DiffuseMap = (maps.Diffuse as any) || white
    this.NormalMap = (maps.Bumpmap as any) || flatNormal
    this.SpecularMap = (maps.Specular as any) || white
    this.SmoothnessMap = (maps.Smoothness as any) || white
    this.OpacityMap = (maps.Opacity as any) || white
    this.EmittanceMap = (maps.Emittance as any) || white
    this.EmissiveIntensity = (maps.Decal as any) || gray
    this.MaskMap = (maps.Custom as any) || white
    this.TattooMap = (maps['[2] Custom'] as any) || transparent
    this.FreckleMap = (maps['[3] Custom'] as any) || transparent
    this.ScarMap = (maps['[4] Custom'] as any) || transparent
    // without a scar the slot keeps the customization placeholder, a color texture that decodes to bent normals; the
    // scar normal maps are `_ddna` files
    const scarNormal = isNormalMapFile(files?.['[5] Custom']) ? maps['[5] Custom'] : null
    this.ScarNormalMap = (scarNormal as any) || flatNormal
    this.NormalMapEncoding = normalMapEncoding(maps.Bumpmap, scarNormal)
    this.ScarGlossMap = (maps['[5] Smoothness'] as any) || white
    // engine default FlatBump, BC5_SNORM: the rim samples .r at most 1/127, practically no rim (see IllumMaterial)
    this.RimMap = (maps['[1] Custom'] as any) || flatNormal
  }

  private setAttributes(attrs: NwMaterialProps['attrs']) {
    if (attrs.Diffuse) {
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
    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
    if (attrs.AlphaTest < 1) {
      this.AlphaTestRef = attrs.AlphaTest
      this.EnabledAlphaTest = TRUE
    }
  }

  /**
   * Replaces public params of this material (e.g. the mask colors of an appearance), see {@link ParamsMaterial}
   */
  public setParams(params: MaterialParams) {
    this.setPublicParams(params as unknown as PublicParams)
  }

  private setPublicParams(params: PublicParams) {
    this.Melanin = paramValue(params.Melanin, this.Melanin)
    this.SssIndex = paramValue(params.SSSIndex, this.SssIndex)
    this.TranslucencyMultiplier = paramValue(params.TranslucencyMultiplier, this.TranslucencyMultiplier)
    this.EmittanceMapGamma = paramValue(params.EmittanceMapGamma, this.EmittanceMapGamma)
    this.TattooColor = paramVec4(params.TattooColor, this.TattooColor)
    this.ScarColor = paramVec4(params.ScarColor, this.ScarColor)
    this.FacialMarkingColor = paramVec4(params.FacialMarkingColor, this.FacialMarkingColor)
    this.ScarNormalStrength = paramValue(params.ScarNormalStrength, this.ScarNormalStrength)
    this.ScarTissue = paramValue(params.ScarTissue, this.ScarTissue)
    this.MaskR = paramValue(params.Mask_R, this.MaskR)
    this.MaskRColor = paramVec3(params.Mask_R_Color, this.MaskRColor)
    this.MaskROverride = paramValue(params.Mask_R_Override, this.MaskROverride)
    this.MaskG = paramValue(params.Mask_G, this.MaskG)
    this.MaskGColor = paramVec3(params.Mask_G_Color, this.MaskGColor)
    this.MaskGOverride = paramValue(params.Mask_G_Override, this.MaskGOverride)
    this.MaskB = paramValue(params.Mask_B, this.MaskB)
    this.MaskBColor = paramVec3(params.Mask_B_Color, this.MaskBColor)
    this.MaskBOverride = paramValue(params.Mask_B_Override, this.MaskBOverride)
    this.MaskAGloss = paramValue(params.Mask_A_Gloss, this.MaskAGloss)
    this.MaskAGlossShift = paramValue(params.Mask_A_GlossShift, this.MaskAGlossShift)
    this.MaskASpecColor = paramVec3(params.Mask_A_SpecColor, this.MaskASpecColor)
    this.MaskASpecColorOverride = paramValue(params.Mask_A_SpecColor_Override, this.MaskASpecColorOverride)
    this.DissolveColor = paramVec4(params.DissolveColor, this.DissolveColor)
    this.DissolveEdgeThickness = paramValue(params.DissolveEdgeThickness, this.DissolveEdgeThickness)
    this.DissolvePercentage = paramValue(params.DissolvePercentage, this.DissolvePercentage)
    this.RimMajorColor = paramVec4(params.Rim_Major_Color, this.RimMajorColor)
    this.RimMajorIntensity = paramValue(params.Rim_Major_Intensity, this.RimMajorIntensity)
    this.RimMajorWidth = paramValue(params.Rim_Major_Width, this.RimMajorWidth)
    this.RimFillColor = paramVec4(params.Rim_Fill_Color, this.RimFillColor)
    this.RimFillIntensity = paramValue(params.Rim_Fill_Intensity, this.RimFillIntensity)
    this.RimFillWidth = paramValue(params.Rim_Fill_Width, this.RimFillWidth)
    this.RimColorBlend = paramValue(params.Rim_Color_Blend, this.RimColorBlend)
    this.RimSmoothness = paramValue(params.Rim_Smoothness, this.RimSmoothness)
    this.RimCenterColor = paramVec4(params.Rim_Center_Color, this.RimCenterColor)
    this.RimCenterIntensity = paramValue(params.Rim_Center_Intensity, this.RimCenterIntensity)
  }

  private frame: number
  public update(time: number, delta: number, frame: number) {
    if (this.frame === frame) {
      return
    }
    this.frame = frame
    if (this.modDiffuse?.isAnimated) {
      this.updateModDiffuse(time)
    }
  }

  private updateModDiffuse(time: number) {
    this.modDiffuse.update(time)
    this.UvModDiffuse = this.modDiffuse.matrix
  }
}
