import { Color4, Matrix, Mesh } from '@babylonjs/core'

export interface DebugShapeCollectionOptions {
  mesh: Mesh
  capacity?: number
}

export class DebugShapeRef {
  private collection: DebugShapeCollection
  public constructor(collection: DebugShapeCollection) {
    this.collection = collection
  }
  public updateTransform(matrix: Matrix): boolean {
    return this.collection.updateTransform(this, matrix)
  }
  public updateColor(color: Color4): boolean {
    return this.collection.updateColor(this, color)
  }
  public destroy(): void {
    this.collection.destroyInstance(this)
  }
}

export class DebugShapeCollection {
  private mesh: Mesh
  private capacity: number
  private matricesData: Float32Array
  private colorData: Float32Array
  private count = 0
  private indexMap = new Map<DebugShapeRef, number>()
  private refMap = new Map<number, DebugShapeRef>()

  private transformChanged = false
  private colorChanged = false

  public get instanceCount() {
    return this.count
  }

  public constructor(options: DebugShapeCollectionOptions) {
    this.mesh = options.mesh
    this.capacity = options.capacity || 100000
    this.matricesData = new Float32Array(16 * this.capacity)
    this.colorData = new Float32Array(4 * this.capacity)
  }

  public dispose(): void {
    this.mesh.material.dispose()
    this.mesh.dispose()
    this.indexMap.clear()
    this.refMap.clear()
  }

  public createInstance(): DebugShapeRef {
    if (this.count >= this.capacity) {
      return undefined
    }
    const ref = new DebugShapeRef(this)
    this.indexMap.set(ref, this.count)
    this.refMap.set(this.count, ref)
    this.count++
    this.transformChanged = true
    this.colorChanged = true
    return ref
  }

  public updateTransform(ref: DebugShapeRef, matrix: Matrix): boolean {
    const index = this.indexMap.get(ref)
    if (index === undefined) {
      return false
    }
    matrix.copyToArray(this.matricesData, index * 16)
    this.transformChanged = true
    return true
  }

  public updateColor(ref: DebugShapeRef, color: Color4) {
    const index = this.indexMap.get(ref)
    if (index === undefined) {
      return false
    }
    color.toArray(this.colorData, index * 4)
    this.colorChanged = true
    return true
  }

  public destroyInstance(ref: DebugShapeRef) {
    const index = this.indexMap.get(ref)
    if (index === undefined) {
      return
    }
    this.indexMap.delete(ref)

    const lastIndex = this.count - 1
    if (index === lastIndex) {
      this.count--
      this.transformChanged = true
      this.colorChanged = true
      this.refMap.delete(index)
      return
    }

    this.matricesData.copyWithin(index * 16, lastIndex * 16, (lastIndex + 1) * 16)
    this.colorData.copyWithin(index * 4, lastIndex * 4, (lastIndex + 1) * 4)
    const lastRef = this.refMap.get(lastIndex)
    this.indexMap.set(lastRef, index)
    this.refMap.set(index, lastRef)
    this.count--
    this.transformChanged = true
    this.colorChanged = true
  }

  public update() {
    if (this.transformChanged) {
      this.mesh.thinInstanceSetBuffer('matrix', this.matricesData.subarray(0, this.count * 16), 16)
      this.mesh.thinInstanceRefreshBoundingInfo(true)
    }
    if (this.colorChanged) {
      this.mesh.thinInstanceSetBuffer('color', this.colorData.subarray(0, this.count * 4), 4)
    }
    this.transformChanged = false
    this.colorChanged = false
  }
}
