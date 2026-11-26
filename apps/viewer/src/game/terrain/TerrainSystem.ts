import { EcsGame, SchedulerSystem } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Device, type ResourceScope } from '@gglib/graphics'
import {
  BoundingFrustum,
  mat4$initScaleXYZ,
  mat4$setScaleXYZ,
  mat4$setTranslationXYZ,
  mat4CreateTranslation,
  mat4GetTranslation,
  mat4Identity,
  srgbToLinear,
  vec3,
  vec3$initFrom,
  vec4,
  type IVec4,
  type Mat4,
} from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'

import { isViewerWaterOceanComponent, type LevelInfo } from '../../api'
import { QUAD_TREE_LEAF_SIZE, TERRAIN_LOD_RANGE_FACTOR, VT_LOD_QUALITY, VT_MIP_COUNT } from '../../constants'
import { ContentService, materialAssetPath } from '../../content'
import { WaterPatchMaterial, type OceanAnimationParams } from '../../material'
import { DebugLayer, type DebugShapeEntry } from '../debug/DebugShapeComponent'
import { DebugShapeSystem } from '../debug/DebugShapeSystem'
import { TerrainComponent } from './TerrainComponent'
import { TerrainIndirection } from './TerrainIndirection'
import { TerrainMacroArrays } from './TerrainMacroArrays'
import { TerrainMesh } from './TerrainMesh'
import { TerrainPageTextures } from './TerrainPageTextures'
import { regionContains, sampleRegionHeightAsTerrain } from './heightSampling'
import { pageWorldSize, TerrainPages } from './TerrainPages'
import { TerrainRegionComponent, type TerraQuad } from './TerrainRegionComponent'
import { loadBaseMaterial, loadHeightmap, loadLayerMaterials } from './loaders'

export class TerrainSystem extends GameSystem {
  private allTerrains: GameQuery
  private allRegions: GameQuery

  private game: EcsGame
  private device: Device
  private content: ContentService
  private scheduler: SchedulerSystem
  private world: GameWorld

  private renderList: TerraQuad[] = []
  private loadedRegions: TerrainRegionComponent[] = []

  private mountainHeight = 2048
  private oceanLevel = 40

  private oceanMtl: WaterPatchMaterial
  private oceanDirty = true
  private oceanAnimation: OceanAnimationParams = {}

  /**
   * Virtual texture page selection and residency
   */
  public readonly pages = new TerrainPages({ quality: VT_LOD_QUALITY })
  public pageTextures: TerrainPageTextures
  public indirection: TerrainIndirection
  public macroArrays: TerrainMacroArrays
  private pagesFrustum = new BoundingFrustum()
  private pagesDebug: DebugShapeEntry[] = null
  private pagesDebugPool: Mat4[] = []

  public initialize(world: GameWorld): void {
    this.world = world
    this.device = world.getSystem(Device)
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.allTerrains = world.query({ scope: 'all', required: [TerrainComponent] })
    this.allRegions = world.query({ scope: 'all', required: [TerrainRegionComponent] })
  }

  public update(): void {
    let count = 0
    for (const entity of this.allTerrains) {
      count++
      if (count === 1) {
        this.updateTerrain(entity.component(TerrainComponent))
      } else {
        console.warn('Multiple terrain entities found, only the first one will be updated')
      }
    }

    if (!count) {
      this.disposeVirtualTexture()
    }
  }

  public destroy(): void {
    this.disposeVirtualTexture()
  }

  /**
   * Terrain height at a world position from the CPU heightmaps of the loaded regions, sampled like the
   * terrain vertex shader, undefined if no region with a heightmap covers the position
   */
  public heightAt(x: number, y: number): number | undefined {
    for (const region of this.loadedRegions) {
      if (!region.heightmap) {
        continue
      }
      const lx = x - region.origin.x
      const ly = y - region.origin.y
      if (lx >= 0 && ly >= 0 && lx <= region.size && ly <= region.size) {
        return sampleRegionHeightAsTerrain(region, x, y)
      }
    }
    return undefined
  }

  private createVirtualTexture(terrain: TerrainComponent) {
    this.pageTextures = new TerrainPageTextures(this.device, this.pages.capacity, this.content.whitePixel)
    this.indirection = new TerrainIndirection(this.device, this.pages, terrain.regionSize)
    this.macroArrays = new TerrainMacroArrays(this.device)
    this.pages.bake = (page) => this.pageTextures?.bake(page)
    this.pages.canBake = (region) => !!region.baseMaterial && !!region.macroMaps && region.layerMaterialsReady
    this.pages.onResidencyChange = (page) => this.indirection?.pageChanged(page)
  }

  private disposeVirtualTexture() {
    this.pageTextures?.dispose()
    this.pageTextures = null
    this.indirection?.dispose()
    this.indirection = null
    this.macroArrays?.dispose()
    this.macroArrays = null
  }

  public async setLevelInfo(
    info: LevelInfo,
    ctx: { content: ContentService; scope: ResourceScope; signal: AbortSignal },
  ) {
    this.mountainHeight = info.mountainHeight
    this.oceanLevel = info.oceanLevel
    this.oceanAnimation = oceanAnimationOf(info)
    this.oceanMtl = null
    this.oceanDirty = true

    const materialName = info.mission?.environment?.ocean?.material
    if (!materialName) {
      return
    }

    const material = await this.content.loader.loadMaterial(materialAssetPath(materialName), {
      baseUrl: this.content.nwbtFileUrl,
      scope: ctx.scope,
      signal: ctx.signal,
    })
    ctx.signal.throwIfAborted()

    this.oceanMtl = material as WaterPatchMaterial
    this.oceanDirty = true
  }

  // #region Update Terrain Entity

  private updateTerrain(terrain: TerrainComponent) {
    if (!this.pageTextures) {
      this.createVirtualTexture(terrain)
    }

    if (!terrain.mesh) {
      const mesh = new TerrainMesh(this.device, { size: QUAD_TREE_LEAF_SIZE })
      mesh.TerrainMaterial.HeightMap = this.content.nullHeightmapArray
      mesh.TerrainMaterial.MountainHeight = this.mountainHeight

      mesh.WaterMaterial.WaterLevel = this.oceanLevel

      terrain.mesh = mesh
    }

    const material = terrain.mesh.TerrainMaterial
    material.PageMap1 = this.pageTextures.textures[0]
    material.PageMap2 = this.pageTextures.textures[1]
    material.IndirectionMap = this.indirection.texture
    material.MacroColorMap = this.macroArrays.textures[0]
    material.MacroNormalMap = this.macroArrays.textures[1]
    material.MacroGlossMap = this.macroArrays.textures[2]

    if (this.oceanDirty) {
      this.oceanDirty = false

      const mesh = terrain.mesh
      mesh.WaterMaterial = this.oceanMtl || new WaterPatchMaterial(this.device, { properties: {} })
      mesh.WaterMaterial.applyOceanAnimation(this.oceanAnimation)
      mesh.WaterMaterial.WaterLevel = this.oceanLevel
      // TODO: dispose the old water material
    }

    // regions are destroyed when the RegionComponent unloads its content, they leave the query without being seen inactive
    for (let i = this.loadedRegions.length - 1; i >= 0; i--) {
      if (this.loadedRegions[i].entity.isDestroyed) {
        this.unloadRegion(this.loadedRegions[i])
      }
    }
    for (const entity of this.allRegions) {
      const region = entity.component(TerrainRegionComponent)
      if (!entity.isActive) {
        this.unloadRegion(region)
      } else {
        this.updateRegionResources(region)
        this.updateRegion(region)
      }
    }

    // region layers must be known before instances reference them
    this.indirection.sync(this.loadedRegions)
    for (const region of this.loadedRegions) {
      this.macroArrays.sync(region, this.indirection.layerOf(region))
    }

    this.updateRenderList(terrain)
    this.updatePages(terrain)
  }

  private updatePages(terrain: TerrainComponent) {
    const camera = this.game.scene.getView(0).camera
    this.pagesFrustum.updateFromViewProjection(camera.view, camera.projection)
    const focalPx = (camera.projection[5] * this.device.canvas.height) / 2
    this.pages.update(this.loadedRegions, mat4GetTranslation(camera.world), this.pagesFrustum, focalPx)
    this.indirection.upload()
    this.updatePagesDebug(terrain)
  }

  private updatePagesDebug(terrain: TerrainComponent) {
    const debug = this.world.getSystem(DebugShapeSystem)
    if (!debug?.isLayerEnabled(DebugLayer.TerrainPages)) {
      return
    }
    if (!this.pagesDebug) {
      const shapes = terrain.debugShapes
      this.pagesDebug = []
      for (let mip = 0; mip <= VT_MIP_COUNT; mip++) {
        // last entry collects pages that are not resident yet
        const color = mip < VT_MIP_COUNT ? PAGE_MIP_COLORS[mip] : { x: 0.3, y: 0.3, z: 0.3 }
        this.pagesDebug.push(shapes.add({ type: 'box', layer: DebugLayer.TerrainPages, color, instances: [] }))
      }
    }
    for (const entry of this.pagesDebug) {
      entry.transforms.length = 0
    }
    let used = 0
    for (const page of this.pages.selected) {
      const size = pageWorldSize(page.mip)
      const mat = (this.pagesDebugPool[used++] ||= mat4Identity())
      // shrink a bit so neighbouring outlines stay apart, lift above the ground
      mat4$initScaleXYZ(mat, size * 0.92, size * 0.92, 0.1)
      mat4$setTranslationXYZ(
        mat,
        page.region.origin.x + (page.x + 0.5) * size,
        page.region.origin.y + (page.y + 0.5) * size,
        page.height + 0.5,
      )
      const entry = this.pagesDebug[this.pages.isResident(page) ? page.mip : VT_MIP_COUNT]
      entry.transforms.push(mat)
    }
  }

  private unloadRegion(region: TerrainRegionComponent) {
    removeItemUnordered(this.loadedRegions, region)
  }

  private updateRegion(region: TerrainRegionComponent) {
    console.assert(region.entity.isActive, 'Region should be active')

    if (!this.loadedRegions.includes(region)) {
      this.loadedRegions.push(region)
    }

    const camera = this.game.scene.getView(0).camera
    region.traverseRequiredSet(camera, TERRAIN_LOD_RANGE_FACTOR, () => {
      // selection only, visibility flags are read when building the render list
    })
  }

  private updateRegionResources(region: TerrainRegionComponent) {
    this.loadHeightmap(region)
    this.loadBaseMaterial(region)
    this.loadLayerMaterials(region)
  }

  private loadBaseMaterial(region: TerrainRegionComponent) {
    if (region.baseMaterial || region.baseMaterialTask) {
      return
    }
    const material = region.materialData
    if (!material) {
      region.baseMaterialReady = true
      return
    }
    const scope = this.content.scopeOf(region.entity)
    region.baseMaterialTask = loadBaseMaterial(this.content, this.scheduler, scope, material, (result) => {
      region.baseMaterialReady = true
      region.baseMaterialTask = null
      region.baseMaterial = result?.material
      region.macroMaps = result?.macro
      region.materialVersion++
    })
  }

  private loadLayerMaterials(region: TerrainRegionComponent) {
    if (region.layers || region.layerMaterialsTask) {
      return
    }
    const material = region.materialData
    if (!material) {
      region.layerMaterialsReady = true
      return
    }
    const scope = this.content.scopeOf(region.entity)
    region.layerMaterialsTask = loadLayerMaterials(this.content, this.scheduler, scope, material, (result) => {
      region.layerMaterialsReady = true
      region.layerMaterialsTask = null
      region.layers = result || []
      region.materialVersion++
    })
  }

  private loadHeightmap(region: TerrainRegionComponent) {
    if (region.heightmap || region.heightmapTask) {
      return
    }
    region.heightmapTask = loadHeightmap(
      this.content,
      this.scheduler,
      region.coatlicueName,
      region.regionName,
      (result) => {
        region.heightmapReady = true
        region.heightmapTask = null
        region.heightmap = result || new Uint16Array(region.size * region.size)
      },
    )
  }

  private updateRenderList(terrain: TerrainComponent) {
    this.renderList.length = 0
    terrain.renderRegions.length = 0

    for (const region of this.loadedRegions) {
      if (!region.entity || !region.entity.isActive) {
        continue
      }

      if (!region.heightmap) {
        continue
      }

      terrain.renderRegions.push(region)

      for (const node of region.tree.flatPreOrdered) {
        if (node.data.visible) {
          this.renderList.push(node)
        }
      }
    }

    terrain.syncHeightmaps()

    const mesh = terrain.meshComponent.mesh as TerrainMesh
    const hmMaterial = mesh.TerrainMaterial
    hmMaterial.HeightMap = terrain.heightmap.texture

    mesh.resetInstanceCount()
    let instanceCount = 0
    let lastRegion: TerrainRegionComponent = null
    for (const renderNode of this.renderList) {
      const p = renderNode.data
      const region = p.region

      if (region !== lastRegion) {
        lastRegion = region
        this.writeRegionInstanceData(region)
      }

      mesh.startInstance(instanceCount)

      vec3$initFrom(vec3.$1, renderNode.bounds.min)
      const mat = mat4CreateTranslation(vec3.$1)
      mat4$setScaleXYZ(mat, renderNode.size / region.leafSize, renderNode.size / region.leafSize, 1)
      mesh.writeTransform(mat)

      const morphLod = Math.log2(renderNode.size / region.leafSize)
      mesh.writeParams1({
        x: QUAD_TREE_LEAF_SIZE,
        y: TERRAIN_LOD_RANGE_FACTOR,
        z: morphLod,
        w: 0,
      })

      mesh.writeParams2(this.regionParams2)

      mesh.writeParams3({
        x: terrain.getNeighbourLayer(region, 0, 0),
        y: terrain.getNeighbourLayer(region, 1, 0), // +X,
        z: terrain.getNeighbourLayer(region, 0, 1), // +Y,
        w: terrain.getNeighbourLayer(region, 1, 1), // +X+Y corner,
      })

      mesh.writeRegionParams(this.regionParams)
      mesh.writeMacroColor(this.regionMacroColor)

      computeUvTransform(renderNode, renderNode.root, vec4.$0)
      mesh.writeHeightUvTransform(vec4.$0)
      mesh.writeHeightUvTransformCoarse(vec4.$0)

      instanceCount++
    }
    mesh.commitInstanceData()
  }

  private regionParams2 = vec4()
  private regionParams = vec4()
  private regionMacroColor = vec4()

  /**
   * Virtual texture layer and distant macro shading of a region, see TerrainPatchMaterial InstanceBlock
   */
  private writeRegionInstanceData(region: TerrainRegionComponent) {
    const layer = this.indirection.layerOf(region)
    // the terrain draw binds the world background params, color as linear * 2 (GPA capture, g_macroMaterialDiffuseColor)
    const data = region.materialData
    const macro = data?.customBackgroundParams ?? data?.worldBackgroundParams ?? data?.macroMaterialParams
    const color = macro?.color ?? [0.5, 0.5, 0.5, 1]
    const colorScale = 2 * (macro?.colorScale ?? 1)

    this.regionParams2.x = layer
    this.regionParams2.y = this.macroArrays.isReady(region, layer) ? 1 : 0
    this.regionParams2.z = Math.max(macro?.normalScale ?? 1, 0.001)
    this.regionParams2.w = macro?.specularReflectance ?? 0

    this.regionParams.x = region.origin.x
    this.regionParams.y = region.origin.y
    this.regionParams.z = region.size
    this.regionParams.w = 0

    this.regionMacroColor.x = srgbToLinear(color[0]) * colorScale
    this.regionMacroColor.y = srgbToLinear(color[1]) * colorScale
    this.regionMacroColor.z = srgbToLinear(color[2]) * colorScale
    this.regionMacroColor.w = macro?.glossScale ?? 1
  }

  // #endregion
}

export function computeUvTransform(childNode: TerraQuad, ancestorNode: TerraQuad, output: IVec4) {
  const child = childNode.bounds
  const ancestor = ancestorNode.bounds

  const rangeW = 1 / (ancestor.max.x - ancestor.min.x)
  const rangeH = 1 / (ancestor.max.y - ancestor.min.y)

  const scaleX = (child.max.x - child.min.x) * rangeW
  const offsetX = (child.min.x - ancestor.min.x) * rangeW

  // HINT: y is flipped in UV space, so we use max.y for offset and scale based on height
  const scaleY = (child.max.y - child.min.y) * rangeH
  const offsetY = (ancestor.max.y - child.max.y) * rangeH

  output.x = scaleX
  output.y = scaleY
  output.z = offsetX
  output.w = offsetY
}

const PAGE_MIP_COLORS = [
  { x: 1.0, y: 0.1, z: 0.1 },
  { x: 1.0, y: 0.5, z: 0.0 },
  { x: 1.0, y: 1.0, z: 0.0 },
  { x: 0.2, y: 1.0, z: 0.2 },
  { x: 0.0, y: 0.9, z: 0.9 },
  { x: 0.2, y: 0.4, z: 1.0 },
  { x: 0.6, y: 0.2, z: 1.0 },
  { x: 1.0, y: 0.3, z: 0.8 },
]

/**
 * The ocean animation of a level. The game takes it from the WaterOceanComponent of the mission entities and falls
 * back to the mission `<OceanAnimation>` values only without that component.
 */
function oceanAnimationOf(info: LevelInfo): OceanAnimationParams {
  for (const entity of info.missionEntities ?? []) {
    const ocean = entity.components?.find(isViewerWaterOceanComponent)
    if (ocean) {
      return ocean
    }
  }
  return info.mission?.environment?.oceanAnimation ?? {}
}
