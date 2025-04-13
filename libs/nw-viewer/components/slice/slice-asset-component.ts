import { Matrix } from '@babylonjs/core'
import { cryToGltfMat4, mat4FromAzTransform } from '@nw-viewer/math/mat4'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { ContentProvider } from '../../services/content-provider'
import { StaticMeshComponent } from '../static-mesh-component'
import { TransformComponent } from '../transform-component'
import {
  AzEntity,
  AzGameTransformComponent,
  azVectorElements,
  getSliceComponent,
  isAzEntity,
  isAzGameTransformComponent,
  isAzInstancedMeshComponent,
  isAzMeshComponent,
  isAzPrefabSpawnerComponent,
} from './types'

export interface SliceAssetOptions {
  sliceName: string
  slcieAssetId: string
}

export class SliceAssetComponent implements GameComponent {
  public entity: GameEntity
  private sliceName: string
  private slcieAssetId: string
  private content: ContentProvider
  private entities = new GameEntityCollection()
  private transform: TransformComponent
  private active = false

  public constructor(options: SliceAssetOptions) {
    this.sliceName = options.sliceName
    this.slcieAssetId = options.slcieAssetId
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.content = entity.game.system(ContentProvider)
    this.transform = entity.component(TransformComponent)
  }

  public activate(): void {
    this.active = true
    this.content
      .resolveAssetId(this.slcieAssetId, {
        name: this.sliceName,
      })
      .then((data) => {
        if (!data) {
          return null
        }
        let url = data.url
        let rootUrl = data.rootUrl
        if (url.endsWith('.slice.meta')) {
          url = url.replace('.slice.meta', '.dynamicslice.json')
        } else if (url.endsWith('.dynamicslice')) {
          url = url.replace('.dynamicslice', '.dynamicslice.json')
        } else {
          throw new Error(`Unknown asset type ${url}`)
        }
        return fetch(rootUrl + url)
      })
      .then((res) => res?.json())
      .then((data) => this.onDataLoaded(data))
      .catch(console.error)
  }

  public deactivate(): void {
    this.active = false
    this.entities.deactivate()
    this.entities.destroy()
    this.entities.clear()
  }

  public destroy(): void {
    this.entities.deactivate()
    this.entities.destroy()
    this.entities.clear()
  }

  private onDataLoaded(data: any): void {
    if (!this.active || !data) {
      return
    }

    if (!isAzEntity(data)) {
      return
    }
    const slice = getSliceComponent(data)
    for (const azEntity of azVectorElements(slice.entities)) {
      let azTransform: AzGameTransformComponent = null
      for (const azComponent of azVectorElements(azEntity.components)) {
        switch (azComponent.__type) {
          case 'GameTransformComponent': {
            if (isAzGameTransformComponent(azComponent)) {
              azTransform = azComponent
            }
            break
          }
          case 'PointSpawnerComponent': {
            // console.log('PointSpawnerComponent', azComponent)
            // references aliasasset to span one (of multiple) configured assets
            break
          }
          case 'ProjectileSpawnerComponent': {
            // console.log('ProjectileSpawnerComponent', azComponent)
            break
          }
          case 'AreaSpawnerComponent': {
            console.log('AreaSpawnerComponent', azComponent)
            break
          }
          case 'PrefabSpawnerComponent': {
            if (!isAzPrefabSpawnerComponent(azComponent)) {
              break
            }
            const asset = azComponent['prefab asset']
            if (!asset || !asset.guid || asset.guid === '00000000-0000-0000-0000-000000000000') {
              break
            }
            const entity = this.createEntity(azEntity, azTransform)
            entity.addComponents(
              new SliceAssetComponent({
                slcieAssetId: asset.guid,
                sliceName: asset.name,
              }),
            )
            entity.initialize(this.entity.game)
            entity.activate()
            this.entities.add(entity)
            break
          }
          case 'MeshComponent': {
            if (!isAzMeshComponent(azComponent)) {
              break
            }
            const node = azComponent['static mesh render node']
            if (!node.visible) {
              break
            }
            const entity = this.createEntity(azEntity, azTransform)
            // even though m_onnewparentkeepworldtm can be true, all assets inside a slice are relative to the slice
            entity.addComponents(
              new StaticMeshComponent({
                assetId: node['static mesh'].guid,
              }),
            )
            entity.initialize(this.entity.game)
            entity.activate()
            this.entities.add(entity)
            break
          }
          case 'SkinnedMeshComponent': {
            // console.log('\SkinnedMeshComponent', component)
            break
          }
          case 'InstancedMeshComponent': {
            if (!isAzInstancedMeshComponent(azComponent)) {
              break
            }
            const node = azComponent['instanced mesh render node']
            if (!node.baseclass1.visible) {
              break
            }
            const entity = this.createEntity(azEntity, azTransform)
            entity.addComponents(
              new StaticMeshComponent({
                assetId: node.baseclass1['static mesh'].guid,
                // the instances
                instances: azVectorElements(node['instance transforms']).map((it) => {
                  return Matrix.FromArray(cryToGltfMat4(mat4FromAzTransform(it.data)))
                }),
              }),
            )
            entity.initialize(this.entity.game)
            entity.activate()
            this.entities.add(entity)
            break
          }
        }
        // GameTransformComponent
        // PrefabSpawnerComponent
        // ProjectileSpawnerComponent
        // AreaSpawnerComponent
        // PointSpawnerComponent
        // SkinnedMeshComponent
        // MeshComponent
        // InstancedMeshComponent
      }
    }
  }

  private createEntity(azEntity: AzEntity, transform: AzGameTransformComponent): GameEntity {
    const entity = this.entity.game.createEntity()
    entity.name = azEntity.name
    entity.addComponents(
      // even though m_onnewparentkeepworldtm can be true, all assets inside a slice are relative to the slice
      new TransformComponent({
        transform: this.transform.createChild(azEntity.name, {
          matrix: Matrix.FromArray(cryToGltfMat4(mat4FromAzTransform(transform.m_worldtm.data))),
        }),
      }),
    )
    return entity
  }
}
