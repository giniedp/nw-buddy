import { EntityInfo } from '@nw-serve'
import { uniq } from 'lodash'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { cryToGltfMat4 } from '../../../math/mat4'
import { RendererProvider } from '../../services/renderer-provider'
import { SceneProvider } from '../../services/scene-provider'
import { ActionlistComponent } from '../actionlist-component'
import { NameplateComponent } from '../nameplate-component'
import { SkinnedMeshComponent } from '../skinned-mesh-component'
import { StaticMeshComponent } from '../static-mesh-component'
import { createTransform, Transform, TransformComponent } from '../transform-component'

export interface ThreeEntitiesGroupComponentOptions {
  entities: EntityInfo[]
}

const DEBUG_LAYER = '' // 'dungeon_script'
const SHOW_ENCOUNTERS = ['sandworm', 'dungeon', 'raid', 'trial', 'daily', 'quest']

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
  }

  public deactivate(): void {
    this.entities.deactivate()
  }

  public destroy(): void {
    this.entities.destroy()
  }
}

export function instantiateEntities(collection: GameEntityCollection, list: EntityInfo[], host: Transform) {
  if (!list?.length) {
    return
  }

  const modelGroups: Record<string, EntityInfo[]> = {}
  const dubplicates: Record<string, number> = {}
  let dublicatesCount = 0
  for (const item of list) {
    if (!item.model) {
      // TODO: handle non-model items
      continue
    }
    if (DEBUG_LAYER && item.layer?.toLowerCase() !== DEBUG_LAYER) {
      continue
    }
    if (item.encounterName && !SHOW_ENCOUNTERS.includes(item.encounterName)) {
      console.debug('skip encounter', item.encounterName, item.encounter)
      continue
    }
    const key = `${item.model}#${item.material}`
    modelGroups[key] = modelGroups[key] || []
    modelGroups[key].push(item)
  }

  for (const key in modelGroups) {
    const group = modelGroups[key]
    if (group.length == 1 || !!group[0].vital) {
      for (const item of group) {
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
            parent: host,
            name: item.name,
            matrix: fromCryMatrix(item.transform),
            matrixIsWorld: true,
            maxDistance: item.maxViewDistance,
            userData: {
              item: item,
            },
          }),
        )
        // TODO: implement skinned meshes
        const isSkinned = false // item.vital
        if (isSkinned) {
          entity.addComponents(
            new ActionlistComponent({
              animationDatabase: item.vital.adbFile,
              defaultTags: item.vital.tags,
            }),
            new SkinnedMeshComponent({
              model: item.model,
              material: item.material,
              adbFile: item.vital.adbFile,
            }),
          )
        } else {
          entity.addComponents(
            new StaticMeshComponent({
              model: item.model,
              material: item.material,
              // TODO: add identity matrix for first instance?
              instances: item.instances?.map(fromCryMatrix),
            }),
          )
        }

        if (item.vital) {
          entity.addComponent(
            new NameplateComponent({
              vital: item.vital,
            }),
          )
        }
      }
      continue
    }

    const lead = group[0]
    const model = lead.model
    const material = lead.material

    const leadWorld = fromCryMatrix(lead.transform)
    const leadInverse = new Matrix4().copy(leadWorld).invert()
    const entityName = `${urlPathBasename(model)} [${group.length}]`
    const instances: Matrix4[] = []
    const skipped: EntityInfo[] = []
    const debugItems: any[] = []

    for (const item of group) {
      const instanceWorld = fromCryMatrix(item.transform)
      const instance = new Matrix4().multiplyMatrices(leadInverse, instanceWorld)
      const mKey = `${item.model}#${instanceWorld.elements.map((it) => it.toFixed(4)).join(',')}`
      if (dubplicates[mKey]) {
        dubplicates[mKey] += 1
        dublicatesCount += 1
        continue
      }
      dubplicates[mKey] = 1
      instances.push(instance)
    }
    if (skipped.length) {
      console.warn(entityName, 'skipped dublicates', { skipped, group })
    }

    collection.create(entityName).addComponents(
      new TransformComponent({
        node: createTransform({
          parent: host,
          name: entityName,
          matrix: leadWorld,
          matrixIsWorld: true,
          maxDistance: Math.max(...uniq(group.map((it) => it.maxViewDistance | 0))),
          userData: {
            instanceItems: group,
            debugItems,
          },
        }),
      }),
      new StaticMeshComponent({
        model: model,
        material: material,
        instances: instances,
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

function getMatrixPosition(matrix: Matrix4) {
  return new Vector3().setFromMatrixPosition(matrix)
}

function getMatrixScale(matrix: Matrix4) {
  return new Vector3().setFromMatrixScale(matrix)
}

function hasUniformScale(mat: Matrix4) {
  const scale = new Vector3()

  mat.decompose(new Vector3(), new Quaternion(), scale)
  const scaleArray = scale.toArray()
  return scaleArray.every((it) => it.toFixed(4) == scaleArray[0].toFixed(4))
}

function buildLeadMatrix(items: EntityInfo[]) {
  const positions = items.map((it) => {
    const mat = fromCryMatrix(it.transform)
    return new Vector3().setFromMatrixPosition(mat)
  })
  return new Matrix4().setPosition(findCenter(positions))
}

function findCenter(positions: Vector3[]) {
  const center = new Vector3()
  for (const pos of positions) {
    center.add(pos)
  }
  return center.divideScalar(positions.length)
}
