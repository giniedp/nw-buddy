import { vec3 } from '@gglib/math'
import type { AnimationPose, AnimationRig } from '@gglib/model'
import { DebugLayer, type DebugShapeComponent, type DebugShapeEntry } from '../debug/DebugShapeComponent'

/**
 * Radius of a joint sphere and thickness of a bone, in meters
 */
const JOINT_RADIUS = 0.012
const BONE_THICKNESS = 0.006

/**
 * The skeleton of a character as debug shapes on its {@link DebugShapeComponent}: a sphere per joint and a thin box
 * per bone (joint to parent), on {@link DebugLayer.Skeleton}
 *
 * @remarks
 * The instance matrices are written in place from a model space pose ({@link update}), the debug shape system puts
 * them into the entity's world.
 */
export class SkeletonShapes {
  private readonly rig: AnimationRig
  private readonly joints: Float32Array[]
  private readonly bones: Float32Array[]
  /**
   * The joint of each bone instance
   */
  private readonly boneJoints: Int16Array
  private readonly entries: DebugShapeEntry[]
  private readonly debug: DebugShapeComponent

  public constructor(debug: DebugShapeComponent, rig: AnimationRig, visibleIf: () => boolean) {
    this.rig = rig
    this.debug = debug
    const boneJoints: number[] = []
    for (let j = 0; j < rig.count; j++) {
      if (rig.parents[j] >= 0) {
        boneJoints.push(j)
      }
    }
    this.boneJoints = Int16Array.from(boneJoints)
    this.joints = Array.from({ length: rig.count }, () => new Float32Array(16))
    this.bones = Array.from({ length: boneJoints.length }, () => new Float32Array(16))
    this.entries = [
      debug.add({
        layer: DebugLayer.Skeleton,
        type: 'sphere',
        color: vec3(1, 0.85, 0.2),
        instances: this.joints,
        onTop: true,
        visibleIf,
      }),
      debug.add({
        layer: DebugLayer.Skeleton,
        type: 'box',
        color: vec3(0.2, 0.9, 1),
        instances: this.bones,
        onTop: true,
        visibleIf,
      }),
    ]
  }

  /**
   * Places the shapes at a model space pose
   */
  public update(model: AnimationPose) {
    const t = model.translations
    const joints = this.joints
    for (let j = 0; j < this.rig.count; j++) {
      writeScaleTranslation(joints[j], JOINT_RADIUS, t[j * 3], t[j * 3 + 1], t[j * 3 + 2])
    }
    const bones = this.bones
    for (let i = 0; i < this.boneJoints.length; i++) {
      const j = this.boneJoints[i]
      const p = this.rig.parents[j]
      writeBone(bones[i], t[p * 3], t[p * 3 + 1], t[p * 3 + 2], t[j * 3], t[j * 3 + 1], t[j * 3 + 2])
    }
  }

  /**
   * Removes the shapes from the debug component
   */
  public dispose() {
    for (const entry of this.entries) {
      this.debug.remove(entry)
    }
  }
}

function writeScaleTranslation(m: Float32Array, scale: number, x: number, y: number, z: number) {
  m.fill(0)
  m[0] = scale
  m[5] = scale
  m[10] = scale
  m[12] = x
  m[13] = y
  m[14] = z
  m[15] = 1
}

/**
 * A unit box (centered) stretched from (px, py, pz) to (cx, cy, cz): z along the bone, x and y the thickness
 */
function writeBone(m: Float32Array, px: number, py: number, pz: number, cx: number, cy: number, cz: number) {
  const dx = cx - px
  const dy = cy - py
  const dz = cz - pz
  const length = Math.hypot(dx, dy, dz)
  m.fill(0)
  m[15] = 1
  if (length < 1e-5) {
    return
  }
  // a: perpendicular to the bone, b: perpendicular to both
  let ux = 0
  const uy = 0
  let uz = 1
  if (Math.abs(dz) > 0.9 * length) {
    ux = 1
    uz = 0
  }
  let ax = uy * dz - uz * dy
  let ay = uz * dx - ux * dz
  let az = ux * dy - uy * dx
  const al = Math.hypot(ax, ay, az)
  ax /= al
  ay /= al
  az /= al
  const bx = (dy * az - dz * ay) / length
  const by = (dz * ax - dx * az) / length
  const bz = (dx * ay - dy * ax) / length
  m[0] = ax * BONE_THICKNESS
  m[1] = ay * BONE_THICKNESS
  m[2] = az * BONE_THICKNESS
  m[4] = bx * BONE_THICKNESS
  m[5] = by * BONE_THICKNESS
  m[6] = bz * BONE_THICKNESS
  m[8] = dx
  m[9] = dy
  m[10] = dz
  m[12] = px + dx * 0.5
  m[13] = py + dy * 0.5
  m[14] = pz + dz * 0.5
}
