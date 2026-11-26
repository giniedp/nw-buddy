import {
  CafAssetFlags,
  CafCompressionFormat,
  CafKeyTimesFormat,
  type CafClip,
  type CafController,
  type CafMotionParams,
} from './types'

// Chunk file layout as in formats/cgf (CryHeaders.h, nwbt formats/cgf reader.go)
const SIGNATURE = 'CrCh'
const FILE_VERSION_3_6 = 0x746

const CHUNK_CONTROLLER = 0x100d
const CHUNK_MOTION_PARAMETERS = 0x3002
const CONTROLLER_0831 = 0x0831
const MOTION_PARAMS_0925 = 0x0925

// CONTROLLER_CHUNK_DESC_0831: 18 bytes of fields, the track data follows the 4 byte aligned struct
const CONTROLLER_HEADER_SIZE = 20
// CONTROLLER_CHUNK_DESC_0831::eKeyTimeRotation: the position track shares the rotation key times
const KEY_TIME_ROTATION = 0

// Lumberyard ANIMATION_30Hz
const DEFAULT_SAMPLE_RATE = 30

// QuatQuantization.h
const MAX_15BIT = 23170.0
const MAX_20BIT = 741454.0
const MAX_21BIT = 1482909.0
const RANGE = 0.707106781186

const ROTATION_SIZES: Record<number, number> = {
  [CafCompressionFormat.NoCompressQuat]: 16,
  [CafCompressionFormat.SmallTree48BitQuat]: 6,
  [CafCompressionFormat.SmallTree64BitExtQuat]: 8,
}
const POSITION_SIZES: Record<number, number> = {
  [CafCompressionFormat.NoCompress]: 12,
  [CafCompressionFormat.NoCompressVec3]: 12,
}
const TIME_SIZES: Record<number, number> = {
  [CafKeyTimesFormat.F32]: 4,
  [CafKeyTimesFormat.UInt16]: 2,
  [CafKeyTimesFormat.Byte]: 1,
}

/**
 * Parses a `.caf` animation (chunk file with 0x0831 controllers and 0x0925 motion parameters)
 *
 * @remarks
 * Supports the formats the game uses (2026-11-17 scan of all 31,972 files): rotations SmallTree48BitQuat (5) and
 * SmallTree64BitExtQuat (8), positions NoCompressVec3 (2), key times u16 and byte; plus the uncompressed variants.
 * Other formats throw. Legacy controllers (0x0827-0x0830) do not occur and are skipped.
 */
export function parseCaf(buffer: ArrayBuffer | ArrayBufferView): CafClip {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (signature !== SIGNATURE) {
    throw new Error(`Invalid caf signature. Expected '${SIGNATURE}' but was '${signature}'`)
  }
  const version = view.getUint32(4, true)
  if (version < FILE_VERSION_3_6) {
    throw new Error(`Unsupported caf version 0x${version.toString(16)}`)
  }
  const chunkCount = view.getUint32(8, true)
  const chunkOffset = view.getUint32(12, true)

  let motion: CafMotionParams | null = null
  const controllers: CafController[] = []
  for (let i = 0; i < chunkCount; i++) {
    const at = chunkOffset + i * 16
    const type = view.getUint16(at, true)
    const chunkVersion = view.getUint16(at + 2, true)
    const offset = view.getUint32(at + 12, true)
    if (type === CHUNK_CONTROLLER && chunkVersion === CONTROLLER_0831) {
      controllers.push(readController(view, offset))
    } else if (type === CHUNK_MOTION_PARAMETERS && chunkVersion === MOTION_PARAMS_0925) {
      motion = readMotionParams(view, offset)
    }
  }

  const additive = !!motion && (motion.assetFlags & CafAssetFlags.Additive) !== 0
  const sampleRate =
    motion && motion.secsPerTick > 0 && motion.ticksPerFrame > 0
      ? 1 / (motion.secsPerTick * motion.ticksPerFrame)
      : DEFAULT_SAMPLE_RATE
  // GlobalAnimationHeaderCAF::ReadMotionParameters: an additive clip starts one frame later
  const startFrame = (motion?.start ?? 0) + (additive ? 1 : 0)
  const endFrame = Math.max(motion?.end ?? lastKeyFrame(controllers), startFrame)
  return {
    sampleRate,
    startFrame,
    endFrame,
    additive,
    cycle: !!motion && (motion.assetFlags & CafAssetFlags.Cycle) !== 0,
    motion,
    controllers,
  }
}

function lastKeyFrame(controllers: CafController[]): number {
  let result = 0
  for (const it of controllers) {
    if (it.rotationTimes?.length) {
      result = Math.max(result, it.rotationTimes[it.rotationTimes.length - 1])
    }
    if (it.positionTimes?.length) {
      result = Math.max(result, it.positionTimes[it.positionTimes.length - 1])
    }
  }
  return result
}

function readMotionParams(view: DataView, at: number): CafMotionParams {
  const floats = (offset: number, count: number) => {
    const out = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      out[i] = view.getFloat32(offset + i * 4, true)
    }
    return out
  }
  return {
    assetFlags: view.getUint32(at, true),
    compression: view.getUint32(at + 4, true),
    ticksPerFrame: view.getInt32(at + 8, true),
    secsPerTick: view.getFloat32(at + 12, true),
    start: view.getInt32(at + 16, true),
    end: view.getInt32(at + 20, true),
    moveSpeed: view.getFloat32(at + 24, true),
    turnSpeed: view.getFloat32(at + 28, true),
    assetTurn: view.getFloat32(at + 32, true),
    distance: view.getFloat32(at + 36, true),
    slope: view.getFloat32(at + 40, true),
    startLocation: floats(at + 44, 7),
    endLocation: floats(at + 72, 7),
  }
}

/**
 * GlobalAnimationHeaderCAFStreamContent::ReadController for CONTROLLER_CHUNK_DESC_0831
 */
function readController(view: DataView, at: number): CafController {
  const controllerId = view.getUint32(at, true)
  const flags = view.getUint32(at + 4, true)
  const numRotationKeys = view.getUint16(at + 8, true)
  const numPositionKeys = view.getUint16(at + 10, true)
  const rotationFormat = view.getUint8(at + 12)
  const rotationTimeFormat = view.getUint8(at + 13)
  const positionFormat = view.getUint8(at + 14)
  const positionKeysInfo = view.getUint8(at + 15)
  const positionTimeFormat = view.getUint8(at + 16)
  const alignment = view.getUint8(at + 17) ? 4 : 1

  let cursor = at + CONTROLLER_HEADER_SIZE
  const result: CafController = {
    controllerId,
    flags,
    rotationTimes: null,
    rotations: null,
    positionTimes: null,
    positions: null,
  }

  if (numRotationKeys) {
    const size = ROTATION_SIZES[rotationFormat]
    if (!size) {
      throw new Error(`caf controller ${controllerId}: unsupported rotation format ${rotationFormat}`)
    }
    result.rotations = readRotations(view, cursor, numRotationKeys, rotationFormat)
    cursor += align(size * numRotationKeys, alignment)
    result.rotationTimes = readTimes(view, cursor, numRotationKeys, rotationTimeFormat, controllerId)
    cursor += align(TIME_SIZES[rotationTimeFormat] * numRotationKeys, alignment)
  }

  if (numPositionKeys) {
    const size = POSITION_SIZES[positionFormat]
    if (!size) {
      throw new Error(`caf controller ${controllerId}: unsupported position format ${positionFormat}`)
    }
    const positions = new Float32Array(numPositionKeys * 3)
    for (let i = 0; i < positions.length; i++) {
      positions[i] = view.getFloat32(cursor + i * 4, true)
    }
    result.positions = positions
    cursor += align(size * numPositionKeys, alignment)
    if (positionKeysInfo === KEY_TIME_ROTATION) {
      result.positionTimes = result.rotationTimes
    } else {
      result.positionTimes = readTimes(view, cursor, numPositionKeys, positionTimeFormat, controllerId)
    }
  }
  return result
}

function align(value: number, alignment: number) {
  return Math.ceil(value / alignment) * alignment
}

function readTimes(view: DataView, at: number, count: number, format: number, controllerId: number): Float32Array {
  const out = new Float32Array(count)
  switch (format) {
    case CafKeyTimesFormat.F32:
      for (let i = 0; i < count; i++) {
        out[i] = view.getFloat32(at + i * 4, true)
      }
      return out
    case CafKeyTimesFormat.UInt16:
      for (let i = 0; i < count; i++) {
        out[i] = view.getUint16(at + i * 2, true)
      }
      return out
    case CafKeyTimesFormat.Byte:
      for (let i = 0; i < count; i++) {
        out[i] = view.getUint8(at + i)
      }
      return out
  }
  throw new Error(`caf controller ${controllerId}: unsupported key time format ${format}`)
}

function readRotations(view: DataView, at: number, count: number, format: number): Float32Array {
  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    switch (format) {
      case CafCompressionFormat.NoCompressQuat:
        for (let c = 0; c < 4; c++) {
          out[i * 4 + c] = view.getFloat32(at + i * 16 + c * 4, true)
        }
        break
      case CafCompressionFormat.SmallTree48BitQuat:
        decodeSmallTree48(
          view.getUint16(at + i * 6, true),
          view.getUint16(at + i * 6 + 2, true),
          view.getUint16(at + i * 6 + 4, true),
          out,
          i * 4,
        )
        break
      case CafCompressionFormat.SmallTree64BitExtQuat:
        decodeSmallTree64Ext(view.getUint32(at + i * 8, true), view.getUint32(at + i * 8 + 4, true), out, i * 4)
        break
    }
  }
  return out
}

/**
 * SmallTree48BitQuat::ToExternalType: three 15 bit components, the dropped (largest) component index in the top 2 bits
 */
export function decodeSmallTree48(m1: number, m2: number, m3: number, out: Float32Array, offset: number) {
  const index = m3 >>> 14
  const packed0 = m1 & 0x7fff
  const packed1 = ((m1 >>> 15) | (m2 << 1)) & 0x7fff
  const packed2 = ((m2 >>> 14) | (m3 << 2)) & 0x7fff
  expand(index, packed0 / MAX_15BIT - RANGE, packed1 / MAX_15BIT - RANGE, packed2 / MAX_15BIT - RANGE, out, offset)
}

/**
 * SmallTree64BitExtQuat::ToExternalType: two 21 bit and one 20 bit component, the dropped index in the top 2 bits
 */
export function decodeSmallTree64Ext(m1: number, m2: number, out: Float32Array, offset: number) {
  const index = (m2 >>> 30) & 3
  const packed0 = m1 & 0x1fffff
  const packed1 = ((m1 >>> 21) | (m2 << 11)) & 0x1fffff
  const packed2 = (m2 >>> 10) & 0xfffff
  expand(index, packed0 / MAX_21BIT - RANGE, packed1 / MAX_21BIT - RANGE, packed2 / MAX_20BIT - RANGE, out, offset)
}

/**
 * The components the three stored values go to, by the index of the dropped component
 */
const STORED_SLOTS = [
  [1, 2, 3],
  [0, 2, 3],
  [0, 1, 3],
  [0, 1, 2],
]

/**
 * Writes the three stored components around the dropped one and restores it from the unit length
 */
function expand(index: number, a: number, b: number, c: number, out: Float32Array, offset: number) {
  // float32 like the engine
  a = Math.fround(a)
  b = Math.fround(b)
  c = Math.fround(c)
  const slots = STORED_SLOTS[index]
  out[offset + slots[0]] = a
  out[offset + slots[1]] = b
  out[offset + slots[2]] = c
  out[offset + index] = Math.sqrt(Math.max(0, 1 - (a * a + b * b + c * c)))
}
