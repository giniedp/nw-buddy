import type { SpaceBasis } from '@gglib/math'

/**
 * Steps a second over which an exponential turn rate compounds
 */
export const EXPONENTIAL_TURN_STEPS = 30

/**
 * A local direction or velocity: `x` right, `y` forward, `z` up (the CAGE character frame)
 */
export interface LocalVec {
  x: number
  y: number
  z: number
}

/**
 * The motion state the CAGE motion activities write and the third person movement reads: the last set velocity (world), the facing, and whether the animation's
 * root motion moves the character this step.
 *
 * @remarks
 * Angles are radians about the space's up axis, measured from its forward axis towards the left: a positive yaw
 * turns forward to the left. The view yaw is the camera's, the facing the character's.
 */
export class CageMotion {
  public readonly space: SpaceBasis
  /**
   * The last set velocity, world, m/s
   */
  public readonly velocity = { x: 0, y: 0, z: 0 }
  /**
   * The character's facing
   */
  public yaw = 0
  /**
   * The camera's horizontal view direction
   */
  public viewYaw = 0
  /**
   * `AnimationDrivenMotion` ran this step: the root motion, times {@link rootMotionMultiplier}, plus the inherited
   * velocity move the character instead of {@link velocity}
   */
  public animationDriven = false
  public rootMotionMultiplier = 1
  /**
   * The share of the root's turn the character takes while animation driven (`RotationMultiplier`)
   */
  public rootRotationMultiplier = 0
  /**
   * The velocity an `AnimationDrivenMotion` with `InheritVelocity` carries on (world)
   */
  public readonly inherited = { x: 0, y: 0, z: 0 }

  public constructor(space: SpaceBasis) {
    this.space = space
  }

  /**
   * Called before the activities update: no activity drove the motion yet
   */
  public beginStep() {
    this.animationDriven = false
    this.rootMotionMultiplier = 1
    this.rootRotationMultiplier = 0
  }

  /**
   * `ClearMotion`: no velocity, nothing inherited
   */
  public clear() {
    this.setWorldVelocity(0, 0, 0)
    this.inherited.x = 0
    this.inherited.y = 0
    this.inherited.z = 0
  }

  public setWorldVelocity(x: number, y: number, z: number) {
    this.velocity.x = x
    this.velocity.y = y
    this.velocity.z = z
  }

  /**
   * The horizontal speed of the last set velocity (`MoveSpeed` reads it)
   */
  public get horizontalSpeed(): number {
    const up = this.space.up
    const v = this.velocity
    const along = v.x * up.x + v.y * up.y + v.z * up.z
    return Math.hypot(v.x - up.x * along, v.y - up.y * along, v.z - up.z * along)
  }

  /**
   * A world vector in the frame of a yaw (`x` right, `y` forward, `z` up)
   */
  public toLocal(yaw: number, x: number, y: number, z: number, out: LocalVec): LocalVec {
    const { forward: f, right: r, up: u } = this.space
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    // forward(yaw) = c F - s R, right(yaw) = c R + s F
    const fx = c * f.x - s * r.x
    const fy = c * f.y - s * r.y
    const fz = c * f.z - s * r.z
    const rx = c * r.x + s * f.x
    const ry = c * r.y + s * f.y
    const rz = c * r.z + s * f.z
    out.x = x * rx + y * ry + z * rz
    out.y = x * fx + y * fy + z * fz
    out.z = x * u.x + y * u.y + z * u.z
    return out
  }

  /**
   * A vector of a yaw's frame in world space
   */
  public toWorld(yaw: number, local: LocalVec, out: LocalVec): LocalVec {
    const { forward: f, right: r, up: u } = this.space
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    const fx = c * f.x - s * r.x
    const fy = c * f.y - s * r.y
    const fz = c * f.z - s * r.z
    const rx = c * r.x + s * f.x
    const ry = c * r.y + s * f.y
    const rz = c * r.z + s * f.z
    const { x, y, z } = local
    out.x = x * rx + y * fx + z * u.x
    out.y = x * ry + y * fy + z * u.y
    out.z = x * rz + y * fz + z * u.z
    return out
  }

  /**
   * The yaw of a direction of a yaw's frame (`x` right, `y` forward); NaN for no direction
   */
  public yawOf(frameYaw: number, x: number, y: number): number {
    if (Math.abs(x) <= 1e-7 && Math.abs(y) <= 1e-7) {
      return NaN
    }
    // a direction to the right turns clockwise, a negative yaw
    return frameYaw + Math.atan2(-x, y)
  }

  /**
   * Turns the facing towards a yaw: a share of the angle compounded over the step at an exponential rate, else the
   * rate in degrees a second, never past the target
   */
  public turnToward(target: number, rate: number, exponential: boolean, dt: number) {
    if (!Number.isFinite(target)) {
      return
    }
    let delta = target - this.yaw
    delta -= Math.round(delta / (2 * Math.PI)) * 2 * Math.PI
    const angle = Math.abs(delta)
    let step: number
    if (exponential) {
      const kept = Math.pow(Math.max(0, 1 - rate), dt * EXPONENTIAL_TURN_STEPS)
      step = (1 - kept) * angle
    } else {
      step = rate * (Math.PI / 180) * dt
    }
    this.yaw += Math.sign(delta) * Math.min(angle, step)
  }
}

/**
 * The step of a velocity towards its target at per axis rates, never past the target
 */
export function approach(difference: LocalVec, rate: LocalVec, dt: number, out: LocalVec): LocalVec {
  const length = Math.hypot(difference.x, difference.y, difference.z)
  if (length <= 1e-7) {
    out.x = difference.x
    out.y = difference.y
    out.z = difference.z
    return out
  }
  const dx = difference.x / length
  const dy = difference.y / length
  const dz = difference.z / length
  const step = Math.hypot(rate.x * dx, rate.y * dy, rate.z * dz) * dt
  if (length < step) {
    out.x = difference.x
    out.y = difference.y
    out.z = difference.z
  } else {
    out.x = dx * step
    out.y = dy * step
    out.z = dz * step
  }
  return out
}
