import type { GameComponent, GameEntity } from '@gglib/ecs'
import { mat4Copy, mat4Identity } from '@gglib/math'
import type { AnimationPlayer, Model, Skeleton, SkinPalette } from '@gglib/model'
import { setInstanceSkinOffset } from '../../material/common'
import { CharacterAnimationSystem } from '../character/CharacterAnimationSystem'

export interface GltfAnimationOptions {
  /**
   * The rendered model, see {@link GltfAnimationComponent.canAnimate}
   */
  model: Model
  /**
   * Instance data of the model's draws
   */
  draws: Float32Array[]
}

/**
 * Plays the glTF animations of a model and skins it through the palette of the {@link CharacterAnimationSystem}
 */
export class GltfAnimationComponent implements GameComponent {
  /**
   * Whether a model has animations and one skin
   */
  public static canAnimate(model: Model): boolean {
    return model.animations.length > 0 && model.skeletons.length === 1
  }

  public entity: GameEntity
  public readonly player: AnimationPlayer

  private readonly model: Model
  private readonly skeleton: Skeleton
  private readonly parents: Int32Array
  private readonly draws: Float32Array[]
  private readonly root = mat4Identity()
  private palette: SkinPalette | null = null
  private offset = -1
  private changed = true

  public constructor(options: GltfAnimationOptions) {
    this.model = options.model
    this.draws = options.draws
    this.player = options.model.createAnimationPlayer()
    this.skeleton = options.model.skeletons[0]
    const bones = this.skeleton.bones
    this.parents = Int32Array.from(bones, (bone) => bones.indexOf(bone.parent))
  }

  /**
   * The clip names
   */
  public get clips(): string[] {
    return this.player.clips.map((it) => it.name)
  }

  public initialize(): void {
    this.palette = this.entity.world.getSystem(CharacterAnimationSystem).palette
    this.offset = this.palette.allocate(this.skeleton.boneCount)
    for (const data of this.draws) {
      setInstanceSkinOffset(data, this.offset)
    }
  }

  /**
   * Plays a clip in a loop from its start, null restores the rest pose
   */
  public play(name: string | null) {
    this.player.reset()
    if (name) {
      this.player.play(name, { loop: true })
    }
    this.changed = true
  }

  /**
   * Writes the pose into the palette when it changed
   */
  public animate(dt: number) {
    if (this.player.playing) {
      this.player.update(dt)
      this.changed = true
    }
    if (!this.changed || this.offset < 0) {
      return
    }
    this.changed = false
    // the joints are relative to the model root, it keeps its transform
    mat4Copy(this.model.rootWorld, this.root)
    this.model.updateScene(this.root)
    this.model.updateSkeletons()
    this.palette.writeMatrices(this.offset, this.skeleton.jointMatrices, this.skeleton.boneCount, this.parents)
  }

  public destroy(): void {
    if (this.palette && this.offset >= 0) {
      this.palette.release(this.offset, this.skeleton.boneCount)
    }
    for (const data of this.draws) {
      setInstanceSkinOffset(data, null)
    }
    this.offset = -1
    this.palette = null
  }
}
