import { Box3, Matrix4, Mesh, Object3D, Sphere } from 'three'
import { InstancedMesh, InstancedMeshRef } from './instanced-mesh'

export class InstancedModelRef<T = unknown> {
  public readonly model: InstancedModel
  public readonly meshes: InstancedMeshRef<{ matrix: Matrix4; data: T }>[] = []
  public constructor(model: InstancedModel, meshes: InstancedMeshRef<{ matrix: Matrix4; data: T }>[]) {
    this.model = model
    this.meshes = meshes
  }

  public dispose() {
    for (const mesh of this.meshes) {
      mesh.mesh.dispose()
    }
    this.meshes.length = 0
  }
}

const EPSILON = 1e-6
function equal(a: number, b: number) {
  return Math.abs(a - b) < EPSILON
}
function isIdentity(mat: Matrix4) {
  return (
    equal(mat.elements[0], 1) &&
    equal(mat.elements[1], 0) &&
    equal(mat.elements[2], 0) &&
    equal(mat.elements[3], 0) &&
    equal(mat.elements[4], 0) &&
    equal(mat.elements[5], 1) &&
    equal(mat.elements[6], 0) &&
    equal(mat.elements[7], 0) &&
    equal(mat.elements[8], 0) &&
    equal(mat.elements[9], 0) &&
    equal(mat.elements[10], 1) &&
    equal(mat.elements[11], 0) &&
    equal(mat.elements[12], 0) &&
    equal(mat.elements[13], 0) &&
    equal(mat.elements[14], 0) &&
    equal(mat.elements[15], 1)
  )
}

export class InstancedModel extends Object3D {
  private meshes: InstancedMesh[] = []
  public boundingBox = new Box3()
  public boundingSphere = new Sphere()

  public constructor(model: Object3D, capacity: number, autoGrow?: number) {
    super()
    walkHierarchy(model, (mesh) => {
      mesh.updateMatrixWorld(true)
      const instance = new InstancedMesh({
        geometry: mesh.geometry,
        material: mesh.material as any,
        capacity,
        autoGrow,
      })
      instance.name = `${model.name} - ${mesh.name}`

      if (!isIdentity(mesh.matrixWorld)) {
        // TODO: no idea why this works without grabbing the matrix of this node
        // instance.matrix.copy(mesh.matrixWorld)
        // instance.matrixAutoUpdate = false
        // instance.matrixWorldNeedsUpdate = false
        console.warn('InstancedModel: mesh matrixWorld is not identity, ignored', mesh)
      }

      this.meshes.push(instance)
      this.add(instance)
    })
  }

  public dispose() {
    for (const mesh of this.meshes) {
      mesh.dispose()
    }
    this.meshes.length = 0
  }

  public override copy(object: Object3D, recursive?: boolean): this {
    throw new Error('Not implemented')
  }

  public createInstance<T>(matrix: Matrix4, data?: T): InstancedModelRef<T> {
    const meshes = this.meshes.map((mesh) => mesh.createRef({ matrix, data }))
    const instance = new InstancedModelRef(this, meshes)
    for (const mesh of meshes) {
      mesh.updateTransform(mesh.data.matrix)
    }
    return instance
  }

  public update() {
    let boundsChanged = false
    for (const mesh of this.meshes) {
      boundsChanged = mesh.update() || boundsChanged
    }
    if (boundsChanged) {
      this.computeBoundingBox()
      this.computeBoundingSphere()
    }
  }

  public computeBoundingBox() {
    this.boundingBox.makeEmpty()
    for (const mesh of this.meshes) {
      this.boundingBox.union(mesh.boundingBox)
    }
  }

  public computeBoundingSphere() {
    this.boundingSphere.makeEmpty()
    for (const mesh of this.meshes) {
      this.boundingSphere.union(mesh.boundingSphere)
    }
  }
}

function walkHierarchy(model: Object3D, callback: (mesh: Mesh) => void) {
  if (model instanceof Mesh) {
    callback(model)
  }
  if (model.children?.length) {
    for (const child of model.children) {
      walkHierarchy(child, callback)
    }
  }
}

function cloneHierarchy(model: Object3D, create: (mesh: Mesh) => InstancedMesh): Object3D {
  if (model instanceof Mesh) {
    const instance = create(model)
    copyObjectProperties(model, instance, instance.name)
    return instance
  }
  const clone = new Object3D()
  copyObjectProperties(model, clone)
  for (const child of model.children) {
    clone.add(cloneHierarchy(child, create))
  }
  return clone
}

function copyObjectProperties(source: Object3D, target: Object3D, rename?: string) {
  target.name = rename ?? source.name

  target.up.copy(source.up)

  target.position.copy(source.position)
  target.rotation.order = source.rotation.order
  target.quaternion.copy(source.quaternion)
  target.scale.copy(source.scale)

  target.matrix.copy(source.matrix)
  target.matrixWorld.copy(source.matrixWorld)

  target.matrixAutoUpdate = source.matrixAutoUpdate

  target.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate
  target.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate

  target.layers.mask = source.layers.mask
  target.visible = source.visible

  target.castShadow = source.castShadow
  target.receiveShadow = source.receiveShadow

  target.frustumCulled = source.frustumCulled
  target.renderOrder = source.renderOrder

  target.animations = source.animations.slice()

  target.userData = JSON.parse(JSON.stringify(source.userData))
}
