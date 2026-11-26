import { EcsGame, TimeSystem } from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { SpaceBasis } from '@gglib/math'
import { ViewerConfig } from '../config'
import { ContentService } from '../content'
import { MtlContainer } from '../formats/mtl'
import { RenderSizeSystem } from '../graphics/RenderSizeSystem'

export interface CoreSystemsOptions {
  /**
   * The runtime settings. Added first, so systems and components can read the settings when they initialize.
   */
  config: ViewerConfig
  /**
   * The nwbt server, see {@link ContentServiceOptions.nwbtUrl}
   */
  nwbtUrl?: string | null
  /**
   * See {@link ContentServiceOptions.environmentTextures}
   */
  environmentTextures?: boolean
}

/**
 * Adds the systems every viewer needs, from `onCreate`: the config, the clock, the render size, the Z-up space and
 * the content (loader and service). The loaders are registered later, see {@link registerViewerContent}.
 */
export function addCoreSystems(game: EcsGame, options: CoreSystemsOptions) {
  const world = game.world
  world.addSystem(options.config)
  // the viewer's clock: its game clock drives rendering, particles, fog volumes and the animated time of day
  const time = new TimeSystem()
  world.addSystem(time)
  game.renderClock = time.game
  world.addSystem(new RenderSizeSystem())
  world.addSystem(SpaceBasis.Z_UP_POS_Y)
  // instances are cached per url. Of the containers (file data) only the small material libraries stay cached,
  // models create several sub materials from them. Texture and geometry data is dropped after the GPU upload.
  world.addSystem(
    new ContentLoader(game.device, {
      cacheContainers: (container) => container instanceof MtlContainer,
    }),
  )
  world.addSystem(new ContentService({ nwbtUrl: options.nwbtUrl, environmentTextures: options.environmentTextures }))
}
