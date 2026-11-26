import { mat4$initFrom, mat4$multiply, type Mat4, type Transform } from '@gglib/math'
import type { NodeData } from '@gglib/model'
import type { HitShapeJoints } from '../../character/mannequin/HitShapes'
import { GAME_TO_GLTF } from '../gameAxes'

/**
 * The joints of a glTF character (nwbt export) for hit shapes: world frames in the game axes, for a debug shape
 * component on an entity with the identity world
 *
 * @param nodes - the model's nodes, joints are found by name (without case)
 * @param root - world matrix of the model root
 */
export function gltfHitShapeJoints(nodes: ReadonlyArray<Transform<NodeData>>, root: () => Mat4): HitShapeJoints {
  const names = nodes.map((it) => it.name?.toLowerCase() ?? '')
  return {
    find: (name) => names.indexOf(name),
    joint: (index, out) => mat4$multiply(mat4$initFrom(out, nodes[index].world), GAME_TO_GLTF),
    root: (out) => mat4$multiply(mat4$initFrom(out, root()), GAME_TO_GLTF),
  }
}
