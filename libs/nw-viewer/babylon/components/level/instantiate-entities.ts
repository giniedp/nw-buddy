import { Color4, Matrix, StandardMaterial } from '@babylonjs/core'
import { EntityInfo } from '@nw-serve'
import { GameEntity, GameEntityCollection } from '../../../ecs'
import { cryToBabylonMat4 } from '../../../math/mat4'
import { DebugMeshComponent } from '../debug-mesh-component'
import { SpriteComponent } from '../sprite-component'
import { StaticMeshComponent } from '../static-mesh-component'
import { TransformComponent } from '../transform-component'
import { ENABLE_ENTITY_INDICATOR } from './constants'

export function instantiateEntities(
  collection: GameEntityCollection,
  list: EntityInfo[],
  parent: TransformComponent,
  onEntity?: (item: EntityInfo, entity: GameEntity) => void,
) {
  if (!list?.length) {
    return
  }

  // TODO: group models
  // const groups = groupBy(list, (it) => it.model)
  // for (const key in groups) {
  //   const group = groups[key]

  //   const transforms: Matrix[] = []
  //   for (const item of group) {
  //     const tx = Matrix.FromArray(cryToBabylonMat4(item.transform))
  //     transforms.push(tx)
  //     // for (const inst of item.instances || []) {
  //     //   const instance = Matrix.FromArray(cryToBabylonMat4(inst))
  //     //   tx.multiplyToRef(instance, instance)
  //     //   transforms.push(instance)
  //     // }
  //   }

  //   collection.create().addComponents(
  //     new TransformComponent({
  //       transform: parent.createChild(`${group[0].name}`, {
  //         matrix: Matrix.Identity(),
  //         isAbsolute: true,
  //       }),
  //     }),
  //     new StaticMeshComponent({
  //       model: group[0].model,
  //       instances: transforms,
  //     }),
  //   )
  // }

  for (const item of list) {
    const entity = collection.create(item.name, item.id)
    entity.addComponents(
      new TransformComponent({
        transform: parent.createChild(`${item.name} - ${item.id}`, {
          matrix: Matrix.FromArray(cryToBabylonMat4(item.transform)),
          isAbsolute: true,
        }),
      }),
    )
    if (item.vital) {
      entity.addComponent(
        new SpriteComponent({
          kind: 'vital',
        }),
      )
    }
    if (item.model) {
      entity.addComponent(
        new StaticMeshComponent({
          model: item.model,
          material: item.material,
          instances: item.instances?.map((it) => Matrix.FromArray(cryToBabylonMat4(it))),
        }),
      )
    }
    if (item.light) {
    }

    if (ENABLE_ENTITY_INDICATOR) {
      if (item.light) {
        // entity.addComponent(
        //   new DebugMeshComponent({
        //     name: `${item.name} - ${item.id} - ligtht`,
        //     type: 'sphere',
        //     color: new Color4(0.5, 0.5, 0.0, 1.0),
        //     size: item.light.pointDistance,
        //   }),
        // )
      } else {
        entity.addComponent(
          new DebugMeshComponent({
            name: `${item.name} - ${item.id} - indicator`,
            type: 'sphere',
            color: new Color4(0.25, 0.25, 0.25, 1.0),
            size: 0.5,
          }),
        )
      }
    }
    onEntity?.(item, entity)
  }
}

function createDebugMaterial() {
  const material = new StandardMaterial('debug-material-entity')
  material.diffuseColor.set(1, 0.25, 0.25)
  material.emissiveColor.set(1, 0.25, 0.25)
  material.alpha = 0.25
  material.disableLighting = true
  material.wireframe = false
  return material
}
