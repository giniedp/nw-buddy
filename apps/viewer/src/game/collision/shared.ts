/**
 * Player state shared between the main thread and the collision worker
 */

/**
 * Request flags of the player block
 */
export const PlayerFlags = {
  /**
   * Take the requested position without resolving walls (e.g. after a teleport or mode switch)
   */
  Teleport: 1 << 0,
  /**
   * Resolve the capsule against walls, when unset the player walks through walls but stays on the ground
   */
  Walls: 1 << 1,
} as const

// Int32 slots
const SEQ_IN = 0
const SEQ_OUT = 1
const FLAGS = 2
// Float32 slots
const IN_X = 4
const IN_Y = 5
const IN_Z = 6
const IN_DT = 7
const OUT_X = 8
const OUT_Y = 9
const OUT_Z = 10
const BYTE_LENGTH = 16 * 4

export interface PlayerRequest {
  x: number
  y: number
  z: number
  /**
   * Seconds since the previous request
   */
  dt: number
  flags: number
}

export interface PlayerResult {
  x: number
  y: number
  z: number
}

/**
 * Player feet position, requested by the main thread and resolved by the collision worker
 *
 * @remarks
 * Both directions use a sequence lock: the writer stores 0 into the sequence slot, writes the payload and then
 * stores the new sequence number (never 0). A reader loads the sequence before and after reading the payload and
 * discards the read if it changed or was 0. Atomics on the sequence slots order the plain float reads and writes.
 *
 * The worker waits on the input sequence (`Atomics.waitAsync`), the main thread never waits, it applies the latest
 * consistent result whenever it is available.
 */
export class PlayerBlock {
  public readonly buffer: SharedArrayBuffer
  private readonly i32: Int32Array<SharedArrayBuffer>
  private readonly f32: Float32Array<SharedArrayBuffer>
  private lastRequest = 0

  public constructor(buffer?: SharedArrayBuffer) {
    this.buffer = buffer ?? new SharedArrayBuffer(BYTE_LENGTH)
    this.i32 = new Int32Array(this.buffer)
    this.f32 = new Float32Array(this.buffer)
  }

  /**
   * Main thread: publishes a request and wakes the worker
   *
   * @returns the sequence number of the request
   */
  public request(req: PlayerRequest): number {
    const seq = nextSequence(this.lastRequest)
    this.lastRequest = seq
    Atomics.store(this.i32, SEQ_IN, 0)
    this.f32[IN_X] = req.x
    this.f32[IN_Y] = req.y
    this.f32[IN_Z] = req.z
    this.f32[IN_DT] = req.dt
    this.i32[FLAGS] = req.flags
    Atomics.store(this.i32, SEQ_IN, seq)
    Atomics.notify(this.i32, SEQ_IN)
    return seq
  }

  /**
   * Main thread: the sequence number of the latest resolved request, 0 if none is available
   */
  public get resolvedSequence(): number {
    return Atomics.load(this.i32, SEQ_OUT)
  }

  /**
   * Main thread: reads the latest result
   *
   * @returns the sequence number of the request the result belongs to, 0 if no consistent result is available
   */
  public readResult(out: PlayerResult): number {
    const seq = Atomics.load(this.i32, SEQ_OUT)
    if (!seq) {
      return 0
    }
    out.x = this.f32[OUT_X]
    out.y = this.f32[OUT_Y]
    out.z = this.f32[OUT_Z]
    return Atomics.load(this.i32, SEQ_OUT) === seq ? seq : 0
  }

  /**
   * Worker: resolves when the input sequence is no longer `seq`
   */
  public waitRequest(seq: number): Promise<unknown> {
    const result = Atomics.waitAsync(this.i32, SEQ_IN, seq)
    return result.async ? result.value : Promise.resolve(result.value)
  }

  /**
   * Worker: reads the latest request
   *
   * @returns the sequence number of the request, 0 if the request is being written
   */
  public readRequest(out: PlayerRequest): number {
    const seq = Atomics.load(this.i32, SEQ_IN)
    if (!seq) {
      return 0
    }
    out.x = this.f32[IN_X]
    out.y = this.f32[IN_Y]
    out.z = this.f32[IN_Z]
    out.dt = this.f32[IN_DT]
    out.flags = this.i32[FLAGS]
    return Atomics.load(this.i32, SEQ_IN) === seq ? seq : 0
  }

  /**
   * Worker: publishes the result of the request with the given sequence number
   */
  public writeResult(seq: number, result: PlayerResult) {
    Atomics.store(this.i32, SEQ_OUT, 0)
    this.f32[OUT_X] = result.x
    this.f32[OUT_Y] = result.y
    this.f32[OUT_Z] = result.z
    Atomics.store(this.i32, SEQ_OUT, seq)
  }
}

function nextSequence(seq: number) {
  const next = (seq + 1) | 0
  return next === 0 ? 1 : next
}
