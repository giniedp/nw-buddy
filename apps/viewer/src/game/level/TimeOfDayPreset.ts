import { lerp, vec3, vec3$init, type IVec3 } from '@gglib/math'
import type { TimeOfDay } from '../../api'
import { getTodParamByName, parseTodSpline, TodParams, type TodParam, type TodSplineKey } from './TimeOfDayParams'

const loggedUnknowns = {}
export class TimeOfDayPreset {
  public time: number
  public timeStart: number
  public timeEnd: number
  public timeAnimSpeed: number
  public variables: Record<string, TodParam<any>> = {}

  private t: number
  public constructor(definition?: TimeOfDay) {
    this.reset()
    if (definition) {
      this.applyDefinition(definition)
    }
  }

  public reset() {
    this.time = 12
    this.timeStart = 0
    this.timeEnd = 24
    this.timeAnimSpeed = 0
    Object.values(TodParams).forEach((param) => {
      this.variables[param.name] = JSON.parse(JSON.stringify(param))
    })
  }

  public applyDefinition(tod: TimeOfDay) {
    this.time = tod.time
    this.timeStart = tod.timeStart
    this.timeEnd = tod.timeEnd
    this.timeAnimSpeed = tod.timeAnimSpeed
    for (const v of tod.variable) {
      const preset = getTodParamByName(v.name)
      if (!preset) {
        if (!loggedUnknowns[v.name]) {
          // console.warn(`Unknown TOD variable: ${v.name}`)
          loggedUnknowns[v.name] = true
        }
        continue
      }
      if (preset.type === 'color') {
        const param: TodParam<IVec3> = JSON.parse(JSON.stringify(preset))
        param.value = vec3(v.color)
        param.spline = parseTodSpline(v.spline?.keys)
        this.variables[param.name] = param
      } else {
        const param: TodParam<number> = JSON.parse(JSON.stringify(preset))
        param.value = v.value
        param.spline = parseTodSpline(v.spline?.keys)
        this.variables[param.name] = param
      }
    }
  }

  public interpolate(t: number) {
    if (this.t === t) {
      return
    }
    this.t = t
    for (const key in this.variables) {
      const v = this.variables[key]
      if (!v.spline) {
        continue
      }
      if (!evalSpline(v.spline, t, tmp)) {
        continue
      }

      if (v.type === 'color') {
        vec3$init(v.value, tmp[0], tmp[1], tmp[2])
      } else {
        v.value = tmp[0]
      }
    }
  }
}
const tmp: number[] = []

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function evalSpline(keys: TodSplineKey[], time: number, out: number[]): boolean {
  if (keys.length <= 1) {
    return false
  }
  if (time <= keys[0].time) {
    const k = keys[0]
    for (let i = 0; i < k.value.length; i++) {
      out[i] = k.value[i]
    }
    return true
  }
  if (time >= keys[keys.length - 1].time) {
    const k = keys[keys.length - 1]
    for (let i = 0; i < k.value.length; i++) {
      out[i] = k.value[i]
    }
    return true
  }

  let i = 0
  while (i < keys.length - 1 && keys[i + 1].time < time) {
    i++
  }

  const k0 = keys[i]
  const k1 = keys[i + 1]

  const span = k1.time - k0.time
  const t = span > 0 ? (time - k0.time) / span : 0
  const s = smoothstep(t)

  for (let i = 0; i < k0.value.length; i++) {
    out[i] = lerp(k0.value[i], k1.value[i], s)
  }
  return true
}
