import {
  AbstractMesh,
  Collider,
  ISmartArrayLike,
  Plane,
  Ray,
  SmartArrayNoDuplicate,
  SubMesh,
  TransformNode,
} from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../ecs'
import { IVec2, SpatialEntry } from '../../math'
import { SceneProvider } from '../services/scene-provider'
import { QuadTree } from '../utils/quad-tree'

export interface QuadTreeOptions {
  min: IVec2
  max: IVec2
  leafSize: number
}

export class QuadTreeComponent implements GameComponent {
  private options: QuadTreeOptions
  private tree: QuadTree<AbstractMesh>
  private scene: SceneProvider

  private quadTreeEntries = new Map<AbstractMesh, SpatialEntry<AbstractMesh>>()
  private activeMeshes = new SmartArrayNoDuplicate<AbstractMesh>(10000)
  private skipFrustumClippingRestore: boolean
  public entity: GameEntity

  public constructor(options: QuadTreeOptions) {
    this.options = options
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider)
    if (this.options) {
      this.tree = createQuadTree(this.options.min, this.options.max, this.options.leafSize)
    }
  }

  public activate(): void {
    if (!this.tree) {
      console.debug('QuadTreeComponent: not activated')
      return
    }
    console.debug('QuadTreeComponent: activated', this.tree)
    this.scene.main.onNewMeshAddedObservable.add(this.onMeshAdded)
    this.scene.main.onMeshImportedObservable.add(this.onMeshImported)
    this.scene.main.onMeshRemovedObservable.add(this.onMeshRemoved)
    this.scene.main.getActiveMeshCandidates = this.getActiveMeshCandidates
    this.scene.main.getActiveSubMeshCandidates = this.getActiveSubMeshCandidates
    this.scene.main.getCollidingSubMeshCandidates = this.getCollidingSubMeshCandidates
    this.scene.main.getIntersectingSubMeshCandidates = this.getIntersectingSubMeshCandidates

    this.skipFrustumClippingRestore = this.scene.main.skipFrustumClipping
    this.scene.main.skipFrustumClipping = true
    for (const mesh of this.scene.main.meshes) {
      this.insertToQuadTree(mesh)
    }
  }

  public deactivate(): void {
    if (!this.tree) {
      return
    }
    this.scene.main.onNewMeshAddedObservable.removeCallback(this.onMeshAdded)
    this.scene.main.onMeshImportedObservable.removeCallback(this.onMeshImported)
    this.scene.main.onMeshRemovedObservable.removeCallback(this.onMeshRemoved)
    this.scene.main.setDefaultCandidateProviders()
    this.scene.main.skipFrustumClipping = this.skipFrustumClippingRestore
  }

  public destroy(): void {
    //
  }

  private onMeshAdded = (mesh: AbstractMesh) => {
    mesh.onAfterWorldMatrixUpdateObservable.add(this.onMeshWorldUpdated)
    this.onMeshWorldUpdated(mesh)
  }

  private onMeshImported = (mesh: AbstractMesh) => {
    //
  }

  private onMeshRemoved = (mesh: AbstractMesh) => {
    mesh.onAfterWorldMatrixUpdateObservable.removeCallback(this.onMeshWorldUpdated)
    this.removeFromQuadTree(mesh)
  }

  private onMeshWorldUpdated = (node: TransformNode) => {
    this.insertToQuadTree(node as AbstractMesh)
  }

  private getActiveMeshCandidates = (): ISmartArrayLike<AbstractMesh> => {
    this.activeMeshes.reset()
    selectMeshes(this.tree, this.scene.main.frustumPlanes, this.activeMeshes)
    return this.activeMeshes
  }

  private getActiveSubMeshCandidates = (mesh: AbstractMesh): ISmartArrayLike<SubMesh> => {
    return this.scene.main._getDefaultSubMeshCandidates(mesh)
  }

  private getIntersectingSubMeshCandidates = (mesh: AbstractMesh, localRay: Ray): ISmartArrayLike<SubMesh> => {
    return this.scene.main._getDefaultSubMeshCandidates(mesh)
  }

  private getCollidingSubMeshCandidates = (mesh: AbstractMesh, collider: Collider): ISmartArrayLike<SubMesh> => {
    return this.scene.main._getDefaultSubMeshCandidates(mesh)
  }

  private insertToQuadTree(mesh: AbstractMesh) {
    const volume = mesh.getBoundingInfo()
    const node = mesh.alwaysSelectAsActiveMesh ? this.tree : this.tree.fit(volume.minimum, volume.maximum)
    let entry = this.quadTreeEntries.get(mesh)
    if (entry && entry.node === node) {
      return
    }

    if (entry) {
      entry.node.remove(entry)
    } else {
      entry = { value: mesh, node }
    }
    this.quadTreeEntries.set(mesh, entry)

    node.insert(entry)
  }

  private removeFromQuadTree(mesh: AbstractMesh) {
    const entry = this.quadTreeEntries.get(mesh)
    if (entry) {
      entry.node.remove(entry)
      this.quadTreeEntries.delete(mesh)
    }
  }
}

function selectMeshes(tree: QuadTree, frustum: Plane[], activeMeshes: SmartArrayNoDuplicate<AbstractMesh>) {
  if (!tree.containsEntries() || !tree.volume.isInFrustum(frustum)) {
    return
  }
  for (const entry of tree.entries) {
    activeMeshes.pushNoDuplicate(entry.value)
  }
  for (const child of tree.children) {
    selectMeshes(child, frustum, activeMeshes)
  }
}

function createQuadTree(min: IVec2, max: IVec2, leafSize: number) {
  leafSize = nextPowerOfTwo(leafSize)
  max.x = Math.max(nextPowerOfTwo(max.x), leafSize)
  max.y = Math.max(nextPowerOfTwo(max.y), leafSize)
  const maxDepth = Math.log2(max.x) - Math.log2(leafSize)
  return QuadTree.create<AbstractMesh>(
    {
      x: min.x,
      y: Number.MIN_VALUE,
      z: min.y,
    },
    {
      x: max.x,
      y: Number.MAX_VALUE,
      z: max.y,
    },
    maxDepth,
  )
}

function nextPowerOfTwo(num: number) {
  let result = 1
  while (result < num) {
    result *= 2
  }
  return result
}
