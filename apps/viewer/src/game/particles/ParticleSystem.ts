import { EcsGame, TimeSystem } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import type { ResourceScope, Texture } from '@gglib/graphics'
import { mat4GetTranslation, vec3, type IVec3 } from '@gglib/math'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { ContentService, normalizeAssetPath } from '../../content'
import { mtlTextureFile, parseMtl, type MtlMaterial } from '../../formats/mtl'
import { TextureModifier, type TexMod } from '../../material/TexMod'
import { paramVec4 } from '../../material/utils'
import {
  parseParticleLibrary,
  resolveParticleEffect,
  type ParticleEffect,
  type ParticleLibraryDocument,
} from '../../formats/particles'
import type { ParticleCamera } from './ParticleEmitter'

/**
 * Inputs of the Particles shader feature %SIGNED_DISTANCE_FIELD_2D (particles.cfi): the diffuse map is scrolled and
 * distorted by a noise map, the shape comes from a mask in the opacity slot
 */
export interface ParticleSdf2D {
  /** `[2] Custom` map ($CustomMap3), the distortion noise */
  noise: Texture
  /** `Opacity` map, alpha mask of the sprite (red channel) */
  mask: Texture
  /** SDF_2D_STRENGTH */
  strength: number
  /** SDF_2D_TILE_X/Y, SDF_2D_SPEED_X/Y, SDF_2D_PHASE_X/Y */
  tile: [number, number]
  speed: [number, number]
  phase: [number, number]
  /** SOURCE_2D_TILE_X/Y, SOURCE_2D_SPEED_X/Y, SOURCE_2D_PHASE_X/Y, applied to the diffuse map */
  sourceTile: [number, number]
  sourceSpeed: [number, number]
  sourcePhase: [number, number]
  /** SDF_2D_MASK_TILE_X/Y */
  maskTile: [number, number]
}

/**
 * Material inputs of a sprite besides the diffuse texture, color and SDF (particles.cfx / particles.cfi ParticlePS)
 */
export interface ParticleSpriteFeatures {
  /**
   * %REFRACTION: the sprite bends the scene behind it instead of drawing its texture. Not ported, such sprites are
   * not drawn.
   */
  refraction: boolean
  /**
   * Emission of the material (ParticleEmissiveColor = GetFinalEmittance: Emittance rgb × intensity × 1000 /
   * LIGHT_UNIT_SCALE), added as `diffuse.a × diffuse.rgb × glow.rgb × emittance`, not tinted by the particle color
   */
  emittance: [number, number, number]
  /**
   * %GLOW_MAP: the emission map ($Detail)
   */
  glow: Texture | null
  /**
   * %DEFORMATION: the diffuse uv is offset by two scrolling lookups of a normal map ($CustomMap)
   */
  deformation: { map: Texture; tile: number; amount: number; animSpeed: number } | null
  /**
   * %COLOR_LOOKUP: the color comes from a gradient ($CustomSecondaryMap) by the luminance of the diffuse map
   */
  colorLookup: { map: Texture; amplitude: number; phase: number } | null
  /**
   * Texture modifiers. The shader applies them only when a modifier is set on any slot (%_TT_TEXCOORD_MATRIX): the
   * diffuse uv gets _ModifyUV_1, the glow uv (emittanceTC) is _ModifyDetailUV of the tiled uv. Without any modifier
   * the glow uv stays zero, the glow map is read at its first texel.
   */
  texMods: { any: boolean; diffuse: TexMod | null; detail: TexMod | null }
}

type ParticleSpriteFeaturesDef = Omit<ParticleSpriteFeatures, 'glow' | 'deformation' | 'colorLookup'> & {
  glowFile: string | null
  deformation: { file: string; tile: number; amount: number; animSpeed: number } | null
  colorLookup: { file: string; amplitude: number; phase: number } | null
}

/**
 * Texture slots whose modifiers set %_TT_TEXCOORD_MATRIX
 */
const TEXMOD_MAPS = ['Diffuse', 'Detail', 'Custom', 'Emittance', 'Decal']

/**
 * {@link ParticleSdf2D} with texture files instead of textures, cached per material
 */
type ParticleSdf2DDef = Omit<ParticleSdf2D, 'noise' | 'mask'> & { noiseFile: string; maskFile: string }

/**
 * Maximum simulation step, longer frames (e.g. a hidden tab) are clamped
 */
const MAX_STEP = 0.1

/**
 * Loads particle libraries and textures, and simulates the particle emitters of active {@link ParticleComponent}s
 */
export class ParticleSystem extends GameSystem {
  /**
   * Pauses the simulation, particles stay where they are
   */
  public paused = false

  /**
   * Statistics of the last update
   */
  public readonly stats = { components: 0, emitters: 0, particles: 0, time: 0 }

  private game: EcsGame
  private time: TimeSystem
  private content: ContentService
  private libraries = new Map<string, Promise<ParticleLibraryDocument | null>>()
  private effects = new Map<string, Promise<ParticleEffect | null>>()
  private textureFiles = new Map<string, Promise<string | null>>()
  private mtls = new Map<string, Promise<MtlMaterial | null>>()
  private sdfDefs = new Map<string, Promise<ParticleSdf2DDef | null>>()
  private featureDefs = new Map<string, Promise<ParticleSpriteFeaturesDef | null>>()
  private active = new Set<ParticleUpdatable>()
  private camera: ParticleCamera = { position: vec3() }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.time = world.getSystem(TimeSystem)
    this.content = world.getSystem(ContentService)
  }

  public get cameraPosition(): Readonly<IVec3> {
    return this.camera.position
  }

  public register(item: ParticleUpdatable) {
    this.active.add(item)
  }

  public unregister(item: ParticleUpdatable) {
    this.active.delete(item)
  }

  public update(time: number, dt: number): void {
    const start = performance.now()
    const view = this.game?.scene?.getView(0)
    if (view?.camera) {
      mat4GetTranslation(view.camera.world, this.camera.position)
    }
    // the game clock, so a paused or fixed time freezes the particles
    const step = this.paused ? 0 : Math.min(this.time.game.delta, MAX_STEP)
    let emitters = 0
    let particles = 0
    for (const item of this.active) {
      item.updateParticles(step, this.camera)
      emitters += item.emitterCount
      particles += item.particleCount
    }
    this.stats.components = this.active.size
    this.stats.emitters = emitters
    this.stats.particles = particles
    this.stats.time = performance.now() - start
  }

  /**
   * Loads and resolves an effect of a particle library, null if it does not exist
   */
  public loadEffect(library: string, name: string): Promise<ParticleEffect | null> {
    const key = `${library}|${name}`.toLowerCase()
    if (!this.effects.has(key)) {
      this.effects.set(
        key,
        this.loadLibrary(library).then((lib) => {
          const effect = lib ? resolveParticleEffect(lib, name) : null
          if (lib && !effect) {
            console.warn('particle effect not found', library, name)
          }
          return effect
        }),
      )
    }
    return this.effects.get(key)
  }

  /**
   * Loads and parses a particle library, null if it fails
   */
  public loadLibrary(path: string): Promise<ParticleLibraryDocument | null> {
    const key = normalizeAssetPath(path)
    if (!this.libraries.has(key)) {
      this.libraries.set(
        key,
        this.content
          .fetchFile(key)
          .then((res) => res.text())
          .then((xml) => parseParticleLibrary(xml))
          .catch((err) => {
            console.warn('particle library failed', path, err)
            return null
          }),
      )
    }
    return this.libraries.get(key)
  }

  /**
   * Loads the sprite texture of an effect: the diffuse map of its material, or its texture
   *
   * @param scope - owns the texture, see {@link ContentService.scopeOf}
   */
  public async loadSpriteTexture(texture: string, material: string, scope: ResourceScope): Promise<Texture | null> {
    const key = `${texture}|${material}`.toLowerCase()
    if (!this.textureFiles.has(key)) {
      this.textureFiles.set(
        key,
        this.resolveSpriteTexture(texture, material).catch((err) => {
          console.warn('particle texture failed', texture, material, err)
          return null
        }),
      )
    }
    const file = await this.textureFiles.get(key)
    return file ? this.loadSpriteFile(file, scope) : null
  }

  private loadSpriteFile(file: string, scope: ResourceScope): Promise<Texture | null> {
    return this.content.loadTexture(`${file}?merge=true&size=${MATERIAL_TEXTURE_SIZE}`, scope).catch((err) => {
      console.warn('particle texture failed', file, err)
      return null
    })
  }

  private async resolveSpriteTexture(texture: string, material: string): Promise<string | null> {
    const mtl = await this.loadSpriteMtl(material)
    const diffuse = mtl?.textures.find((it) => it.Map === 'Diffuse')
    const result = diffuse ? mtlTextureFile(diffuse) : null
    if (result) {
      return result
    }
    return texture ? mtlTextureFile({ Map: 'Diffuse', File: texture } as any) : null
  }

  private loadSpriteMtl(material: string): Promise<MtlMaterial | null> {
    if (!material) {
      return Promise.resolve(null)
    }
    const file = normalizeAssetPath(/\.mtl$/i.test(material) ? material : `${material}.mtl`)
    if (!this.mtls.has(file)) {
      this.mtls.set(
        file,
        this.content
          .fetchFile(file)
          .then(async (res) => parseMtl(await res.text()).materials[0] ?? null)
          .catch(() => null),
      )
    }
    return this.mtls.get(file)
  }

  /**
   * Diffuse color of a sprite material, the original multiplies the texture with it (USE_MATERIAL in particles.cfi)
   */
  public async loadSpriteDiffuseColor(material: string): Promise<[number, number, number]> {
    const color = (await this.loadSpriteMtl(material))?.attrs.Diffuse
    return color?.length >= 3 ? [color[0], color[1], color[2]] : [1, 1, 1]
  }

  /**
   * Loads the inputs of the %SIGNED_DISTANCE_FIELD_2D feature of a sprite material, null if the material does not use it
   *
   * @param scope - owns the textures, see {@link ContentService.scopeOf}
   */
  public async loadSpriteSdf(material: string, scope: ResourceScope): Promise<ParticleSdf2D | null> {
    const key = (material || '').toLowerCase()
    if (!this.sdfDefs.has(key)) {
      this.sdfDefs.set(
        key,
        this.resolveSpriteSdf(material).catch((err) => {
          console.warn('particle sdf failed', material, err)
          return null
        }),
      )
    }
    const def = await this.sdfDefs.get(key)
    if (!def) {
      return null
    }
    const [noise, mask] = await Promise.all([
      this.loadSpriteFile(def.noiseFile, scope),
      this.loadSpriteFile(def.maskFile, scope),
    ])
    if (!noise || !mask) {
      return null
    }
    const { noiseFile, maskFile, ...params } = def
    return { ...params, noise, mask }
  }

  private async resolveSpriteSdf(material: string): Promise<ParticleSdf2DDef | null> {
    const mtl = await this.loadSpriteMtl(material)
    if (!mtl || !/%SIGNED_DISTANCE_FIELD_2D\b/i.test(mtl.attrs.StringGenMask ?? '')) {
      return null
    }
    const textureFile = (map: string) => {
      const tex = mtl.textures.find((it) => it.Map === map)
      return tex ? mtlTextureFile(tex) : null
    }
    const noiseFile = textureFile('[2] Custom')
    const maskFile = textureFile('Opacity')
    if (!noiseFile || !maskFile) {
      return null
    }
    const num = (name: string, fallback: number) => {
      const value = Number(mtl.params[name])
      return Number.isFinite(value) ? value : fallback
    }
    const pair = (prefix: string, fallback: number): [number, number] => [
      num(`${prefix}_X`, fallback),
      num(`${prefix}_Y`, fallback),
    ]
    return {
      noiseFile,
      maskFile,
      strength: num('SDF_2D_STRENGTH', 1),
      tile: pair('SDF_2D_TILE', 1),
      speed: pair('SDF_2D_SPEED', 0),
      phase: pair('SDF_2D_PHASE', 0),
      sourceTile: pair('SOURCE_2D_TILE', 1),
      sourceSpeed: pair('SOURCE_2D_SPEED', 0),
      sourcePhase: pair('SOURCE_2D_PHASE', 0),
      maskTile: pair('SDF_2D_MASK_TILE', 1),
    }
  }

  /**
   * Loads the {@link ParticleSpriteFeatures} of a sprite material
   *
   * @param scope - owns the textures, see {@link ContentService.scopeOf}
   */
  public async loadSpriteFeatures(material: string, scope: ResourceScope): Promise<ParticleSpriteFeatures> {
    const key = (material || '').toLowerCase()
    if (!this.featureDefs.has(key)) {
      this.featureDefs.set(
        key,
        this.resolveSpriteFeatures(material).catch((err) => {
          console.warn('particle material failed', material, err)
          return null
        }),
      )
    }
    const def = await this.featureDefs.get(key)
    if (!def) {
      return NO_SPRITE_FEATURES
    }
    const { glowFile, deformation, colorLookup, ...rest } = def
    const load = (file: string | null) => (file ? this.loadSpriteFile(file, scope) : Promise.resolve(null))
    const [glow, deformMap, lookupMap] = await Promise.all([
      load(glowFile),
      load(deformation?.file ?? null),
      load(colorLookup?.file ?? null),
    ])
    return {
      ...rest,
      glow,
      deformation: deformation && deformMap ? { ...deformation, map: deformMap } : null,
      colorLookup: colorLookup && lookupMap ? { ...colorLookup, map: lookupMap } : null,
    }
  }

  private async resolveSpriteFeatures(material: string): Promise<ParticleSpriteFeaturesDef | null> {
    const mtl = await this.loadSpriteMtl(material)
    if (!mtl) {
      return null
    }
    const flags = new Set((mtl.attrs.StringGenMask ?? '').split('%').filter(Boolean))
    const textureFile = (map: string) => {
      const tex = mtl.textures.find((it) => it.Map === map)
      return tex ? mtlTextureFile(tex) : null
    }
    const texMod = (map: string) => {
      const mod = mtl.textures.find((it) => it.Map === map)?.TexMod
      return mod && TextureModifier.isModified(mod) ? mod : null
    }
    const num = (name: string, fallback: number) => {
      const value = Number(mtl.params[name])
      return Number.isFinite(value) ? value : fallback
    }
    const emittance = mtl.attrs.Emittance ? paramVec4(mtl.attrs.Emittance) : null
    // GetFinalEmittance: color × strength (alpha) × 1000 / RENDERER_LIGHT_UNIT_SCALE
    const scale = emittance ? emittance.w * 0.1 : 0
    const deformFile = flags.has('DEFORMATION') ? textureFile('Custom') : null
    const lookupFile = flags.has('COLOR_LOOKUP') ? textureFile('[1] Custom') : null
    return {
      refraction: flags.has('REFRACTION'),
      emittance: emittance ? [emittance.x * scale, emittance.y * scale, emittance.z * scale] : [0, 0, 0],
      glowFile: flags.has('GLOW_MAP') ? textureFile('Detail') : null,
      deformation: deformFile
        ? {
            file: deformFile,
            tile: num('DeformTile', 0.1),
            amount: num('DeformAmount', 0),
            animSpeed: num('DeformAnimSpeed', 0),
          }
        : null,
      colorLookup: lookupFile
        ? {
            file: lookupFile,
            amplitude: num('ColLookupAmplitude', 1),
            phase: num('ColLookupColPhase', 1),
          }
        : null,
      texMods: {
        any: TEXMOD_MAPS.some((map) => !!texMod(map)),
        diffuse: texMod('Diffuse'),
        detail: texMod('Detail'),
      },
    }
  }

  public destroy(): void {
    this.active.clear()
  }
}

const NO_SPRITE_FEATURES: ParticleSpriteFeatures = {
  refraction: false,
  emittance: [0, 0, 0],
  glow: null,
  deformation: null,
  colorLookup: null,
  texMods: { any: false, diffuse: null, detail: null },
}

/**
 * A particle effect instance that is updated by the {@link ParticleSystem}
 */
export interface ParticleUpdatable {
  readonly emitterCount: number
  readonly particleCount: number
  updateParticles(dt: number, camera: ParticleCamera): void
}
