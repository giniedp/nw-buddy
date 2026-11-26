import {
  CameraComponent,
  getSpatialEntries,
  KeyboardInputSystem,
  ModelComponent,
  MouseInputSystem,
  SpatialComponent,
} from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { KeyboardKeys, MouseButton } from '@gglib/game'
import type { Mesh } from '@gglib/graphics'
import {
  Intersection,
  mat4,
  mat4Invert,
  rayCreate,
  rayIntersectsBoxAt,
  rayPositionAt,
  vec3,
  vec3ApplyMat4,
  vec3ApplyMat4Rotation,
  vec3Distance,
  type BoundingBox,
  type Transform,
} from '@gglib/math'
import { brand, EventEmitter, type EventType } from '@gglib/utils'
import { RenderSizeSystem } from '../../graphics/RenderSizeSystem'
import { CullingSystem } from '../culling/CullingSystem'
import { InstancedModelComponent } from '../instancing/InstancedModelComponent'

export interface RaySelection {
  distance: number
  entity: GameEntity
  node: Transform
  mesh: Mesh
  box: BoundingBox
}

export class RaycastSystem extends GameSystem {
  public static readonly onSelect = brand<EventType<RaySelection>>(Symbol('onSelect'))

  private events = new EventEmitter()
  public onSelect = this.events.channel(RaycastSystem.onSelect)

  private mouse: MouseInputSystem
  private keyboard: KeyboardInputSystem
  private spatialQuery: GameQuery
  private culling: CullingSystem | null
  private pickId = 0

  private ignoreList: Array<any> = []
  private selectList: RaySelection[] = []
  private selectIndex: number = 0

  private get selection() {
    return this.selectList[this.selectIndex]
  }

  public maxPickDistance: number = 1000
  public camera: CameraComponent
  public initialize(world: GameWorld): void {
    this.mouse = world.getSystem(MouseInputSystem)
    this.keyboard = world.getSystem(KeyboardInputSystem)
    this.spatialQuery = world.query({ scope: 'active', required: [SpatialComponent] })
    this.culling = world.getSystem(CullingSystem, { optional: true })
    this.renderSize = world.getSystem(RenderSizeSystem, { optional: true })
  }

  private renderSize: RenderSizeSystem | null = null

  public override update() {
    if (!this.camera) {
      return
    }

    // toggle through selection list
    if (this.keyboard.justPressed(KeyboardKeys.Tab)) {
      const step = this.keyboard.isPressed(KeyboardKeys.ShiftLeft) ? -1 : 1
      this.selectIndex = (this.selectIndex + step + this.selectList.length) % this.selectList.length
      this.emitSelection()
      return
    }

    const shiftThrough = this.keyboard.isPressed(KeyboardKeys.AltLeft)
    if (!shiftThrough) {
      this.ignoreList.length = 0
    }

    if (this.mouse.buttonJustPressed(MouseButton.Middle)) {
      this.pick(shiftThrough)
    }
  }

  private async pick(shiftThrough: boolean) {
    const pickId = ++this.pickId
    const output: RaySelection[] = []
    this.raycast(output)
    await this.raycastCulled(output)
    if (pickId !== this.pickId) {
      // a newer pick started meanwhile
      return
    }
    output.sort((a, b) => a.distance - b.distance)
    this.selectList = output
    this.selectIndex = 0
    while (this.ignoreList.includes(this.selection?.node)) {
      this.selectIndex++
    }
    if (this.selection && shiftThrough) {
      this.ignoreList.push(this.selection.node)
    }
    this.emitSelection()
  }

  /**
   * Picks the models that are culled by the culling worker, they are not part of a spatial index
   */
  private async raycastCulled(output: RaySelection[]) {
    const culling = this.culling
    if (!culling) {
      return
    }
    const ray = this.mouseRay()
    const hits = await culling.raycast(ray.position, ray.direction, this.maxPickDistance)
    for (const hit of hits) {
      const model = hit.component.model
      const node = model.sceneNodes.filter((it) => model.meshes[it.data?.mesh])[hit.node]
      const mesh = node && model.meshes[node.data.mesh]
      if (!mesh) {
        continue
      }
      output.push({
        distance: hit.distance,
        entity: hit.component.entity,
        node,
        mesh,
        box: mesh.boundingBox,
      })
    }
  }

  private tmpRay = rayCreate()

  /**
   * The ray under the mouse, mapped into the main view (letterboxed for a fixed resolution + fit)
   */
  private mouseRay() {
    const size = this.renderSize
    const x = size ? size.toViewX(this.mouse.xNormalized) : this.mouse.xNormalized
    const y = size ? size.toViewY(this.mouse.yNormalized) : this.mouse.yNormalized
    return this.camera.createRay(x, y)
  }

  private raycast(output: RaySelection[]) {
    const ray = this.mouseRay()
    for (const entity of this.spatialQuery) {
      entity.component(SpatialComponent).index.traverseIntersection(ray, Intersection.rayBox, (node) => {
        for (const item of getSpatialEntries(node).values) {
          const model =
            item.entity.component(ModelComponent, GetComponent.Optional)?.model ||
            item.entity.component(InstancedModelComponent, GetComponent.Optional)?.model
          if (!model) {
            continue
          }
          for (const node of model.sceneNodes) {
            const mesh = model.meshes[node.data.mesh]
            if (!mesh) {
              continue
            }

            // transform ray into local space of mesh
            const localRay = this.tmpRay
            const inv = mat4Invert(node.world, mat4.$0)
            vec3ApplyMat4(ray.position, inv, localRay.position)
            vec3ApplyMat4Rotation(ray.direction, inv, localRay.direction)

            // check intersection
            const dLocal = rayIntersectsBoxAt(localRay, mesh.boundingBox)
            if (isNaN(dLocal) || dLocal < 0) {
              continue
            }

            // transform intersection point back into world space
            rayPositionAt(localRay, dLocal, vec3.$0)
            vec3ApplyMat4(vec3.$0, node.world, vec3.$0)
            const distance = vec3Distance(ray.position, vec3.$0)

            // store result
            if (distance > 0 && distance < this.maxPickDistance) {
              output.push({
                distance,
                entity: item.entity,
                node: node,
                mesh: mesh,
                box: mesh.boundingBox,
              })
            }
          }
        }
      })
    }
  }

  private emitSelection() {
    const selection = this.selection
    if (selection) {
      this.events.emit(RaycastSystem.onSelect, selection)
    }
  }

  public destroy(): void {
    //
  }
}
