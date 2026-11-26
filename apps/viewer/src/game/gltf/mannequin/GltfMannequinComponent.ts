import type { GameComponent, GameEntity } from '@gglib/ecs'
import { mat4Copy, mat4Identity, type Transform } from '@gglib/math'
import type { Model, NodeData, Skeleton, SkinPalette } from '@gglib/model'
import { setInstanceSkinOffset } from '../../../material/common'
import { CharacterAnimationSystem } from '../../character/CharacterAnimationSystem'
import { GltfFragmentPlayer } from './GltfFragmentPlayer'
import type { HitShapes } from '../../character/mannequin/HitShapes'

export interface GltfMannequinOptions {
  /**
   * The rendered model, see {@link GltfMannequinComponent.canAnimate}
   */
  model: Model
  /**
   * Instance data of the model's draws
   */
  draws: Float32Array[]
}

/**
 * Plays fragments ({@link GltfFragmentPlayer}) on a glTF character and skins it through the palette of the
 * {@link CharacterAnimationSystem}
 *
 * @remarks
 * One palette range for all draws: the skins of a character export repeat the same skeleton per part (same joints in
 * the same order), the first skeleton's joint matrices skin them all.
 */
export class GltfMannequinComponent implements GameComponent {
  /**
   * Whether a model has a skin
   */
  public static canAnimate(model: Model): boolean {
    return model.skeletons.length > 0
  }

  public entity: GameEntity
  public readonly player: GltfFragmentPlayer
  /**
   * The melee hit shapes of the playing fragment, placed with each new pose
   */
  public hitShapes: HitShapes | null = null

  private readonly model: Model
  private readonly skeleton: Skeleton
  private readonly parents: Int32Array
  private readonly draws: Float32Array[]
  private readonly root = mat4Identity()
  private palette: SkinPalette | null = null
  private offset = -1

  public constructor(options: GltfMannequinOptions) {
    this.model = options.model
    this.draws = options.draws
    this.skeleton = options.model.skeletons[0]
    const bones = this.skeleton.bones
    this.parents = Int32Array.from(bones, (bone) => bones.indexOf(bone.parent))
    this.player = new GltfFragmentPlayer(bones as ReadonlyArray<Transform<NodeData>>)
  }

  public initialize(): void {
    this.palette = this.entity.world.getSystem(CharacterAnimationSystem).palette
    this.offset = this.palette.allocate(this.skeleton.boneCount)
    for (const data of this.draws) {
      setInstanceSkinOffset(data, this.offset)
    }
  }

  /**
   * Advances the fragment and writes the pose into the palette when it changed
   */
  public animate(dt: number) {
    if (!this.player.update(dt) || this.offset < 0) {
      return
    }
    // the joints are relative to the model root, it keeps its transform
    mat4Copy(this.model.rootWorld, this.root)
    this.model.updateScene(this.root)
    this.model.updateSkeletons()
    this.palette.writeMatrices(this.offset, this.skeleton.jointMatrices, this.skeleton.boneCount, this.parents)
    this.updateHitShapes()
  }

  /**
   * Places the {@link hitShapes} at the current pose and time
   */
  public updateHitShapes() {
    this.hitShapes?.update(this.player.fragment, this.player.time)
  }

  public destroy(): void {
    this.hitShapes?.dispose()
    this.hitShapes = null
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
