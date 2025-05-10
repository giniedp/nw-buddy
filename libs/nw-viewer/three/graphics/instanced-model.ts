import { Box3, Matrix4, Mesh, Object3D, Sphere } from 'three'
import { InstancedMesh, InstancedMeshRef } from './instanced-mesh'

export class InstancedModelRef<T = unknown> {
  public readonly model: InstancedMeshModel
  public readonly meshes: InstancedMeshRef<{ matrix: Matrix4, data: T}>[] = []
  public constructor(model: InstancedMeshModel, meshes: InstancedMeshRef<{ matrix: Matrix4, data: T}>[]) {
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

export class InstancedMeshModel extends Object3D {
  private meshes: InstancedMesh[] = []
  public boundingBox = new Box3()
  public boundingSphere = new Sphere()

  public constructor(model: Object3D, capacity: number, autogrow?: number) {
    super()
    model.traverse((object) => {
      if (!(object instanceof Mesh) || !object.geometry) {
        return
      }
      const mesh = new InstancedMesh({
        geometry: object.geometry,
        material: object.material,
        capacity: capacity || 0,
        autoGrow: autogrow || 0,
      })
      mesh.name = `${model.name} - ${object.name}`
      object.updateMatrixWorld()
      object.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale)
      mesh.updateMatrix()
      this.add(mesh)
      this.meshes.push(mesh)
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
    this.boundingBox.makeEmpty();
    for (const mesh of this.meshes) {
      this.boundingBox.union(mesh.boundingBox)
    }
  }

  public computeBoundingSphere() {
    this.boundingSphere.makeEmpty();
    for (const mesh of this.meshes) {
      this.boundingSphere.union(mesh.boundingSphere)
    }
  }
}
