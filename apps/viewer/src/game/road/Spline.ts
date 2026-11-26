import {
  quat$initAxisAngle,
  vec3,
  vec3$applyQuat,
  vec3$init,
  vec3$initFromArray,
  vec3$normalize,
  vec3Distance,
  vec3Length,
  vec4,
  type IVec3,
} from '@gglib/math'
import type { Vec3Data, ViewerSpline } from '../../api'

/**
 * Position on a spline, segment index and fraction inside the segment (AZ::SplineAddress)
 */
export interface SplineAddress {
  segment: number
  fraction: number
}

const EPSILON = 1e-6

/**
 * Evaluates splines of the SplineComponent (linear, bezier, catmull rom) in entity space.
 *
 * Port of AzCore/Math/Spline.cpp, including its approximations: segment lengths are sampled with the
 * spline granularity and a distance maps linearly to the fraction inside a segment.
 *
 * Vertices are the asset data, all evaluated points and directions are IVec3.
 */
export class Spline {
  public readonly type: ViewerSpline['type']
  public readonly closed: boolean
  public readonly vertices: Vec3Data[]
  public readonly segmentCount: number
  /**
   * First segment that is part of the spline, 1 for open catmull rom splines
   */
  public readonly begin: number
  /**
   * End segment (exclusive)
   */
  public readonly end: number
  public readonly length: number

  private bezier: ViewerSpline['bezier']
  private granularity: number
  private alpha: number
  private segmentLengths: number[] = []

  public constructor(data: ViewerSpline) {
    this.type = data.type
    this.closed = !!data.closed
    this.vertices = data.vertices || []
    this.bezier = data.bezier
    this.alpha = data.knotParameterization ?? 0.5
    this.granularity = this.type === 'Linear' ? 1 : Math.max(1, data.granularity || 8)

    const count = this.vertices.length
    if (this.type === 'CatmullRom') {
      // a catmull rom spline needs at least four vertices
      this.segmentCount = count > 3 ? (this.closed ? count : count - 3) : 0
      this.begin = this.closed ? 0 : 1
      this.end = count > 3 ? count - (this.closed ? 0 : 2) : 0
    } else {
      this.segmentCount = count > 1 ? count - 1 + (this.closed ? 1 : 0) : 0
      this.begin = 0
      this.end = count > 1 ? (this.closed ? count : count - 1) : 0
    }
    if (this.type === 'Bezier' && (this.bezier?.length ?? 0) < count) {
      // without control points a bezier spline degrades to a linear one
      this.bezier = null
    }

    let length = 0
    for (let i = 0; i < this.end; i++) {
      const segmentLength = i >= this.begin ? this.computeSegmentLength(i) : 0
      this.segmentLengths.push(segmentLength)
      length += segmentLength
    }
    this.length = length
  }

  public getSegmentLength(index: number) {
    return this.segmentLengths[index] ?? 0
  }

  /**
   * Address at the given distance from the start (GetAddressByDistanceInternal)
   */
  public addressByDistance(distance: number, out: SplineAddress = { segment: 0, fraction: 0 }): SplineAddress {
    if (distance < 0 || this.end <= this.begin) {
      out.segment = this.begin
      out.fraction = 0
      return out
    }
    let current = 0
    let index = this.begin
    let segmentLength = 0
    for (; index < this.end; index++) {
      segmentLength = this.segmentLengths[index]
      if (current + segmentLength > distance) {
        break
      }
      current += segmentLength
    }
    if (index === this.end) {
      out.segment = index - 1
      out.fraction = 1
      return out
    }
    out.segment = index
    out.fraction = segmentLength > 0 ? (distance - current) / segmentLength : 0
    return out
  }

  /**
   * Distance from the start to the vertex, used for per vertex attributes (GetLength(SplineAddress(index)))
   */
  public lengthAtVertex(index: number) {
    let length = 0
    for (let i = this.begin; i < index && i < this.end; i++) {
      length += this.segmentLengths[i]
    }
    return length
  }

  public position(address: SplineAddress, out: IVec3 = vec3()): IVec3 {
    switch (this.type) {
      case 'CatmullRom':
        return this.catmullRom(address, out, false)
      case 'Bezier':
        if (this.bezier) {
          return this.bezierAt(address, out, false)
        }
        return this.linear(address, out, false)
      default:
        return this.linear(address, out, false)
    }
  }

  /**
   * Normalized tangent
   */
  public tangent(address: SplineAddress, out: IVec3 = vec3()): IVec3 {
    switch (this.type) {
      case 'CatmullRom':
        this.catmullRom(address, out, true)
        break
      case 'Bezier':
        if (this.bezier) {
          this.bezierAt(address, out, true)
        } else {
          this.linear(address, out, true)
        }
        break
      default:
        this.linear(address, out, true)
    }
    return normalize(out)
  }

  /**
   * Normalized normal, the tangent rotated around Z by 90 degrees (ZAxisCross),
   * bezier vertices may add a roll angle around the tangent
   */
  public normal(address: SplineAddress, out: IVec3 = vec3()): IVec3 {
    if (this.segmentCount === 0) {
      return vec3$init(out, 1, 0, 0)
    }
    const tangent = this.tangent(address, tmpTangent)
    // ZAxisCross: (-y, x, 0)
    vec3$init(out, -tangent.y, tangent.x, 0)

    if (this.type === 'Bezier' && this.bezier) {
      let index = address.segment
      let t = address.fraction
      if (index >= this.segmentCount) {
        index = this.segmentCount - 1
        t = 1
      }
      const next = (index + 1) % this.vertices.length
      const an1 = this.bezier[index].angle || 0
      const an2 = this.bezier[next].angle || 0
      if (Math.abs(an1) > EPSILON || Math.abs(an2) > EPSILON) {
        // eased blend of the vertex angles, see BezierSpline::GetNormal
        let af = t * 2 - 1
        const ed = af < 0 ? -1 : 1
        af = ed - af
        af = af * af * af
        af = ed - af
        af = (af + 1) * 0.5
        const angle = ((1 - af) * an1 + af * an2) * (Math.PI / 180)
        vec3$applyQuat(out, quat$initAxisAngle(tmpRotation, tangent, angle))
      }
    }
    return normalize(out)
  }

  private computeSegmentLength(index: number) {
    if (this.type === 'Linear' || (this.type === 'Bezier' && !this.bezier)) {
      const a = this.vertices[index]
      const b = this.vertices[(index + 1) % this.vertices.length]
      return distance(a, b)
    }
    // piecewise with the spline granularity (CalculateSegmentLengthPiecewise)
    const address = { segment: index, fraction: 0 }
    let prev = this.position(address, vec3())
    let next = vec3()
    let length = 0
    for (let i = 1; i <= this.granularity; i++) {
      address.fraction = i / this.granularity
      this.position(address, next)
      length += vec3Distance(prev, next)
      const swap = prev
      prev = next
      next = swap
    }
    return length
  }

  private linear(address: SplineAddress, out: IVec3, derivative: boolean): IVec3 {
    const count = this.vertices.length
    if (this.segmentCount === 0) {
      return vec3$init(out, 0, 0, 0)
    }
    const outOfBounds = address.segment >= this.segmentCount
    if (!this.closed && outOfBounds && !derivative) {
      return vec3$initFromArray(out, this.vertices[count - 1])
    }
    const index = Math.min(address.segment, this.segmentCount - 1)
    const a = this.vertices[index]
    const b = this.vertices[(index + 1) % count]
    if (derivative) {
      return vec3$init(out, b[0] - a[0], b[1] - a[1], b[2] - a[2])
    }
    const t = outOfBounds ? 1 : address.fraction
    return vec3$init(out, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
  }

  private bezierAt(address: SplineAddress, out: IVec3, derivative: boolean): IVec3 {
    const count = this.vertices.length
    if (this.segmentCount === 0) {
      return vec3$init(out, 0, 0, 0)
    }
    const outOfBounds = address.segment >= this.segmentCount
    if (!this.closed && outOfBounds && !derivative) {
      return vec3$initFromArray(out, this.vertices[count - 1])
    }
    const index = Math.min(address.segment, this.segmentCount - 1)
    const next = (index + 1) % count
    const t = outOfBounds ? 1 : address.fraction
    const p0 = this.vertices[index]
    const p1 = this.bezier[index].forward
    const p2 = this.bezier[next].back
    const p3 = this.vertices[next]
    const it = 1 - t
    if (derivative) {
      const a = 3 * it * it
      const b = 6 * it * t
      const c = 3 * t * t
      for (let i = 0; i < 3; i++) {
        tmpComponents[i] = (p1[i] - p0[i]) * a + (p2[i] - p1[i]) * b + (p3[i] - p2[i]) * c
      }
      return vec3$initFromArray(out, tmpComponents)
    }
    const w0 = it * it * it
    const w1 = 3 * t * it * it
    const w2 = 3 * t * t * it
    const w3 = t * t * t
    for (let i = 0; i < 3; i++) {
      tmpComponents[i] = p0[i] * w0 + p1[i] * w1 + p2[i] * w2 + p3[i] * w3
    }
    return vec3$initFromArray(out, tmpComponents)
  }

  private catmullRom(address: SplineAddress, out: IVec3, derivative: boolean): IVec3 {
    const count = this.vertices.length
    if (this.segmentCount === 0) {
      return vec3$init(out, 0, 0, 0)
    }
    let index = address.segment
    let fraction = index >= count ? 1 : address.fraction
    if (!this.closed) {
      if (derivative) {
        if (index < 1) {
          index = 1
          fraction = 0
        } else if (index >= count - 2) {
          index = count - 3
          fraction = 1
        }
      } else {
        if (index < 1) {
          return vec3$initFromArray(out, this.vertices[1])
        }
        if (index >= count - 2) {
          return vec3$initFromArray(out, this.vertices[count - 2])
        }
      }
    }
    const safe = Math.min(index, count - 1)
    const p0 = this.vertices[(safe - 1 + count) % count]
    const p1 = this.vertices[safe]
    const p2 = this.vertices[(safe + 1) % count]
    const p3 = this.vertices[(safe + 2) % count]

    const t1 = Math.pow(distance(p1, p0), this.alpha)
    const t2 = Math.pow(distance(p2, p1), this.alpha) + t1
    const t3 = Math.pow(distance(p3, p2), this.alpha) + t2
    const t = t1 + (t2 - t1) * fraction

    // Barry and Goldman's pyramidal formulation
    for (let i = 0; i < 3; i++) {
      const a1 = ((t1 - t) / t1) * p0[i] + (t / t1) * p1[i]
      const a2 = ((t2 - t) / (t2 - t1)) * p1[i] + ((t - t1) / (t2 - t1)) * p2[i]
      const a3 = ((t3 - t) / (t3 - t2)) * p2[i] + ((t - t2) / (t3 - t2)) * p3[i]
      const b1 = ((t2 - t) / t2) * a1 + (t / t2) * a2
      const b2 = ((t3 - t) / (t3 - t1)) * a2 + ((t - t1) / (t3 - t1)) * a3
      if (!derivative) {
        tmpComponents[i] = ((t2 - t) / (t2 - t1)) * b1 + ((t - t1) / (t2 - t1)) * b2
        continue
      }
      const a1p = (p1[i] - p0[i]) / t1
      const a2p = (p2[i] - p1[i]) / (t2 - t1)
      const a3p = (p3[i] - p2[i]) / (t3 - t2)
      const b1p = (a2 - a1) / t2 + ((t2 - t) / t2) * a1p + (t / t2) * a2p
      const b2p = (a3 - a2) / (t3 - t1) + ((t3 - t) / (t3 - t1)) * a2p + ((t - t1) / (t3 - t1)) * a3p
      tmpComponents[i] = (b2 - b1) / (t2 - t1) + ((t2 - t) / (t2 - t1)) * b1p + ((t - t1) / (t2 - t1)) * b2p
    }
    return vec3$initFromArray(out, tmpComponents)
  }
}

/**
 * Width along a road: default width plus per vertex offsets, eased between vertices
 * (SplineGeometryWidthModifier, RoadWidthInterpolator)
 */
export class SplineWidth {
  private keys: Array<{ distance: number; width: number }> = []
  private defaultWidth: number

  public constructor(defaultWidth: number, widths: number[] | undefined, spline: Spline) {
    this.defaultWidth = defaultWidth
    for (let i = 0; i < (widths?.length ?? 0); i++) {
      this.keys.push({ distance: spline.lengthAtVertex(i), width: widths[i] })
    }
  }

  public at(distance: number) {
    return this.defaultWidth + this.offsetAt(distance)
  }

  private offsetAt(distance: number) {
    const keys = this.keys
    if (!keys.length) {
      return 0
    }
    for (let i = 0; i < keys.length; i++) {
      if (distance < keys[i].distance) {
        if (i === 0) {
          return keys[0].width
        }
        const a = keys[i - 1]
        const b = keys[i]
        const t = easeInOut(b.distance > a.distance ? (distance - a.distance) / (b.distance - a.distance) : 0)
        return a.width + (b.width - a.width) * t
      }
    }
    return keys[keys.length - 1].width
  }
}

function easeInOut(t: number) {
  t *= 2
  if (t < 1) {
    return 0.5 * t * t
  }
  t -= 1
  return -0.5 * (t * (t - 2) - 1)
}

const tmpTangent = vec3()
const tmpRotation = vec4()
const tmpComponents = [0, 0, 0]

function distance(a: Vec3Data, b: Vec3Data) {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
}

/**
 * Normalizes in place, leaves degenerate vectors untouched
 */
function normalize(v: IVec3) {
  return vec3Length(v) > EPSILON ? vec3$normalize(v) : v
}
