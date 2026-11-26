import {
  type BehaviorComponent,
  KeyboardInputSystem,
  MouseInputSystem,
  type TransformComponent,
  WASDComponent,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { KeyboardKeys } from '@gglib/game'
import { SpaceBasis, vec3 } from '@gglib/math'
import { ViewerConfig } from '../../config/ViewerConfig'
import { THIRD_PERSON_ENABLED } from '../../constants'
import type { CageKeyState } from '../character/cage/CageKeyboard'
import { CharacterAnimationSystem } from '../character/CharacterAnimationSystem'
import { CollisionSystem } from '../collision/CollisionSystem'
import { PlayerFlags, type PlayerResult } from '../collision/shared'
import { LevelSystem } from '../level/LevelSystem'
import { ThirdPersonCharacter } from './ThirdPersonCharacter'

export type MovementMode = 'free' | 'third'

/**
 * Number of requests whose positions are remembered to correct them once their results arrive
 */
const HISTORY = 16

/**
 * Third person: the height of the orbit center above the feet and the camera distance
 */
const THIRD_CENTER_HEIGHT = 1.5
const THIRD_DISTANCE = 4
/**
 * Keys the viewer keeps in third person (the mode switch); the action list gets every other binding of the game's
 * profile, except the right mouse button, which orbits the camera there
 */
const THIRD_RESERVED_KEYS = [KeyboardKeys.KeyT]

/**
 * Switches the camera between free flight and a third person character (key `T`). The viewer starts in free mode.
 *
 * Third person: the WASD component orbits the camera around the character (right mouse drag, wheel), the
 * {@link ThirdPersonCharacter} (the default male) runs the player's CAGE action list on the game's key bindings and
 * moves the feet. It spawns below the camera and leaves with the mode.
 *
 * @remarks
 * Must be added after the {@link WASDComponent} of the same entity, it places the orbit center WASD orbits around.
 * The feet are integrated here and sent to the collision worker (walls block them unless the `playerCollision` config
 * is off); results arrive asynchronously (usually within the same or the next frame) and are applied as a correction
 * relative to the request they belong to, so the main thread never waits for the worker.
 */
export class PlayerMovementComponent implements GameComponent, BehaviorComponent {
  public readonly entity: GameEntity

  public get mode(): MovementMode {
    return this._mode
  }

  public set mode(mode: MovementMode) {
    this.setMode(mode)
  }

  /**
   * Whether third person is available, its collision worker needs shared memory (cross origin isolation)
   */
  public get canUseThirdPerson() {
    return !!this.collision.player
  }

  /**
   * Whether third person may be entered: only while the level viewer shows the engine. The other tools show their
   * previews with the same camera. Turning it off leaves third person, so the viewer starts in free mode again.
   */
  public get thirdPersonAvailable() {
    return this._thirdPersonAvailable
  }

  public set thirdPersonAvailable(available: boolean) {
    this._thirdPersonAvailable = available && THIRD_PERSON_ENABLED
    if (!available) {
      this.setMode('free')
    }
  }

  private _thirdPersonAvailable = false
  /**
   * The keyboard focus is in a text field (read once per frame): keys type there, they do not toggle the mode or drive
   * the character
   */
  private typing = false
  private _mode: MovementMode = 'free'
  /**
   * The character of the third person mode, null in the other modes
   */
  public thirdPerson: ThirdPersonCharacter | null = null
  private wasdBefore: Pick<
    WASDComponent,
    'orbitMode' | 'moveSpeed' | 'moveSpeedMin' | 'moveSpeedMultiplier' | 'radiusMin' | 'radiusMax' | 'mouseButton'
  > | null = null
  /**
   * Feet position at the end of the previous frame, the velocity of the third person character
   */
  private previousFeet = vec3()
  private velocity = vec3()
  private displacement = vec3()
  private wasd: WASDComponent
  private keyboard: KeyboardInputSystem
  private mouse: MouseInputSystem
  /**
   * Keys and mouse buttons as the third person action list reads them
   */
  private keyState: CageKeyState
  private collision: CollisionSystem
  private config: ViewerConfig
  private space: SpaceBasis

  /**
   * Feet position, integrated from the character's displacement and corrected by worker results
   */
  private feet = vec3()
  private teleportPending = true
  private result: PlayerResult = { x: 0, y: 0, z: 0 }
  private appliedSeq = 0
  private historySeq = new Int32Array(HISTORY)
  private historyPos = new Float64Array(HISTORY * 3)

  public initialize(): void {
    this.wasd = this.entity.component(WASDComponent)
    this.keyboard = this.entity.service(KeyboardInputSystem)
    this.mouse = this.entity.service(MouseInputSystem)
    const keyboard = this.keyboard
    const mouse = this.mouse
    this.keyState = {
      isPressed: (input) => {
        switch (input) {
          case 'mouse1':
            return mouse.leftButtonIsPressed
          case 'mouse2':
            return mouse.rightButtonIsPressed
          case 'mouse3':
            return mouse.middleButtonIsPressed
          default:
            return !this.typing && keyboard.isPressed(input)
        }
      },
      justPressed: (input) => {
        switch (input) {
          case 'mouse1':
            return mouse.leftButtonJustPressed
          case 'mouse2':
            return mouse.rightButtonJustPressed
          case 'mouse3':
            return mouse.middleButtonJustPressed
          default:
            return !this.typing && keyboard.justPressed(input)
        }
      },
      justReleased: (input) => {
        switch (input) {
          case 'mouse1':
            return mouse.leftButtonJustReleased
          case 'mouse2':
            return mouse.rightButtonJustReleased
          case 'mouse3':
            return mouse.middleButtonJustReleased
          default:
            return keyboard.justReleased(input)
        }
      },
    }
    this.collision = this.entity.service(CollisionSystem)
    this.config = this.entity.service(ViewerConfig)
    this.space = this.entity.service(SpaceBasis)
  }

  public setMode(mode: MovementMode) {
    if (mode === 'third' && !this._thirdPersonAvailable) {
      mode = 'free'
    }
    if (mode === 'third' && !this.collision.player) {
      console.warn('third person movement needs shared memory (cross origin isolation)')
      mode = 'free'
    }
    if (this._mode === mode) {
      return
    }
    this._mode = mode
    const third = mode === 'third'
    this.wasd.planar = third
    this.collision.playerActive = third
    if (third) {
      this.enterThirdPerson()
    } else {
      this.leaveThirdPerson()
    }
    this.teleport()
  }

  private enterThirdPerson() {
    const wasd = this.wasd
    this.wasdBefore = {
      orbitMode: wasd.orbitMode,
      moveSpeed: wasd.moveSpeed,
      moveSpeedMin: wasd.moveSpeedMin,
      moveSpeedMultiplier: wasd.moveSpeedMultiplier,
      radiusMin: wasd.radiusMin,
      radiusMax: wasd.radiusMax,
      mouseButton: wasd.mouseButton,
    }
    const position = this.entity.getTransform<TransformComponent>().translation
    const up = this.space.up
    // the orbit center at the camera (the feet below it, see teleport), the camera behind it
    wasd.orbitCenter.x = position.x
    wasd.orbitCenter.y = position.y
    wasd.orbitCenter.z = position.z
    wasd.orbitMode = true
    // the action list moves the character, WASD only orbits the camera, with the right button (left attacks)
    wasd.moveSpeedMin = 0
    wasd.moveSpeed = 0
    wasd.mouseButton = 2
    wasd.radiusMin = 1.5
    wasd.radiusMax = 15
    wasd.targetRadius = THIRD_DISTANCE
    this.previousFeet.x = position.x - up.x * THIRD_CENTER_HEIGHT
    this.previousFeet.y = position.y - up.y * THIRD_CENTER_HEIGHT
    this.previousFeet.z = position.z - up.z * THIRD_CENTER_HEIGHT

    const levels = this.entity.world.getSystem(LevelSystem)
    const assets = this.entity.world.getSystem(CharacterAnimationSystem).assets
    const character = new ThirdPersonCharacter()
    this.thirdPerson = character
    const reserved = { keys: THIRD_RESERVED_KEYS, mouse: ['mouse2' as const] }
    // the character faces where the camera looks
    const yaw = this.wasd.getRotationHorizontal()
    character.spawn(levels, assets, this.space, yaw, reserved).catch((err) => {
      console.warn('third person character: ' + (err instanceof Error ? err.message : String(err)))
    })
  }

  private leaveThirdPerson() {
    this.thirdPerson?.despawn()
    this.thirdPerson = null
    if (this.wasdBefore) {
      Object.assign(this.wasd, this.wasdBefore)
      this.wasdBefore = null
    }
  }

  /**
   * Places the feet below the orbit center on the next update, call after moving the orbit center externally
   */
  public teleport() {
    this.teleportPending = true
  }

  public updateBehavior(time: number, dt: number): void {
    this.typing = isTextInput(document.activeElement)
    if (!this.typing && this.keyboard.justPressed(KeyboardKeys.KeyT)) {
      this.setMode(this._mode === 'third' ? 'free' : 'third')
    }
    if (this._mode === 'free') {
      return
    }

    const player = this.collision.player
    const center = this.wasd.orbitCenter
    let flags = this.config.value.playerCollision ? PlayerFlags.Walls : 0

    if (this.teleportPending) {
      this.teleportPending = false
      this.feet.x = center.x
      this.feet.y = center.y
      this.feet.z = center.z - THIRD_CENTER_HEIGHT
      this.historySeq.fill(0)
      this.appliedSeq = player.resolvedSequence
      flags |= PlayerFlags.Teleport
    } else {
      // correct the feet by the difference between a resolved request and what was requested
      const seq = player.readResult(this.result)
      if (seq && seq !== this.appliedSeq) {
        const slot = this.historySlot(seq)
        if (slot >= 0) {
          this.feet.x += this.result.x - this.historyPos[slot * 3 + 0]
          this.feet.y += this.result.y - this.historyPos[slot * 3 + 1]
          this.feet.z += this.result.z - this.historyPos[slot * 3 + 2]
        }
        this.appliedSeq = seq
      }
      // the action list moves the feet: its motion activities' velocity, or the root motion of the animation
      const character = this.thirdPerson
      character?.step(dt, this.keyState, this.wasd.getRotationHorizontal())
      character?.takeDisplacement(dt, this.displacement)
      this.feet.x += this.displacement.x
      this.feet.y += this.displacement.y
    }

    const seq = player.request({ x: this.feet.x, y: this.feet.y, z: this.feet.z, dt, flags })
    const slot = seq & (HISTORY - 1)
    this.historySeq[slot] = seq
    this.historyPos[slot * 3 + 0] = this.feet.x
    this.historyPos[slot * 3 + 1] = this.feet.y
    this.historyPos[slot * 3 + 2] = this.feet.z

    // the orbit center follows the feet, the WASD component places the camera around it next frame
    center.x = this.feet.x
    center.y = this.feet.y
    center.z = this.feet.z + THIRD_CENTER_HEIGHT
    this.updateCharacter(dt)
  }

  private updateCharacter(dt: number) {
    const feet = this.feet
    const previous = this.previousFeet
    const scale = dt > 0 ? 1 / dt : 0
    this.velocity.x = (feet.x - previous.x) * scale
    this.velocity.y = (feet.y - previous.y) * scale
    this.velocity.z = (feet.z - previous.z) * scale
    previous.x = feet.x
    previous.y = feet.y
    previous.z = feet.z
    this.thirdPerson?.place(feet, this.velocity)
  }

  private historySlot(seq: number) {
    const slot = seq & (HISTORY - 1)
    return this.historySeq[slot] === seq ? slot : -1
  }
}

/**
 * Text fields take the keys (search boxes, the code editor's textarea); checkboxes, sliders and buttons do not
 */
const TEXT_INPUT = [
  'input:not([type=checkbox], [type=radio], [type=range], [type=button], [type=submit], [type=reset], [type=color])',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ')

function isTextInput(element: Element | null) {
  return !!element && element.matches(TEXT_INPUT)
}
