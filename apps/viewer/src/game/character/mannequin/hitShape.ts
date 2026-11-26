import {
  DEGREE_TO_RAD,
  mat4$initIdentity,
  mat4$initRotationX,
  mat4$initRotationY,
  mat4$initRotationZ,
  mat4$initScaleXYZ,
  mat4$initTranslationXYZ,
  mat4$multiply,
  mat4Identity,
  type Mat4,
} from '@gglib/math'
import type { AdbProcedural } from '../../../formats/mannequin'

/**
 * The procedural type of a melee hit
 */
export const CAGE_DAMAGE = 'CAGE-Damage'

export type HitShapeType = 'sphere' | 'capsule' | 'box' | 'cylinder'

export type Axis = 'x' | 'y' | 'z'

/**
 * One rotation of a {@link HitShape.order}: the axis and the sign of its angle
 */
export interface HitShapeRotation {
  axis: Axis
  sign: 1 | -1
}

/**
 * The melee hit shape of a `CAGE-Damage` procedural, in the game axes (Z up, +Y forward) of its joint
 */
export interface HitShape {
  type: HitShapeType
  /**
   * Sphere, capsule and cylinder radius
   */
  radius: number
  /**
   * Capsule and cylinder half height
   */
  halfHeight: number
  /**
   * Box size, full extents
   */
  size: [number, number, number]
  /**
   * The joint the shape follows, null for the character root
   */
  joint: string | null
  offset: [number, number, number]
  /**
   * Euler angles in degrees
   */
  rotation: [number, number, number]
  /**
   * The order of the Euler rotations (`ShapeAxesModifierCommands`), multiplied left to right
   */
  order: HitShapeRotation[]
  /**
   * The shape starts at the offset and extends along its +Z axis, instead of being centered there
   */
  endAsCenter: boolean
}

/**
 * How the shape params are read, the parts the data does not settle
 */
export interface HitShapeConventions {
  /**
   * The rotation order without `ShapeAxesModifierCommands`
   */
  order: HitShapeRotation[]
  /**
   * The local axis of capsules and cylinders
   */
  axis: Axis
  /**
   * The capsule's half height includes its caps (else it is half of the cylinder part)
   */
  halfHeightWithCaps: boolean
}

const HIT_SHAPE_CONVENTIONS: HitShapeConventions = {
  order: [
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: 1 },
  ],
  axis: 'z',
  halfHeightWithCaps: false,
}

const TYPE_PREFIX = 'MeleeAttackShapeCastType'

/**
 * The hit shape of a procedural, null for other procedurals, shapes without a primitive (`None`: the weapon's shape)
 * and empty sizes
 */
export function hitShapeOf(procedural: AdbProcedural | null): HitShape | null {
  if (procedural?.type !== CAGE_DAMAGE) {
    return null
  }
  const params = procedural.params
  const type = castType(text(params['MeleeAttackShapeCastType']))
  if (!type) {
    return null
  }
  const shape: HitShape = {
    type,
    radius: num(params['MeleeAttackShapeRadius']),
    halfHeight: num(params['MeleeAttackCapsuleHalfHeight']),
    size: [
      num(params['MeleeAttackBoxDimensionsX']),
      num(params['MeleeAttackBoxDimensionsY']),
      num(params['MeleeAttackBoxDimensionsZ']),
    ],
    joint: text(params['JointName']).trim() || null,
    offset: [num(params['OffsetX']), num(params['OffsetY']), num(params['OffsetZ'])],
    rotation: [num(params['xRotationOffset']), num(params['yRotationOffset']), num(params['zRotationOffset'])],
    order: rotationOrder(text(params['ShapeAxesModifierCommands'])),
    endAsCenter: text(params['UseEndAsCenter']) === 'true',
  }
  return hasSize(shape) ? shape : null
}

/**
 * The hit shape of a `CAGE-Damage` procedural as text, e.g. `capsule r 0.8 m, half height 0.93 m at bind_mouth_web`;
 * `weapon shape` when it uses the weapon's shape, null for other procedurals
 */
export function hitShapeLabel(procedural: AdbProcedural | null): string | null {
  if (procedural?.type !== CAGE_DAMAGE) {
    return null
  }
  const shape = hitShapeOf(procedural)
  if (!shape) {
    return castType(text(procedural.params['MeleeAttackShapeCastType'])) ? null : 'weapon shape'
  }
  const at = ` at ${shape.joint ?? 'root'}`
  switch (shape.type) {
    case 'sphere': {
      return `sphere r ${meters(shape.radius)} m${at}`
    }
    case 'box': {
      return `box ${shape.size.map(meters).join(' × ')} m${at}`
    }
    default: {
      return `${shape.type} r ${meters(shape.radius)} m, half height ${meters(shape.halfHeight)} m${at}`
    }
  }
}

function meters(value: number): string {
  return String(Math.round(value * 100) / 100)
}

/**
 * The rotation order of `ShapeAxesModifierCommands`, e.g. `z y x`, `zyx`, `y -z x`; empty for none
 */
export function rotationOrder(value: string): HitShapeRotation[] {
  const result: HitShapeRotation[] = []
  for (const match of value.toLowerCase().matchAll(/(-?)\s*([xyz])/g)) {
    result.push({ axis: match[2] as Axis, sign: match[1] ? -1 : 1 })
  }
  return result.length === 3 ? result : []
}

const tmp = mat4Identity()

/**
 * The shape's frame in its joint's game axes: offset, rotation and, for {@link HitShape.endAsCenter}, the shift that
 * puts the shape's start at the offset
 */
export function hitShapeFrame(
  shape: HitShape,
  out: Mat4,
  conventions: HitShapeConventions = HIT_SHAPE_CONVENTIONS,
): Mat4 {
  mat4$initTranslationXYZ(out, shape.offset[0], shape.offset[1], shape.offset[2])
  const order = shape.order.length ? shape.order : conventions.order
  for (const { axis, sign } of order) {
    const angle = shape.rotation[AXIS_INDEX[axis]] * sign * DEGREE_TO_RAD
    mat4$multiply(out, rotation(axis, angle))
  }
  if (shape.endAsCenter) {
    mat4$multiply(out, mat4$initTranslationXYZ(tmp, 0, 0, halfLength(shape, conventions)))
  }
  return out
}

/**
 * Calls back with the unit primitives of a shape (debug mesh shapes: sphere of radius 1, box of size 1, cylinder of
 * radius 1 and height 1 along Z, all centered) in the shape's frame. The matrix is reused between calls.
 */
export function hitShapePrimitives(
  shape: HitShape,
  emit: (type: 'sphere' | 'box' | 'cylinder', local: Mat4) => void,
  conventions: HitShapeConventions = HIT_SHAPE_CONVENTIONS,
) {
  const m = primitive
  const r = shape.radius
  switch (shape.type) {
    case 'sphere': {
      emit('sphere', mat4$initScaleXYZ(m, r, r, r))
      return
    }
    case 'box': {
      emit('box', mat4$initScaleXYZ(m, shape.size[0], shape.size[1], shape.size[2]))
      return
    }
    case 'cylinder': {
      axisFrame(m, conventions.axis)
      emit('cylinder', mat4$multiply(m, mat4$initScaleXYZ(tmp, r, r, shape.halfHeight * 2)))
      return
    }
    case 'capsule': {
      const half = conventions.halfHeightWithCaps ? Math.max(0, shape.halfHeight - r) : shape.halfHeight
      axisFrame(m, conventions.axis)
      emit('cylinder', mat4$multiply(m, mat4$initScaleXYZ(tmp, r, r, half * 2)))
      for (const end of CAPSULE_ENDS) {
        axisFrame(m, conventions.axis)
        mat4$multiply(m, mat4$initTranslationXYZ(tmp, 0, 0, half * end))
        emit('sphere', mat4$multiply(m, mat4$initScaleXYZ(tmp, r, r, r)))
      }
      return
    }
  }
}

const AXIS_INDEX: Record<Axis, number> = { x: 0, y: 1, z: 2 }
const CAPSULE_ENDS = [-1, 1]
const primitive = mat4Identity()
const rotationTmp = mat4Identity()

function rotation(axis: Axis, angle: number): Mat4 {
  switch (axis) {
    case 'x': {
      return mat4$initRotationX(rotationTmp, angle)
    }
    case 'y': {
      return mat4$initRotationY(rotationTmp, angle)
    }
    default: {
      return mat4$initRotationZ(rotationTmp, angle)
    }
  }
}

/**
 * A frame whose Z is the given axis
 */
function axisFrame(out: Mat4, axis: Axis): Mat4 {
  switch (axis) {
    case 'x': {
      return mat4$initRotationY(out, Math.PI / 2)
    }
    case 'y': {
      return mat4$initRotationX(out, -Math.PI / 2)
    }
    default: {
      return mat4$initIdentity(out)
    }
  }
}

/**
 * Half the shape's length along its frame's Z axis
 */
function halfLength(shape: HitShape, conventions: HitShapeConventions): number {
  switch (shape.type) {
    case 'box': {
      return shape.size[2] / 2
    }
    case 'sphere': {
      return shape.radius
    }
    case 'cylinder': {
      return shape.halfHeight
    }
    case 'capsule': {
      return conventions.halfHeightWithCaps ? shape.halfHeight : shape.halfHeight + shape.radius
    }
  }
}

function hasSize(shape: HitShape): boolean {
  switch (shape.type) {
    case 'box': {
      return shape.size.every((it) => it > 0)
    }
    default: {
      return shape.radius > 0
    }
  }
}

function castType(value: string): HitShapeType | null {
  const name = value.startsWith(TYPE_PREFIX) ? value.slice(TYPE_PREFIX.length) : value
  switch (name.toLowerCase()) {
    case 'sphere':
    case 'capsule':
    case 'box':
    case 'cylinder': {
      return name.toLowerCase() as HitShapeType
    }
    default: {
      return null
    }
  }
}

function text(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(' ')
  }
  return value ?? ''
}

function num(value: string | string[] | undefined): number {
  const result = Number.parseFloat(text(value))
  return Number.isFinite(result) ? result : 0
}
