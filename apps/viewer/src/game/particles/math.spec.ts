import { vec3, vec3ApplyQuat, vec4, type IVec3 } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import { AXIS_X, AXIS_Z, quat$initFromTo, quat$initRotationXYZ, quat$integrate, quat$rotateToUp } from './math'

function expectVec(v: IVec3, x: number, y: number, z: number) {
  expect(v.x).toBeCloseTo(x)
  expect(v.y).toBeCloseTo(y)
  expect(v.z).toBeCloseTo(z)
}

describe('particles/math', () => {
  it('matches CryEngine Quat::CreateRotationXYZ', () => {
    // reference values of the CryEngine formula
    const [x, y, z] = [0.3, -0.7, 1.1]
    const [sx, cx, sy, cy, sz, cz] = [
      Math.sin(x / 2),
      Math.cos(x / 2),
      Math.sin(y / 2),
      Math.cos(y / 2),
      Math.sin(z / 2),
      Math.cos(z / 2),
    ]
    const q = quat$initRotationXYZ(vec4(), x, y, z)
    expect(q.w).toBeCloseTo(cz * cy * cx + sz * sy * sx)
    expect(q.x).toBeCloseTo(cz * cy * sx - sz * sy * cx)
    expect(q.y).toBeCloseTo(cz * sy * cx + sz * cy * sx)
    expect(q.z).toBeCloseTo(sz * cy * cx - cz * sy * sx)
  })

  it('rotates from one vector to another', () => {
    const to = vec3(0, 1, 0)
    expectVec(vec3ApplyQuat(AXIS_Z, quat$initFromTo(vec4(), AXIS_Z, to)), 0, 1, 0)
    // opposite vectors
    expectVec(vec3ApplyQuat(AXIS_Z, quat$initFromTo(vec4(), AXIS_Z, vec3(0, 0, -1))), 0, 0, -1)
  })

  it('rotates the up axis', () => {
    const q = quat$initRotationXYZ(vec4(), 0.4, 0.2, 0.1)
    quat$rotateToUp(q, AXIS_X)
    expectVec(vec3ApplyQuat(AXIS_Z, q), 1, 0, 0)
  })

  it('integrates angular velocity', () => {
    const q = vec4(0, 0, 0, 1)
    // a quarter turn about z in one second
    quat$integrate(q, vec3(0, 0, Math.PI / 2), 1)
    expectVec(vec3ApplyQuat(AXIS_X, q), 0, 1, 0)
  })
})
