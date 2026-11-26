import { EcsGame, MeshComponent, TransformComponent } from '@gglib/components'
import { GameSystem, GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { mat4GetTranslation, vec3 } from '@gglib/math'
import { Renderer, type RenderContext } from '@gglib/render'
import { GpuInstanceBatch } from '../../graphics/instancing/GpuInstanceBatch'
import type { Model } from '@gglib/model'

const cameraPosition = vec3()

/**
 * Owns the GPU instance batch that renders static level objects and culls it before each frame
 */
export class InstancedRenderSystem extends GameSystem {
  public batch: GpuInstanceBatch | null = null

  private world: GameWorld
  private game: EcsGame
  private renderer: Renderer | null = null
  private meshComponent: MeshComponent | null = null

  /**
   * Scale applied to the max view distance of each instance. Use 0 to ignore view distances.
   */
  public viewDistanceScale = 1

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
  }

  /**
   * Checks whether the model can be rendered by the instance batch
   */
  public canRender(model: Model) {
    if (model.skins?.length) {
      return false
    }
    const batch = this.getBatch()
    for (const node of model.sceneNodes) {
      const mesh = model.meshes[node.data?.mesh]
      if (mesh && !batch.canRender(mesh)) {
        return false
      }
    }
    return true
  }

  /**
   * Gets the batch, creates it on first access
   */
  public getBatch(): GpuInstanceBatch {
    if (this.batch) {
      return this.batch
    }
    this.batch = new GpuInstanceBatch(this.world.getSystem(Device), 'level objects')
    this.meshComponent = new MeshComponent()
    this.world.createEntity({
      name: 'Instanced Objects',
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true }),
      components: [this.meshComponent],
    })
    this.batch.onMeshChanged = (mesh) => {
      this.meshComponent.mesh = mesh
    }
    return this.batch
  }

  public update() {
    if (!this.renderer) {
      this.renderer = this.world.getSystem(Renderer, { optional: true })
      this.renderer?.onContextReady.add(this.cull)
    }
  }

  public destroy(): void {
    this.renderer?.onContextReady.remove(this.cull)
    this.batch?.dispose()
    this.batch = null
  }

  private cull = (context: RenderContext) => {
    const camera = context.view.camera
    if (!this.batch || camera !== this.game.scene.getView(0).camera) {
      return
    }
    mat4GetTranslation(camera.world, cameraPosition)
    this.batch.cull({
      view: camera.view,
      projection: camera.projection,
      cameraPosition,
      viewDistanceScale: this.viewDistanceScale,
    })
  }
}
