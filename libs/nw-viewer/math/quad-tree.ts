import { boxContainsBox, IntersectionType } from './collision'
import { IVec3, SpatialEntry, SpatialNode } from './types'


/**
 * @public
 */
export class QuadTree<T = any> implements SpatialNode<T> {
  public readonly min: IVec3
  public readonly max: IVec3

  /**
   * Number of object contained by this or descendant nodes
   */
  public readonly count: number

  /**
   * Depth level of this node
   */
  public readonly level: number

  /**
   * Indicates whether this is a leaf node
   */
  public get isLeaf() {
    return this.children.length == 0
  }

  /**
   * Indicates that this node is a root node without a parent
   */
  public get isRoot() {
    return this.parent == null
  }

  public readonly children: Array<QuadTree<T>> = []
  public readonly entries: Array<SpatialEntry<T>> = []

  public get hasEntries() {
    return this.containsEntries()
  }

  private constructor(
    min: IVec3,
    max: IVec3,
    level: number,
    private parent?: QuadTree<T>,
  ) {
    this.min = {
      x: Math.min(min.x, max.x),
      y: Math.min(min.y, max.y),
      z: Math.min(min.z, max.z),
    }
    this.max = {
      x: Math.max(min.x, max.x),
      y: Math.max(min.y, max.y),
      z: Math.max(min.z, max.z),
    }
    this.level = level
  }

  public containsEntries() {
    if (this.entries.length > 0) {
      return true
    }
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].containsEntries()) {
        return true
      }
    }
    return false
  }

  public walk(callback: (node: QuadTree<T>) => true | void): true | void  {
    if (callback(this)) {
      return true
    }
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].walk(callback)) {
        return true
      }
    }
  }

  /**
   * Creates an occ tree with given dimensions
   * @param min - the minimum point in 3D space
   * @param max - the maximum point in 3D space
   * @param maxDepth - the maximum tree dpeth
   */
  public static create<T = any>(min: IVec3, max: IVec3, maxDepth: number) {
    return new QuadTree<T>(min, max, 0).subdivide(maxDepth)
  }

  /**
   * Inserts an entry into this node
   *
   * @param entry - the entry to insert
   * @remarks
   * The entry is inserted without any checks. This method is meant
   * for higher level system to insert entries as needed
   * @returns `false` if the entry was already inserted
   */
  public insert(entry: SpatialEntry<T>): boolean {
    const index = this.entries.indexOf(entry)
    if (index < 0) {
      this.entries.push(entry)
      return true
    }
    return false
  }

  /**
   * Removes an entry from this node
   *
   * @param entry - the entry to remove
   * @returns `true` if the entry was in this node ind is removed
   */
  public remove(entry: SpatialEntry<T>): boolean {
    const index = this.entries.indexOf(entry)
    if (index >= 0) {
      this.entries.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Sub divide the nodes of the tree until given depth is reached
   *
   * @param maxDepth - the maximum tree depth
   */
  public subdivide(maxDepth: number): this {
    if (this.level >= maxDepth) {
      return this
    }
    if (this.children.length == 0) {
      const stepX = (this.max.x - this.min.x) * 0.5
      const stepZ = (this.max.z - this.min.z) * 0.5

      for (let i = 0; i < 4; i++) {
        const offsetX = i & 1 ? stepX : 0
        const offsetZ = i & 2 ? stepZ : 0
        const min = {
          x: this.min.x + offsetX,
          y: this.min.y,
          z: this.min.z + offsetZ,
        }
        const max = {
          x: min.x + stepX,
          y: this.max.y,
          z: min.z + stepZ,
        }
        this.children[i] = new QuadTree(min, max, this.level + 1, this)
      }
    }
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].subdivide(maxDepth)
    }
    return this
  }

  public fit(min: IVec3, max: IVec3): QuadTree<T> {
    if (boxContainsBox(this.min, this.max, min, max) === IntersectionType.Contains) {
      return this.testDown(min, max)
    }
    return this.testUp(min, max)
  }

  private testUp(min: IVec3, max: IVec3): QuadTree<T> {
    if (this.parent) {
      if (boxContainsBox(this.parent.min, this.parent.max, min, max) === IntersectionType.Contains) {
        return this.parent
      }
      return this.parent.testUp(min, max)
    }
    return this
  }

  private testDown(min: IVec3, max: IVec3): QuadTree<T> {
    if (this.children) {
      let child: QuadTree
      for (let i = 0; i < this.children.length; i++) {
        child = this.children[i]
        if (boxContainsBox(child.min, child.max, min, max) === IntersectionType.Contains) {
          return this.children[i].testDown(min, max)
        }
      }
    }
    return this
  }
}
