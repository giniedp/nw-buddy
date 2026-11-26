import type { TransformComponent } from '@gglib/components'
import { GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import {
  mat4,
  mat4CreateFromArray,
  mat4Invert,
  mat4Multiply,
  quat$initAxisAngle,
  quatMultiply,
  vec3,
  vec3ApplyMat4,
  vec4,
  type IVec3,
  type Mat4,
  type SpaceBasis,
} from '@gglib/math'
import type { Mat4Data, ViewerPatrolPath } from '../../api'
import {
  GROUND_PROBE_HEIGHT,
  GROUND_PROBE_LENGTH,
  GROUND_SETTLE_TIMEOUT,
  GROUND_SNAP_HEIGHT,
  PATROL_ARRIVE_DISTANCE,
  PATROL_SPEED,
  PATROL_TURN_RATE,
} from '../../constants'
import { MotionParam } from '../character/blendSpace'
import { CharacterComponent } from '../character/CharacterComponent'
import { nextWaypoint, turnToward, waypointWait, type PatrolStep } from './patrol'

/**
 * How often a patrol looks for its character while the spawned slice loads, seconds
 */
const CHARACTER_SEARCH_INTERVAL = 0.5

/**
 * What a patrol reads from the world each frame, see {@link PatrolSystem}
 */
export interface PatrolContext {
  /**
   * Seconds of game time since the last frame
   */
  dt: number
  eye: IVec3
  /**
   * Characters within this distance animate, the others hold still
   */
  animationDistance: number
  space: SpaceBasis
  /**
   * Terrain height at a world position, undefined without terrain there
   */
  heightAt: (x: number, y: number) => number | undefined
}

interface Waypoint {
  x: number
  y: number
  z: number
  /**
   * The facing of the waypoint, radians about up from forward
   */
  heading: number
  task: string
  minDuration: number
  maxDuration: number
  matchAlignment: boolean
  /**
   * The waypoint lies on the terrain: a patrol toward it follows the terrain height
   */
  onTerrain: boolean
}

/**
 * The patrol of a point spawner (`m_patrolPathEntity`): moves the spawner entity, and with it the actor it spawned,
 * along the path's waypoints. At each waypoint the actor runs the waypoint's task fragment for its duration, then walks
 * on by the path's policy. Walking plays the `Move` fragment; the step is the root
 * motion of the walk clip, so the feet do not slide. An `onGround` spawner also stands its actor on the ground.
 *
 * @remarks
 * Paths are straight lines between waypoints (no navigation mesh). The patrol runs only while its character animates
 * (within the animation distance): farther actors hold still like their pose.
 */
export class PatrolComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly path: ViewerPatrolPath
  /**
   * The character of the spawned actor, null until it loaded
   */
  public character: CharacterComponent | null = null
  /**
   * Set while the patrol walks a segment off the terrain: it needs the collider ground below {@link groundProbe}
   */
  public wantsGround = false
  /**
   * Where the patrol probes the ground: x, y and the feet height
   */
  public readonly groundProbe = vec3()
  /**
   * Highest collider hit of the latest answered ground probe, NaN without a hit or answer
   */
  public colliderGround = Number.NaN
  /**
   * The root motion travel of the walk clip in the last walked frame, 0 when the clip does not move its root (the
   * patrol then steps by {@link PATROL_SPEED})
   */
  public rootTravel = 0

  /**
   * The slice space transform of the spawner entity, maps the waypoints (slice space) to the world
   */
  private readonly sliceTransform: Mat4Data
  private waypoints: Waypoint[] | null = null
  private readonly step: PatrolStep = { index: 0, direction: 1 }
  private state: 'walk' | 'wait' = 'walk'
  private waitLeft = 0
  private searchLeft = 0
  private fragment = ''
  private readonly position = vec3()
  private heading = 0
  /**
   * The segment the patrol walks: its start, for the height between the waypoints
   */
  private readonly from = vec3()
  private fromOnTerrain = false
  private readonly quat = vec4()
  private readonly local = vec3()
  /**
   * The spawner stands its spawn on the ground under the spawn point (NavMeshConstraintComponent)
   */
  private readonly onGround: boolean
  /**
   * The height of the spawn point, where the settle probes from
   */
  private spawnZ = 0
  /**
   * Seconds the settle still waits for collider ground, 0 when it is done
   */
  private settleLeft = 0
  /**
   * The actor stands on probed ground
   */
  private grounded = false

  public constructor(path: ViewerPatrolPath, sliceTransform: Mat4Data, onGround = false) {
    this.path = path
    this.sliceTransform = sliceTransform
    this.onGround = onGround
  }

  public update(ctx: PatrolContext): void {
    this.wantsGround = false
    if (!this.findCharacter(ctx.dt)) {
      return
    }
    const world = this.entity.getTransform().world
    const dx = world[12] - ctx.eye.x
    const dy = world[13] - ctx.eye.y
    const dz = world[14] - ctx.eye.z
    if (dx * dx + dy * dy + dz * dz > ctx.animationDistance * ctx.animationDistance) {
      return
    }
    const waypoints = this.waypoints ?? this.start(ctx)
    if (waypoints.length && this.state === 'wait') {
      this.waitAt(waypoints[this.step.index], ctx)
    } else if (waypoints.length) {
      this.walk(waypoints[this.step.index], ctx)
    }
    if (this.settleLeft > 0) {
      this.settle(ctx)
    }
    if (waypoints.length || this.onGround) {
      this.place(ctx.space)
    }
  }

  /**
   * Stands the spawn on the ground the probe from the spawn point finds. Probes until a collider hit arrives or
   * {@link GROUND_SETTLE_TIMEOUT} passes, the best ground so far holds the feet.
   */
  private settle(ctx: PatrolContext) {
    this.settleLeft -= ctx.dt
    if (this.state === 'walk' && this.waypoints.length) {
      return
    }
    const x = this.position.x
    const y = this.position.y
    const top = this.spawnZ + GROUND_PROBE_HEIGHT
    const hasCollider = this.colliderGround > top - GROUND_PROBE_LENGTH && this.colliderGround <= top
    const ground = this.probeGround(x, y, ctx.heightAt(x, y), this.spawnZ)
    if (!Number.isNaN(ground)) {
      this.position.z = ground
      this.grounded = true
    }
    if (hasCollider || this.settleLeft <= 0) {
      this.settleLeft = 0
    }
  }

  /**
   * Maps the waypoints to the world once the entity is placed, starts from the entity's position and facing
   */
  private start(ctx: PatrolContext): Waypoint[] {
    const space = ctx.space
    const world = this.entity.getTransform().world
    const sliceToWorld = mat4Multiply(world, mat4Invert(mat4CreateFromArray(this.sliceTransform)))
    const m = mat4()
    this.waypoints = this.path.waypoints.map((it) => {
      mat4Multiply(sliceToWorld, mat4CreateFromArray(it.transform), m)
      const terrain = ctx.heightAt(m[12], m[13])
      return {
        x: m[12],
        y: m[13],
        z: m[14],
        heading: headingOf(m, space),
        task: it.task ?? '',
        minDuration: it.minDuration,
        maxDuration: it.maxDuration,
        matchAlignment: !!it.matchAlignment,
        onTerrain: terrain !== undefined && Math.abs(m[14] - terrain) <= GROUND_SNAP_HEIGHT,
      }
    })
    this.position.x = world[12]
    this.position.y = world[13]
    this.position.z = world[14]
    this.spawnZ = world[14]
    this.grounded = false
    this.settleLeft = this.onGround ? GROUND_SETTLE_TIMEOUT : 0
    this.heading = headingOf(world, space)
    this.beginSegment(ctx)
    return this.waypoints
  }

  private beginSegment(ctx: PatrolContext) {
    this.from.x = this.position.x
    this.from.y = this.position.y
    this.from.z = this.position.z
    const terrain = ctx.heightAt(this.from.x, this.from.y)
    this.fromOnTerrain = terrain !== undefined && Math.abs(this.from.z - terrain) <= GROUND_SNAP_HEIGHT
    this.state = 'walk'
  }

  private walk(target: Waypoint, ctx: PatrolContext) {
    const character = this.character
    this.play('Move')
    character.motion.params[MotionParam.TravelSpeed] = PATROL_SPEED

    const tx = target.x - this.position.x
    const ty = target.y - this.position.y
    const distance = Math.hypot(tx, ty)

    // the walk clip's travel this frame, the speed when the clip does not move its root
    const root = character.rootMotion
    let travel = Math.hypot(root[0], root[1])
    this.rootTravel = travel
    root.fill(0)
    if (travel <= 1e-5) {
      travel = PATROL_SPEED * ctx.dt
    }

    if (distance > 1e-5) {
      const space = ctx.space
      const desired = headingToward(tx / distance, ty / distance, space)
      this.heading = turnToward(this.heading, desired, PATROL_TURN_RATE * ctx.dt)
    }
    if (distance <= PATROL_ARRIVE_DISTANCE || travel >= distance) {
      this.arrive(target, ctx)
      return
    }
    this.position.x += (tx / distance) * travel
    this.position.y += (ty / distance) * travel
    this.position.z = this.heightBetween(target, ctx)
  }

  /**
   * The height of the walk: on the terrain when both ends of the segment are. Else the game's ground probe, a ray from
   * {@link GROUND_PROBE_HEIGHT} above the feet over {@link GROUND_PROBE_LENGTH}, whose first hit of terrain and
   * colliders is the ground; between the ends by the progress while the probe has no hit.
   */
  private heightBetween(target: Waypoint, ctx: PatrolContext): number {
    const x = this.position.x
    const y = this.position.y
    const terrain = ctx.heightAt(x, y)
    if (this.fromOnTerrain && target.onTerrain && terrain !== undefined) {
      return terrain
    }

    const ground = this.probeGround(x, y, terrain)
    if (!Number.isNaN(ground)) {
      return ground
    }
    const total = Math.hypot(target.x - this.from.x, target.y - this.from.y)
    const left = Math.hypot(target.x - x, target.y - y)
    const t = total > 1e-5 ? 1 - left / total : 1
    return this.from.z + (target.z - this.from.z) * t
  }

  /**
   * The game's ground probe below (x, y) from the feet of the previous frame: the first hit of terrain and the
   * latest collider answer, NaN without a hit. Asks for the collider ground at (x, y) for the next frames.
   */
  private probeGround(x: number, y: number, terrain: number | undefined, feet = this.position.z): number {
    this.wantsGround = true
    this.groundProbe.x = x
    this.groundProbe.y = y
    this.groundProbe.z = feet

    const top = feet + GROUND_PROBE_HEIGHT
    const bottom = top - GROUND_PROBE_LENGTH
    let ground = Number.NaN
    if (terrain !== undefined && terrain <= top && terrain > bottom) {
      ground = terrain
    }
    if (this.colliderGround > bottom && this.colliderGround <= top && !(this.colliderGround <= ground)) {
      ground = this.colliderGround
    }
    return ground
  }

  private arrive(target: Waypoint, ctx: PatrolContext) {
    const terrain = ctx.heightAt(target.x, target.y)
    let z = target.z
    if (target.onTerrain && terrain !== undefined) {
      z = terrain
    } else if (this.waypoints.length > 1 || this.onGround) {
      // off the terrain the probe holds the feet on the floor, as on the way
      const ground = this.probeGround(target.x, target.y, terrain)
      if (!Number.isNaN(ground)) {
        z = ground
      } else if (this.grounded) {
        // a grounded spawn keeps its floor while the probe has no answer
        z = this.position.z
      }
    }
    this.position.x = target.x
    this.position.y = target.y
    this.position.z = z
    this.waitLeft = waypointWait(target.task, target.minDuration, target.maxDuration, Math.random)
    // a one waypoint path stays at it
    if (this.waypoints.length < 2) {
      this.waitLeft = -1
    }
    this.play(target.task || 'Idle')
    this.state = 'wait'
  }

  private waitAt(target: Waypoint, ctx: PatrolContext) {
    this.character.rootMotion.fill(0)
    if (target.matchAlignment) {
      this.heading = turnToward(this.heading, target.heading, PATROL_TURN_RATE * ctx.dt)
    }
    if (this.waitLeft < 0) {
      return
    }
    this.waitLeft -= ctx.dt
    if (this.waitLeft > 0) {
      return
    }
    nextWaypoint(this.path.policy, this.waypoints.length, this.step, Math.random)
    this.beginSegment(ctx)
  }

  /**
   * Plays a fragment of the character's Mannequin database, `Idle` when the database has no fragment of that name
   * (e.g. a task)
   */
  private play(fragment: string) {
    const mannequin = this.character?.mannequin
    if (!mannequin || this.fragment === fragment) {
      return
    }
    this.fragment = fragment
    void mannequin.queue(fragment).then((ok) => {
      if (!ok && fragment !== 'Idle' && this.fragment === fragment) {
        this.fragment = 'Idle'
        void mannequin.queue('Idle')
      }
    })
  }

  /**
   * Writes the position and facing into the entity's local transform
   */
  private place(space: SpaceBasis) {
    const transform = this.entity.getTransform<TransformComponent>()
    quat$initAxisAngle(this.quat, space.up, this.heading)
    const parent = transform.parent
    if (parent) {
      vec3ApplyMat4(this.position, parent.worldInverse, this.local)
      quatMultiply(parent.worldRotationInverse, this.quat, this.quat)
    } else {
      this.local.x = this.position.x
      this.local.y = this.position.y
      this.local.z = this.position.z
    }
    transform.setPositionV(this.local)
    transform.setRotation(this.quat)
  }

  /**
   * Looks for the character of the spawned actor among the entity's descendants, every
   * {@link CHARACTER_SEARCH_INTERVAL} until one is found
   */
  private findCharacter(dt: number): boolean {
    if (this.character && !this.character.entity.isDestroyed) {
      return true
    }
    this.character = null
    this.waypoints = null
    this.colliderGround = Number.NaN
    this.searchLeft -= dt
    if (this.searchLeft > 0) {
      return false
    }
    this.searchLeft = CHARACTER_SEARCH_INTERVAL
    this.character = findCharacter(this.entity)
    return !!this.character
  }
}

function findCharacter(entity: GameEntity): CharacterComponent | null {
  for (const child of entity.getTransform().children) {
    const found = child.entity.component(CharacterComponent, GetComponent.Optional) ?? findCharacter(child.entity)
    if (found) {
      return found
    }
  }
  return null
}

/**
 * Heading of a direction across the ground: radians about up from forward (the inverse of the rotation about up)
 */
function headingToward(x: number, y: number, space: SpaceBasis): number {
  const right = space.right
  const forward = space.forward
  return Math.atan2(-(x * right.x + y * right.y), x * forward.x + y * forward.y)
}

/**
 * Heading of a transform: where it turns the forward axis, across the ground
 */
function headingOf(m: Mat4, space: SpaceBasis): number {
  const f = space.forward
  const x = m[0] * f.x + m[4] * f.y + m[8] * f.z
  const y = m[1] * f.x + m[5] * f.y + m[9] * f.z
  return headingToward(x, y, space)
}
