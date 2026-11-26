import { mat4Multiply, vec3, vec3ApplyMat4, type IVec3, type Mat4 } from '@gglib/math'
import type { Model } from '@gglib/model'

export interface Box3 {
  min: IVec3
  max: IVec3
}

export function emptyBox(): Box3 {
  return {
    min: vec3(Infinity, Infinity, Infinity),
    max: vec3(-Infinity, -Infinity, -Infinity),
  }
}

const corner = vec3()
const transformed = vec3()
let nodeWorld: Mat4 = null

/**
 * Grows the box by the bounding boxes of the meshes of a model placed at the given world transform
 */
export function addModelBounds(model: Model, world: Mat4, box: Box3): Box3 {
  for (const node of model.sceneNodes) {
    const mesh = model.meshes[node.data?.mesh]
    if (!mesh) {
      continue
    }
    const bounds = mesh.boundingBox
    nodeWorld = mat4Multiply(world, node.world, nodeWorld)
    for (let i = 0; i < 8; i++) {
      corner.x = i & 1 ? bounds.max.x : bounds.min.x
      corner.y = i & 2 ? bounds.max.y : bounds.min.y
      corner.z = i & 4 ? bounds.max.z : bounds.min.z
      vec3ApplyMat4(corner, nodeWorld, transformed)
      box.min.x = Math.min(box.min.x, transformed.x)
      box.min.y = Math.min(box.min.y, transformed.y)
      box.min.z = Math.min(box.min.z, transformed.z)
      box.max.x = Math.max(box.max.x, transformed.x)
      box.max.y = Math.max(box.max.y, transformed.y)
      box.max.z = Math.max(box.max.z, transformed.z)
    }
  }
  return box
}

/**
 * Whether the box holds at least one point
 */
export function isBoxValid(box: Box3) {
  return box.min.x <= box.max.x && box.min.y <= box.max.y && box.min.z <= box.max.z
}
