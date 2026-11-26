import { MeshComponent } from '@gglib/components'
import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { TerrainHeightmapArray } from './TerrainHeightmap'
import { TerrainRegionComponent } from './TerrainRegionComponent'
import type { TerrainMesh } from './TerrainMesh'

export interface TerrainComponentOptions {
  regionSize: number
}

export class TerrainComponent implements GameComponent {
  public readonly entity: GameEntity

  public meshComponent: MeshComponent
  public debugShapes: DebugShapeComponent
  public heightmap: TerrainHeightmapArray
  public regionSize: number
  public renderRegions: TerrainRegionComponent[] = []

  public get mesh() {
    return this.meshComponent?.mesh as TerrainMesh
  }

  public set mesh(value: TerrainMesh) {
    this.meshComponent.mesh = value
  }

  public constructor(options: TerrainComponentOptions) {
    this.regionSize = options.regionSize
  }

  public initialize(): void {
    const device = this.entity.service(Device)
    this.heightmap = new TerrainHeightmapArray(device, this.regionSize)
    this.meshComponent = this.entity.getOrCreateComponent(MeshComponent, () => new MeshComponent())
    this.debugShapes = this.entity.getOrCreateComponent(DebugShapeComponent, () => new DebugShapeComponent())
  }

  public destroy(): void {
    this.heightmap.dispose()
  }

  public syncHeightmaps() {
    this.heightmap.sync(this.renderRegions)
  }

  public getNeighbourLayer(region: TerrainRegionComponent, dx: number, dy: number): number {
    for (const r of this.renderRegions) {
      if (r.xIndex === region.xIndex + dx && r.yIndex === region.yIndex + dy) {
        return this.heightmap.layerOf(r.regionName)
      }
    }
    return -1
  }
}
