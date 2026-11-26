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
import { mat4Identity, vec4 } from '@gglib/math'
import type { NwMaterialProps } from './GltfExtension'
import SCHEMA from './ParticleImposterMaterial.meta'
import WGSL from './ParticleImposterMaterial.wgsl'
import { TextureModifier } from './TexMod'
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import { MtlUtil, paramValue, paramVec4 } from './utils'

export function particleImposterShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Particle Imposter Shader',
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function particleImposterEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Particle Imposter Effect',
    meta: {},
    program: {
      shader: particleImposterShaderOptions(constants),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

type PublicParams = {
  AnimAmplitude: string //          number
  BumpAnimSpeed: string //          number
  BumpScale: string //              number
  AnimOffset: string //             number
  AnimSpeed: string //              number
  BumpTilling: string //            number
  DiffuseRange: string //           number
  SoftIntersectionFactor: string // number
}

const util = new MtlUtil('ParticleImposter', {
  knownMaps: ['Diffuse', 'Bumpmap'],
  knownMods: ['Diffuse'],
  knownFlags: ['NORMAL_MAP', 'SOFT_PARTICLE'],
})
export class ParticleImposterMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Particle Imposter Material',
      effect: null,
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`
    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, particleImposterEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha
    this.isTransparent = true

    this.layer = MaterialLayerMasks.ParticleImposter
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
    this.AnimAmplitude = 0.3
    this.AnimOffset = 0.0
    this.AnimSpeed = 0.5
    this.BumpAnimSpeed = 0.3
    this.BumpScale = 0.005
    this.BumpTilling = 0.4
    this.DiffuseRange = 1.0
    this.SoftIntersectionFactor = 1.0

    this.UvModDiffuse = mat4Identity()
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (!maps) {
      return
    }

    // NAME       count modCount
    // Diffuse     39   20
    // Bumpmap     36   0
    // Specular    3    0
    // Environment 1    0
    // Smoothness  1    0
    if (maps.Diffuse) {
      this.DiffuseMap = maps.Diffuse as any
    }

    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as any
    }
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
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.DiffuseColor = paramVec4(attrs.Diffuse, vec4.One)
    if (attrs.Opacity < 1) {
      this.DiffuseColor.w = attrs.Opacity
    }
  }

  private setPublicParams(params: PublicParams) {
    this.AnimAmplitude = paramValue(params.AnimAmplitude, this.AnimAmplitude)
    this.BumpAnimSpeed = paramValue(params.BumpAnimSpeed, this.BumpAnimSpeed)
    this.BumpScale = paramValue(params.BumpScale, this.BumpScale)
    this.AnimOffset = paramValue(params.AnimOffset, this.AnimOffset)
    this.AnimSpeed = paramValue(params.AnimSpeed, this.AnimSpeed)
    this.BumpTilling = paramValue(params.BumpTilling, this.BumpTilling)
    this.DiffuseRange = paramValue(params.DiffuseRange, this.DiffuseRange)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
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
