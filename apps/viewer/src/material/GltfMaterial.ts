import { createMaterial, type AssetCreator } from '@gglib/content'
import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  FALSE,
  Material,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  TRUE,
  uvInfoToMat4,
  type CommonMaterialProps,
  type EffectOptions,
  type MaterialOptions,
} from '@gglib/graphics'
import { mat4Identity, vec4 } from '@gglib/math'
import { createEmissiveEffect, hasEmittance, InputBlocks, MaterialLayerMasks, NwRenderVariant } from './common'
import Schema from './GltfMaterial.meta'
import WGSL from './GltfMaterial.wgsl'
import { getFlatNormalTexture, getWhiteTexture } from './utils'

/**
 * Material creator of the viewer's content loader: materials of glTF files (plain options) become
 * {@link GltfMaterial}s, materials with a factory (`.mtl` files) or an effect are created as they ask.
 */
export const createViewerMaterial: AssetCreator<MaterialOptions, Material> = (content, options) => {
  if (options instanceof Material || options?.effect || options?.factory) {
    return createMaterial(content, options)
  }
  return new GltfMaterial(content.device, options)
}

/**
 * Fragment entry points of the glTF shader per render variant
 */
const GLTF_FRAGMENT_ENTRY = {
  forward: 'fs_main',
  gbuffer: 'fs_gbuffer',
  emissive: 'fs_emissive',
} as const

function gltfEffectOptions(fragmentEntry: string): EffectOptions {
  return {
    name: 'glTF Effect',
    meta: {},
    program: {
      shader: {
        name: `glTF Shader (${fragmentEntry})`,
        wgsl: {
          source: WGSL,
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

/**
 * The material of glTF files: the glTF material properties ({@link CommonMaterialProps}, as the glTF loader of
 * gglib reads them) on the viewer's render pipeline.
 *
 * @remarks
 * Opaque and masked materials write the GBuffer and are lit by the deferred lighting, blended materials are lit
 * forward in the transparent pass. Emittance is added after the lighting. Normal maps in a signed format (the BC5_SNORM
 * DDS of game files) are read without the unsigned remap.
 */
export class GltfMaterial extends MaterialWithSchema(Schema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: options?.name || 'glTF Material',
      effect: null,
      meta: options?.meta ?? {},
    })
    const props: CommonMaterialProps = options?.properties ?? {}
    this.setDefaults()
    this.setProperties(props)

    // the loader marks masked materials with AlphaBlend too, the cutoff tells them apart
    const masked = (props.AlphaClip ?? 0) > 0
    this.isTransparent = !!props.AlphaBlend && !masked
    this.AlphaBlend = this.isTransparent ? TRUE : FALSE
    const cullState = props.DoubleSided ? CullState.None : CullState.CullBack

    this.setEffect(RenderVariant.Forward, new Effect(this.device, gltfEffectOptions(GLTF_FRAGMENT_ENTRY.forward)))
    this.effect.cullState = cullState
    this.layer = MaterialLayerMasks.Common
    if (this.isTransparent) {
      this.effect.blendState = BlendState.Alpha
      this.effect.depthState = DepthState.GreaterEqualNoWrite
      return
    }
    this.effect.blendState = BlendState.Opaque
    const gbuffer = new Effect(this.device, gltfEffectOptions(GLTF_FRAGMENT_ENTRY.gbuffer))
    gbuffer.cullState = cullState
    gbuffer.blendState = BlendState.Opaque
    this.setEffect(RenderVariant.GBuffer, gbuffer)
    if (hasEmittance(this.EmissiveColor)) {
      this.setEffect(
        NwRenderVariant.Emissive,
        createEmissiveEffect(this.device, gltfEffectOptions(GLTF_FRAGMENT_ENTRY.emissive), gbuffer),
      )
    }
  }

  private setDefaults() {
    const white = getWhiteTexture(this.device)
    this.BaseColor = vec4(1, 1, 1, 1)
    this.EmissiveColor = vec4(0, 0, 0, 1)
    this.SpecularColor = vec4(1, 1, 1, 1)
    this.TextureMod = mat4Identity()
    this.Metallic = 1
    this.Roughness = 1
    this.Ior = 1.5
    this.AlphaClip = 0
    this.BaseMap = white
    this.MetallicRoughnessMap = white
    this.NormalMap = getFlatNormalTexture(this.device)
    this.OcclusionMap = white
    this.EmissiveMap = white
    this.SpecularMap = white
    this.BaseMapSampler = SamplerState.LinearWrap
    this.MetallicRoughnessMapSampler = SamplerState.LinearWrap
    this.NormalMapSampler = SamplerState.LinearWrap
    this.OcclusionMapSampler = SamplerState.LinearWrap
    this.EmissiveMapSampler = SamplerState.LinearWrap
    this.SpecularMapSampler = SamplerState.LinearWrap
    this.SamplerLinear = SamplerState.LinearClamp
  }

  private setProperties(props: CommonMaterialProps) {
    const baseColor = props.BaseColor ?? [1, 1, 1, 1]
    this.BaseColor = vec4(baseColor[0], baseColor[1], baseColor[2], (baseColor[3] ?? 1) * (props.Opacity ?? 1))
    if (props.EmissiveColor) {
      const [r, g, b] = props.EmissiveColor
      this.EmissiveColor = vec4(r, g, b, props.EmissiveStrength ?? 1)
    }
    if (props.SpecularColor || props.SpecularWeight != null) {
      const [r, g, b] = props.SpecularColor ?? [1, 1, 1]
      this.SpecularColor = vec4(r, g, b, props.SpecularWeight ?? 1)
    }
    if (props.Metallic != null) {
      this.Metallic = props.Metallic
    }
    if (props.Roughness != null) {
      this.Roughness = props.Roughness
    }
    if (props.IOR != null) {
      this.Ior = props.IOR
    }
    if (props.AlphaClip != null) {
      this.AlphaClip = props.AlphaClip
    }
    if (props.BaseMapUv) {
      this.TextureMod = uvInfoToMat4(props.BaseMapUv)
      this.UseTextureMod = TRUE
    }

    if (props.BaseMap) {
      this.BaseMap = props.BaseMap as any
      this.UseBaseMap = TRUE
    }
    if (props.MetallicRoughnessMap) {
      this.MetallicRoughnessMap = props.MetallicRoughnessMap as any
      this.UseMetallicRoughnessMap = TRUE
    }
    if (props.NormalMap) {
      this.NormalMap = props.NormalMap as any
      this.UseNormalMap = TRUE
      // game normal maps are BC5_SNORM, signed formats are read without the unsigned remap
      // a texture or the options to create one, both have the format
      const format: string | undefined = (props.NormalMap as { format?: string }).format
      this.NormalSigned = format?.includes('snorm') ? TRUE : FALSE
    }
    if (props.OcclusionMap) {
      this.OcclusionMap = props.OcclusionMap as any
      this.UseOcclusionMap = TRUE
    }
    if (props.EmissiveMap) {
      this.EmissiveMap = props.EmissiveMap as any
      this.UseEmissiveMap = TRUE
    }
    if (props.SpecularMap) {
      this.SpecularMap = props.SpecularMap as any
      this.UseSpecularMap = TRUE
    }

    if (props.BaseMapSampler) {
      this.BaseMapSampler = props.BaseMapSampler
    }
    if (props.MetallicRoughnessMapSampler) {
      this.MetallicRoughnessMapSampler = props.MetallicRoughnessMapSampler
    }
    if (props.NormalMapSampler) {
      this.NormalMapSampler = props.NormalMapSampler
    }
    if (props.OcclusionMapSampler) {
      this.OcclusionMapSampler = props.OcclusionMapSampler
    }
    if (props.EmissiveMapSampler) {
      this.EmissiveMapSampler = props.EmissiveMapSampler
    }
    if (props.SpecularMapSampler) {
      this.SpecularMapSampler = props.SpecularMapSampler
    }
  }
}
