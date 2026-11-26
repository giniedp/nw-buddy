/**
 * An animation clip of a `.caf` file: its controllers decoded into packed arrays, key times in frames
 */
export interface CafClip {
  /**
   * Key frames per second, 1 / (SecsPerTick * TicksPerFrame); 30 without motion parameters (ANIMATION_30Hz)
   */
  sampleRate: number
  /**
   * The first played frame. Additive clips start one frame after their reference frame.
   */
  startFrame: number
  /**
   * The last played frame, not before {@link startFrame}
   */
  endFrame: number
  /**
   * Asset flag CA_ASSET_ADDITIVE: rotations compose onto the default pose, positions add to it
   */
  additive: boolean
  /**
   * Asset flag CA_ASSET_CYCLE: authored as a loop
   */
  cycle: boolean
  /**
   * The motion parameters of the clip, null when the file has none
   */
  motion: CafMotionParams | null
  controllers: CafController[]
}

/**
 * The animated channels of one joint
 */
export interface CafController {
  /**
   * CRC32 of the joint name, matched with {@link CgfBone.controllerId}
   */
  controllerId: number
  flags: number
  /**
   * Rotation key frames, ascending, null without a rotation track
   */
  rotationTimes: Float32Array | null
  /**
   * Rotations, x y z w per key (Cry order), not normalized beyond the decoding
   */
  rotations: Float32Array | null
  /**
   * Position key frames, ascending, null without a position track. The rotation key frames when the file shares them.
   */
  positionTimes: Float32Array | null
  /**
   * Positions in meters, x y z per key
   */
  positions: Float32Array | null
}

/**
 * MotionParams905 of the motion parameters chunk (0x3002 v0x0925)
 */
export interface CafMotionParams {
  assetFlags: number
  compression: number
  ticksPerFrame: number
  secsPerTick: number
  start: number
  end: number
  moveSpeed: number
  turnSpeed: number
  assetTurn: number
  distance: number
  slope: number
  /**
   * QuatT: rotation x y z w, then translation x y z
   */
  startLocation: Float32Array
  /**
   * QuatT: rotation x y z w, then translation x y z
   */
  endLocation: Float32Array
}

/**
 * Asset flags of the motion parameters (CryCharAnimationParams.h CA_ASSET_*)
 */
export const CafAssetFlags = {
  Additive: 0x001,
  Cycle: 0x002,
} as const

/**
 * Rotation and position formats of controller tracks (ControllerPQ.h ECompressionFormat)
 */
export const CafCompressionFormat = {
  NoCompress: 0,
  NoCompressQuat: 1,
  NoCompressVec3: 2,
  ShotInt3Quat: 3,
  SmallTreeDWORDQuat: 4,
  SmallTree48BitQuat: 5,
  SmallTree64BitQuat: 6,
  PolarQuat: 7,
  SmallTree64BitExtQuat: 8,
} as const

/**
 * Key time formats of controller tracks (ControllerPQ.h EKeyTimesFormat)
 */
export const CafKeyTimesFormat = {
  F32: 0,
  UInt16: 1,
  Byte: 2,
  F32StartStop: 3,
  UInt16StartStop: 4,
  ByteStartStop: 5,
  Bitset: 6,
} as const
