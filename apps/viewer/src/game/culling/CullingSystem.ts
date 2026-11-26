import { EcsGame, type SceneComponent, type SceneSource } from '@gglib/components'
import { GameSystem, GameWorld } from '@gglib/ecs'
import type { Geometry, Material } from '@gglib/graphics'
import { mat4GetTranslation, vec3, type Mat4 } from '@gglib/math'
import type { Model } from '@gglib/model'
import {
  addLayerFlags,
  LayerMask,
  RenderItemFlags,
  RenderItemType,
  Renderer,
  type CameraData,
  type FrameInfo,
  type InstanceBatchRenderItem,
  type RenderItem,
} from '@gglib/render'
import { WORKER_CULLING_FOV_MARGIN, WORKER_CULLING_IN_FLIGHT } from '../../constants'
import type { CulledModelComponent } from './CulledModelComponent'
import type {
  CullBatch,
  CullBuffers,
  CullHit,
  CullingToMain,
  CullingWorkerStats,
  CullLevel,
  CullLevelUpdate,
  CullRecord,
  CullResult,
  MainToCulling,
} from './worker/protocol'

interface BatchEntry {
  geometry: Geometry
  material: Material
  layer: number
  /**
   * Draw order of the items (entity render order)
   */
  order: number
  /**
   * Number of registered parts that use this batch, the batch is not drawn when it drops to 0
   */
  refs: number
}

interface RecordEntry {
  component: CulledModelComponent
  /**
   * Batch ids of all registered levels, one per part, for the reference counts
   */
  batches: number[]
}

export interface CullingStats extends CullingWorkerStats {
  /**
   * Frames between the cull request and the frame the result is drawn in
   */
  latency: number
}

/**
 * Culls static models in a worker and adds the visible ones to the scene as instance batches.
 *
 * @remarks
 * Models are registered by {@link CulledModelComponent}. Each frame the camera is sent to the worker, which returns the
 * visible instances grouped by batch (geometry, material and layer). The newest result is drawn: its instances are copied
 * into the renderer instance buffers and one render item per batch is added to the scene. Results are 1–2 frames late,
 * the worker culls with a widened frustum so objects do not pop in at the screen edges while turning.
 */
export class CullingSystem extends GameSystem implements SceneSource {
  private game: EcsGame
  private renderer: Renderer
  private worker: Worker
  private scene: SceneComponent | null = null

  private batches: BatchEntry[] = [null]
  private batchIds = new Map<string, number>()
  private records = new Map<number, RecordEntry>()
  private nextRecordId = 1

  private pendingBatches: CullBatch[] = []
  private pendingAdds = new Map<number, CullRecord>()
  private pendingRemoves: number[] = []
  private pendingLevels: CullLevelUpdate[] = []
  /**
   * Levels of detail requested by the worker that are loading
   */
  private loadingLevels = new Map<string, { id: number; level: number }>()

  private inFlight = 0
  private latest: CullResult | null = null
  private freeBuffers: CullBuffers[] = []
  private items: InstanceBatchRenderItem[] = []
  private projection = new Float32Array(16)
  private view = new Float32Array(16)
  private position = vec3()

  private raycasts = new Map<number, (hits: CullHit[]) => void>()
  private nextRaycastId = 1

  public stats: CullingStats | null = null

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.renderer = world.getSystem(Renderer)
    this.worker = new Worker(new URL('./worker/worker.ts', import.meta.url), {
      type: 'module',
      name: 'culling',
    })
    this.worker.addEventListener('message', this.onMessage)
  }

  public update(): void {
    const scene = this.game.scene
    if (scene !== this.scene) {
      this.scene?.sources.splice(this.scene.sources.indexOf(this), 1)
      this.scene = scene
      this.scene?.sources.push(this)
    }
    this.updateLoadingLevels()
    this.flush()
  }

  public destroy(): void {
    this.scene?.sources.splice(this.scene.sources.indexOf(this), 1)
    this.worker.removeEventListener('message', this.onMessage)
    this.worker.terminate()
  }

  /**
   * Whether all parts of a model can be drawn as instance batches: opaque, with an effect that reads its transforms
   * from the per instance buffer
   */
  public canCull(model: Model): boolean {
    let parts = 0
    for (const mesh of model.meshes) {
      for (const part of mesh.parts) {
        const material = mesh.materials[part.materialIndex]
        if (!material || material.noRender) {
          continue
        }
        if (material.isTransparent || !material.primaryEffect?.program?.perInstanceTransformBlock) {
          return false
        }
        parts++
      }
    }
    return parts > 0
  }

  public add(component: CulledModelComponent) {
    const id = this.nextRecordId++
    component.recordId = id
    const entry: RecordEntry = { component, batches: [] }
    this.records.set(id, entry)

    const model = component.model
    const sphere = model.boundingSphere
    const box = model.boundingBox
    const lod = model.lod
    this.pendingAdds.set(id, {
      id,
      sphere: new Float32Array([sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius]),
      box: new Float32Array([box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z]),
      data: component.data,
      lod: lod
        ? {
            distance: lod.distance,
            spacing: lod.spacing,
            maxLevel: lod.maxLevel,
            hysteresis: lod.hysteresis,
            maxScreenSize: lod.maxScreenSize ? Array.from(lod.maxScreenSize) : null,
          }
        : null,
      base: this.createLevel(entry, model),
    })
  }

  public remove(component: CulledModelComponent) {
    const id = component.recordId
    const entry = this.records.get(id)
    if (!entry) {
      return
    }
    component.recordId = 0
    this.records.delete(id)
    for (const batch of entry.batches) {
      this.batches[batch].refs--
    }
    this.pendingAdds.delete(id)
    this.pendingRemoves.push(id)
  }

  /**
   * Finds the culled models that a ray hits, by the bounding boxes of their mesh nodes (base level)
   */
  public raycast(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    maxDistance: number,
  ): Promise<Array<{ component: CulledModelComponent; node: number; distance: number }>> {
    const id = this.nextRaycastId++
    this.flush()
    return new Promise((resolve) => {
      this.raycasts.set(id, (hits) => {
        const result: Array<{ component: CulledModelComponent; node: number; distance: number }> = []
        for (const hit of hits) {
          const entry = this.records.get(hit.record)
          if (entry) {
            result.push({ component: entry.component, node: hit.node, distance: hit.distance })
          }
        }
        resolve(result)
      })
      this.post({
        type: 'raycast',
        id,
        origin: new Float32Array([origin.x, origin.y, origin.z]),
        direction: new Float32Array([direction.x, direction.y, direction.z]),
        maxDistance,
      })
    })
  }

  /**
   * Requests the next cull and adds the batches of the newest result, see {@link SceneSource}
   */
  public collect(frame: FrameInfo, camera: CameraData, result: RenderItem[], scene: SceneComponent): void {
    this.requestCull(frame, camera)

    const latest = this.latest
    if (!latest || !latest.instanceCount) {
      return
    }
    const instances = this.renderer.instances
    const floats = latest.instanceCount * 16
    const offset = instances.reserve(latest.instanceCount)
    instances.writeRange(offset, latest.transforms.subarray(0, floats), latest.data.subarray(0, floats))

    const mask = camera.visibilityMask ?? LayerMask.All
    const batches = latest.batches
    let count = 0
    for (let i = 0; i < latest.batchCount; i++) {
      const batch = this.batches[batches[i * 3]]
      if (!batch || batch.refs <= 0 || !(batch.layer & mask)) {
        continue
      }
      scene.updateMaterial(batch.material, null)
      const item = (this.items[count++] ||= {
        type: RenderItemType.InstanceBatch,
        data: { geometry: null, material: null, instanceOffset: 0, instanceCount: 0 },
        flags: RenderItemFlags.Opaque,
        layer: LayerMask.All,
        transform: null,
      })
      item.data.geometry = batch.geometry
      item.data.material = batch.material
      item.data.instanceCount = batches[i * 3 + 1]
      item.data.instanceOffset = offset + batches[i * 3 + 2]
      item.layer = batch.layer
      item.order = batch.order
      result.push(item)
    }
    if (this.stats) {
      this.stats.latency = frame.id - latest.frame
    }
  }

  private requestCull(frame: FrameInfo, camera: CameraData) {
    if (this.inFlight >= WORKER_CULLING_IN_FLIGHT) {
      return
    }
    this.flush()
    this.inFlight++
    // a smaller projection scale widens the frustum
    this.projection.set(camera.projection)
    this.projection[0] /= 1 + WORKER_CULLING_FOV_MARGIN
    this.projection[5] /= 1 + WORKER_CULLING_FOV_MARGIN
    this.view.set(camera.view)
    mat4GetTranslation(camera.world, this.position)
    const buffers = this.freeBuffers.pop() ?? null
    const transfer: Transferable[] = buffers
      ? [buffers.transforms.buffer, buffers.data.buffer, buffers.batches.buffer]
      : []
    this.post(
      {
        type: 'cull',
        frame: frame.id,
        view: this.view.slice(),
        projection: this.projection.slice(),
        projectionScaleY: camera.projection[5],
        position: new Float32Array([this.position.x, this.position.y, this.position.z]),
        visibilityMask: camera.visibilityMask ?? LayerMask.All,
        buffers,
      },
      transfer,
    )
  }

  private onMessage = (event: MessageEvent<CullingToMain>) => {
    const message = event.data
    switch (message.type) {
      case 'result': {
        this.inFlight--
        const result: CullResult = message
        if (this.latest && this.latest.frame > result.frame) {
          this.freeBuffers.push(result)
          return
        }
        if (this.latest) {
          this.freeBuffers.push(this.latest)
        }
        this.latest = result
        this.stats = { ...result.stats, latency: this.stats?.latency ?? 0 }
        for (let i = 0; i < result.requests.length; i += 2) {
          this.requestLevel(result.requests[i], result.requests[i + 1])
        }
        break
      }
      case 'raycast': {
        const resolve = this.raycasts.get(message.id)
        this.raycasts.delete(message.id)
        resolve?.(message.hits)
        break
      }
    }
  }

  private requestLevel(id: number, level: number) {
    const entry = this.records.get(id)
    const lod = entry?.component.model.lod
    if (!lod) {
      return
    }
    lod.resolve(level)
    this.loadingLevels.set(`${id}:${level}`, { id, level })
  }

  private updateLoadingLevels() {
    for (const [key, { id, level }] of this.loadingLevels) {
      const entry = this.records.get(id)
      const lod = entry?.component.model.lod
      if (!lod) {
        this.loadingLevels.delete(key)
        continue
      }
      const model = lod.getModel(level)
      if (model) {
        this.loadingLevels.delete(key)
        model.update(entry.component.entity.getTransform().world)
        const data = this.canCull(model) ? this.createLevel(entry, model) : null
        this.pendingLevels.push({ id, level, data })
      } else if (lod.maxLevel < level) {
        // does not exist
        this.loadingLevels.delete(key)
        this.pendingLevels.push({ id, level, data: null })
      }
    }
  }

  private createLevel(entry: RecordEntry, model: Model): CullLevel {
    const layer = entry.component.entity.layer
    const layerFlags = entry.component.entity.layerFlags
    const order = entry.component.entity.renderOrder
    const matrices: number[] = []
    const boxes: number[] = []
    const batchStart: number[] = [0]
    const batches: number[] = []
    for (const node of model.sceneNodes) {
      const mesh = model.meshes[node.data?.mesh]
      if (!mesh) {
        continue
      }
      pushMat4(matrices, node.world)
      const box = mesh.boundingBox
      boxes.push(box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z)
      for (const part of mesh.parts) {
        const material = mesh.materials[part.materialIndex]
        const geometry = mesh.geometries[part.geometryIndex]
        if (!material || !geometry || material.noRender) {
          continue
        }
        // batches are keyed by layer and order, so they split by the entity layer flags (e.g. decal receivers) and
        // render order (e.g. decal sort priority)
        const batch = this.getBatch(
          geometry,
          material,
          addLayerFlags(layer ?? material.layer ?? LayerMask.All, layerFlags),
          order,
        )
        this.batches[batch].refs++
        entry.batches.push(batch)
        batches.push(batch)
      }
      batchStart.push(batches.length)
    }
    return {
      matrices: new Float32Array(matrices),
      boxes: new Float32Array(boxes),
      batchStart: new Uint32Array(batchStart),
      batches: new Uint32Array(batches),
    }
  }

  private getBatch(geometry: Geometry, material: Material, layer: number, order: number) {
    const key = `${objectId(geometry)}:${objectId(material)}:${layer}:${order}`
    let id = this.batchIds.get(key)
    if (id === undefined) {
      id = this.batches.length
      this.batches.push({ geometry, material, layer, order, refs: 0 })
      this.batchIds.set(key, id)
      this.pendingBatches.push({ id, layer })
    }
    return id
  }

  /**
   * Sends the pending registrations
   */
  private flush() {
    if (
      !this.pendingBatches.length &&
      !this.pendingAdds.size &&
      !this.pendingRemoves.length &&
      !this.pendingLevels.length
    ) {
      return
    }
    this.post({
      type: 'update',
      batches: this.pendingBatches,
      adds: [...this.pendingAdds.values()],
      removes: this.pendingRemoves,
      levels: this.pendingLevels,
    })
    this.pendingBatches = []
    this.pendingAdds.clear()
    this.pendingRemoves = []
    this.pendingLevels = []
  }

  private post(message: MainToCulling, transfer?: Transferable[]) {
    this.worker.postMessage(message, transfer ?? [])
  }
}

let nextObjectId = 1
const objectIds = new WeakMap<object, number>()
function objectId(object: object) {
  let id = objectIds.get(object)
  if (!id) {
    id = nextObjectId++
    objectIds.set(object, id)
  }
  return id
}

function pushMat4(out: number[], m: Mat4) {
  for (let i = 0; i < 16; i++) {
    out.push(m[i])
  }
}
