import type { TransformComponent } from '@gglib/components'
import type { GameEntity } from '@gglib/ecs'
import type { AnimationPose, AnimationRig } from '@gglib/model'
import type { ViewerCharacterWeapon } from '../../api'

/**
 * A weapon entity on a socket of its holder: a child of the holder's entity, placed at the socket's joint of the
 * holder's model pose × the socket × the equip type's offset
 */
export class CharacterWeapon {
  public readonly entity: GameEntity
  public readonly data: ViewerCharacterWeapon
  /**
   * The socket × offset relative to the joint: translation x, y, z and rotation x, y, z, w
   */
  private readonly position = new Float32Array(3)
  private readonly rotation = new Float32Array(4)
  /**
   * The holder's joint, -1 until a rig resolves it or when the rig lacks it
   */
  private joint = -1

  public constructor(entity: GameEntity, data: ViewerCharacterWeapon) {
    this.entity = entity
    this.data = data
    const [sx = 0, sy = 0, sz = 0] = data.socketPosition
    const [qx = 0, qy = 0, qz = 0, qw = 1] = data.socketRotation
    const offset = eulerDegreesToQuat(data.offsetRotation)
    const [ox = 0, oy = 0, oz = 0] = data.offsetPosition
    rotateVec(qx, qy, qz, qw, ox, oy, oz, this.position)
    this.position[0] += sx
    this.position[1] += sy
    this.position[2] += sz
    multiplyQuat(qx, qy, qz, qw, offset[0], offset[1], offset[2], offset[3], this.rotation)
  }

  /**
   * Resolves the joint by name (ignoring case when the exact name is missing)
   */
  public bind(rig: AnimationRig) {
    this.joint = rig.names.indexOf(this.data.joint)
    if (this.joint < 0) {
      const name = this.data.joint.toLowerCase()
      this.joint = rig.names.findIndex((it) => it.toLowerCase() === name)
    }
  }

  /**
   * Moves the weapon to its socket in the holder's model pose
   */
  public place(pose: AnimationPose) {
    const j = this.joint
    if (j < 0) {
      return
    }
    const transform = this.entity.getTransform<TransformComponent>()
    const t = pose.translations
    const r = pose.rotations
    const jx = r[j * 4]
    const jy = r[j * 4 + 1]
    const jz = r[j * 4 + 2]
    const jw = r[j * 4 + 3]
    const p = this.position
    const q = this.rotation
    rotateVec(jx, jy, jz, jw, p[0], p[1], p[2], scratch)
    transform.translation.x = t[j * 3] + scratch[0]
    transform.translation.y = t[j * 3 + 1] + scratch[1]
    transform.translation.z = t[j * 3 + 2] + scratch[2]
    multiplyQuat(jx, jy, jz, jw, q[0], q[1], q[2], q[3], scratch)
    transform.rotation.x = scratch[0]
    transform.rotation.y = scratch[1]
    transform.rotation.z = scratch[2]
    transform.rotation.w = scratch[3]
    transform.markAsChanged()
  }
}

const scratch = new Float32Array(4)

/**
 * The quaternion of rotations in degrees about x, then y, then z (R = Rz · Ry · Rx)
 */
function eulerDegreesToQuat(degrees: number[]): Float32Array {
  const [x = 0, y = 0, z = 0] = degrees.map((it) => (it * Math.PI) / 360)
  const cx = Math.cos(x)
  const sx = Math.sin(x)
  const cy = Math.cos(y)
  const sy = Math.sin(y)
  const cz = Math.cos(z)
  const sz = Math.sin(z)
  const zy = new Float32Array(4)
  multiplyQuat(0, 0, sz, cz, 0, sy, 0, cy, zy)
  const result = new Float32Array(4)
  multiplyQuat(zy[0], zy[1], zy[2], zy[3], sx, 0, 0, cx, result)
  return result
}

/**
 * a · b into out (x, y, z, w)
 */
function multiplyQuat(
  ax: number,
  ay: number,
  az: number,
  aw: number,
  bx: number,
  by: number,
  bz: number,
  bw: number,
  out: Float32Array,
) {
  out[0] = aw * bx + ax * bw + ay * bz - az * by
  out[1] = aw * by - ax * bz + ay * bw + az * bx
  out[2] = aw * bz + ax * by - ay * bx + az * bw
  out[3] = aw * bw - ax * bx - ay * by - az * bz
}

/**
 * The vector rotated by the quaternion into out
 */
function rotateVec(qx: number, qy: number, qz: number, qw: number, x: number, y: number, z: number, out: Float32Array) {
  // t = 2 q × v, v' = v + w t + q × t
  const tx = 2 * (qy * z - qz * y)
  const ty = 2 * (qz * x - qx * z)
  const tz = 2 * (qx * y - qy * x)
  out[0] = x + qw * tx + (qy * tz - qz * ty)
  out[1] = y + qw * ty + (qz * tx - qx * tz)
  out[2] = z + qw * tz + (qx * ty - qy * tx)
}
