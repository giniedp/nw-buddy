import type { IVec3 } from '@gglib/math'

/**
 * Attenuation of an environment probe at a world position, as in the tiled shading (TiledShading.cfi, shadeLib.cfi):
 *
 * ```
 * p     = R^T * (probePos - x) / extents     // 0 if any |p| >= 1
 * atten = smoothstep(0, falloff, 1 - |MapCubeToSphere(p)|²)
 * ```
 *
 * @param world - the probe world matrix, column major. Only position and axis directions are used
 * @param extents - half size of the probe box along its local axes
 * @param falloff - edge falloff (AttenuationFalloffMax), clamped to 0.001 like the engine
 * @param point - the world position
 */
export function envProbeAttenuation(world: ArrayLike<number>, extents: IVec3, falloff: number, point: IVec3): number {
  const dx = world[12] - point.x
  const dy = world[13] - point.y
  const dz = world[14] - point.z

  const px = projectOnAxis(world, 0, dx, dy, dz) / extents.x
  const py = projectOnAxis(world, 4, dx, dy, dz) / extents.y
  const pz = projectOnAxis(world, 8, dx, dy, dz) / extents.z
  if (Math.abs(px) >= 1 || Math.abs(py) >= 1 || Math.abs(pz) >= 1) {
    return 0
  }

  // MapCubeToSphere
  const x2 = px * px
  const y2 = py * py
  const z2 = pz * pz
  const sx = px * Math.sqrt(1 - 0.5 * y2 - 0.5 * z2 + 0.333 * y2 * z2)
  const sy = py * Math.sqrt(1 - 0.5 * z2 - 0.5 * x2 + 0.333 * z2 * x2)
  const sz = pz * Math.sqrt(1 - 0.5 * x2 - 0.5 * y2 + 0.333 * x2 * y2)

  const distance = saturate(1 - (sx * sx + sy * sy + sz * sz))
  const t = saturate(distance / Math.max(falloff, 0.001))
  return t * t * (3 - 2 * t)
}

function projectOnAxis(world: ArrayLike<number>, column: number, x: number, y: number, z: number) {
  const ax = world[column]
  const ay = world[column + 1]
  const az = world[column + 2]
  return (ax * x + ay * y + az * z) / (Math.sqrt(ax * ax + ay * ay + az * az) || 1)
}

function saturate(value: number) {
  return Math.min(Math.max(value, 0), 1)
}
