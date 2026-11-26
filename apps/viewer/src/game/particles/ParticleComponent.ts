import { MeshComponent, TransformComponent } from '@gglib/components'
import type { GameComponent, GameEntity, GameWorld } from '@gglib/ecs'
import { Device, Geometry, Mesh, type ResourceScope, type Texture } from '@gglib/graphics'
import { ContentService } from '../../content'
import { mat4Decompose, mat4Identity, quat$initIdentity, vec3, vec3DistanceSquared, vec4 } from '@gglib/math'
import type { ViewerParticleComponent } from '../../api'
import {
  forEachParticleEffect,
  isParticleEffectImmortal,
  type ParticleEffect,
  type ParticleParams,
} from '../../formats/particles'
import { ViewerConfig } from '../../config'
import {
  PARTICLE_INSTANCE_FLOATS,
  ParticleEmitter,
  type ParticleCamera,
  type ParticleLocation,
} from './ParticleEmitter'
import { ParticleMaterial } from './ParticleMaterial'
import {
  ParticleSystem,
  type ParticleSdf2D,
  type ParticleSpriteFeatures,
  type ParticleUpdatable,
} from './ParticleSystem'

export type ParticleComponentState = 'idle' | 'loading' | 'ready' | 'skipped' | 'failed'

export interface ParticleComponentOptions {
  /**
   * Shows one shot effects regardless of config `particleOneShots`, e.g. in the particle preview of the browser
   */
  oneShots?: boolean
  /**
   * Restarts one shot effects after this many seconds, 0 plays them once
   */
  loop?: number
  /**
   * Overrides the activation range, see {@link particleRange}
   */
  range?: number
}

interface EmitterSlot {
  emitter: ParticleEmitter
  geometry: Geometry
  data: Float32Array<ArrayBuffer>
}

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

/**
 * Activation range of a particle emitter, config `particleViewDistance` times the emitter view distance multiplier
 */
export function particleRange(world: GameWorld, data: ViewerParticleComponent) {
  const distance = world.getSystem(ViewerConfig, { optional: true })?.value.particleViewDistance ?? 60
  return distance * (data.viewDistanceMultiplier || 1)
}

/**
 * Particle emitter of an entity (ParticleComponent). Loads the effect when the entity activates,
 * simulates it while active (see {@link ParticleSystem}) and renders its sprite emitters through a child mesh.
 *
 * @remarks
 * Only effects with an immortal emitter (fires, candles, ambient dust …) are shown by default. One shot effects
 * are triggered by game events (demolish, loot …), see config `particleOneShots`.
 */
export class ParticleComponent implements GameComponent, ParticleUpdatable {
  public readonly entity: GameEntity
  public readonly data: ViewerParticleComponent
  public state: ParticleComponentState = 'idle'
  public effect: ParticleEffect | null = null

  private system: ParticleSystem
  /**
   * Owns the textures and the mesh of this component, the scope of the region or level
   */
  private scope: ResourceScope
  private mesh: Mesh | null = null
  private config: ViewerConfig
  private slots: EmitterSlot[] = []
  private child: GameEntity
  private isActive = false
  private location: ParticleLocation = { position: vec3(), rotation: vec4(0, 0, 0, 1), scale: 1 }
  private scale = vec3()

  public readonly options: ParticleComponentOptions

  private isImmortal = true
  private loopTime = 0

  public constructor(data: ViewerParticleComponent, options?: ParticleComponentOptions) {
    this.data = data
    this.options = options ?? {}
  }

  public get emitterCount() {
    return this.slots.length
  }

  public get particleCount() {
    let result = 0
    for (const slot of this.slots) {
      result += slot.emitter.count
    }
    return result
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(ParticleSystem)
    this.scope = this.entity.service(ContentService).scopeOf(this.entity)
    this.config = this.entity.world.getSystem(ViewerConfig, { optional: true })
  }

  public activate(): void {
    this.isActive = true
    if (this.state === 'ready') {
      this.system.register(this)
      return
    }
    if (this.state !== 'idle') {
      return
    }
    this.state = 'loading'
    this.load().catch((err) => {
      console.warn('particle effect failed', this.data.emitter, err)
      this.state = 'failed'
    })
  }

  public deactivate(): void {
    this.isActive = false
    this.system?.unregister(this)
    // restart from the steady state when activated again
    for (const slot of this.slots) {
      slot.emitter.reset()
      slot.geometry.instanceCount = 0
    }
    this.prerolled = false
  }

  public destroy(): void {
    this.deactivate()
    this.child?.destroy()
    this.child = null
    this.mesh?.dispose()
    this.mesh = null
    this.slots.length = 0
  }

  private async load() {
    const effect = await this.system.loadEffect(this.data.library, this.data.emitter)
    if (!effect) {
      this.state = 'failed'
      return
    }
    this.effect = effect
    this.isImmortal = isParticleEffectImmortal(effect)
    if (!this.options.oneShots && !this.config?.value.particleOneShots && !this.isImmortal) {
      this.state = 'skipped'
      return
    }

    const sprites: ParticleParams[] = []
    forEachParticleEffect(effect, (it) => {
      const p = it.params
      // phase 1: sprite emitters that spawn from the emitter itself
      if (p && p.count.base > 0 && p.spawnIndirection === 'Direct' && !p.geometry && (p.texture || p.material)) {
        if (p.emitterShape !== 'TRAIL' && p.emitterShape !== 'BEAM') {
          sprites.push(p)
        }
      }
    })
    const [textures, sdfs, colors, features] = await Promise.all([
      Promise.all(sprites.map((p) => this.system.loadSpriteTexture(p.texture, p.material, this.scope))),
      Promise.all(sprites.map((p) => this.system.loadSpriteSdf(p.material, this.scope))),
      Promise.all(sprites.map((p) => this.system.loadSpriteDiffuseColor(p.material))),
      Promise.all(sprites.map((p) => this.system.loadSpriteFeatures(p.material, this.scope))),
    ])
    if (!this.entity || this.entity.isDestroyed) {
      return
    }
    this.build(sprites, textures, sdfs, colors, features)
    this.state = 'ready'
    if (this.isActive) {
      this.system.register(this)
    }
  }

  private build(
    sprites: ParticleParams[],
    textures: Array<Texture | null>,
    sdfs: Array<ParticleSdf2D | null>,
    colors: Array<[number, number, number]>,
    features: ParticleSpriteFeatures[],
  ) {
    const device = this.entity.service(Device)
    this.updateLocation()
    const spawn = {
      countScale: (this.data.countScale ?? 1) * (this.config?.value.particleCountScale ?? 1),
      sizeScale: this.data.sizeScale ?? 1,
      speedScale: this.data.speedScale ?? 1,
      timeScale: this.data.timeScale ?? 1,
      strength: this.data.strength ?? -1,
      color: [this.data.color?.[0] ?? 1, this.data.color?.[1] ?? 1, this.data.color?.[2] ?? 1] as [
        number,
        number,
        number,
      ],
      alphaScale: (this.data.alphaScale ?? 1) * (this.data.color?.[3] ?? 1),
    }

    const geometries: Geometry[] = []
    const materials: ParticleMaterial[] = []
    for (let i = 0; i < sprites.length; i++) {
      const texture = textures[i]
      // refraction materials bend the scene behind them instead of drawing their texture, not ported
      if (!texture || features[i].refraction) {
        continue
      }
      const emitter = new ParticleEmitter(sprites[i], spawn, this.location)
      emitter.setTextureSize(texture.width, texture.height)
      const data = new Float32Array(emitter.capacity * PARTICLE_INSTANCE_FLOATS)
      const geometry = new Geometry(device, {
        name: 'Particles',
        primitiveType: 'triangle-strip',
        vertexBuffer: [
          {
            layout: { corner: { type: 'float32x2', byteOffset: 0 } },
            data: QUAD,
          },
          {
            layout: {
              iPosition: { type: 'float32x4', byteOffset: 0 },
              iAxisX: { type: 'float32x4', byteOffset: 16 },
              iAxisY: { type: 'float32x4', byteOffset: 32 },
              iColor: { type: 'float32x4', byteOffset: 48 },
              iExtra: { type: 'float32x4', byteOffset: 64 },
            },
            instanced: true,
            stride: PARTICLE_INSTANCE_FLOATS * 4,
            size: data.byteLength,
          },
        ],
        vertexCount: 4,
        instanceCount: 0,
      })
      geometries.push(geometry)
      materials.push(new ParticleMaterial(device, sprites[i], texture, sdfs[i], colors[i], features[i]))
      this.slots.push({ emitter, geometry, data })
    }
    if (!this.slots.length) {
      return
    }

    const mesh = new Mesh(device, {
      name: this.data.emitter,
      geometries,
      materials,
      parts: geometries.map((_, i) => ({ geometryIndex: i, materialIndex: i })),
      boundingBox: [-1, -1, -1, 1, 1, 1],
      boundingSphere: [0, 0, 0, 1],
    })
    this.mesh = mesh
    // particles are written in world space, the entity transform is only used for sorting
    this.child = this.entity.world.createEntity({
      parent: this.entity,
      name: 'Particles',
      transform: new TransformComponent({ local: mat4Identity() }),
      components: [new MeshComponent({ mesh })],
    })
  }

  private prerolled = false

  public updateParticles(dt: number, camera: ParticleCamera): void {
    // the entity may be active for longer by a mesh with a larger view distance
    const range = this.options.range ?? particleRange(this.entity.world, this.data)
    if (vec3DistanceSquared(camera.position, this.location.position) > range * range) {
      if (this.prerolled) {
        this.prerolled = false
        for (const slot of this.slots) {
          slot.emitter.reset()
          slot.geometry.instanceCount = 0
        }
      }
      return
    }
    if (!this.prerolled) {
      this.prerolled = true
      this.updateLocation()
      for (const slot of this.slots) {
        if (!this.isImmortal) {
          // one shot effects play from the start
          continue
        }
        // simulate to the steady state, so effects do not visibly start when they come into range
        const p = slot.emitter.params
        const life = p.particleLifeTime.base * (1 + p.particleLifeTime.random)
        slot.emitter.preroll(Math.min(Number.isFinite(life) ? life : 2, 4))
      }
    }
    if (!this.isImmortal && this.options.loop > 0) {
      this.loopTime += dt
      if (this.loopTime >= this.options.loop) {
        this.loopTime = 0
        for (const slot of this.slots) {
          slot.emitter.reset()
        }
      }
    }
    for (const slot of this.slots) {
      const emitter = slot.emitter
      emitter.update(dt)
      const count = emitter.writeInstances(slot.data, camera)
      slot.geometry.instanceCount = count
      if (count > 0) {
        slot.geometry.vertexBuffer.buffers[1].setSubData(0, slot.data, 0, count * PARTICLE_INSTANCE_FLOATS)
      }
    }
  }

  /**
   * Position, rotation and uniform scale of the entity
   */
  private updateLocation() {
    const loc = this.location
    const scale = this.scale
    mat4Decompose(this.entity.getTransform().world, scale, loc.rotation, loc.position)
    if (this.data.ignoreRotation) {
      quat$initIdentity(loc.rotation)
      loc.scale = 1
    } else {
      loc.scale = (scale.x + scale.y + scale.z) / 3 || 1
    }
  }
}
