import { EcsGame, TimeSystem } from '@gglib/components'
import { GameSystem, GetComponent, type GameQuery, type GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, SpaceBasis, vec3 } from '@gglib/math'
import { ViewerConfig } from '../../config'
import { GROUND_PROBE_HEIGHT, GROUND_PROBE_LENGTH } from '../../constants'
import { CollisionSystem } from '../collision/CollisionSystem'
import { GROUND_QUERY_STRIDE } from '../collision/worker/protocol'
import { TerrainSystem } from '../terrain/TerrainSystem'
import { PatrolComponent, type PatrolContext } from './PatrolComponent'

/**
 * Walks the active patrols ({@link PatrolComponent}). Registered after the character animation, so the walk reads the
 * root motion the characters produced this frame.
 *
 * Patrols off the terrain probe the collider ground through the collision worker: one query is out at a time, its
 * answers arrive one or more frames later.
 */
export class PatrolSystem extends GameSystem {
  private patrols: GameQuery
  private world: GameWorld
  private game: EcsGame
  private time: TimeSystem
  private config: ViewerConfig
  private terrain: TerrainSystem | null = null
  private collision: CollisionSystem | null = null
  private readonly context: PatrolContext = {
    dt: 0,
    eye: vec3(),
    animationDistance: 0,
    space: null,
    heightAt: (x, y) => this.terrain?.heightAt(x, y),
  }
  /**
   * Buffer of the ground query, null while the query is out
   */
  private groundBuffer: Float32Array<ArrayBuffer> | null = new Float32Array(GROUND_QUERY_STRIDE * 64)
  /**
   * The patrols of the query that is out, in buffer order
   */
  private sent: PatrolComponent[] = []
  /**
   * The patrols that want ground this frame
   */
  private wanting: PatrolComponent[] = []
  private readonly onGround = (count: number, buffer: Float32Array<ArrayBuffer>) => {
    for (let i = 0; i < count; i++) {
      this.sent[i].colliderGround = buffer[i * GROUND_QUERY_STRIDE]
    }
    this.sent.length = 0
    this.groundBuffer = buffer
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.time = world.getSystem(TimeSystem)
    this.config = world.getSystem(ViewerConfig)
    this.terrain = world.getSystem(TerrainSystem, GetComponent.Optional) ?? null
    this.world = world
    this.context.space = world.getSystem(SpaceBasis)
    this.patrols = world.query({ scope: 'active', required: [PatrolComponent] })
  }

  public override update(): void {
    const camera = this.game.scene?.getView(0)?.camera
    if (!camera) {
      return
    }
    const context = this.context
    mat4GetTranslation(camera.world, context.eye)
    // the game clock, a paused or fixed time stops the patrols with the animations
    context.dt = Math.min(this.time.game.delta, 0.25)
    if (context.dt <= 0) {
      return
    }
    context.animationDistance = this.config.value.animationDistance
    const wanting = this.wanting
    wanting.length = 0
    for (const entity of this.patrols) {
      const patrol = entity.component(PatrolComponent)
      patrol.update(context)
      if (patrol.wantsGround) {
        wanting.push(patrol)
      }
    }
    this.queryGround()
  }

  private queryGround() {
    // the collision system is added after this one, resolved lazily
    this.collision ??= this.world.getSystem(CollisionSystem, { optional: true }) ?? null
    const collision = this.collision
    if (!collision?.canQueryGround) {
      return
    }
    const wanting = this.wanting
    // collision chunks spawn while patrols need them
    collision.patrolsActive = wanting.length > 0
    if (!wanting.length || !this.groundBuffer) {
      return
    }
    let buffer = this.groundBuffer
    if (buffer.length < wanting.length * GROUND_QUERY_STRIDE) {
      buffer = new Float32Array(wanting.length * GROUND_QUERY_STRIDE * 2)
    }
    for (let i = 0; i < wanting.length; i++) {
      const probe = wanting[i].groundProbe
      const o = i * GROUND_QUERY_STRIDE
      const top = probe.z + GROUND_PROBE_HEIGHT
      buffer[o] = probe.x
      buffer[o + 1] = probe.y
      buffer[o + 2] = top
      buffer[o + 3] = top - GROUND_PROBE_LENGTH
      this.sent[i] = wanting[i]
    }
    this.sent.length = wanting.length
    if (collision.queryGround(buffer, wanting.length, this.onGround)) {
      this.groundBuffer = null
    } else {
      this.sent.length = 0
      this.groundBuffer = buffer
    }
  }

  public destroy(): void {
    if (this.collision) {
      this.collision.patrolsActive = false
    }
    this.terrain = null
    this.collision = null
    this.sent.length = 0
    this.wanting.length = 0
  }
}
