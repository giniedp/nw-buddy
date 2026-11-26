import type { RnrAsset } from '../../../formats/rnr/types'
import type { ColliderInfo } from './CollisionWorld'

export type MainToCollision =
  | {
      type: 'init'
      /**
       * Buffer of the PlayerBlock, null if shared memory is not available
       */
      player: SharedArrayBuffer | null
      /**
       * Absolute url of the nwbt file endpoint, shape asset paths are resolved against it
       */
      filesUrl: string
    }
  | {
      type: 'heightmapAdd'
      /**
       * Region name
       */
      id: string
      originX: number
      originY: number
      size: number
      mountainHeight: number
      /**
       * Shared with the main thread (copied if shared memory is not available)
       */
      heightmap: Uint16Array<ArrayBufferLike>
    }
  | {
      type: 'heightmapRemove'
      id: string
    }
  | {
      /**
       * Static colliders that block the player, batched per frame
       */
      type: 'colliders'
      add: ColliderInfo[]
      remove: number[]
    }
  | { type: 'stats' }
  | {
      /**
       * Requests a parsed shape asset, e.g. for the debug view
       */
      type: 'shape'
      requestId: number
      path: string
    }
  | {
      /**
       * Collider ground below points (the walking patrols), see {@link GROUND_QUERY_STRIDE}. The worker loads the
       * colliders around the points and returns the buffer with the answers.
       */
      type: 'ground'
      count: number
      buffer: Float32Array<ArrayBuffer>
    }

/**
 * Floats per point of a ground query: x, y, top, bottom. The answer replaces the first float of each point with the
 * highest collider hit in (bottom, top], NaN if there is none.
 */
export const GROUND_QUERY_STRIDE = 4

export type CollisionToMain =
  | { type: 'ready' }
  | {
      type: 'ground'
      count: number
      buffer: Float32Array<ArrayBuffer>
    }
  | { type: 'stats'; stats: CollisionWorkerStats }
  | {
      type: 'shape'
      requestId: number
      /**
       * Parsed asset (a copy of the worker's), unset on error
       */
      asset?: RnrAsset
      error?: string
    }

export interface CollisionWorkerStats {
  instances: number
  pending: number
  loading: number
  leaves: number
  assets: number
  heightmaps: number
  /**
   * Mean and max time of a player resolve since the previous stats request
   */
  resolveMs: number
  resolveMaxMs: number
}
