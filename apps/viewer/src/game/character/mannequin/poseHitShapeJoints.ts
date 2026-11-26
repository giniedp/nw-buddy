import { mat4$initFromQuatValues, mat4$initIdentity, mat4$setTranslationXYZ } from '@gglib/math'
import type { AnimationPose, AnimationRig } from '@gglib/model'
import type { HitShapeJoints } from './HitShapes'

/**
 * The joints of a game character (`.cdf`) for hit shapes: its model space pose, in the game axes, for a debug shape
 * component on the character's entity
 *
 * @param pose - the model space pose, updated in place by the character
 */
export function poseHitShapeJoints(rig: AnimationRig, pose: AnimationPose): HitShapeJoints {
  const names = rig.names.map((it) => it.toLowerCase())
  return {
    find: (name) => names.indexOf(name),
    joint: (index, out) => {
      const r = pose.rotations
      const t = pose.translations
      mat4$initFromQuatValues(out, r[index * 4], r[index * 4 + 1], r[index * 4 + 2], r[index * 4 + 3])
      return mat4$setTranslationXYZ(out, t[index * 3], t[index * 3 + 1], t[index * 3 + 2])
    },
    root: (out) => mat4$initIdentity(out),
  }
}
