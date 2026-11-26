import type { ColorParam, ParticleCurve, VarParam } from '../../formats/particles'

/**
 * The age dependent factor of {@link ageValue} (or one component of {@link colorValue}) for many particles:
 * the age curve, mixed with the second age curve by the particle lerp (RandLerp params). Allocation free.
 *
 * @param out - receives the factors
 * @param ages - relative particle ages
 * @param lerps - particle lerp values, null for lerp 0
 * @param tmp - scratch, same length as out
 */
export function ageFactors(
  out: Float32Array,
  p: VarParam | ColorParam,
  c: number,
  ages: Float32Array,
  lerps: Float32Array | null,
  count: number,
  tmp: Float32Array,
): void {
  evaluateCurve(out, p.age, ages, count, c)
  const age2 = p.randomLerpAge ? p.age2 : null
  if (!age2 || !lerps) {
    return
  }
  age2.evaluateMany(tmp, ages, count, c)
  for (let i = 0; i < count; i++) {
    out[i] += (tmp[i] - out[i]) * lerps[i]
  }
}

/**
 * Evaluates a curve for many times, 1 without a curve
 */
export function evaluateCurve(out: Float32Array, curve: ParticleCurve | null, ts: Float32Array, count: number, c = 0) {
  if (curve) {
    curve.evaluateMany(out, ts, count, c)
  } else {
    out.fill(1, 0, count)
  }
}

/**
 * Random modifier of a var param at emission: `(1 - random01 * random) * strengthCurve(strength)`.
 * See `TVarEParam::GetVarMod`.
 */
export function varMod(p: VarParam, strength: number, lerp = 0): number {
  let mod = p.random ? 1 - Math.random() * p.random : 1
  if (p.strength) {
    const s1 = p.strength.value(strength)
    mod *= p.randomLerpStrength && p.strength2 ? mix(s1, p.strength2.value(strength), lerp) : s1
  } else if (p.randomLerpStrength && p.strength2) {
    mod *= mix(1, p.strength2.value(strength), lerp)
  }
  return mod
}

/**
 * Value of a var param at emission, without age curve: `base * varMod`. See `TVarEParam::operator()(VRANDOM, strength)`.
 */
export function varValue(p: VarParam, strength: number): number {
  return p.base * varMod(p, strength)
}

/**
 * Value over the particle life from the emission modifier: `base * mod * ageCurve(age)`. See `TVarEPParam::GetValueFromMod`.
 */
export function ageValue(p: VarParam, mod: number, age: number, lerp = 0): number {
  const base = p.randomLerpColor ? mix(p.base, p.base2, lerp) : p.base
  if (!p.age) {
    return p.randomLerpAge && p.age2 ? base * mod * mix(1, p.age2.value(age), lerp) : base * mod
  }
  const a = p.randomLerpAge && p.age2 ? mix(p.age.value(age), p.age2.value(age), lerp) : p.age.value(age)
  return base * mod * a
}

/**
 * Whether the param varies over the particle life
 */
export function hasAgeCurve(p: VarParam) {
  return !!p.age || (p.randomLerpAge && !!p.age2)
}

/**
 * Color modifier at emission (random gray or hue and emitter strength), written to `out`
 */
export function colorMod(out: number[], p: ColorParam, strength: number, lerp: number) {
  if (p.random) {
    if (p.randomHue) {
      out[0] = 1 - Math.random() * p.random
      out[1] = 1 - Math.random() * p.random
      out[2] = 1 - Math.random() * p.random
    } else {
      const r = 1 - Math.random() * p.random
      out[0] = r
      out[1] = r
      out[2] = r
    }
  } else {
    out[0] = 1
    out[1] = 1
    out[2] = 1
  }
  if (p.strength || (p.randomLerpStrength && p.strength2)) {
    for (let c = 0; c < 3; c++) {
      const s1 = p.strength ? p.strength.component(strength, c) : 1
      out[c] *= p.randomLerpStrength && p.strength2 ? mix(s1, p.strength2.component(strength, c), lerp) : s1
    }
  }
}

/**
 * Color over the particle life, written to `out`
 */
export function colorValue(out: number[], p: ColorParam, mod: number[], age: number, lerp: number) {
  for (let c = 0; c < 3; c++) {
    const base = p.randomLerpColor ? mix(p.base[c], p.base2[c], lerp) : p.base[c]
    let a = p.age ? p.age.component(age, c) : 1
    if (p.randomLerpAge && p.age2) {
      a = mix(a, p.age2.component(age, c), lerp)
    }
    out[c] = base * mod[c] * a
  }
}

export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}
