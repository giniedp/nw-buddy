import { quat$initFromMat4, vec4 } from '@gglib/math'
import { AnimationPose, AnimationRig, AnimationTrackClip, type AnimationTrack } from '@gglib/model'
import type { CafClip } from '../../formats/caf'
import type { CgfBone, CgfSkinBones } from '../../formats/cgf'

/**
 * Builds the animation rig of a skeleton (`.chr` / `.skin` CompiledBones), as the game prepares its default skeleton
 */
export function createCharacterRig(bones: CgfBone[]): AnimationRig {
  const count = bones.length
  const modelRotations = new Float32Array(count * 4)
  const modelTranslations = new Float32Array(count * 3)
  const q = vec4()
  for (let j = 0; j < count; j++) {
    const m = bones[j].boneToWorld
    quat$initFromMat4(q, m)
    const length = Math.hypot(q.x, q.y, q.z, q.w) || 1
    modelRotations[j * 4] = q.x / length
    modelRotations[j * 4 + 1] = q.y / length
    modelRotations[j * 4 + 2] = q.z / length
    modelRotations[j * 4 + 3] = q.w / length
    modelTranslations[j * 3] = m[12]
    modelTranslations[j * 3 + 1] = m[13]
    modelTranslations[j * 3 + 2] = m[14]
  }

  const pose = new AnimationPose(count)
  for (let j = 0; j < count; j++) {
    const parent = bones[j].parent
    if (parent < 0) {
      pose.rotations.set(modelRotations.subarray(j * 4, j * 4 + 4), j * 4)
      pose.translations.set(modelTranslations.subarray(j * 3, j * 3 + 3), j * 3)
      continue
    }
    relativeTransform(modelRotations, modelTranslations, parent, j, pose)
  }

  if (count && bones[0].name.startsWith('Bip01')) {
    pose.rotations.fill(0, 0, 3)
    pose.rotations[3] = 1
    pose.translations.fill(0, 0, 3)
    for (let j = 1; j < count; j++) {
      if (bones[j].parent === 0) {
        pose.rotations.set(modelRotations.subarray(j * 4, j * 4 + 4), j * 4)
        pose.translations.set(modelTranslations.subarray(j * 3, j * 3 + 3), j * 3)
      }
    }
  }

  return new AnimationRig({
    names: bones.map((it) => it.name),
    parents: bones.map((it) => it.parent),
    defaultPose: pose,
    targets: bones.map((it) => it.controllerId),
  })
}

/**
 * `inverse(parent) * child` of model space rotations and translations, written to the pose at the child
 */
function relativeTransform(
  rotations: Float32Array,
  translations: Float32Array,
  parent: number,
  child: number,
  out: AnimationPose,
) {
  // conjugate of the parent rotation
  const px = -rotations[parent * 4]
  const py = -rotations[parent * 4 + 1]
  const pz = -rotations[parent * 4 + 2]
  const pw = rotations[parent * 4 + 3]
  const cx = rotations[child * 4]
  const cy = rotations[child * 4 + 1]
  const cz = rotations[child * 4 + 2]
  const cw = rotations[child * 4 + 3]
  // conj(parent) * child
  const x = px * cw + cx * pw + py * cz - pz * cy
  const y = py * cw + cy * pw + pz * cx - px * cz
  const z = pz * cw + cz * pw + px * cy - py * cx
  const w = pw * cw - px * cx - py * cy - pz * cz
  const length = Math.hypot(x, y, z, w) || 1
  const r = out.rotations
  r[child * 4] = x / length
  r[child * 4 + 1] = y / length
  r[child * 4 + 2] = z / length
  r[child * 4 + 3] = w / length
  // conj(parent) applied to (child.t - parent.t)
  const vx = translations[child * 3] - translations[parent * 3]
  const vy = translations[child * 3 + 1] - translations[parent * 3 + 1]
  const vz = translations[child * 3 + 2] - translations[parent * 3 + 2]
  const ux = py * vz - pz * vy
  const uy = pz * vx - px * vz
  const uz = px * vy - py * vx
  const t = out.translations
  t[child * 3] = vx + 2 * (pw * ux + py * uz - pz * uy)
  t[child * 3 + 1] = vy + 2 * (pw * uy + pz * ux - px * uz)
  t[child * 3 + 2] = vz + 2 * (pw * uz + px * uy - py * ux)
}

/**
 * A `.caf` clip as a gglib clip: tracks keyed by controller id, times in frames, the played range of the motion
 * parameters. The decoded arrays are shared, not copied.
 */
export function createCafClip(name: string, caf: CafClip): AnimationTrackClip {
  const tracks: AnimationTrack[] = []
  for (const controller of caf.controllers) {
    if (controller.rotations && controller.rotationTimes) {
      tracks.push({
        target: controller.controllerId,
        channel: 'rotation',
        times: controller.rotationTimes,
        values: controller.rotations,
        interpolation: 'LINEAR',
      })
    }
    if (controller.positions && controller.positionTimes) {
      tracks.push({
        target: controller.controllerId,
        channel: 'translation',
        times: controller.positionTimes,
        values: controller.positions,
        interpolation: 'LINEAR',
      })
    }
  }
  return new AnimationTrackClip({
    name,
    tracks,
    start: caf.startFrame,
    end: caf.endFrame,
    rate: caf.sampleRate,
    additive: caf.additive,
  })
}

/**
 * Rig joint by lower case name, per rig
 */
const jointsByName = new WeakMap<AnimationRig, Map<string, number>>()

/**
 * The rig joint of each bone of a skin, like CAttachmentSKIN::UpdateRemapTable: matched by lower case name. A bone the
 * skeleton lacks takes its nearest ancestor that it has: the game extends the skeleton with the bone at its bind offset
 * under its parent, which moves rigidly with that ancestor as long as no clip animates the bone. Without such an
 * ancestor the root (the game's remap default).
 */
export function skinJointMap(rig: AnimationRig, bones: CgfSkinBones): Int16Array {
  let names = jointsByName.get(rig)
  if (!names) {
    names = new Map()
    rig.names.forEach((name, joint) => {
      const key = name.toLowerCase()
      if (!names.has(key)) {
        names.set(key, joint)
      }
    })
    jointsByName.set(rig, names)
  }
  const result = new Int16Array(bones.names.length)
  for (let i = 0; i < result.length; i++) {
    let joint = -1
    for (let bone = i; bone >= 0 && joint < 0; bone = bones.parents[bone]) {
      joint = names.get(bones.names[bone].toLowerCase()) ?? -1
    }
    result[i] = Math.max(joint, 0)
  }
  return result
}
