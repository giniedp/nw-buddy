import {
  BoxHelper,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  Material,
  Matrix4,
  InstancedMesh as ThreeInstancedMesh,
} from 'three'

export class InstancedMeshRef<T = unknown> {
  /**
   * The mesh instance
   */
  public readonly mesh: InstancedMesh
  /**
   * User Data
   */
  public readonly data: T

  public constructor(mesh: InstancedMesh, data?: T) {
    this.mesh = mesh
    this.data = data
  }

  public updateTransform(matrix: Matrix4) {
    this.mesh.setMatrixAt(this.mesh.indexOf(this), matrix)
  }

  public updateColor(color: Color) {
    this.mesh.setColorAt(this.mesh.indexOf(this), color)
  }

  public dispose(): void {
    this.mesh.destroyRef(this)
  }
}

export interface InstancedMeshOptions {
  geometry: BufferGeometry
  material: Material
  capacity: number
  autoGrow?: number
  colored?: boolean
}

export class InstancedMesh extends ThreeInstancedMesh {
  private matrixChanged = false
  private colorChanged = false
  private capacity: number
  private autoGrow: number
  private refToIndex = new Map<InstancedMeshRef, number>()
  private indexToRef = new Map<number, InstancedMeshRef>()

  public constructor(options: InstancedMeshOptions) {
    super(options.geometry, options.material, options.capacity)

    this.capacity = options.capacity
    this.autoGrow = options.autoGrow || 0
    if (!this.instanceMatrix) {
      this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(16 * this.capacity), 16)
    }
    if (!this.instanceColor && options.colored) {
      this.instanceColor = new InstancedBufferAttribute(new Float32Array(3 * this.capacity), 3)
    }
    this.instanceMatrix.setUsage(DynamicDrawUsage)
    this.instanceColor?.setUsage(DynamicDrawUsage)
    this.count = 0 // buffer got it's initial size. set count to 0 to draw nothing initially
  }

  public indexOf(ref: InstancedMeshRef): number {
    return this.refToIndex.get(ref) ?? -1
  }

  override setMatrixAt(index: number, matrix: Matrix4): void {
    super.setMatrixAt(index, matrix)
    this.matrixChanged = true
  }

  override setColorAt(index: number, color: Color): void {
    super.setColorAt(index, color)
    this.colorChanged = true
  }

  public createRef<T>(data?: T): InstancedMeshRef<T> {
    if (this.count >= this.capacity) {
      if (!this.autoGrow || this.autoGrow <= 0) {
        return undefined
      }
      this.capacity += this.autoGrow
      const matrix = this.instanceMatrix
      this.instanceMatrix = this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(16 * this.capacity), 16)
      this.instanceMatrix.array.set(matrix.array, 0)

      if (this.instanceColor) {
        const color = this.instanceColor
        this.instanceColor = new InstancedBufferAttribute(new Float32Array(3 * this.capacity), 3)
        this.instanceColor.array.set(color.array, 0)
      }
    }
    const ref = new InstancedMeshRef(this, data)
    this.refToIndex.set(ref, this.count)
    this.indexToRef.set(this.count, ref)
    this.count++
    this.matrixChanged = true
    this.colorChanged = true
    return ref
  }

  public destroyRef(ref: InstancedMeshRef) {
    const index = this.refToIndex.get(ref)
    if (index === undefined) {
      return
    }
    this.refToIndex.delete(ref)

    const lastIndex = this.count - 1
    if (index === lastIndex) {
      this.count--
      this.matrixChanged = true
      this.colorChanged = true
      this.indexToRef.delete(index)
      return
    }

    this.instanceMatrix.array.copyWithin(index * 16, lastIndex * 16, (lastIndex + 1) * 16)
    this.matrixChanged = true
    if (this.instanceColor) {
      this.instanceColor.array.copyWithin(index * 3, lastIndex * 3, (lastIndex + 1) * 3)
      this.colorChanged = true
    }
    const lastRef = this.indexToRef.get(lastIndex)
    this.refToIndex.set(lastRef, index)
    this.indexToRef.set(index, lastRef)
    this.count--
  }

  public update() {
    let updated = false
    if (this.matrixChanged) {
      this.instanceMatrix.needsUpdate = true
      this.matrixChanged = false
      this.updateMatrixWorld()
      this.computeBoundingBox()
      this.computeBoundingSphere()
      updated = true
    }
    if (this.colorChanged) {
      if (this.instanceColor) {
        this.instanceColor.needsUpdate = true
      }
      this.colorChanged = false
    }
    return updated
  }
}
