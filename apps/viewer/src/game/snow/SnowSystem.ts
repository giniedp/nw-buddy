import { EcsGame } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import { mat4Invert, vec4, type Mat4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { InputSlots } from '../../material/common'
import type { SnowComponent } from './SnowComponent'

/**
 * Below these values the engine skips the snow layer (FX_DeferredSnowLayer)
 */
const MIN_AMOUNT = 0.05
const MIN_RADIUS = 0.05

/**
 * Active snow volumes of the loaded slices.
 *
 * The engine keeps one global snow volume (C3DEngine::SetSnowSurfaceParams), set by the last activated SnowComponent
 * and cleared by its deactivation. The viewer picks the volume nearest to the camera in the xy plane (the snow
 * attenuation ignores z) and publishes it as the global inputs {@link InputSlots.Global.SnowVolumeParams},
 * {@link InputSlots.Global.SnowMultipliers} and {@link InputSlots.Global.SnowBrightness}.
 * Without a volume, or below the engine thresholds, `SnowVolumeParams.w` is 0 and the snow pass is skipped.
 */
export class SnowSystem extends GameSystem {
  public readonly volumes = new Set<SnowComponent>()
  /**
   * The volume published this frame
   */
  public active: SnowComponent | null = null

  private game: EcsGame
  private renderer: Renderer
  private volumeParams = vec4(0)
  private multipliers = vec4(0)
  private brightness = vec4(0)
  private inverse = new Float32Array(16) as unknown as Mat4

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.renderer = world.getSystem(Renderer)
    this.publish()
  }

  public add(volume: SnowComponent) {
    this.volumes.add(volume)
  }

  public remove(volume: SnowComponent) {
    this.volumes.delete(volume)
  }

  public override render(): void {
    const camera = this.game.scene?.getView(0)?.camera
    this.active = camera ? this.pick(camera.view) : null
    this.publish()
  }

  public destroy(): void {
    this.volumes.clear()
    this.active = null
  }

  private pick(view: Mat4): SnowComponent | null {
    if (!this.volumes.size) {
      return null
    }
    const eye = mat4Invert(view, this.inverse)
    const ex = eye[12]
    const ey = eye[13]
    let result: SnowComponent | null = null
    let best = Infinity
    for (const volume of this.volumes) {
      const dx = volume.x - ex
      const dy = volume.y - ey
      const d = dx * dx + dy * dy
      if (d < best) {
        best = d
        result = volume
      }
    }
    return result
  }

  private publish() {
    const params = this.volumeParams
    const multipliers = this.multipliers
    const brightness = this.brightness
    const data = this.active?.data
    const enabled =
      !!data &&
      data.radius >= MIN_RADIUS &&
      (data.snowAmount >= MIN_AMOUNT || data.frostAmount >= MIN_AMOUNT || data.surfaceFreezing >= MIN_AMOUNT)
    if (enabled) {
      params.x = this.active.x
      params.y = this.active.y
      params.z = this.active.z
      params.w = 1 / Math.max(data.radius, 1e-3)
      multipliers.x = data.snowAmount
      multipliers.y = data.frostAmount
      multipliers.z = Math.min(Math.max(data.surfaceFreezing, 0), 1)
      brightness.x = data.snowBrightness
      brightness.y = data.frostBrightness
    } else {
      params.w = 0
      multipliers.x = 0
      multipliers.y = 0
      multipliers.z = 0
    }
    const inputs = this.renderer.inputs
    inputs.set(InputSlots.Global.SnowVolumeParams, params)
    inputs.set(InputSlots.Global.SnowMultipliers, multipliers)
    inputs.set(InputSlots.Global.SnowBrightness, brightness)
  }
}
