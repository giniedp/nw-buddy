import { QuadTree, QuadTreeNode, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { Texture } from '@gglib/graphics'
import { BoundingFrustum, mat4GetTranslation, vec3, type IVec2 } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { lfmt } from '@gglib/utils'
import type { RegionMaterial } from '../../api'
import { QUAD_TREE_LEAF_SIZE } from '../../constants'
import type { TerrainCompositeMaterial } from '../../material'

/**
 * A splat layer of a region. The material may be shared with other regions (loader cache),
 * everything region specific is held here and bound right before baking.
 */
export interface TerrainMaterialLayer {
  material: TerrainCompositeMaterial
  splat: Texture
  /**
   * Region sub tiles (8x8 of 256m) where the layer contributes, bit = row * 8 + column with row 0 at the region max y
   */
  affectedTiles: bigint
}

/**
 * Macro maps of a region
 */
export interface TerrainMacroMaps {
  color: Texture
  normal: Texture
  gloss: Texture
}

export type TerraPayload = {
  /**
   * visible in this frame
   */
  visible: boolean

  /**
   * required by a visible child
   */
  required: boolean

  region: TerrainRegionComponent
}

export type TerraRoot = QuadTree<TerraPayload>
export type TerraQuad = QuadTreeNode<TerraPayload>

export interface TerrainRegionOptions {
  regionName: string
  coatlicueName: string
  origin: IVec2
  regionSize: number
  mountainHeight: number
  regionMaterial: RegionMaterial
}

export class TerrainRegionComponent implements GameComponent {
  public get xIndex() {
    return this.origin.x / this.size
  }
  public get yIndex() {
    return this.origin.y / this.size
  }

  public heightmap: Uint16Array<ArrayBufferLike>
  public heightmapTask: ScheduledTask | null
  public heightmapReady: boolean

  /**
   * Default material of the region, may be shared with other regions, see TerrainMaterialLayer
   */
  public baseMaterial: TerrainCompositeMaterial
  public macroMaps: TerrainMacroMaps
  public baseMaterialTask: ScheduledTask | null
  public baseMaterialReady: boolean

  public layers: TerrainMaterialLayer[]
  public layerMaterialsTask: ScheduledTask | null
  public layerMaterialsReady: boolean

  public materialVersion: number = 0
  public materialData: RegionMaterial

  public readonly coatlicueName: string
  public readonly regionName: string
  public readonly origin: IVec2
  public readonly size: number
  public readonly tree: TerraRoot
  public readonly leafSize: number
  public readonly maxLevel: number
  public readonly mountainHeight: number

  /**
   * Indicates whether all resources have been loaded
   */
  public get isLoaded() {
    return this.heightmapReady && this.baseMaterialReady && this.layerMaterialsReady
  }

  private frustum: BoundingFrustum = new BoundingFrustum()
  private requiredQuads = new Set<TerraQuad>()
  private logTag = lfmt.badge('#4E79A7', '⛰️ TerrainRegionComponent')
  public constructor(options: TerrainRegionOptions) {
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', `${options.regionName}`))
    this.regionName = options.regionName
    this.coatlicueName = options.coatlicueName
    this.size = options.regionSize
    this.origin = options.origin
    this.leafSize = QUAD_TREE_LEAF_SIZE
    this.mountainHeight = options.mountainHeight
    this.materialData = options.regionMaterial

    console.assert(!!this.regionName, 'RegionComponent: regionName is required')
    console.assert(!!this.coatlicueName, 'RegionComponent: coatlicueName is required')
    console.assert(this.size > 0, 'RegionComponent: size must be greater than 0')
    console.assert(this.leafSize > 0, 'RegionComponent: leafSize must be greater than 0')
    console.assert(this.size % this.leafSize === 0, 'RegionComponent: size must be a multiple of leafSize')

    this.tree = QuadTree.create({
      min: vec3(this.origin.x, this.origin.y, 0),
      max: vec3(this.origin.x + this.size, this.origin.y + this.size, this.size),
      verticalAxis: 'z',
    })

    this.tree.subdivideTosize(this.leafSize)
    this.maxLevel = Math.log2(this.size / this.leafSize)
    for (const node of this.tree.flatPreOrdered) {
      node.data.region = this
      node.data.visible = false
    }
  }

  // #region GameComponent interface
  public readonly entity: GameEntity
  public initialize(): void {
    //
  }
  public activate(): void {
    console.log(...lfmt.merge(this.logTag, lfmt.green('Activated')))
  }
  public deactivate(): void {
    console.log(...lfmt.merge(this.logTag, lfmt.red('Deactivated')))
  }
  public destroy(): void {
    // the loads go into the region scope, which is disposed with the region: a load still in flight would fail on it.
    // The TerrainSystem only sees the region gone on its next update.
    const scheduler = this.entity.service(SchedulerSystem)
    scheduler.cancel(this.heightmapTask)
    scheduler.cancel(this.baseMaterialTask)
    scheduler.cancel(this.layerMaterialsTask)
    // splat and macro maps are owned by the region scope
    this.layers = null
    this.macroMaps = null
  }
  // #endregion

  public traverseRequiredSet(camera: CameraData, baseFactor: number, fn: (node: TerraQuad) => void): void {
    // clear helper collections
    this.requiredQuads.clear()
    clearVisibility(this.tree)

    // list of non overlapping quads

    const cam = mat4GetTranslation(camera.world)
    this.frustum.updateFromViewProjection(camera.view, camera.projection)
    this.tree.traverseLOD(cam, baseFactor, (it) => {
      if (!this.frustum.intersectsBox(it.bounds)) {
        return
      }

      it.data.visible = true
      it.data.required = true

      // union with all ancestors
      let next = it
      while (next) {
        if (this.requiredQuads.has(next)) {
          // already tracked
          break
        }
        this.requiredQuads.add(next)
        next.data.required = true
        next = next.parent
      }
    })

    traverseRequired(this.tree, fn)
  }
}

function clearVisibility(node: TerraQuad) {
  node.data.visible = false
  node.data.required = false
  for (const child of node.children) {
    clearVisibility(child)
  }
}

function traverseRequired(node: TerraQuad, fn: (node: TerraQuad) => void) {
  if (node.data.required) {
    fn(node)
  }
  for (const child of node.children) {
    traverseRequired(child, fn)
  }
}
