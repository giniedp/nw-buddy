import {
  BlendState,
  CullState,
  DepthState,
  MaterialWithSchema,
  SamplerState,
  TRUE,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { mat4Identity, vec4 } from '@gglib/math'
import type { NwMaterialProps } from './GltfExtension'
import SCHEMA from './MeshparticleMaterial.meta'
import WGSL from './MeshparticleMaterial.wgsl'
import { TextureModifier } from './TexMod'
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import { MtlUtil, paramValue, paramVec4 } from './utils'

export function meshparticleShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Meshparticle Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function meshparticleEffectOptions(): EffectOptions {
  return {
    name: 'Meshparticle Effect',
    meta: {},
    program: {
      shader: meshparticleShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

interface PublicParams {
  AmbStrength: string //            | number
  Brightness: string //             | number
  fadingFeaturing: string //        | number
  viewDependencyFactor: string //   | number
  SoftIntersectionFactor: string // | number
  FadeOutDistance: string //        | number
  SunColorInfluence: string //      | number
  RefrBumpScale: string //          | number
  RefractionBlend: string //        | number
  DissolveColor: string //          | vec4
  DissolveEdgeThickness: string //  | number
  DissolvePercentage: string //     | number
}

const util = new MtlUtil('Meshparticle', {
  knownMaps: [
    'Diffuse',
    'Bumpmap',
    'Detail',
    'Decal',
    'Custom',
    'Emittance',
    // Opacity: true,
    // Smoothness: true,
  ],
  knownMods: ['Diffuse', 'Custom', 'Detail', 'Emittance', 'Decal'],
  knownFlags: [
    'ENABLE_FADEOUT',
    'DIFFUSE_MAP_2',
    'APPLY_SUN_COLOR',
    'REFRACTION',
    'DIFFUSE_MAP_3',
    'DIFFUSE_MAP_4',
    // FX_DISSOLVE: true,
  ],
})

export class MeshparticleMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modCustom: TextureModifier | null
  declare private modDetail: TextureModifier | null
  declare private modEmittance: TextureModifier | null
  declare private modDecalEmissive: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Meshparticle Material',
      effect: meshparticleEffectOptions(),
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    // ZEnable = true
    // ZWriteEnable = false
    // CullMode = None
    // DestBlend = InvSrcAlpha
    // SrcBlend = SrcAlpha
    // AlphaBlendEnable = true
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha
    this.isTransparent = true

    this.layer = MaterialLayerMasks.Meshparticle
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
  }

  private setDefaults() {
    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerPoint = SamplerState.PointWrap

    this.DiffuseColor = vec4(1, 1, 1, 1)
    this.DissolveColor = vec4(1, 1, 1, 1)
    this.AmbStrength = 1.0
    this.Brightness = 1.0
    this.FadingFeaturing = 0.55
    this.ViewDependencyFactor = 2.0
    this.SoftIntersectionFactor = 1.0
    this.FadeOutDistance = 0.2
    this.SunColorInfluence = 0.5
    this.RefrBumpScale = 0.1
    this.RefractionBlend = 0.0
    this.DissolveEdgeThickness = 0.0
    this.DissolvePercentage = 0.0

    this.UvModCustom = mat4Identity()
    this.UvModDecalEmissive = mat4Identity()
    this.UvModDetail = mat4Identity()
    this.UvModDiffuse = mat4Identity()
    this.UvModEmittance = mat4Identity()
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
      //
    }

    // == EFTT_ENV
    // - envMap
    if (maps.Environment) {
      //
    }

    // == EFTT_DETAIL_OVERLAY
    // - detailMap
    if (maps.Detail) {
      this.DetailMap = maps.Detail as any
    }

    // == EFTT_SECOND_SMOOTHNESS
    // - translucencyMap
    if (maps.SecondSmoothness) {
      //
    }

    // == EFTT_HEIGHT
    // - heightMap
    if (maps.Heightmap) {
      //
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
      //
    }

    // == EFTT_CUSTOM
    // - DiffuseMap2
    if (maps.Custom) {
      this.DiffuseMap2 = maps.Custom as any
    }

    // == EFTT_CUSTOM_SECONDARY
    // - BumpMap2
    if (maps['[1] Custom']) {
      //
    }

    // == EFTT_OPACITY
    // - opacityMap
    // - BlendMap
    // - DecalOpacityMap
    if (maps.Opacity) {
      // TODO:
    }

    // == EFTT_SMOOTHNESS
    // - smoothnessMap
    if (maps.Smoothness) {
      // TODO:
    }

    // == EFTT_EMITTANCE
    // - emittanceMap
    if (maps.Emittance) {
      this.EmittanceMap = maps.Emittance as any
    }

    // == EFTT_OCCLUSION
    // - OcclusionMap
    if (maps.Occlusion) {
      //
    }

    // == EFTT_SPECULAR_2
    // - SpecularMap2
    if (maps.Specular2) {
      //
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

    if (attrs.Specular) {
      //
    }

    if (attrs.Emissive) {
      //
    }

    if (attrs.Emittance) {
      //
    }

    if (attrs.AlphaTest < 1) {
      //
    }

    if (attrs.Opacity < 1 || flags.has('DECAL')) {
      //
    }

    if (attrs.Shininess) {
      //
    }

    if (flags.has('ENABLE_FADEOUT')) {
      this.EnabledFadeout = TRUE
    }
    if (flags.has('DIFFUSE_MAP_2')) {
      this.EnabledDiffuseMap2 = TRUE
    }
    if (flags.has('APPLY_SUN_COLOR')) {
      this.EnabledApplySunColor = TRUE
    }
    if (flags.has('REFRACTION')) {
      this.EnabledRefraction = TRUE
    }
    if (flags.has('FX_DISSOLVE')) {
      //
    }
    if (flags.has('DIFFUSE_MAP_3')) {
      this.EnabledDiffuseMap3 = TRUE
    }
    if (flags.has('DIFFUSE_MAP_4')) {
      this.EnabledDiffuseMap4 = TRUE
    }
  }

  private setPublicParams(params: PublicParams) {
    this.AmbStrength = paramValue(params.AmbStrength, this.AmbStrength)
    this.Brightness = paramValue(params.Brightness, this.Brightness)
    this.FadingFeaturing = paramValue(params.fadingFeaturing, this.FadingFeaturing)
    this.ViewDependencyFactor = paramValue(params.viewDependencyFactor, this.ViewDependencyFactor)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.FadeOutDistance = paramValue(params.FadeOutDistance, this.FadeOutDistance)
    this.SunColorInfluence = paramValue(params.SunColorInfluence, this.SunColorInfluence)
    this.RefrBumpScale = paramValue(params.RefrBumpScale, this.RefrBumpScale)
    this.RefractionBlend = paramValue(params.RefractionBlend, this.RefractionBlend)
    this.DissolveColor = paramVec4(params.DissolveColor, this.DissolveColor)
    this.DissolveEdgeThickness = paramValue(params.DissolveEdgeThickness, this.DissolveEdgeThickness)
    this.DissolvePercentage = paramValue(params.DissolvePercentage, this.DissolvePercentage)
    this.AmbStrength = paramValue(params.AmbStrength, this.AmbStrength)
    this.Brightness = paramValue(params.Brightness, this.Brightness)
    this.FadeOutDistance = paramValue(params.FadeOutDistance, this.FadeOutDistance)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.SunColorInfluence = paramValue(params.SunColorInfluence, this.SunColorInfluence)
    this.FadingFeaturing = paramValue(params.fadingFeaturing, this.FadingFeaturing)
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
