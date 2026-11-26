import { mat4Identity, type Mat4 } from '@gglib/math'
import { describe, expect, it } from 'vitest'
import type { AdbProcedural } from '../../../formats/mannequin'
import {
  hitShapeFrame,
  hitShapeLabel,
  hitShapeOf,
  hitShapePrimitives,
  rotationOrder,
  type HitShapeConventions,
} from './hitShape'

function damage(params: Record<string, string>): AdbProcedural {
  return { type: 'CAGE-Damage', contextType: 'DamageContext', params }
}

// npc_alligator_anims.adb, Attack_Bite
const BITE = damage({
  ScaleX: '1',
  ScaleY: '1',
  ScaleZ: '1',
  OffsetX: '0',
  OffsetY: '0',
  OffsetZ: '-0.2',
  MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeCapsule',
  MeleeAttackShapeRadius: '0.80000001',
  MeleeAttackCapsuleHalfHeight: '0.93000001',
  MeleeAttackBoxDimensionsX: '1.5',
  MeleeAttackBoxDimensionsY: '1.5',
  MeleeAttackBoxDimensionsZ: '2',
  JointName: 'bind_mouth_web',
  xRotationOffset: '0',
  yRotationOffset: '0',
  zRotationOffset: '0',
  ShapeAxesModifierCommands: '',
  UseEndAsCenter: 'false',
})

// bruteanims.adb, Attack_Weapon_Overhead_Slam
const SLAM = damage({
  OffsetX: '0',
  OffsetY: '2',
  OffsetZ: '1',
  MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeBox',
  MeleeAttackBoxDimensionsX: '1.5',
  MeleeAttackBoxDimensionsY: '2.5',
  MeleeAttackBoxDimensionsZ: '2',
  JointName: 'Xform',
  xRotationOffset: '0',
  yRotationOffset: '0',
  zRotationOffset: '0',
  UseEndAsCenter: 'false',
})

const CONVENTIONS: HitShapeConventions = {
  order: rotationOrder('x y z'),
  axis: 'z',
  halfHeightWithCaps: false,
}

function point(m: Mat4, x: number, y: number, z: number): number[] {
  return [0, 1, 2].map((i) => {
    return Math.round((m[i] * x + m[4 + i] * y + m[8 + i] * z + m[12 + i]) * 1000) / 1000
  })
}

describe('hitShapeOf', () => {
  it('reads a capsule', () => {
    const shape = hitShapeOf(BITE)
    expect(shape).toMatchObject({
      type: 'capsule',
      joint: 'bind_mouth_web',
      offset: [0, 0, -0.2],
      rotation: [0, 0, 0],
      order: [],
      endAsCenter: false,
    })
    expect(shape.radius).toBeCloseTo(0.8)
    expect(shape.halfHeight).toBeCloseTo(0.93)
  })

  it('reads a box with full extents', () => {
    expect(hitShapeOf(SLAM)).toMatchObject({ type: 'box', size: [1.5, 2.5, 2], joint: 'Xform', offset: [0, 2, 1] })
  })

  it('skips weapon shapes, empty sizes and other procedurals', () => {
    expect(hitShapeOf(damage({ MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeNone', ScaleY: '15' }))).toBeNull()
    expect(hitShapeOf(damage({ MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeSphere' }))).toBeNull()
    expect(hitShapeOf({ type: 'CAGE-RangedAttack', contextType: '', params: {} })).toBeNull()
    expect(hitShapeOf(null)).toBeNull()
  })

  it('an empty joint is the character root', () => {
    const shape = hitShapeOf(
      damage({
        MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeSphere',
        MeleeAttackShapeRadius: '1',
        JointName: '',
      }),
    )
    expect(shape.joint).toBeNull()
  })
})

describe('hitShapeLabel', () => {
  it('describes the shape and its joint', () => {
    expect(hitShapeLabel(BITE)).toBe('capsule r 0.8 m, half height 0.93 m at bind_mouth_web')
    expect(hitShapeLabel(SLAM)).toBe('box 1.5 × 2.5 × 2 m at Xform')
    expect(
      hitShapeLabel(
        damage({ MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeSphere', MeleeAttackShapeRadius: '2' }),
      ),
    ).toBe('sphere r 2 m at root')
  })

  it('names weapon shapes, nothing for other procedurals', () => {
    expect(hitShapeLabel(damage({ MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeNone' }))).toBe('weapon shape')
    expect(hitShapeLabel({ type: 'Homing', contextType: '', params: {} })).toBeNull()
  })
})

describe('rotationOrder', () => {
  it('reads the axes commands', () => {
    expect(rotationOrder('z y x').map((it) => it.axis)).toEqual(['z', 'y', 'x'])
    expect(rotationOrder('zxy').map((it) => it.axis)).toEqual(['z', 'x', 'y'])
    expect(rotationOrder('y -z x')).toEqual([
      { axis: 'y', sign: 1 },
      { axis: 'z', sign: -1 },
      { axis: 'x', sign: 1 },
    ])
    expect(rotationOrder('')).toEqual([])
  })
})

describe('hitShapeFrame', () => {
  it('turns the shape axis forward and starts it at the offset', () => {
    // an Xform capsule: -90° about X turns +Z into +Y (forward), UseEndAsCenter starts it at the offset
    const shape = hitShapeOf(
      damage({
        MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeCapsule',
        MeleeAttackShapeRadius: '0.5',
        MeleeAttackCapsuleHalfHeight: '1',
        JointName: 'Xform',
        OffsetY: '0.5',
        OffsetZ: '1',
        xRotationOffset: '-90',
        UseEndAsCenter: 'true',
      }),
    )
    const frame = hitShapeFrame(shape, mat4Identity(), CONVENTIONS)
    // the end of the capsule (cylinder half 1 + cap 0.5) sits at the offset
    expect(point(frame, 0, 0, -1.5)).toEqual([0, 0.5, 1])
    expect(point(frame, 0, 0, 1.5)).toEqual([0, 3.5, 1])
  })

  it('applies the rotations in the given order', () => {
    const base = { MeleeAttackShapeCastType: 'MeleeAttackShapeCastTypeSphere', MeleeAttackShapeRadius: '1' }
    const xy = hitShapeOf(damage({ ...base, xRotationOffset: '90', yRotationOffset: '90' }))
    const yx = hitShapeOf(
      damage({ ...base, xRotationOffset: '90', yRotationOffset: '90', ShapeAxesModifierCommands: 'y x z' }),
    )
    const a = point(hitShapeFrame(xy, mat4Identity(), CONVENTIONS), 0, 0, 1)
    const b = point(hitShapeFrame(yx, mat4Identity(), CONVENTIONS), 0, 0, 1)
    expect(a).not.toEqual(b)
  })
})

describe('hitShapePrimitives', () => {
  it('builds a capsule from a cylinder and two spheres', () => {
    const shape = hitShapeOf(BITE)
    const emitted: Array<{ type: string; center: number[]; top: number[] }> = []
    hitShapePrimitives(
      shape,
      (type, m) => {
        emitted.push({ type, center: point(m, 0, 0, 0), top: point(m, 0, 0, 0.5) })
      },
      CONVENTIONS,
    )
    expect(emitted.map((it) => it.type)).toEqual(['cylinder', 'sphere', 'sphere'])
    expect(emitted[0].top).toEqual([0, 0, 0.93])
    expect(emitted[1].center).toEqual([0, 0, -0.93])
    expect(emitted[2].center).toEqual([0, 0, 0.93])
  })
})
