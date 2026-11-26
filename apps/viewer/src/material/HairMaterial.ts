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
import SCHEMA from './HairMaterial.meta'
import WGSL from './HairMaterial.wgsl'
import { TextureModifier } from './TexMod'
import { getShaderConstants, InputBlocks, MaterialLayerMasks } from './common'
import type { MaterialParams, ParamsMaterial } from './appearance'
import { MtlFlag } from './types'
import {
  getFlatNormalTexture,
  getWhiteTexture,
  MtlUtil,
  normalMapEncoding,
  paramValue,
  paramVec3,
  paramVec4,
} from './utils'

function hairEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Hair Effect',
    meta: {},
    program: {
      shader: {
        name: 'Hair Shader',
        wgsl: {
          source: WGSL,
          fragmentConstants: ShaderConstants.get(constants),
          vertexConstants: ShaderConstants.get(constants),
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
  AlphaBlendMultiplier: string
  SecondaryHighlightWidth: string
  SecondaryHighlightShiftAmount: string
  SecondaryHighlightColor: string
  ShiftVariation: string
  DiffuseWrap: string
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
}

const hair = new MtlUtil('Hair', {
  knownMaps: ['Diffuse', 'Bumpmap', 'Specular', 'Smoothness', 'Opacity', 'Custom', 'Detail'],
  knownMods: ['Diffuse'],
  knownFlags: [
    'HAIR_PASS',
    'ANISO_SPECULAR',
    'NORMAL_MAP',
    'OVERLAY_MASK',
    'VERTCOLORS',
    'FX_DISSOLVE',
    'DIRECTION_MAP',
    // drawn like the default hair (alpha tested), see HairMaterial.wgsl
    'SOLID_HAIR',
    'THIN_HAIR',
    'ENFORCE_TILED_SHADING',
    // not ported, see HairMaterial.wgsl
    'RIM_DIFFUSE_LIGHTING',
    'RIM_SPEC_LIGHTING',
  ],
})

/**
 * Default alpha test of hair without a material AlphaTest: the clip of the game's blended passes
 */
const HAIR_ALPHA_CLIP = 0.05

/**
 * Character hair, fur and feathers (hair.cfx), a forward opaque surface drawn after the deferred lighting,
 * see {@link HairMaterial.wgsl}
 */
export class HairMaterial extends MaterialWithSchema(SCHEMA) implements ParamsMaterial {
  declare private modDiffuse: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Hair Material',
      effect: null,
      meta: options,
    })

    const { params, attrs, texMaps, texMods, shaderFlags } = hair.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`

    // forward only: no GBuffer effect, so the item lands in the forward opaque list (after the lighting pass)
    this.setEffect(RenderVariant.Forward, new Effect(this.device, hairEffectOptions(getShaderConstants(shaderFlags))))
    this.effect.cullState = CullState.None // hair.cfx "Cull = NONE"
    this.effect.blendState = BlendState.Opaque
    this.layer = MaterialLayerMasks.Illum

    this.setDefaults()
    this.setTextures(texMaps)
    this.setAttributes(attrs)
    this.setPublicParams(params)
    if (TextureModifier.isModified(texMods?.Diffuse)) {
      this.modDiffuse = new TextureModifier(texMods.Diffuse)
      this.EnabledUvModDiffuse = TRUE
      this.updateModDiffuse(0)
    }

    if (attrs.MtlFlags & MtlFlag.MTL_FLAG_NODRAW) {
      this.noRender = true
    }
  }

  private setDefaults() {
    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.SpecularColor = vec4(1, 1, 1, 1)
    this.AlphaBlendMultiplier = 1
    this.SecondaryHighlightWidth = 1.5
    this.SecondaryHighlightShiftAmount = 0.1
    this.SecondaryHighlightColor = vec4(0.7, 0.7, 0.7, 1)
    this.ShiftVariation = 0
    this.DiffuseWrap = 0.5
    this.MaskAGlossShift = 0.5
    this.DissolveColor = vec4(1, 1, 1, 1)
    this.AlphaTestRef = HAIR_ALPHA_CLIP
    this.UvModDiffuse = mat4Identity()
    this.SamplerLinear = SamplerState.LinearWrap
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    maps ||= {}
    const white = getWhiteTexture(this.device)
    const flatNormal = getFlatNormalTexture(this.device)
    this.DiffuseMap = (maps.Diffuse as any) || white
    this.NormalMap = (maps.Bumpmap as any) || flatNormal
    this.NormalMapEncoding = normalMapEncoding(maps.Bumpmap)
    this.SpecularMap = (maps.Specular as any) || white
    this.SmoothnessMap = (maps.Smoothness as any) || white
    this.OpacityMap = (maps.Opacity as any) || white
    this.MaskMap = (maps.Custom as any) || white
    // only read with %DIRECTION_MAP, which always comes with the map
    this.DirectionMap = (maps.Detail as any) || white
  }

  private setAttributes(attrs: NwMaterialProps['attrs']) {
    if (attrs.Diffuse) {
      this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    }
    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular, vec4.One)
    }
    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
    if (attrs.AlphaTest > 0) {
      this.AlphaTestRef = attrs.AlphaTest
    }
  }

  /**
   * Replaces public params of this material (e.g. the mask colors of an appearance), see {@link ParamsMaterial}
   */
  public setParams(params: MaterialParams) {
    this.setPublicParams(params as unknown as PublicParams)
  }

  private setPublicParams(params: PublicParams) {
    this.AlphaBlendMultiplier = paramValue(params.AlphaBlendMultiplier, this.AlphaBlendMultiplier)
    this.SecondaryHighlightWidth = paramValue(params.SecondaryHighlightWidth, this.SecondaryHighlightWidth)
    this.SecondaryHighlightShiftAmount = paramValue(
      params.SecondaryHighlightShiftAmount,
      this.SecondaryHighlightShiftAmount,
    )
    this.SecondaryHighlightColor = paramVec4(params.SecondaryHighlightColor, this.SecondaryHighlightColor)
    this.ShiftVariation = paramValue(params.ShiftVariation, this.ShiftVariation)
    this.DiffuseWrap = paramValue(params.DiffuseWrap, this.DiffuseWrap)
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
