import { IVec3 } from './types'
import { Vec3 } from './vec3'

export const enum IntersectionType {
  Disjoint = 0,
  Intersects = 1,
  Contains = 2,
}

const v3temp1: IVec3 = { x: 0, y: 0, z: 0 }
export function boxContainsSphere(min: IVec3, max: IVec3, center: IVec3, radius: number): IntersectionType {
  const vector = Vec3.clamp(center, min, max, v3temp1)
  const distance = Vec3.distanceSquared(center, vector)
  if (distance > radius * radius) {
    return IntersectionType.Disjoint
  }
  if (
    min.x + radius > center.x ||
    center.x > max.x - radius ||
    max.x - min.x <= radius ||
    min.y + radius > center.y ||
    center.y > max.y - radius ||
    max.y - min.y <= radius ||
    min.z + radius > center.z ||
    center.z > max.z - radius ||
    max.z - min.z <= radius
  ) {
    return IntersectionType.Intersects
  }
  return IntersectionType.Contains
}

export function boxContainsBox(min1: IVec3, max1: IVec3, min2: IVec3, max2: IVec3): IntersectionType {
  if (max1.x < min2.x || min1.x > max2.x || max1.y < min2.y || min1.y > max2.y || max1.z < min2.z || min1.z > max2.z) {
    return IntersectionType.Disjoint
  }
  if (
    min1.x <= min2.x &&
    max1.x >= max2.x &&
    min1.y <= min2.y &&
    max1.y >= max2.y &&
    min1.z <= min2.z &&
    max1.z >= max2.z
  ) {
    return IntersectionType.Contains
  }
  return IntersectionType.Intersects
}
