import { TransformComponent } from '@gglib/components'
import { GameEntity, GameSystem, GetComponent } from '@gglib/ecs'
import { TEARDOWN_BUDGET_MS } from '../../constants'
import { ResourceScopeComponent } from '../../content'

/**
 * Destroys entity subtrees over several frames, within {@link TEARDOWN_BUDGET_MS} per frame
 *
 * @remarks
 * A region's content is tens of thousands of entities plus the GPU resources of its scope. Destroying it at once
 * stalls the frame for hundreds of milliseconds. Here, the subtree is destroyed leaves first, so each `destroy` call
 * covers a single entity. The resources of a {@link ResourceScopeComponent} on the way are released in steps before
 * its entity is destroyed.
 *
 * A root handed over stays active, detached from its parent, until its last entity is destroyed.
 */
export class DeferredDestroySystem extends GameSystem {
  /**
   * Entities to visit, depth first: the top of the stack is processed first
   */
  private stack: GameEntity[] = []

  /**
   * Number of entities on the visit stack, roots and the descendants visited so far
   */
  public get pendingCount() {
    return this.stack.length
  }

  /**
   * Detaches the root from its parent and destroys it with its subtree over the next frames
   */
  public destroyLater(root: GameEntity) {
    if (root.isDestroyed) {
      return
    }
    root.setParent(null)
    this.stack.push(root)
  }

  /**
   * Destroys what is left of a root handed to {@link destroyLater} right away
   */
  public finish(root: GameEntity) {
    if (!root.isDestroyed) {
      root.destroy()
    }
    // the destroyed entities of the root leave the stack in the next update
  }

  public initialize(): void {
    //
  }

  public destroy(): void {
    // the world goes away: destroy what is left right away
    for (const entity of this.stack) {
      if (!entity.isDestroyed) {
        entity.destroy()
      }
    }
    this.stack.length = 0
  }

  public override update(): void {
    const stack = this.stack
    if (!stack.length) {
      return
    }
    const deadline = performance.now() + TEARDOWN_BUDGET_MS
    while (stack.length && performance.now() < deadline) {
      const entity = stack[stack.length - 1]
      if (entity.isDestroyed) {
        stack.pop()
        continue
      }
      const children = entity.getTransform<TransformComponent>()?.children
      if (children?.length) {
        // descend, leaves first: destroying a leaf deactivates and destroys only that entity and detaches it
        stack.push(children[children.length - 1].entity)
        continue
      }
      // a scope root (region content): its resources are released in steps before the entity goes
      const scope = entity.component(ResourceScopeComponent, GetComponent.Optional)
      if (scope && !scope.releaseStep(deadline)) {
        break
      }
      stack.pop()
      entity.destroy()
    }
  }
}
