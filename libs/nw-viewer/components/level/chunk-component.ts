import { Matrix, TransformNode } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../ecs'
import { cryToGltfMat4, mat4FromAzTransform } from '../../math/mat4'

import { ContentProvider, ContentSourceUrl } from '../../services/content-provider'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from './../debug-mesh-component'
import { StaticMeshComponent } from './../static-mesh-component'
import { TransformComponent } from './../transform-component'
import { Chunk } from './types'

export class ChunkComponent implements GameComponent {
  public entity: GameEntity
  private chunk: Chunk
  private debug: DebugMeshComponent
  private model: StaticMeshComponent
  private content: ContentProvider
  private scene: SceneProvider
  private transform: TransformComponent
  private active = false
  private entities: GameEntity[] = null

  public constructor(chunk: Chunk) {
    this.chunk = chunk
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.debug = entity.component(DebugMeshComponent)
    this.model = entity.component(StaticMeshComponent)
    this.content = entity.game.system(ContentProvider)
    this.scene = entity.game.system(SceneProvider)
    this.transform = entity.component(TransformComponent)
  }

  public activate(): void {
    this.active = true
    if (!this.entities) {
      this.beginLoad()
    } else {
      for (const entity of this.entities) {
        entity.activate()
      }
    }
  }

  public deactivate(): void {
    this.active = false
    for (const entity of this.entities || []) {
      entity.deactivate()
    }
  }

  public destroy(): void {
    const toDestroy = this.entities || []
    this.entities = null
    for (const entity of toDestroy) {
      entity.destroy()
    }
  }

  private beginLoad() {
    if (!this.chunk?.assetid?.guid) {
      return
    }
    this.content.resolveAssetId(this.chunk.assetid.guid).then((asset) => {
      if (asset.url.endsWith('.cgf')) {
        this.onModelDetected({
          url: asset.url + '.glb',
          rootUrl: asset.rootUrl,
        })
      } else if (asset.url.endsWith('.slice.meta')) {
        this.onSliceDetected({
          url: asset.url.replace('.slice.meta', '.dynamicslice.json'),
          rootUrl: asset.rootUrl,
        })
      } else if (asset.url.endsWith('.dynamicslice')) {
        this.onSliceDetected({
          url: asset.url.replace('.dynamicslice', '.dynamicslice.json'),
          rootUrl: asset.rootUrl,
        })
      } else {
        console.debug('Unknown asset type', asset.url)
      }
    })
  }

  private onModelDetected(source: ContentSourceUrl) {
    if (!this.active) {
      return
    }
    // this.model.setOptions({
    //   url: source.url,
    //   rootUrl: source.rootUrl,
    //   position: {
    //     x: this.chunk.worldposition[0],
    //     y: this.chunk.worldposition[2],
    //     z: this.chunk.worldposition[1],
    //   },
    // })
  }

  private async onSliceDetected(source: ContentSourceUrl) {
    if (!this.active) {
      return
    }
    const data = await this.content.fetchJson(source.rootUrl + source.url)
    if (!this.active) {
      return
    }

    this.entities = this.buildEntities(data.components.element.entities.element)
    for (const entity of this.entities) {
      entity.initialize(this.entity.game)
      entity.activate()
    }
  }

  private buildEntities(data: any[]) {
    const entities: GameEntity[] = []
    for (const item of data) {
      const entity = this.buildEntity(item)
      if (!entity) {
        continue
      }
      if (!entity.componentCount) {
        continue
      }
      entities.push(entity)
    }
    return entities
  }

  private buildEntity(data: any) {
    const entity = new GameEntity()
    entity.name = data.name
    for (const spec of data.components.element) {
      const type = spec.__type as string
      if (type.includes('Prefab') || type.includes('Spawn')) {
        console.log(type, spec)
      }
      switch (type) {
        case 'GameTransformComponent': {
          const matrix = Matrix.FromArray(cryToGltfMat4(mat4FromAzTransform(spec.m_worldtm.data)))
          const transform = new TransformNode(entity.name, this.scene.main)
          transform.parent = this.transform.node
          entity.addComponent(new TransformComponent({ transform, matrix }))
          break
        }
        case 'MeshComponent': {
          const hint = spec['static mesh render node']?.['static mesh']?.['hint'] as string
          if (hint?.endsWith('.cgf')) {
            entity.addComponent(
              new StaticMeshComponent({
                url: hint + '.glb',
                rootUrl: this.content.nwbtFileUrl,
              }),
            )
          }
          break
        }
        case 'SpawnerComponent': {
          break
        }
        case 'PointSpawnerComponent': {
          break
        }
      }
    }
    return entity
  }
}
