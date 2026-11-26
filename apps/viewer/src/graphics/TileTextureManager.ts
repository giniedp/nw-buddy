import { type Device, type SurfaceFormat, type Texture } from '@gglib/graphics'
import { brand, type Brand } from '@gglib/utils'

export type TileSlotState = Brand<number, 'TileSlotState'>
export const TileSlotState = {
  Free: brand<TileSlotState>(0),
  Pinned: brand<TileSlotState>(1),
  Pooled: brand<TileSlotState>(2),
}

export type TileSlot = {
  layer: number
  state: TileSlotState
  lastUsed: number
}

export type TileSlotHandle = {
  readonly layer: number
  readonly pinned: boolean
}

export interface TileTextureOptions {
  capacity: number
  width: number
  height: number
  formats: SurfaceFormat[]
  labels: string[]
  generateMipmap?: boolean
  mipLevelCount?: number
}

export class TileTexturManager {
  private device: Device

  private freeSlots: TileSlot[] = []
  private pinnedSlots = new Map<number, TileSlot>()
  private pooledSlots = new Map<number, TileSlot>()

  public readonly textures: Texture[] = []
  public readonly width: number
  public readonly height: number
  public readonly capacity: number
  public frame: number = 0

  public get availableLayers() {
    return this.freeSlots.length
  }

  public constructor(device: Device, options: TileTextureOptions) {
    this.device = device
    this.width = options.width
    this.height = options.height
    this.capacity = options.capacity

    if (this.capacity < 1) {
      throw new Error('capacity must be at least 1')
    }
    if (this.width < 1 || this.height < 1) {
      throw new Error('width and height must be at least 1')
    }
    const formats = options.formats
    if (!formats || formats.length < 1) {
      throw new Error('at least one format must be provided')
    }

    for (let i = 0; i < formats.length; i++) {
      this.textures.push(
        this.device.createTexture({
          name: options.labels?.[i] || `TileTexture${i}`,
          format: formats[i],
          type: '2d-array',
          width: this.width,
          height: this.height,
          depth: this.capacity,
          generateMipmap: options.generateMipmap ?? false,
          mipLevelCount: options.mipLevelCount,
        }),
      )
    }

    for (let i = 0; i < this.capacity; i++) {
      this.freeSlots.push({
        layer: i,
        state: TileSlotState.Free,
        lastUsed: 0,
      })
    }
  }

  /**
   * Acquire a slot from the pool.
   *
   * Pinned slots are permanently resident and must be released explicitly.
   * Pooled slots may be evicted under memory pressure in future extensions.
   *
   * Throws if no free slot is available.
   */
  public acquire(pinned?: boolean): TileSlotHandle {
    const slot = this.freeSlots.pop()
    if (!slot) {
      throw new Error(`no free slots (capacity ${this.capacity})`)
    }

    slot.state = pinned ? TileSlotState.Pinned : TileSlotState.Pooled
    slot.lastUsed = this.frame

    if (pinned) {
      this.pinnedSlots.set(slot.layer, slot)
    } else {
      this.pooledSlots.set(slot.layer, slot)
    }

    return {
      layer: slot.layer,
      pinned: pinned ?? false,
    }
  }

  /**
   * Release a previously acquired slot back to the pool.
   */
  public release(handle: TileSlotHandle): void {
    const slot = this.pinnedSlots.get(handle.layer) || this.pooledSlots.get(handle.layer)

    if (!slot) {
      console.warn(`TileManager: slot ${handle.layer} is already free`)
      return
    }

    slot.state = TileSlotState.Free
    slot.lastUsed = 0
    this.freeSlots.push(slot)
    this.pinnedSlots.delete(handle.layer)
    this.pooledSlots.delete(handle.layer)
  }

  public get stats() {
    return {
      capacity: this.capacity,
      pinnedCount: this.pinnedSlots.size,
      pooledCount: this.pooledSlots.size,
      usedCount: this.pinnedSlots.size + this.pooledSlots.size,
      freeCount: this.freeSlots.length,
    }
  }
  /**
   * Advance the internal frame counter.
   * Call once per frame before building instance buffers.
   */
  public tick(): void {
    this.frame++
  }

  /**
   * Release all GPU resources. Instance is unusable after this call.
   */
  public dispose(): void {
    for (const texture of this.textures) {
      texture.dispose()
    }
  }
}
