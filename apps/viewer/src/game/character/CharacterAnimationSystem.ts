import { EcsGame, TimeSystem } from '@gglib/components'
import { GameSystem, type GameQuery, type GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { mat4GetTranslation, vec3 } from '@gglib/math'
import { SkinPalette } from '@gglib/model'
import { Renderer } from '@gglib/render'
import { ViewerConfig } from '../../config'
import { ContentService } from '../../content'
import { InputSlots } from '../../material/common'
import { CharacterAssets } from './CharacterAssets'
import { CharacterComponent } from './CharacterComponent'

/**
 * Animates the active characters and owns the skinning palette they share
 *
 * @remarks
 * One {@link SkinPalette} of dual quaternions holds the palettes of all characters back to back, published as the
 * global input {@link InputSlots.Global.SkinPalette}. Each skinned draw finds its range by the skin offset of its
 * instance data, so the materials stay shared between characters that play different animations.
 * Characters beyond the animation distance (ViewerConfig `animationDistance`) keep the last palette they wrote.
 */
export class CharacterAnimationSystem extends GameSystem {
  public palette: SkinPalette
  public assets: CharacterAssets

  private characters: GameQuery
  private game: EcsGame
  private time: TimeSystem
  private config: ViewerConfig
  private readonly eye = vec3()

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.time = world.getSystem(TimeSystem)
    this.config = world.getSystem(ViewerConfig)
    this.assets = new CharacterAssets(world.getSystem(ContentService))
    this.characters = world.query({ scope: 'active', required: [CharacterComponent] })
    this.palette = new SkinPalette(world.getSystem(Device), {
      format: 'dualquat',
      capacity: 4096,
      name: 'Character skin palette',
    })
    world.getSystem(Renderer).inputs.set(InputSlots.Global.SkinPalette, this.palette.buffer)
  }

  public override update(): void {
    const camera = this.game.scene?.getView(0)?.camera
    if (!camera) {
      return
    }
    mat4GetTranslation(camera.world, this.eye)
    const distance = this.config.value.animationDistance
    // the game clock, a paused or fixed time freezes the animations
    const dt = Math.min(this.time.game.delta, 0.25)
    for (const entity of this.characters) {
      entity.component(CharacterComponent).animate(dt, this.eye, distance, this.palette)
    }
    this.palette.upload()
  }

  public destroy(): void {
    this.palette?.dispose()
    this.palette = null
  }
}
