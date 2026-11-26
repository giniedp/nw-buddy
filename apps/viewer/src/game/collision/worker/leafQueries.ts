import {
  closestPointOnSegment,
  closestPointOnTriangle,
  rayBoxIntersectsAt,
  raySphereIntersectsAt,
  rayTriangleIntersectsAt,
  vec3,
  vec3DistanceSquared,
  vec3Length,
  type IVec3,
} from '@gglib/math'
import type { ColliderLeaf } from './colliders'

/**
 * Result of {@link closestPointOnLeaf}
 */
export const LeafContact = {
  None: 0,
  Outside: 1,
  /**
   * The query point lies inside the solid, the closest point is on the surface where it leaves the solid fastest
   */
  Inside: 2,
} as const
export type LeafContact = (typeof LeafContact)[keyof typeof LeafContact]

const ZERO = vec3(0, 0, 0)
const v0 = vec3()
const v1 = vec3()
const v2 = vec3()
const tmp = vec3()
const tmp2 = vec3()
const qMin = vec3()
const qMax = vec3()
const march = vec3()

/**
 * Closest point on the surface of a leaf, in leaf local space
 *
 * @param range - meshes only consider triangles within this distance (local space)
 */
export function closestPointOnLeaf(leaf: ColliderLeaf, p: IVec3, range: number, out: IVec3): LeafContact {
  switch (leaf.kind) {
    case 'box':
      return closestOnBox(leaf.half, p, out)
    case 'sphere':
      return closestOnSphere(ZERO, leaf.radius, p, out)
    case 'capsule': {
      closestPointOnSegment(p, leaf.a, leaf.b, tmp)
      return closestOnSphere(tmp, leaf.radius, p, out)
    }
    case 'cylinder':
      return closestOnCylinder(leaf.a, leaf.b, leaf.radius, p, out)
    case 'hull':
      return closestOnHull(leaf.planes, p, out)
    case 'prism':
      return closestOnPrism(leaf.polygon, leaf.height, p, out)
    case 'mesh':
      return closestOnMesh(leaf, p, range, out)
  }
}

/**
 * First hit of a ray with a leaf in leaf local space
 *
 * @param dir - normalized direction
 * @returns distance along the ray, NaN if missed or if the origin lies inside the solid
 */
export function raycastLeaf(leaf: ColliderLeaf, origin: IVec3, dir: IVec3, maxDistance: number): number {
  let t: number
  switch (leaf.kind) {
    case 'box': {
      const h = leaf.half
      if (Math.abs(origin.x) < h.x && Math.abs(origin.y) < h.y && Math.abs(origin.z) < h.z) {
        return Number.NaN
      }
      qMin.x = -h.x
      qMin.y = -h.y
      qMin.z = -h.z
      t = rayBoxIntersectsAt(origin, dir, qMin, h)
      break
    }
    case 'sphere': {
      if (vec3Length(origin) < leaf.radius) {
        return Number.NaN
      }
      t = raySphereIntersectsAt(origin, dir, ZERO, leaf.radius)
      break
    }
    case 'capsule':
    case 'cylinder':
      t = marchLeaf(leaf, origin, dir, maxDistance)
      break
    case 'hull':
      t = raycastHull(leaf.planes, origin, dir, maxDistance)
      break
    case 'prism':
      t = raycastPrism(leaf.polygon, leaf.height, origin, dir, maxDistance)
      break
    case 'mesh':
      t = raycastMesh(leaf, origin, dir, maxDistance)
      break
  }
  return t >= 0 && t <= maxDistance ? t : Number.NaN
}

function closestOnBox(h: IVec3, p: IVec3, out: IVec3): LeafContact {
  const inside = Math.abs(p.x) < h.x && Math.abs(p.y) < h.y && Math.abs(p.z) < h.z
  out.x = Math.max(-h.x, Math.min(h.x, p.x))
  out.y = Math.max(-h.y, Math.min(h.y, p.y))
  out.z = Math.max(-h.z, Math.min(h.z, p.z))
  if (!inside) {
    return LeafContact.Outside
  }
  // move to the nearest face
  const dx = h.x - Math.abs(p.x)
  const dy = h.y - Math.abs(p.y)
  const dz = h.z - Math.abs(p.z)
  if (dx <= dy && dx <= dz) {
    out.x = p.x < 0 ? -h.x : h.x
  } else if (dy <= dz) {
    out.y = p.y < 0 ? -h.y : h.y
  } else {
    out.z = p.z < 0 ? -h.z : h.z
  }
  return LeafContact.Inside
}

function closestOnSphere(center: IVec3, radius: number, p: IVec3, out: IVec3): LeafContact {
  const dx = p.x - center.x
  const dy = p.y - center.y
  const dz = p.z - center.z
  const length = Math.hypot(dx, dy, dz)
  if (length < 1e-6) {
    out.x = center.x
    out.y = center.y
    out.z = center.z + radius
    return LeafContact.Inside
  }
  const s = radius / length
  out.x = center.x + dx * s
  out.y = center.y + dy * s
  out.z = center.z + dz * s
  return length < radius ? LeafContact.Inside : LeafContact.Outside
}

function closestOnCylinder(a: IVec3, b: IVec3, radius: number, p: IVec3, out: IVec3): LeafContact {
  const ax = b.x - a.x
  const ay = b.y - a.y
  const az = b.z - a.z
  const lengthSq = ax * ax + ay * ay + az * az || 1
  const px = p.x - a.x
  const py = p.y - a.y
  const pz = p.z - a.z
  const t = (px * ax + py * ay + pz * az) / lengthSq
  let rx = px - ax * t
  let ry = py - ay * t
  let rz = pz - az * t
  const rl = Math.hypot(rx, ry, rz)
  const inside = t > 0 && t < 1 && rl < radius
  if (!inside) {
    const tc = Math.max(0, Math.min(1, t))
    const s = rl > radius ? radius / rl : 1
    out.x = a.x + ax * tc + rx * s
    out.y = a.y + ay * tc + ry * s
    out.z = a.z + az * tc + rz * s
    return LeafContact.Outside
  }
  const length = Math.sqrt(lengthSq)
  const toSide = radius - rl
  const toStart = t * length
  const toEnd = (1 - t) * length
  if (toSide <= toStart && toSide <= toEnd) {
    if (rl < 1e-6) {
      // on the axis, any direction perpendicular to it
      if (Math.abs(ax) < Math.abs(ay)) {
        rx = 0
        ry = az
        rz = -ay
      } else {
        rx = az
        ry = 0
        rz = -ax
      }
      const l = Math.hypot(rx, ry, rz) || 1
      rx /= l
      ry /= l
      rz /= l
    } else {
      rx /= rl
      ry /= rl
      rz /= rl
    }
    out.x = a.x + ax * t + rx * radius
    out.y = a.y + ay * t + ry * radius
    out.z = a.z + az * t + rz * radius
  } else {
    const tc = toStart <= toEnd ? 0 : 1
    out.x = a.x + ax * tc + rx
    out.y = a.y + ay * tc + ry
    out.z = a.z + az * tc + rz
  }
  return LeafContact.Inside
}

/**
 * Projection onto the plane with the largest signed distance: exact on faces, approximate near edges and corners
 */
function closestOnHull(planes: Float32Array, p: IVec3, out: IVec3): LeafContact {
  let best = -Infinity
  let index = -1
  for (let i = 0; i < planes.length; i += 4) {
    const d = planes[i] * p.x + planes[i + 1] * p.y + planes[i + 2] * p.z + planes[i + 3]
    if (d > best) {
      best = d
      index = i
    }
  }
  if (index < 0) {
    return LeafContact.None
  }
  out.x = p.x - planes[index] * best
  out.y = p.y - planes[index + 1] * best
  out.z = p.z - planes[index + 2] * best
  return best < 0 ? LeafContact.Inside : LeafContact.Outside
}

function closestOnPrism(polygon: Float64Array, height: number, p: IVec3, out: IVec3): LeafContact {
  const zMin = Math.min(0, height)
  const zMax = Math.max(0, height)
  const inPolygon = pointInPolygon(polygon, p.x, p.y)
  // nearest point on the polygon outline
  let bestSq = Infinity
  let ex = 0
  let ey = 0
  const n = polygon.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const x0 = polygon[j * 2]
    const y0 = polygon[j * 2 + 1]
    const dx = polygon[i * 2] - x0
    const dy = polygon[i * 2 + 1] - y0
    const lengthSq = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((p.x - x0) * dx + (p.y - y0) * dy) / lengthSq))
    const cx = x0 + dx * t
    const cy = y0 + dy * t
    const dSq = (p.x - cx) ** 2 + (p.y - cy) ** 2
    if (dSq < bestSq) {
      bestSq = dSq
      ex = cx
      ey = cy
    }
  }
  if (inPolygon && p.z > zMin && p.z < zMax) {
    const toSide = Math.sqrt(bestSq)
    const toTop = zMax - p.z
    const toBottom = p.z - zMin
    out.x = p.x
    out.y = p.y
    out.z = p.z
    if (toSide <= toTop && toSide <= toBottom) {
      out.x = ex
      out.y = ey
    } else {
      out.z = toTop <= toBottom ? zMax : zMin
    }
    return LeafContact.Inside
  }
  out.x = inPolygon ? p.x : ex
  out.y = inPolygon ? p.y : ey
  out.z = Math.max(zMin, Math.min(zMax, p.z))
  return LeafContact.Outside
}

function closestOnMesh(
  leaf: Extract<ColliderLeaf, { kind: 'mesh' }>,
  p: IVec3,
  range: number,
  out: IVec3,
): LeafContact {
  const bvh = leaf.bvh
  const vertices = bvh.vertices
  const indices = bvh.indices
  qMin.x = p.x - range
  qMin.y = p.y - range
  qMin.z = p.z - range
  qMax.x = p.x + range
  qMax.y = p.y + range
  qMax.z = p.z + range
  let bestSq = range * range
  let found = false
  bvh.query(qMin, qMax, (triangle) => {
    readVertex(vertices, indices[triangle * 3], v0)
    readVertex(vertices, indices[triangle * 3 + 1], v1)
    readVertex(vertices, indices[triangle * 3 + 2], v2)
    closestPointOnTriangle(p, v0, v1, v2, tmp2)
    const dSq = vec3DistanceSquared(p, tmp2)
    if (dSq < bestSq) {
      bestSq = dSq
      out.x = tmp2.x
      out.y = tmp2.y
      out.z = tmp2.z
      found = true
    }
  })
  return found ? LeafContact.Outside : LeafContact.None
}

/**
 * Sphere tracing over the exact closest point of convex leaves (capsule, cylinder)
 */
function marchLeaf(leaf: ColliderLeaf, origin: IVec3, dir: IVec3, maxDistance: number): number {
  let t = 0
  for (let i = 0; i < 64; i++) {
    march.x = origin.x + dir.x * t
    march.y = origin.y + dir.y * t
    march.z = origin.z + dir.z * t
    const contact = closestPointOnLeaf(leaf, march, 0, tmp2)
    if (contact === LeafContact.Inside) {
      return i === 0 ? Number.NaN : t
    }
    const distance = Math.sqrt(vec3DistanceSquared(march, tmp2))
    if (distance < 1e-3) {
      return t
    }
    t += distance
    if (t > maxDistance) {
      return Number.NaN
    }
  }
  return Number.NaN
}

/**
 * Real Time Collision Detection 5.3.8, ray against the intersection of halfspaces
 */
function raycastHull(planes: Float32Array, origin: IVec3, dir: IVec3, maxDistance: number): number {
  let tFirst = 0
  let tLast = maxDistance
  let inside = true
  for (let i = 0; i < planes.length; i += 4) {
    const dist = planes[i] * origin.x + planes[i + 1] * origin.y + planes[i + 2] * origin.z + planes[i + 3]
    const denom = planes[i] * dir.x + planes[i + 1] * dir.y + planes[i + 2] * dir.z
    if (dist > 0) {
      inside = false
    }
    if (denom === 0) {
      if (dist > 0) {
        return Number.NaN
      }
      continue
    }
    const t = -dist / denom
    if (denom < 0) {
      tFirst = Math.max(tFirst, t)
    } else {
      tLast = Math.min(tLast, t)
    }
    if (tFirst > tLast) {
      return Number.NaN
    }
  }
  return inside ? Number.NaN : tFirst
}

function raycastPrism(polygon: Float64Array, height: number, origin: IVec3, dir: IVec3, maxDistance: number): number {
  const zMin = Math.min(0, height)
  const zMax = Math.max(0, height)
  if (origin.z > zMin && origin.z < zMax && pointInPolygon(polygon, origin.x, origin.y)) {
    return Number.NaN
  }
  if (Math.abs(dir.z) < 1e-9) {
    return Number.NaN
  }
  let result = Number.NaN
  for (const z of [zMax, zMin]) {
    const t = (z - origin.z) / dir.z
    if (t >= 0 && t <= maxDistance && !(t >= result)) {
      if (pointInPolygon(polygon, origin.x + dir.x * t, origin.y + dir.y * t)) {
        result = t
      }
    }
  }
  return result
}

function raycastMesh(
  leaf: Extract<ColliderLeaf, { kind: 'mesh' }>,
  origin: IVec3,
  dir: IVec3,
  maxDistance: number,
): number {
  const bvh = leaf.bvh
  const vertices = bvh.vertices
  const indices = bvh.indices
  const ex = origin.x + dir.x * maxDistance
  const ey = origin.y + dir.y * maxDistance
  const ez = origin.z + dir.z * maxDistance
  qMin.x = Math.min(origin.x, ex)
  qMin.y = Math.min(origin.y, ey)
  qMin.z = Math.min(origin.z, ez)
  qMax.x = Math.max(origin.x, ex)
  qMax.y = Math.max(origin.y, ey)
  qMax.z = Math.max(origin.z, ez)
  let best = Number.NaN
  bvh.query(qMin, qMax, (triangle) => {
    readVertex(vertices, indices[triangle * 3], v0)
    readVertex(vertices, indices[triangle * 3 + 1], v1)
    readVertex(vertices, indices[triangle * 3 + 2], v2)
    // two sided: winding is not reliable (mirrored transforms, open meshes)
    let t = rayTriangleIntersectsAt(origin, dir, v0, v1, v2)
    if (Number.isNaN(t)) {
      t = rayTriangleIntersectsAt(origin, dir, v0, v2, v1)
    }
    if (t >= 0 && !(t >= best)) {
      best = t
    }
  })
  return best
}

function readVertex(vertices: Float32Array, index: number, out: IVec3) {
  out.x = vertices[index * 3]
  out.y = vertices[index * 3 + 1]
  out.z = vertices[index * 3 + 2]
}

function pointInPolygon(polygon: Float64Array, x: number, y: number) {
  let inside = false
  const n = polygon.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i * 2]
    const yi = polygon[i * 2 + 1]
    const xj = polygon[j * 2]
    const yj = polygon[j * 2 + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
