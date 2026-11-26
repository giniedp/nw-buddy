import {
  lerp,
  quat$initAxisAngle,
  quat$multiply,
  quat$premultiply,
  vec3,
  vec3$normalize,
  vec3ApplyQuat,
  vec3Cross,
  vec3Dot,
  vec3Length,
  vec4,
  vec4$normalize,
  type IVec3,
  type IVec4,
} from '@gglib/math'

/**
 * CryEngine helpers that gglib/math does not provide, built on gglib functions.
 * Conventions: quaternions are `IVec4` (x, y, z, w), Z is up.
 */

export const AXIS_X: Readonly<IVec3> = Object.freeze(vec3(1, 0, 0))
export const AXIS_Y: Readonly<IVec3> = Object.freeze(vec3(0, 1, 0))
export const AXIS_Z: Readonly<IVec3> = Object.freeze(vec3(0, 0, 1))

const tmpQ = vec4()
const tmpV = vec3()
const tmpAxis = vec3()

/**
 * Rotation from euler angles in radians in CryEngine order (`Quat::CreateRotationXYZ`): about X, then Y, then Z
 */
export function quat$initRotationXYZ(out: IVec4, x: number, y: number, z: number): IVec4 {
  quat$initAxisAngle(out, AXIS_Z, z)
  quat$multiply(out, quat$initAxisAngle(tmpQ, AXIS_Y, y))
  return quat$multiply(out, quat$initAxisAngle(tmpQ, AXIS_X, x))
}

/**
 * Shortest rotation from unit vector `from` to unit vector `to`
 */
export function quat$initFromTo(out: IVec4, from: IVec3, to: IVec3): IVec4 {
  const d = vec3Dot(from, to)
  if (d < -0.999999) {
    // opposite: half turn about any axis orthogonal to `from`
    const axis = vec3$normalize(vec3Cross(Math.abs(from.x) < 0.9 ? AXIS_X : AXIS_Y, from, tmpAxis))
    return quat$initAxisAngle(out, axis, Math.PI)
  }
  const axis = vec3Cross(from, to, tmpAxis)
  out.x = axis.x
  out.y = axis.y
  out.z = axis.z
  out.w = 1 + d
  return vec4$normalize(out)
}

/**
 * Rotates a quaternion so its Z axis points along the unit vector, CryEngine `RotateToUpVector`
 */
export function quat$rotateToUp(q: IVec4, up: IVec3): IVec4 {
  const z = vec3ApplyQuat(AXIS_Z, q, tmpV)
  quat$premultiply(q, quat$initFromTo(tmpQ, z, up))
  return vec4$normalize(q)
}

/**
 * Applies an angular velocity (radians per second, world space) over a time step, `Quat::exp(w * dt / 2) * q`
 */
export function quat$integrate(q: IVec4, w: IVec3, dt: number): IVec4 {
  const speed = vec3Length(w)
  if (speed < 1e-9) {
    return q
  }
  tmpV.x = w.x / speed
  tmpV.y = w.y / speed
  tmpV.z = w.z / speed
  quat$premultiply(q, quat$initAxisAngle(tmpQ, tmpV, speed * dt))
  return vec4$normalize(q)
}

/**
 * Uniform random number in the range
 */
export function random(min: number, max: number) {
  return lerp(min, max, Math.random())
}
