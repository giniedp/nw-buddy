/**
 * Conversion matrix from CRY engine space to Babylon engine space.
 * @remarks
 * - Swaps the Y and Z axes.
 * - X axis remains unchanged.
 * @example
 * CRY engine space:
 *  Z
 *  |  Y
 *  | /
 *  |/
 *  o--------X
 *
 *  Babylon engine space:
 *  Y
 *  |  Z
 *  | /
 *  |/
 *  o--------X
 *
 * The conversion matrix:
 *   1 0 0 0
 *   0 0 1 0
 *   0 1 0 0
 *   0 0 0 1
 */
export function cryToBabylonMat4(mat: number[]): number[] {
  // prettier-ignore
  return [
		mat[0], mat[2], mat[1], mat[3],
		mat[8], mat[10], mat[9], mat[11],
		mat[4], mat[6], mat[5], mat[7],
		mat[12], mat[14], mat[13], mat[15],
  ]
}

export function cryToBabylonVec3(vec: number[], out?: V3): number[] {
  out = out || [0, 0, 0]
  const x = vec[0]
  const y = vec[2]
  const z = vec[1]
  out[0] = x
  out[1] = y
  out[2] = z
  return out
}
export function babylonToCryVec3(vec: number[], out?: V3): number[] {
  out = out || [0, 0, 0]
  const x = vec[0]
  const y = vec[2]
  const z = vec[1]
  out[0] = x
  out[1] = y
  out[2] = z
  return out
}
/**
 * Conversion matrix from CRY engine space to GLTF or Three.js engine space.
 * @remarks
 * - Swaps the Y and Z axes.
 * - Negates the X axis.
 * @example
 * CRY engine space:
 *  Z
 *  |  Y
 *  | /
 *  |/
 *  o--------X
 *
 *  GLTF/Three.js engine space:
 *     Y
 *     |
 *     |
 *     |
 *     o--------X
 *    /
 *   /
 *  Z
 *
 * The conversion matrix:
 *  -1 0 0 0
 *   0 0 1 0
 *   0 1 0 0
 *   0 0 0 1
 */
export function cryToGltfMat4(mat: number[]): number[] {
  // prettier-ignore
  return [
		mat[0], -mat[2], -mat[1], -mat[3],
		-mat[8], mat[10], mat[9], mat[11],
		-mat[4], mat[6], mat[5], mat[7],
		-mat[12], mat[14], mat[13], mat[15],
  ]
}

export type V3 = [number, number, number]
export function cryToGltfVec3(vec: V3, out?: V3): V3 {
  out = out || [0, 0, 0]
  const x = -vec[0]
  const y = vec[2]
  const z = vec[1]
  out[0] = x
  out[1] = y
  out[2] = z
  return out
}
export function gltfToCryVec3(vec: V3, out?: V3): V3 {
  out = out || [0, 0, 0]
  const x = -vec[0]
  const y = vec[2]
  const z = vec[1]
  out[0] = x
  out[1] = y
  out[2] = z
  return out
}

export function mat4FromAzTransform(data: number[]): number[] {
  if (data.length === 16) {
    return [...data]
  }
  if (data.length === 12) {
    // prettier-ignore
    return [
      data[0], data[1], data[2], 0,
      data[3], data[4], data[5], 0,
      data[6], data[7], data[8], 0,
      data[9], data[10], data[11], 1,
    ]
  }
  const mat = mat4FromQuaternion(data.slice(0, 4))
  const sx = data[4]
  const sy = data[5]
  const sz = data[6]
  mat[0] *= sx
  mat[1] *= sx
  mat[2] *= sx
  mat[4] *= sy
  mat[5] *= sy
  mat[6] *= sy
  mat[8] *= sz
  mat[9] *= sz
  mat[10] *= sz
  mat[12] = data[7]
  mat[13] = data[8]
  mat[14] = data[9]
  return mat
}

export function mat4FromQuaternion(q: number[]): number[] {
  let x = q[0]
  let y = q[1]
  let z = q[2]
  let w = q[3]

  let xx = x * x
  let xy = x * y
  let xz = x * z
  let xw = x * w

  let yy = y * y
  let yz = y * z
  let yw = y * w

  let zz = z * z
  let zw = z * w

  const m: number[] = []
  m[0] = 1 - 2 * (yy + zz)
  m[1] = 2 * (xy + zw)
  m[2] = 2 * (xz - yw)
  m[3] = 0

  m[4] = 2 * (xy - zw)
  m[5] = 1 - 2 * (zz + xx)
  m[6] = 2 * (yz + xw)
  m[7] = 0

  m[8] = 2 * (xz + yw)
  m[9] = 2 * (yz - xw)
  m[10] = 1 - 2 * (yy + xx)
  m[11] = 0

  m[12] = 0
  m[13] = 0
  m[14] = 0
  m[15] = 1
  return m
}
