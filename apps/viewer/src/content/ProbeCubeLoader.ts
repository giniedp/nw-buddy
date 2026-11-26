import { PriorityLane, SchedulerSystem } from '@gglib/components'
import { GameSystem, GameWorld, type GameEntity } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { ProbeCubeAtlas, type ProbeCubeAtlasOptions, type ProbeCubeTexture } from '../graphics/probes/ProbeCubeAtlas'
import { ContentService } from './ContentService'

export type ProbeCubeState = 'loading' | 'ready' | 'failed'

/**
 * A baked probe cube, shared by all probes that reference the same file
 */
export interface ProbeCube {
  file: string
  slot: number
  state: ProbeCubeState
  sources?: ProbeCubeSources
}

export interface ProbeCubeSources {
  specular: ProbeCubeTexture
  diffuse: ProbeCubeTexture
}

export interface ProbeCubeLoaderOptions {
  /**
   * Format and size of the atlas, the cubes must have its format
   */
  atlas?: ProbeCubeAtlasOptions
  /**
   * The default cube, in the atlas format. Default {@link DEFAULT_PROBE_CUBE}
   */
  defaultCube?: string
}

/**
 * Stand-in while the global probe of a level is not loaded yet, and the probe of previews. It ships with the viewer
 * (with its `_diff` sibling, see bundledGameFileUrl), it doesn't need the nwbt server. BC6H, like the game's cubes.
 */
export const DEFAULT_PROBE_CUBE = 'engineassets/shading/defaultprobe_cm.dds'
/**
 * {@link DEFAULT_PROBE_CUBE} as RGB9E5 KTX2, for an `rgb9e5ufloat` atlas. Only the viewer has it, not the game.
 */
export const DEFAULT_PROBE_CUBE_RGB9E5 = 'engineassets/shading/defaultprobe_cm.ktx2'
/**
 * Uploads per frame. A cube is about 0.5 MB, the budget only prevents a burst after a level load.
 */
const MAX_UPLOADS_PER_FRAME = 1

/**
 * Loads baked probe cubes through the scheduler and uploads them to the {@link ProbeCubeAtlas} within a budget.
 *
 * @remarks
 * Cubes are requested when probes activate. They are never unloaded, there are only a few of them
 * and all of them fit the atlas.
 */
export class ProbeCubeLoader extends GameSystem {
  public atlas: ProbeCubeAtlas
  public defaultCube: ProbeCube

  public readonly cubes = new Map<string, ProbeCube>()

  private options: ProbeCubeLoaderOptions
  private content: ContentService
  private provided = new Map<string, Promise<ProbeCubeSources>>()
  private scheduler: SchedulerSystem
  private uploads: ProbeCube[] = []

  public constructor(options: ProbeCubeLoaderOptions = {}) {
    super()
    this.options = options
  }

  public initialize(world: GameWorld): void {
    this.content = world.getSystem(ContentService)
    this.scheduler = world.getSystem(SchedulerSystem)
    this.atlas = new ProbeCubeAtlas(world.getSystem(Device), this.options.atlas)
    this.defaultCube = this.request(this.options.defaultCube ?? DEFAULT_PROBE_CUBE, PriorityLane.High)
  }

  /**
   * Gets the cube of a file and starts loading it on first use
   *
   * @param file - path of the specular cube, the diffuse cube is its `_diff` sibling
   * @param lane - the lane of the load, only used on first request
   * @param entity - orders the load by distance to the camera
   */
  public request(file: string, lane: PriorityLane, entity?: GameEntity): ProbeCube {
    let cube = this.cubes.get(file)
    if (cube) {
      return cube
    }
    cube = { file, slot: this.atlas.acquire(file), state: 'loading' }
    this.cubes.set(file, cube)
    if (cube.slot < 0) {
      console.warn(`Probe atlas is full, cube is not loaded: ${file}`)
      cube.state = 'failed'
      return cube
    }
    this.scheduler.schedule<void>({
      lane,
      entity,
      label: file,
      load: async () => {
        cube.sources = await this.loadSources(file)
      },
      finalize: (_, error) => {
        if (error) {
          console.warn(`Probe cube not loaded: ${file}`, error)
          cube.state = 'failed'
        } else {
          this.uploads.push(cube)
        }
      },
    })
    return cube
  }

  /**
   * Gives a cube its data instead of the files, e.g. the cubes embedded in a glTF file. Ignored for a cube that is
   * already requested.
   *
   * @param file - the name probes request the cube by
   */
  public provide(file: string, sources: Promise<ProbeCubeSources>) {
    // the request handles a failure, an unrequested cube must not raise an unhandled rejection
    sources.catch(() => undefined)
    if (!this.cubes.has(file)) {
      this.provided.set(file, sources)
    }
  }

  public override update(): void {
    for (let i = 0; i < MAX_UPLOADS_PER_FRAME && this.uploads.length; i++) {
      const cube = this.uploads.shift()
      const { specular, diffuse } = cube.sources
      cube.sources = undefined
      if (this.atlas.upload(cube.slot, specular, diffuse)) {
        cube.state = 'ready'
      } else {
        console.warn(`Probe cube does not fit the atlas (${this.atlas.format}): ${cube.file}`)
        cube.state = 'failed'
      }
    }
  }

  private async loadSources(file: string): Promise<ProbeCubeSources> {
    const provided = this.provided.get(file)
    if (provided) {
      this.provided.delete(file)
      return provided
    }
    const [specular, diffuse] = await Promise.all([
      // the top mips are split into separate files
      this.content.loadTextureData(`${file}?merge=true`),
      this.content.loadTextureData(file.replace(/_cm\.(dds|ktx2)$/, '_cm_diff.$1')),
    ])
    return { specular, diffuse }
  }

  public destroy(): void {
    this.atlas?.dispose()
    this.cubes.clear()
    this.provided.clear()
    this.uploads.length = 0
  }
}
