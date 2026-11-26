/**
 * A key of a particle curve, see CryEngine `SplineElem` / `spline::SplineKey`
 */
export interface ParticleCurveKey {
  /**
   * Time in 0..1
   */
  t: number
  /**
   * Value per component, 1 component for scalar curves, 3 for color curves
   */
  v: number[]
  /**
   * Out tangent (custom tangents only, scalar curves only)
   */
  d: number
  /**
   * In tangent (custom tangents only, scalar curves only)
   */
  s: number
  /**
   * Tangent flags, in tangent in bits 0-2, out tangent in bits 3-5
   */
  flags: number
}

const TANGENT_NONE = 0
const TANGENT_LINEAR = 4
const TANGENT_IN_MASK = 0x07
const TANGENT_OUT_SHIFT = 3

/**
 * A particle curve, e.g. size over particle age. Port of CryEngine `TCurve` (`spline::OptSpline` over `TSplineSlopes<T, Key, true>`).
 *
 * @remarks
 * Values are unit values (0..1), the curve scales a base value. Each segment is a cubic
 * `v(t) = v0 u + v1 t + (c u + d t) t u` with `u = 1 - t`, from the end point slopes. The result is clamped to 0..1.
 * Slopes are per segment: linear tangents use the value difference, none (default) tangents are flat (0)
 * and custom tangents use the stored d/s values.
 * An empty curve evaluates to 1.
 */
export class ParticleCurve {
  public readonly keys: ParticleCurveKey[]
  public readonly dimension: number

  // per segment: t0, t1, then per component v0, v1, c, d
  private readonly segments: Float32Array
  private readonly stride: number

  public constructor(keys: ParticleCurveKey[], dimension: number) {
    this.keys = [...keys].sort((a, b) => a.t - b.t)
    this.dimension = dimension
    this.stride = 2 + 4 * dimension
    this.segments = new Float32Array(Math.max(0, this.keys.length - 1) * this.stride)
    this.computeSegments()
  }

  public get isEmpty() {
    return this.keys.length === 0
  }

  /**
   * Evaluates a scalar curve (first component)
   */
  public value(t: number): number {
    return this.component(t, 0)
  }

  /**
   * Evaluates one component of the curve
   */
  public component(t: number, c: number): number {
    const keys = this.keys
    const count = keys.length
    if (count === 0) {
      return 1
    }
    if (t <= keys[0].t) {
      return keys[0].v[c] ?? 0
    }
    const segments = this.segments
    const stride = this.stride
    for (let i = 0; i < count - 1; i++) {
      const o = i * stride
      const t1 = segments[o + 1]
      if (t <= t1) {
        const t0 = segments[o]
        const x = t1 > t0 ? (t - t0) / (t1 - t0) : 1
        const u = 1 - x
        const p = o + 2 + c * 4
        const value = segments[p] * u + segments[p + 1] * x + (segments[p + 2] * u + segments[p + 3] * x) * x * u
        return value < 0 ? 0 : value > 1 ? 1 : value
      }
    }
    return keys[count - 1].v[c] ?? 0
  }

  /**
   * Evaluates one component for many times at once, same result as {@link component}
   *
   * @remarks
   * Allocation free for per-frame use: no number crosses a function boundary per element.
   *
   * @param out - receives the values, index 0 to count - 1
   * @param ts - the times
   */
  public evaluateMany(out: Float32Array, ts: Float32Array, count: number, c = 0): void {
    const keys = this.keys
    const keyCount = keys.length
    if (keyCount === 0) {
      out.fill(1, 0, count)
      return
    }
    const first = keys[0]
    const firstT = first.t
    const firstV = first.v[c] ?? 0
    const lastV = keys[keyCount - 1].v[c] ?? 0
    const segments = this.segments
    const stride = this.stride
    const segmentCount = keyCount - 1
    for (let n = 0; n < count; n++) {
      const t = ts[n]
      if (t <= firstT) {
        out[n] = firstV
        continue
      }
      let value = lastV
      for (let i = 0; i < segmentCount; i++) {
        const o = i * stride
        const t1 = segments[o + 1]
        if (t <= t1) {
          const t0 = segments[o]
          const x = t1 > t0 ? (t - t0) / (t1 - t0) : 1
          const u = 1 - x
          const p = o + 2 + c * 4
          value = segments[p] * u + segments[p + 1] * x + (segments[p + 2] * u + segments[p + 3] * x) * x * u
          value = value < 0 ? 0 : value > 1 ? 1 : value
          break
        }
      }
      out[n] = value
    }
  }

  /**
   * Minimum value over all keys, used for bounds
   */
  public minValue(c = 0): number {
    if (!this.keys.length) {
      return 1
    }
    let result = Number.POSITIVE_INFINITY
    for (const key of this.keys) {
      result = Math.min(result, key.v[c] ?? 0)
    }
    return result
  }

  private computeSegments() {
    const keys = this.keys
    const last = keys.length - 1
    const dim = this.dimension
    // slopes per key and component, see TSplineSlopes::comp_deriv with bCLAMP
    const dd: number[][] = keys.map((k) => new Array(dim).fill(dim === 1 ? k.d : 0))
    const ds: number[][] = keys.map((k) => new Array(dim).fill(dim === 1 ? k.s : 0))
    const inType = (i: number) => keys[i].flags & TANGENT_IN_MASK
    const outType = (i: number) => (keys[i].flags >> TANGENT_OUT_SHIFT) & TANGENT_IN_MASK
    for (let i = 0; i <= last; i++) {
      for (let c = 0; c < dim; c++) {
        if (i < last && outType(i) === TANGENT_LINEAR) {
          dd[i][c] = value(keys[i + 1], c) - value(keys[i], c)
          if (inType(i + 1) === TANGENT_NONE) {
            dd[i][c] = 2 * dd[i][c] - ds[i + 1][c]
          }
        } else if (i < last && outType(i) === TANGENT_NONE) {
          dd[i][c] = 0
        }
        if (i > 0 && inType(i) === TANGENT_LINEAR) {
          ds[i][c] = value(keys[i], c) - value(keys[i - 1], c)
          if (outType(i - 1) === TANGENT_NONE) {
            ds[i][c] = 2 * ds[i][c] - dd[i - 1][c]
          }
        } else if (i < last && inType(i) === TANGENT_NONE) {
          ds[i][c] = 0
        }
      }
    }
    for (let i = 0; i < last; i++) {
      const o = i * this.stride
      this.segments[o] = keys[i].t
      this.segments[o + 1] = keys[i + 1].t
      for (let c = 0; c < dim; c++) {
        const v0 = value(keys[i], c)
        const v1 = value(keys[i + 1], c)
        const dv = v1 - v0
        const p = o + 2 + c * 4
        this.segments[p] = v0
        this.segments[p + 1] = v1
        this.segments[p + 2] = dd[i][c] - dv
        this.segments[p + 3] = dv - ds[i + 1][c]
      }
    }
  }
}

function value(key: ParticleCurveKey, c: number) {
  return key.v[c] ?? 0
}
