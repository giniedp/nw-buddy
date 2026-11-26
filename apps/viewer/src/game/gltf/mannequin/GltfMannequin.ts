import type { AnimationTrackClip, Model, NodeData } from '@gglib/model'
import type { Transform } from '@gglib/math'
import { fragmentTimeline, type FragmentTimeline } from '../../character/mannequin/timeline'
import { bestVariant, findIdleAction, type FragmentAction, type FragmentVariant } from './actions'
import type { AnimationListEntry } from './animationList'
import { createGltfClip } from './GltfFragmentPlayer'
import type { GltfMannequinComponent } from './GltfMannequinComponent'

export interface GltfMannequinOptions {
  component: GltfMannequinComponent
  /**
   * The character's animation list by lower case name
   */
  animations: ReadonlyMap<string, AnimationListEntry>
  actions: FragmentAction[]
  /**
   * The character's default tags (e.g. a vital model's tags), they choose the idle variant
   */
  tags: string[]
  /**
   * Loads a clip file of the animation list (path relative to the models root)
   */
  loadClip: (file: string) => Promise<Model | null>
}

/**
 * The fragments of a glTF character (an nwbt character export with an animation database): the action list, and
 * playback of one variant at a time with its timeline
 *
 * @remarks
 * Host driven: nothing plays until {@link play} or {@link playIdle}.
 */
export class GltfMannequin {
  /**
   * The fragments of the database and its sub databases, sorted by name
   */
  public readonly actions: ReadonlyArray<FragmentAction>
  /**
   * The character's default tags
   */
  public readonly tags: ReadonlyArray<string>

  private readonly component: GltfMannequinComponent
  private readonly animations: ReadonlyMap<string, AnimationListEntry>
  private readonly loadClip: (file: string) => Promise<Model | null>
  private readonly clips = new Map<string, Promise<AnimationTrackClip | null>>()
  private generation = 0
  private current: FragmentVariant | null = null
  private readonly durations = new Map<FragmentVariant, number>()

  public constructor(options: GltfMannequinOptions) {
    this.component = options.component
    this.animations = options.animations
    this.actions = options.actions
    this.tags = options.tags
    this.loadClip = options.loadClip
  }

  /**
   * The playing variant, null for the rest pose
   */
  public get variant(): FragmentVariant | null {
    return this.current
  }

  /**
   * The playing variant laid out in seconds, null for the rest pose
   */
  public get timeline(): FragmentTimeline | null {
    return this.component.player.fragment
  }

  /**
   * Seconds on the timeline, setting it seeks (also while paused)
   */
  public get time(): number {
    return this.component.player.time
  }
  public set time(value: number) {
    this.component.player.time = value
  }

  public get duration(): number {
    return this.component.player.duration
  }

  /**
   * Whether the time advances; setting it pauses or resumes, a one shot that ended starts over
   */
  public get playing(): boolean {
    return this.component.player.playing
  }
  public set playing(value: boolean) {
    const player = this.component.player
    if (!player.fragment) {
      return
    }
    if (value && !player.fragment.loop && player.time >= player.duration) {
      player.time = 0
    }
    player.playing = value
  }

  /**
   * Plays a variant from its start once its clips are loaded, null restores the rest pose. A later call replaces a
   * pending one, which rejects with an `AbortError`.
   */
  public async play(variant: FragmentVariant | null): Promise<void> {
    const generation = ++this.generation
    if (!variant) {
      this.current = null
      this.component.player.play(null, () => null)
      return
    }
    const loaded = new Map<string, AnimationTrackClip>()
    await Promise.all(
      variant.animations.map(async (name) => {
        const clip = await this.clip(name)
        if (clip) {
          loaded.set(name.toLowerCase(), clip)
        }
      }),
    )
    if (generation !== this.generation) {
      throw new DOMException('fragment replaced', 'AbortError')
    }
    const lookup = (name: string) => loaded.get(name.toLowerCase()) ?? null
    const timeline = fragmentTimeline(variant.fragment, (name) => lookup(name)?.duration ?? null)
    this.durations.set(variant, timeline.duration)
    this.current = variant
    this.component.player.play(timeline, lookup)
  }

  /**
   * Seconds of a variant's timeline, null until it played once (its clips' lengths are known after loading)
   */
  public durationOf(variant: FragmentVariant): number | null {
    return this.durations.get(variant) ?? null
  }

  /**
   * Plays the idle fragment's variant for the default tags (else its first playable variant), see {@link play}
   *
   * @returns false without a playable idle
   */
  public async playIdle(): Promise<boolean> {
    const action = findIdleAction(this.actions)
    const variant = action ? (bestVariant(action, this.tags) ?? action.variants.find((it) => it.playable)) : null
    if (!variant) {
      return false
    }
    await this.play(variant)
    return true
  }

  private clip(name: string): Promise<AnimationTrackClip | null> {
    const entry = this.animations.get(name.toLowerCase())
    if (!entry) {
      return Promise.resolve(null)
    }
    let result = this.clips.get(entry.file)
    if (!result) {
      result = this.loadClip(entry.file)
        .then((model) => {
          const data = model?.animations[0]
          return data ? createGltfClip(data, model.transformNodes as ReadonlyArray<Transform<NodeData>>) : null
        })
        .catch(() => {
          console.warn('clip not loaded', entry.file)
          return null
        })
      this.clips.set(entry.file, result)
    }
    return result
  }
}
