import { describe, expect, it } from 'vitest'
import { CgfWriter, type BodyWriter } from '../cgf/testing'
import { decodeSmallTree48, decodeSmallTree64Ext, parseCaf } from './parse'
import { CafCompressionFormat, CafKeyTimesFormat } from './types'

const CHUNK_CONTROLLER = 0x100d
const CHUNK_MOTION_PARAMETERS = 0x3002

type Quat = [number, number, number, number]

function normalize(q: Quat): Quat {
  const l = Math.hypot(...q)
  return q.map((it) => it / l) as Quat
}

/**
 * Lumberyard SmallTree48BitQuat / SmallTree64BitExtQuat ToInternalType: drop the largest component (made positive)
 */
function prepare(q: Quat) {
  q = normalize(q)
  let index = 0
  for (let i = 1; i < 4; i++) {
    if (Math.abs(q[i]) > Math.abs(q[index])) {
      index = i
    }
  }
  if (q[index] < 0) {
    q = q.map((it) => -it) as Quat
  }
  return { index, stored: q.filter((_, i) => i !== index) }
}

function pack48(q: Quat): [number, number, number] {
  const { index, stored } = prepare(q)
  let value = 0n
  stored.forEach((it, i) => {
    value |= BigInt(Math.floor((it + 0.707106781186) * 23170 + 0.5)) << BigInt(i * 15)
  })
  value |= BigInt(index) << 46n
  return [Number(value & 0xffffn), Number((value >> 16n) & 0xffffn), Number((value >> 32n) & 0xffffn)]
}

function pack64(q: Quat): [number, number] {
  const { index, stored } = prepare(q)
  const value =
    BigInt(Math.floor((stored[0] + 0.707106781186) * 1482909 + 0.5)) |
    (BigInt(Math.floor((stored[1] + 0.707106781186) * 1482909 + 0.5)) << 21n) |
    (BigInt(Math.floor((stored[2] + 0.707106781186) * 741454 + 0.5)) << 42n) |
    (BigInt(index) << 62n)
  return [Number(value & 0xffffffffn), Number(value >> 32n)]
}

/**
 * The same rotation: q and -q are equal
 */
function expectRotation(actual: ArrayLike<number>, expected: Quat, delta: number) {
  const q = normalize(expected)
  const dot = q[0] * actual[0] + q[1] * actual[1] + q[2] * actual[2] + q[3] * actual[3]
  expect(Math.abs(dot)).toBeGreaterThan(1 - delta)
}

function randomQuats(count: number): Quat[] {
  let seed = 7
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647 - 0.5
  }
  const result: Quat[] = [
    [0, 0, 0, 1],
    [1, 0, 0, 0],
    [0, Math.SQRT1_2, 0, Math.SQRT1_2],
  ]
  for (let i = 0; i < count; i++) {
    result.push(normalize([random(), random(), random(), random()]))
  }
  return result
}

describe('rotation decoding', () => {
  it('decodes SmallTree48BitQuat', () => {
    const out = new Float32Array(4)
    for (const q of randomQuats(500)) {
      decodeSmallTree48(...pack48(q), out, 0)
      expectRotation(out, q, 1e-6)
    }
  })

  it('decodes SmallTree64BitExtQuat with 21 bit components', () => {
    const out = new Float32Array(4)
    for (const q of randomQuats(500)) {
      decodeSmallTree64Ext(...pack64(q), out, 0)
      expectRotation(out, q, 1e-6)
    }
    // any positive stored value uses the 21st bit, a 20 bit mask (the old nwbt bug) loses ~0.707
    const q: Quat = normalize([0.1, 0.69, 0.1, 0.71])
    const [m1, m2] = pack64(q)
    expect(m1 & (1 << 20)).not.toBe(0)
    decodeSmallTree64Ext(m1, m2, out, 0)
    expect(Array.from(out).map((it) => Math.round(it * 1e4) / 1e4)).toEqual(q.map((it) => Math.round(it * 1e4) / 1e4))
  })
})

interface Track {
  controllerId: number
  rotations?: Quat[]
  rotationFormat?: number
  rotationTimes?: number[]
  rotationTimeFormat?: number
  positions?: [number, number, number][]
  positionTimes?: number[]
  positionTimeFormat?: number
  aligned?: boolean
}

function u16(w: BodyWriter, ...values: number[]) {
  for (const v of values) {
    w.u8(v & 0xff, (v >> 8) & 0xff)
  }
}

function pad(w: BodyWriter, size: number, alignment: number) {
  const padding = Math.ceil(size / alignment) * alignment - size
  w.u8(...new Array(padding).fill(0))
}

function writeTimes(w: BodyWriter, times: number[], format: number, alignment: number) {
  if (format === CafKeyTimesFormat.F32) {
    w.f32(...times)
    return pad(w, times.length * 4, alignment)
  }
  if (format === CafKeyTimesFormat.UInt16) {
    u16(w, ...times)
    return pad(w, times.length * 2, alignment)
  }
  w.u8(...times)
  return pad(w, times.length, alignment)
}

/**
 * CONTROLLER_CHUNK_DESC_0831 with its tracks
 */
function writeController(w: BodyWriter, track: Track) {
  const rotations = track.rotations ?? []
  const positions = track.positions ?? []
  const rotationFormat = track.rotationFormat ?? CafCompressionFormat.SmallTree48BitQuat
  const rotationTimeFormat = track.rotationTimeFormat ?? CafKeyTimesFormat.UInt16
  const positionTimeFormat = track.positionTimeFormat ?? CafKeyTimesFormat.Byte
  const alignment = track.aligned === false ? 1 : 4
  w.i32(track.controllerId, 0)
  u16(w, rotations.length, positions.length)
  w.u8(rotationFormat, rotationTimeFormat, CafCompressionFormat.NoCompressVec3, track.positionTimes ? 1 : 0)
  w.u8(positionTimeFormat, alignment === 4 ? 1 : 0, 0, 0)
  if (rotations.length) {
    for (const q of rotations) {
      if (rotationFormat === CafCompressionFormat.SmallTree48BitQuat) {
        u16(w, ...pack48(q))
      } else if (rotationFormat === CafCompressionFormat.SmallTree64BitExtQuat) {
        w.i32(...pack64(q))
      } else {
        w.f32(...q)
      }
    }
    const size = { [CafCompressionFormat.SmallTree48BitQuat]: 6, [CafCompressionFormat.SmallTree64BitExtQuat]: 8 }
    pad(w, rotations.length * (size[rotationFormat] ?? 16), alignment)
    writeTimes(w, track.rotationTimes, rotationTimeFormat, alignment)
  }
  if (positions.length) {
    w.f32(...positions.flat())
    if (track.positionTimes) {
      writeTimes(w, track.positionTimes, positionTimeFormat, alignment)
    }
  }
}

function writeMotionParams(w: BodyWriter, params: { flags: number; secsPerTick: number; start: number; end: number }) {
  w.i32(params.flags, 0, 1).f32(params.secsPerTick).i32(params.start, params.end)
  w.f32(1.5, 0, 0, 3, 0) // move speed, turn speed, asset turn, distance, slope
  w.f32(0, 0, 0, 1, 0, 0, 0) // start location
  w.f32(0, 0, 0, 1, 0, 3, 0) // end location
  w.f32(...new Array(8).fill(0))
}

function cafFile(tracks: Track[], params?: { flags: number; secsPerTick: number; start: number; end: number }) {
  const writer = new CgfWriter()
  tracks.forEach((track, i) => writer.chunk(CHUNK_CONTROLLER, 0x0831, i + 1, (w) => writeController(w, track)))
  if (params) {
    writer.chunk(CHUNK_MOTION_PARAMETERS, 0x0925, 100, (w) => writeMotionParams(w, params))
  }
  return writer.build()
}

describe('parseCaf', () => {
  const rotations: Quat[] = [[0, 0, 0, 1], normalize([0, 0, 0.3, 1]), normalize([0.2, 0, 0.3, 1])]

  it('reads controllers with their own and shared key times', () => {
    const clip = parseCaf(
      cafFile(
        [
          // 3 rotation keys of 6 bytes (18, padded to 20) and u16 times (6, padded to 8), positions share the times
          {
            controllerId: 0xdeadbeef,
            rotations,
            rotationTimes: [0, 10, 20],
            positions: [
              [0, 0, 1],
              [0, 0, 2],
              [0, 0, 3],
            ],
          },
          // positions with their own byte times
          {
            controllerId: 7,
            positions: [
              [1, 2, 3],
              [4, 5, 6],
            ],
            positionTimes: [0, 20],
          },
        ],
        { flags: 0x2, secsPerTick: 1 / 30, start: 0, end: 20 },
      ),
    )
    expect(clip.controllers.length).toBe(2)
    const [a, b] = clip.controllers
    expect(a.controllerId).toBe(0xdeadbeef)
    expect(Array.from(a.rotationTimes)).toEqual([0, 10, 20])
    rotations.forEach((q, i) => expectRotation(a.rotations.subarray(i * 4, i * 4 + 4), q, 1e-6))
    expect(a.positionTimes).toBe(a.rotationTimes)
    expect(Array.from(a.positions)).toEqual([0, 0, 1, 0, 0, 2, 0, 0, 3])
    expect(b.rotations).toBeNull()
    expect(Array.from(b.positionTimes)).toEqual([0, 20])
    expect(Array.from(b.positions)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('reads unaligned tracks and 64 bit rotations with f32 times', () => {
    const clip = parseCaf(
      cafFile([
        {
          controllerId: 1,
          rotations,
          rotationFormat: CafCompressionFormat.SmallTree64BitExtQuat,
          rotationTimes: [0, 1.5, 3],
          rotationTimeFormat: CafKeyTimesFormat.F32,
          positions: [[1, 1, 1]],
          positionTimes: [3],
          aligned: false,
        },
      ]),
    )
    const [c] = clip.controllers
    expect(Array.from(c.rotationTimes)).toEqual([0, 1.5, 3])
    rotations.forEach((q, i) => expectRotation(c.rotations.subarray(i * 4, i * 4 + 4), q, 1e-6))
    expect(Array.from(c.positionTimes)).toEqual([3])
  })

  it('takes the timing from the motion parameters', () => {
    const clip = parseCaf(
      cafFile([{ controllerId: 1, rotations, rotationTimes: [0, 12, 24] }], {
        flags: 0x2,
        secsPerTick: 1 / 24,
        start: 0,
        end: 24,
      }),
    )
    expect(clip.sampleRate).toBeCloseTo(24, 4)
    expect(clip.startFrame).toBe(0)
    expect(clip.endFrame).toBe(24)
    expect(clip.cycle).toBe(true)
    expect(clip.additive).toBe(false)
    expect(clip.motion.moveSpeed).toBe(1.5)
    expect(Array.from(clip.motion.endLocation)).toEqual([0, 0, 0, 1, 0, 3, 0])
  })

  it('starts an additive clip after its reference frame', () => {
    const clip = parseCaf(
      cafFile([{ controllerId: 1, rotations, rotationTimes: [0, 1, 2] }], {
        flags: 0x1,
        secsPerTick: 1 / 30,
        start: 0,
        end: 2,
      }),
    )
    expect(clip.additive).toBe(true)
    expect(clip.startFrame).toBe(1)
    expect(clip.endFrame).toBe(2)
  })

  it('falls back to 30 frames per second and the last key without motion parameters', () => {
    const clip = parseCaf(cafFile([{ controllerId: 1, rotations, rotationTimes: [0, 5, 9] }]))
    expect(clip.sampleRate).toBe(30)
    expect(clip.motion).toBeNull()
    expect(clip.endFrame).toBe(9)
  })

  it('rejects formats the game does not use', () => {
    const file = cafFile([
      { controllerId: 1, rotations, rotationTimes: [0, 1, 2], rotationFormat: CafCompressionFormat.PolarQuat },
    ])
    expect(() => parseCaf(file)).toThrow(/unsupported rotation format 7/)
  })
})
