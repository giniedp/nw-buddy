import { EntityInfo } from '@nw-serve'
import { Matrix4 } from 'three'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { cryToGltfMat4 } from '../../../math/mat4'
import { RendererProvider } from '../../services/renderer-provider'
import { SceneProvider } from '../../services/scene-provider'
import { StaticMeshComponent } from '../static-mesh-component'
import { createTransform, Transform, TransformComponent } from '../transform-component'
import { uniq, uniqBy } from 'lodash'
import { SkinnedMeshComponent } from '../skinned-mesh-component'
import { ActionlistComponent } from '../actionlist-component'

export interface ThreeEntitiesGroupComponentOptions {
  entities: EntityInfo[]
}

interface EntityWithDistance {
  entity: GameEntity
  transform: TransformComponent
  maxDistanceSq: number
}

export class EntityGroupComponent implements GameComponent {
  private data: ThreeEntitiesGroupComponentOptions
  private isLoaded: boolean
  private scene: SceneProvider
  private renderer: RendererProvider

  private transform: TransformComponent
  private entities = new GameEntityCollection()
  public readonly entity: GameEntity

  public constructor(data: ThreeEntitiesGroupComponentOptions) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)

    this.scene = entity.service(SceneProvider)
    this.transform = entity.component(TransformComponent)
    this.renderer = entity.service(RendererProvider)
  }

  public activate(): void {
    if (!this.isLoaded) {
      this.isLoaded = true
      instantiateEntities(this.entities, this.data.entities, this.transform.node)
      this.entities.initialize(this.entity.game)
    }
    this.entities.activate()
    this.renderer.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.renderer.onUpdate.remove(this.update)
    this.entities.deactivate()
  }

  public destroy(): void {
    this.entities.destroy()
  }

  private update = () => {
    // const camera = this.scene.camera
    // if (!camera) return
    // const cx = camera.position.x
    // const cy = camera.position.y
    // for (const item of this.entitiesWithDistance) {
    //   const object = item.transform.node
    //   const dx = cx - object.position.x
    //   const dy = cy - object.position.y
    //   const distanceSquared = dx * dx + dy * dy
    //   const isVisible = distanceSquared <= item.maxDistanceSq
    //   if (object.visible !== isVisible) {
    //     object.visible = isVisible
    //     object.updateMatrixWorld()
    //   }
    // }
  }
}

const m = new Matrix4()
export function instantiateEntities(collection: GameEntityCollection, list: EntityInfo[], parent: Transform) {
  if (!list?.length) {
    return
  }

  const modelGroups: Record<string, EntityInfo[]> = {}
  const dubplicates: Record<string, number> = {}
  let dublicatesCount = 0
  for (const item of list) {
    if (item.vital?.vitalsId?.toLowerCase() == 'naga_angryearth') {
      console.log('VITAL', item)
    }
    if (!item.model) {
      // TODO: handle non-model items
      continue
    }

    const key = `${item.model}#${item.material}`
    modelGroups[key] = modelGroups[key] || []
    modelGroups[key].push(item)
  }

  for (const key in modelGroups) {
    const items = modelGroups[key]
    if (items.length == 1) {
      for (const item of items) {
        const mKey = `${item.model}#${fromCryMatrix(item.transform)
          .elements.map((it) => it.toFixed(4))
          .join(',')}`
        if (dubplicates[mKey]) {
          dubplicates[mKey] += 1
          dublicatesCount += 1
          continue
        }
        dubplicates[mKey] = 1

        const entity = collection.create(item.name, item.id).addComponent(
          new TransformComponent({
            parent: parent,
            name: item.name,
            matrix: fromCryMatrix(item.transform),
            matrixIsWorld: true,
          }),
        )
        if (false) { // item.vital) {
          entity.addComponents(
            new ActionlistComponent({
              animationDatabase: item.vital.adbFile,
              defaultTags: item.vital.tags,
            }),
            new SkinnedMeshComponent({
              model: item.model,
              material: item.material,
              maxDistance: item.maxViewDistance,
              adbFile: item.vital.adbFile,
            }),
          )
        } else {
          entity.addComponents(
            new StaticMeshComponent({
              model: item.model,
              material: item.material,
              maxDistance: item.maxViewDistance,
              // TODO: add identity matrix for first instance?
              instances: item.instances?.map(fromCryMatrix),
            }),
          )
        }
      }
      continue
    }

    const ref = items[0]
    const refModel = ref.model
    const refMaterial = ref.material
    const refWorld = fromCryMatrix(ref.transform)
    const refInverse = m.copy(refWorld).invert()
    const entityName = `${urlPathBasename(refModel)} [${items.length}]`

    const instances: Matrix4[] = []
    const skipped: EntityInfo[] = []
    for (const item of items) {
      const instance = fromCryMatrix(item.transform).premultiply(refInverse)
      const mKey = `${item.model}#${instance.elements.map((it) => it.toFixed(4)).join(',')}`
      if (dubplicates[mKey]) {
        dubplicates[mKey] += 1
        dublicatesCount += 1
        continue
      }
      dubplicates[mKey] = 1
      instances.push(instance)
    }
    if (skipped.length) {
      console.warn(entityName, 'skipped dublicates', { skipped, items })
    }

    const node = createTransform({
      parent: parent,
      name: entityName,
      matrix: refWorld,
      matrixIsWorld: true,
    })
    node.userData ||= {}
    node.userData['instance items'] = items
    collection
      .create(entityName)
      .addComponent(
        new TransformComponent({
          node: node,
        }),
      )
      .addComponent(
        new StaticMeshComponent({
          model: refModel,
          material: refMaterial,
          instances: instances,
          maxDistance: Math.max(...uniq(items.map((it) => it.maxViewDistance | 0))),
        }),
      )
  }

  if (dublicatesCount) {
    console.warn('Dublicates found', dublicatesCount)
  }
}

function urlPathBasename(url: string) {
  if (url.includes('?')) {
    url = url.split('?')[0]
  }
  if (url.includes('#')) {
    url = url.split('#')[0]
  }
  return url.split('/').pop()
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}

function fromCryMatrix(matrix: number[]) {
  return new Matrix4().fromArray(cryToGltfMat4(matrix))
}
