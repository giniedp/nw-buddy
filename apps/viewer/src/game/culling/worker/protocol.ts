/**
 * Mesh nodes of one level of detail of a record
 */
export interface CullLevel {
  /**
   * World matrix per node, 16 floats each
   */
  matrices: Float32Array<ArrayBuffer>
  /**
   * Local bounding box of the node mesh, 6 floats each (min xyz, max xyz), for picking
   */
  boxes: Float32Array<ArrayBuffer>
  /**
   * Start of the batch ids of a node in {@link batches}, node count + 1 entries
   */
  batchStart: Uint32Array<ArrayBuffer>
  /**
   * Batch ids of the parts of all nodes
   */
  batches: Uint32Array<ArrayBuffer>
}

export interface CullLod {
  /**
   * See ModelLod.distance
   */
  distance: number
  /**
   * See ModelLod.spacing
   */
  spacing: 'linear' | 'doubling'
  /**
   * See ModelLod.maxLevel
   */
  maxLevel: number
  /**
   * See ModelLod.hysteresis
   */
  hysteresis: number
  /**
   * See ModelLod.maxScreenSize
   */
  maxScreenSize: number[] | null
}

/**
 * A static model that is culled by the worker
 */
export interface CullRecord {
  id: number
  /**
   * World bounding sphere of the base model (x, y, z, radius)
   */
  sphere: Float32Array<ArrayBuffer>
  /**
   * World bounding box of the base model (min xyz, max xyz), for the level of detail distance
   */
  box: Float32Array<ArrayBuffer>
  /**
   * Instance data of all nodes, 16 floats
   */
  data: Float32Array<ArrayBuffer>
  lod: CullLod | null
  /**
   * Level 0, the base model
   */
  base: CullLevel
}

export interface CullBatch {
  id: number
  /**
   * Render layer of the batch, compared with the camera visibility mask
   */
  layer: number
}

/**
 * A level of detail finished loading, null if it does not exist
 */
export interface CullLevelUpdate {
  id: number
  level: number
  data: CullLevel | null
}

export interface CullBuffers {
  transforms: Float32Array<ArrayBuffer>
  data: Float32Array<ArrayBuffer>
  batches: Uint32Array<ArrayBuffer>
}

export interface CullResult extends CullBuffers {
  frame: number
  /**
   * Number of instances in {@link transforms} and {@link data}
   */
  instanceCount: number
  /**
   * Number of entries in {@link batches}, 3 values each: batch id, instance count, first instance
   */
  batchCount: number
  /**
   * Levels of detail that are wanted but not loaded: record id and level, pairwise
   */
  requests: number[]
  stats: CullingWorkerStats
}

export interface CullingWorkerStats {
  records: number
  visibleRecords: number
  instances: number
  batches: number
  /**
   * Time of the last cull in the worker, in ms
   */
  cullMs: number
}

export interface CullHit {
  record: number
  node: number
  distance: number
}

export type MainToCulling =
  | {
      type: 'update'
      batches: CullBatch[]
      adds: CullRecord[]
      removes: number[]
      levels: CullLevelUpdate[]
    }
  | {
      type: 'cull'
      frame: number
      /**
       * View matrix of the camera
       */
      view: Float32Array<ArrayBuffer>
      /**
       * Projection used for frustum culling, may be wider than the camera projection
       */
      projection: Float32Array<ArrayBuffer>
      /**
       * projection[5] of the camera projection, for the screen size of the level of detail selection
       */
      projectionScaleY: number
      position: Float32Array<ArrayBuffer>
      visibilityMask: number
      /**
       * Buffers to write the result into, the worker allocates new ones if they are missing or too small
       */
      buffers: CullBuffers | null
    }
  | {
      type: 'raycast'
      id: number
      origin: Float32Array<ArrayBuffer>
      direction: Float32Array<ArrayBuffer>
      maxDistance: number
    }

export type CullingToMain =
  | { type: 'ready' }
  | ({ type: 'result' } & CullResult)
  | { type: 'raycast'; id: number; hits: CullHit[] }
