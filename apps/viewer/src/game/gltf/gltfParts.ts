import { BoundsComponent, InstanceDataComponent, ModelComponent, TransformComponent } from '@gglib/components'
import type { GameEntity } from '@gglib/ecs'
import type { Material } from '@gglib/graphics'
import { mat4Identity } from '@gglib/math'
import type { Model } from '@gglib/model'
import { isParamsMaterial, type MaterialParams } from '../../material/appearance'
import { createInstanceData } from '../../material/common'
import { createGltfPartModels, type GltfCharacterComponent, type GltfSkinBinding } from './GltfCharacterComponent'

/**
 * A mesh node of a glTF model as an entity, skinned by a rig
 */
export interface GltfPart {
  name: string
  entity: GameEntity
  model: Model
  binding: GltfSkinBinding | null
  /**
   * The rig that skins the part
   */
  rig: GltfCharacterComponent
  /**
   * The file marks the node as hidden by default (`extras.hidden`, e.g. the sleeveless torso of the players)
   */
  hiddenByDefault: boolean
}

export interface GltfPartsOptions {
  model: Model
  /**
   * The rig whose joints skin the parts
   */
  rig: GltfCharacterComponent
  /**
   * The entity the parts are created below
   */
  parent: GameEntity
  /**
   * Own material instances with these public params, null shares the materials
   */
  materialParams: MaterialParams | null
}

/**
 * Creates one entity per mesh node of a model, skinned nodes bound to the joints of the rig
 */
export function createGltfParts({ model, rig, parent, materialParams }: GltfPartsOptions): GltfPart[] {
  const materials = materialParams
    ? (material: Material) => {
        const properties = material.properties as { params?: Record<string, unknown> }
        return material.instantiate({ ...properties, params: { ...properties.params, ...materialParams } })
      }
    : null
  return createGltfPartModels(model, materials).map(({ node, model: partModel }) => {
    const data = createInstanceData({})
    const binding = rig.bind(model, node, data)
    const entity = parent.world.createEntity({
      name: node.name,
      parent,
      transform: new TransformComponent({ local: mat4Identity() }),
      components: [
        new BoundsComponent(),
        new InstanceDataComponent({ data }),
        new ModelComponent({ model: partModel }),
      ],
    })
    return {
      name: node.name,
      entity,
      model: partModel,
      binding,
      rig,
      hiddenByDefault: node.data?.extras?.['hidden'] === true,
    }
  })
}

/**
 * Destroys the entities of the parts and releases their skins
 */
export function destroyGltfParts(parts: GltfPart[]) {
  for (const part of parts) {
    if (part.binding) {
      part.rig.unbind(part.binding)
    }
    part.entity.destroy()
    part.entity.setParent(null)
  }
}

/**
 * Replaces the public params of the parts' materials (e.g. dye colors). Only for parts with own material instances.
 */
export function setGltfPartParams(parts: GltfPart[], params: MaterialParams) {
  for (const part of parts) {
    for (const mesh of part.model.meshes) {
      for (const material of mesh.materials) {
        if (isParamsMaterial(material)) {
          material.setParams(params)
        }
      }
    }
  }
}
