import { KeyboardKey } from '../core'
import { GameComponent, GameEntity } from '../../ecs'
import { RendererProvider } from '../services/renderer-provider'
import { TransformComponent } from './transform-component'
import { Vector3 } from 'three'

/**
 * @public
 */
export interface WASDComponentOptions {
  keyForwad?: KeyboardKey
  keyBackward?: KeyboardKey
  keyLeft?: KeyboardKey
  keyRight?: KeyboardKey
  keyUp?: KeyboardKey
  keyDown?: KeyboardKey
  keyBoost?: KeyboardKey
  mouseButton?: number
}

const FORWARD = new Vector3(0, 0, -1)
const BACKWARD = new Vector3(0, 0, 1)
const LEFT = new Vector3(-1, 0, 0)
const RIGHT = new Vector3(1, 0, 0)
const UP = new Vector3(0, 1, 0)
const DOWN = new Vector3(0, -1, 0)

export class ThreeWASDComponent implements GameComponent {
  private three: RendererProvider
  private target: TransformComponent
  public entity: GameEntity

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.three = entity.game.get(RendererProvider)
    this.target = entity.component(TransformComponent)
  }

  public activate(): void {
    this.three.onUpdate.add(this.onUpdate)
  }

  public deactivate(): void {
    this.three.onUpdate.remove(this.onUpdate)
  }

  public destroy(): void {
    //
  }

  /**
   * Default movement speed in units per second
   */
  public moveSpeed: number = 5
  public moveSpeedStep: number = 1
  public moveSpeedMin: number = 0
  public moveSpeedMax: number = 100
  /**
   * Movement speed multiplier when `SHIFT` is pressed
   */
  public moveSpeedMultiplier: number = 10
  /**
   * Mouse sensitivity
   */
  public sensitivity: number = 1

  /**
   * Damping factor of the turn movement
   */
  public turnDamping: number = 0.1
  /**
   * Damping factor of the translation movement
   */
  public moveDamping: number = 0.1

  private yaw: number = 0
  private pitch: number = 0
  private targetYaw: number = 0
  private targetPitch: number = 0
  private startX: number = 0
  private startY: number = 0
  private startYaw: number = 0
  private startPitch: number = 0
  private isMouseDown: boolean = false

  private currentMoveSpeed: number = 0
  private direction = new Vector3(0, 0, 0)
  private translation = new Vector3(0, 0, 0)

  private keyForwad: KeyboardKey = KeyboardKey.KeyW
  private keyBackward: KeyboardKey = KeyboardKey.KeyS
  private keyLeft: KeyboardKey = KeyboardKey.KeyA
  private keyRight: KeyboardKey = KeyboardKey.KeyD
  private keyUp: KeyboardKey = KeyboardKey.KeyE
  private keyDown: KeyboardKey = KeyboardKey.KeyQ
  private keyBoost: KeyboardKey = KeyboardKey.ShiftLeft
  private mouseButton: number = 0

  /**
   * Checks the input and updates movement
   *
   * @param dt - Elapsed time since last frame
   */
  public onUpdate = (dt: number) => {
    const keyboard = this.three.keyboard
    const mouse = this.three.mouse
    const node = this.target.node

    if (
      keyboard.isPressed(KeyboardKey.ControlLeft) ||
      keyboard.isPressed(KeyboardKey.ControlRight) ||
      keyboard.isPressed(KeyboardKey.MetaLeft) ||
      keyboard.isPressed(KeyboardKey.MetaRight)
    ) {
      if (mouse.wheelDelta < 0) {
        this.moveSpeed += this.moveSpeedStep
      }
      if (mouse.wheelDelta > 0) {
        this.moveSpeed -= this.moveSpeedStep
      }
    }
    this.moveSpeed = Math.min(this.moveSpeedMax, Math.max(this.moveSpeedMin, this.moveSpeed))

    let isMoving = false
    this.translation.set(0, 0, 0)
    if (keyboard.isPressed(this.keyForwad)) {
      this.translation.add(FORWARD)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyBackward)) {
      this.translation.add(BACKWARD)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyLeft)) {
      this.translation.add(LEFT)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyRight)) {
      this.translation.add(RIGHT)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyDown)) {
      this.translation.add(DOWN)
      isMoving = true
    }
    if (keyboard.isPressed(this.keyUp)) {
      this.translation.add(UP)
      isMoving = true
    }
    if (this.translation.lengthSq() > 0) {
      this.translation.applyNormalMatrix(node.normalMatrix)
      this.direction.copy(this.translation).normalize()
    }
    let targetSpeed = this.moveSpeed
    if (keyboard.isPressed(this.keyBoost)) {
      targetSpeed *= this.moveSpeedMultiplier
    }
    if (!isMoving) {
      targetSpeed = 0
    }

    this.currentMoveSpeed += (targetSpeed - this.currentMoveSpeed) * this.moveDamping
    this.currentMoveSpeed = Math.floor(this.currentMoveSpeed * 1000) / 1000
    if (this.currentMoveSpeed !== 0 && this.direction.lengthSq() > 0) {
      node.translateOnAxis(this.direction, this.currentMoveSpeed * (dt / 1000.0))
    }

    const isMouseDown =
      (this.mouseButton === 0 && mouse.leftButtonIsPressed) || (this.mouseButton !== 0 && mouse.rightButtonIsPressed)
    if (!this.isMouseDown && isMouseDown) {
      this.startX = mouse.xNormalized
      this.startY = mouse.yNormalized
      this.startYaw = this.yaw
      this.startPitch = this.pitch
    }
    if (isMouseDown) {
      this.targetYaw = this.startYaw + (this.startX - mouse.xNormalized) * this.sensitivity * Math.PI * 2
      this.targetPitch = this.startPitch + (this.startY - mouse.yNormalized) * this.sensitivity * Math.PI * 2
    }
    this.isMouseDown = isMouseDown

    this.yaw += (this.targetYaw - this.yaw) * this.turnDamping
    this.pitch += (this.targetPitch - this.pitch) * this.turnDamping
    node.rotation.set(this.pitch, this.yaw, 0, 'ZYX')
    node.updateMatrixWorld()
  }
}
