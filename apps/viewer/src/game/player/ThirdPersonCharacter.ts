import type { TransformComponent } from '@gglib/components'
import type { GameEntity } from '@gglib/ecs'
import { type IVec3, SpaceBasis } from '@gglib/math'
import type { ViewerMannequin } from '../../api'
import { MotionParam } from '../character/blendSpace'
import { CageActionList, loadCageGraph } from '../character/cage/CageActionList'
import {
  CageKeyboard,
  loadInputProfiles,
  type CageKeyState,
  type CageMouseButton,
} from '../character/cage/CageKeyboard'
import { CageMotion } from '../character/cage/CageMotion'
import type { CharacterAssets } from '../character/CharacterAssets'
import type { CharacterComponent } from '../character/CharacterComponent'
import { LevelSystem } from '../level/LevelSystem'

/**
 * The appearance of the third person character: the default male. An input, so a chooser or the nw-buddy appearance
 * editor can supply another later.
 */
export const DEFAULT_PLAYER_APPEARANCE = 'objects/characters/player/male/player_male.cdf'

/**
 * The player's Mannequin setup (CAGE route data: `player.adb` and the player controller definition)
 */
export const PLAYER_MANNEQUIN: ViewerMannequin = {
  database: 'animations/mannequin/adb/player/player.adb',
  controllerDefinition: 'animations/mannequin/adb/player/playermalecontrollerdefs.xml',
  defaultTags: ['Unarmed', 'Stand'],
}

/**
 * The player's CAGE grid (`ActionListComponent.m_actionGridNew` of the player slice)
 */
export const PLAYER_GRID = 'sharedassets/springboardentitites/playerdata/cage/player.grid'

/**
 * The third person character: spawned at the feet of the movement and driven by the player's CAGE action list: the
 * game's key bindings give the input names, the grid's actions play their fragments and their motion activities move
 * and turn the character.
 *
 * @remarks
 * The movement asks {@link step} for the step, moves the feet by {@link takeDisplacement} (the velocity the motion
 * activities set, or the root motion while `AnimationDrivenMotion` runs) and places the character with
 * {@link place}.
 */
export class ThirdPersonCharacter {
  public character: CharacterComponent | null = null
  public readonly appearance: string
  /**
   * The action list, null until the grid and its lists loaded
   */
  public actions: CageActionList | null = null
  public keyboard: CageKeyboard | null = null

  private root: GameEntity | null = null
  private entity: GameEntity | null = null
  private space: SpaceBasis
  private motion: CageMotion | null = null
  private readonly inputs = new Set<string>()
  private destroyed = false
  /**
   * The root motion of the last {@link takeRootMotion} in world space, and the root's turn
   */
  private readonly rootMotion = { x: 0, y: 0, z: 0 }
  private rootTurn = 0

  public constructor(appearance = DEFAULT_PLAYER_APPEARANCE) {
    this.appearance = appearance
  }

  /**
   * Spawns the character into the loaded level and loads its action list
   *
   * @param yaw - the initial facing, radians about the space's up axis from its forward axis
   * @param reserved - inputs the viewer keeps (DOM key codes, mouse buttons), not given to the action list
   */
  public async spawn(
    levels: LevelSystem,
    assets: CharacterAssets,
    space: SpaceBasis,
    yaw: number,
    reserved: { keys?: string[]; mouse?: CageMouseButton[] },
  ) {
    this.space = space
    const motion = new CageMotion(space)
    motion.yaw = yaw
    motion.viewYaw = yaw
    this.motion = motion
    const [spawned, graph, profiles] = await Promise.all([
      levels.spawnCharacter(this.appearance, 'Third Person Character', PLAYER_MANNEQUIN),
      loadCageGraph(assets, PLAYER_GRID),
      loadInputProfiles((path) => assets.inputProfile(path)),
    ])
    if (this.destroyed) {
      spawned.root.destroy()
      spawned.root.setParent(null)
      return
    }
    this.root = spawned.root
    this.entity = spawned.entity
    this.character = spawned.character
    // the action list moves the character, the clips' travel is not applied (root motion is taken separately)
    this.character.motion.inPlace = true
    this.actions = new CageActionList(graph, motion)
    this.keyboard = new CageKeyboard(profiles, reserved)
  }

  public despawn() {
    this.destroyed = true
    this.actions?.stop()
    if (this.root) {
      this.root.destroy()
      this.root.setParent(null)
    }
    this.root = null
    this.entity = null
    this.character = null
    this.actions = null
  }

  /**
   * One step of the action list
   *
   * @param viewYaw - the camera's horizontal direction
   */
  public step(dt: number, keys: CageKeyState, viewYaw: number) {
    const actions = this.actions
    const keyboard = this.keyboard
    const mannequin = this.character?.mannequin ?? null
    if (!actions || !keyboard || !mannequin) {
      return
    }
    if (actions.controller !== mannequin) {
      actions.bind(mannequin)
    }
    actions.motion.viewYaw = viewYaw
    actions.step(dt, keyboard.update(keys, this.inputs))
  }

  /**
   * How far the character moves this step (world): the root motion of its animation times the motion multiplier, plus
   * the velocity it carries on, while `AnimationDrivenMotion` runs, else the velocity the motion activities set
   */
  public takeDisplacement(dt: number, out: IVec3): IVec3 {
    const motion = this.motion
    out.x = 0
    out.y = 0
    out.z = 0
    const root = this.takeRootMotion()
    if (!motion || !this.actions) {
      return out
    }
    if (motion.animationDriven) {
      // the root's turn this step, in the share the action asks for
      motion.yaw += this.rootTurn * motion.rootRotationMultiplier
      const scale = motion.rootMotionMultiplier
      out.x = root.x * scale + motion.inherited.x * dt
      out.y = root.y * scale + motion.inherited.y * dt
      out.z = root.z * scale + motion.inherited.z * dt
      if (dt > 0) {
        // what speed conditions read while the animation moves the character
        motion.setWorldVelocity(out.x / dt, out.y / dt, out.z / dt)
      }
    } else {
      out.x = motion.velocity.x * dt
      out.y = motion.velocity.y * dt
      out.z = motion.velocity.z * dt
    }
    return out
  }

  /**
   * Places the character at the feet with its facing, and gives the locomotion its travel speed
   *
   * @param velocity - the feet's velocity this frame (after collision), m/s
   */
  public place(feet: IVec3, velocity: IVec3) {
    const entity = this.entity
    const motion = this.motion
    if (!entity || !motion) {
      return
    }
    const up = this.space.up
    const node = entity.getTransform<TransformComponent>()
    node.setPosition(feet.x, feet.y, feet.z)
    node.setRotationAxisAngleV(up, motion.yaw)
    node.updateIfNeeded()
    const character = this.character
    if (!character) {
      return
    }
    const along = velocity.x * up.x + velocity.y * up.y + velocity.z * up.z
    const speed = Math.hypot(velocity.x - up.x * along, velocity.y - up.y * along, velocity.z - up.z * along)
    character.motion.params[MotionParam.TravelSpeed] = speed
    character.motion.params[MotionParam.TravelAngle] = 0
    character.motion.params[MotionParam.TravelSlope] = 0
  }

  /**
   * The root motion since the last call, in world space (the character's facing applied), then cleared
   */
  private takeRootMotion(): IVec3 {
    const out = this.rootMotion
    const character = this.character
    const world = this.entity?.getTransform().world
    if (!character || !world) {
      out.x = 0
      out.y = 0
      out.z = 0
      this.rootTurn = 0
      return out
    }
    const m = character.rootMotion
    out.x = world[0] * m[0] + world[4] * m[1] + world[8] * m[2]
    out.y = world[1] * m[0] + world[5] * m[1] + world[9] * m[2]
    out.z = world[2] * m[0] + world[6] * m[1] + world[10] * m[2]
    this.rootTurn = m[3]
    m[0] = 0
    m[1] = 0
    m[2] = 0
    m[3] = 0
    return out
  }
}
