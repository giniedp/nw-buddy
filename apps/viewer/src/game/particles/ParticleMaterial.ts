import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  type Device,
  type MaterialOptions,
  type Texture,
} from '@gglib/graphics'
import { mat4Identity, vec4 } from '@gglib/math'
import type { ParticleParams } from '../../formats/particles'
import { InputBlocks, MaterialLayerMasks } from '../../material'
import { TextureModifier } from '../../material/TexMod'
import { getWhiteTexture } from '../../material/utils'
import type { ParticleSdf2D, ParticleSpriteFeatures } from './ParticleSystem'
import SCHEMA from './ParticleMaterial.meta'
import WGSL from './ParticleMaterial.wgsl'

type BlendMode = 'additive' | 'alpha'

/**
 * Creates the effect of a particle material.
 *
 * @remarks
 * Each material needs its own effect, like the other materials of the viewer: materials that share an effect
 * render with the material inputs of one of them (tiling, lighting …).
 */
function createEffect(device: Device, mode: BlendMode): Effect {
  const effect = new Effect(device, {
    name: `Particle Effect (${mode})`,
    meta: {},
    program: {
      shader: {
        name: 'Particle Shader',
        wgsl: { source: WGSL },
        glsl: null,
      },
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame],
    },
  })
  effect.depthState = DepthState.GreaterEqualNoWrite
  effect.cullState = CullState.None
  // the shader outputs premultiplied alpha
  effect.blendState = mode === 'additive' ? BlendState.AdditivePure : BlendState.AlphaPremultiplied
  return effect
}

/**
 * Scale of the particle color, to tune the HDR brightness of emissive particles against the scene
 */
export const PARTICLE_COLOR_SCALE = 1

/**
 * Material of a sprite particle emitter, see {@link ParticleMaterial.wgsl}
 */
export class ParticleMaterial extends MaterialWithSchema(SCHEMA) {
  // declared without emit: assigned in configure(), which runs inside the base constructor before field initializers
  declare private modDiffuse: TextureModifier | null
  declare private modDetail: TextureModifier | null

  public constructor(
    device: Device,
    params: ParticleParams,
    texture: Texture,
    sdf?: ParticleSdf2D | null,
    diffuseColor?: [number, number, number],
    features?: ParticleSpriteFeatures | null,
  ) {
    super(device, {
      name: 'Particle Material',
      effect: null,
      properties: {},
      meta: { params, texture, sdf, diffuseColor, features },
    })
  }

  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({ name: options.name, effect: null, meta: options.meta })
    const params = options.meta.params as ParticleParams
    const texture = options.meta.texture as Texture
    const sdf = options.meta.sdf as ParticleSdf2D | null
    const diffuseColor = (options.meta.diffuseColor as [number, number, number]) ?? [1, 1, 1]
    const additive = params.blendType === 'Additive'
    this.setEffect(RenderVariant.Forward, createEffect(this.device, additive ? 'additive' : 'alpha'))
    this.isTransparent = true
    this.layer = MaterialLayerMasks.Particle

    const tiling = params.textureTiling
    this.Tiles = vec4(tiling.tilesX, tiling.tilesY, 1 / tiling.tilesX, 1 / tiling.tilesY)
    this.Lighting = vec4(params.emissiveLighting, params.diffuseLighting, params.diffuseBacklighting, additive ? 1 : 0)
    this.Options = vec4(tiling.animBlend ? 1 : 0, params.softParticle ? 1 : 0, PARTICLE_COLOR_SCALE, 0)
    this.SamplerLinear = SamplerState.LinearClamp
    // material diffuse color, multiplied with the texture (USE_MATERIAL in particles.cfi)
    this.DiffuseColor = vec4(diffuseColor[0], diffuseColor[1], diffuseColor[2], 1)
    this.SamplerWrap = SamplerState.LinearWrap
    this.DiffuseMap = texture

    // %SIGNED_DISTANCE_FIELD_2D: x = enabled, y = strength, zw = noise tile
    this.Sdf0 = vec4(sdf ? 1 : 0, sdf?.strength ?? 0, sdf?.tile[0] ?? 1, sdf?.tile[1] ?? 1)
    // xy = noise speed, zw = noise phase
    this.Sdf1 = vec4(sdf?.speed[0] ?? 0, sdf?.speed[1] ?? 0, sdf?.phase[0] ?? 0, sdf?.phase[1] ?? 0)
    // xy = source (diffuse) tile, zw = source speed
    this.Sdf2 = vec4(
      sdf?.sourceTile[0] ?? 1,
      sdf?.sourceTile[1] ?? 1,
      sdf?.sourceSpeed[0] ?? 0,
      sdf?.sourceSpeed[1] ?? 0,
    )
    // xy = source phase, zw = mask tile
    this.Sdf3 = vec4(sdf?.sourcePhase[0] ?? 0, sdf?.sourcePhase[1] ?? 0, sdf?.maskTile[0] ?? 1, sdf?.maskTile[1] ?? 1)
    this.SdfNoiseMap = sdf?.noise ?? getWhiteTexture(this.device)
    this.SdfMaskMap = sdf?.mask ?? getWhiteTexture(this.device)

    const features = options.meta.features as ParticleSpriteFeatures | null
    const emittance = features?.emittance ?? [0, 0, 0]
    this.Emissive = vec4(emittance[0], emittance[1], emittance[2], params.todBrightnessInfluence)
    this.GlowMap = features?.glow ?? getWhiteTexture(this.device)
    const deform = features?.deformation
    this.Deform = vec4(deform ? 1 : 0, deform?.tile ?? 0.1, deform?.amount ?? 0, deform?.animSpeed ?? 0)
    this.DeformMap = deform?.map ?? getWhiteTexture(this.device)
    const lookup = features?.colorLookup
    this.Lookup = vec4(lookup ? 1 : 0, lookup?.amplitude ?? 1, lookup?.phase ?? 1, features?.texMods.any ? 1 : 0)
    this.LookupMap = lookup?.map ?? getWhiteTexture(this.device)

    this.UvModDiffuse = mat4Identity()
    this.UvModDetail = mat4Identity()
    this.modDiffuse = features?.texMods.diffuse ? new TextureModifier(features.texMods.diffuse) : null
    this.modDetail = features?.texMods.detail ? new TextureModifier(features.texMods.detail) : null
    this.updateModifiers(0)
  }

  private frame: number
  public update(time: number, delta: number, frame: number) {
    if (this.frame === frame) {
      return
    }
    this.frame = frame
    if (this.modDiffuse?.isAnimated || this.modDetail?.isAnimated) {
      this.updateModifiers(time)
    }
  }

  private updateModifiers(time: number) {
    if (this.modDiffuse) {
      this.modDiffuse.update(time)
      this.UvModDiffuse = this.modDiffuse.matrix
    }
    if (this.modDetail) {
      this.modDetail.update(time)
      this.UvModDetail = this.modDetail.matrix
    }
  }
}
