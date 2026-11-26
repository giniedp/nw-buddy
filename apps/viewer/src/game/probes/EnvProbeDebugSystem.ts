import { EcsGame, MeshComponent } from '@gglib/components'
import { GameSystem, GameWorld, type GameEntity } from '@gglib/ecs'
import { Device, Mesh, sphereGeometry } from '@gglib/graphics'
import { mat4GetTranslation, SpaceBasis, vec3, vec3$normalize, vec3ApplyMat4Rotation, vec4 } from '@gglib/math'
import { ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { ProbeMirrorMaterial } from '../../material/ProbeMirrorMaterial'

const MIRROR_DISTANCE = 6
const MIRROR_RADIUS = 2

/**
 * A mirror sphere in front of the camera that shows a cube of the probe atlas, to inspect the baked cubes.
 */
export class EnvProbeDebugSystem extends GameSystem {
  /**
   * Whether the mirror sphere is shown
   */
  public enabled = false
  /**
   * The atlas slot to show
   */
  public slot = 0
  /**
   * Mip level of the specular cube, gloss 1 is lod 0 and gloss 0 is lod 6
   */
  public lod = 0
  /**
   * Shows the diffuse cube instead of the specular cube
   */
  public diffuse = false

  private game: EcsGame
  private device: Device
  private space: SpaceBasis
  private cubes: ProbeCubeLoader
  private material: ProbeMirrorMaterial
  private mesh: Mesh
  private entity: GameEntity

  private sphere = vec4(0)
  private params = vec4(0)
  private position = vec3()
  private forward = vec3()

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.device = world.getSystem(Device)
    this.space = world.getSystem(SpaceBasis)
    this.cubes = world.getSystem(ProbeCubeLoader)
  }

  public override update(): void {
    if (!this.enabled) {
      this.hide()
      return
    }
    const camera = this.game.scene.getView(0)?.camera
    if (!camera) {
      return
    }
    this.show()

    mat4GetTranslation(camera.world, this.position)
    vec3$normalize(vec3ApplyMat4Rotation(this.space.forward, camera.world, this.forward))
    this.sphere.x = this.position.x + this.forward.x * MIRROR_DISTANCE
    this.sphere.y = this.position.y + this.forward.y * MIRROR_DISTANCE
    this.sphere.z = this.position.z + this.forward.z * MIRROR_DISTANCE
    this.sphere.w = MIRROR_RADIUS
    this.params.x = this.slot
    this.params.y = this.lod
    this.params.z = this.diffuse ? 1 : 0
    this.material.Sphere = this.sphere
    this.material.Params = this.params
  }

  private show() {
    if (this.entity) {
      if (this.entity.canActivate) {
        this.entity.activate()
      }
      return
    }
    this.material = new ProbeMirrorMaterial(this.device, { properties: {} })
    this.material.SpecularCubes = this.cubes.atlas.specular
    this.material.DiffuseCubes = this.cubes.atlas.diffuse
    this.mesh = new Mesh(this.device, {
      materials: [this.material],
      partImports: [{ geometry: sphereGeometry(this.device, { radius: 1, stacks: 48, slices: 96 }), materialIndex: 0 }],
    })
    this.entity = this.game.createEntity({
      name: 'Probe Mirror',
      parent: this.game.scene.entity,
      components: [new MeshComponent({ mesh: this.mesh })],
    })
  }

  private hide() {
    // runs on every frame while disabled: the entity is deactivated once
    if (this.entity?.canDeactivate) {
      this.entity.deactivate()
    }
  }

  public destroy(): void {
    // the mirror is created when shown first
    this.entity?.deactivate()
    this.entity?.destroy()
    this.mesh?.dispose()
    this.entity = null
    this.mesh = null
    this.material = null
  }
}
