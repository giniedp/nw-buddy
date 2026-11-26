import { vec3$init, vec4$init, type Transform } from '@gglib/math'
import {
  AnimationMixer,
  AnimationPose,
  AnimationRig,
  AnimationTrackClip,
  clipSource,
  type AnimationData,
  type AnimationSource,
  type NodeData,
} from '@gglib/model'
import { timelineTime, type FragmentTimeline } from '../../character/mannequin/timeline'
import { nodeControllerId } from '../GltfClipPlayer'

/**
 * The played range of a clip file's animation (nwbt `extras.clip`), seconds
 */
interface ClipExtras {
  startTime?: number
  endTime?: number
  additive?: boolean
}

/**
 * Mixer layers: the fragments of the databases use up to 4 animation layers
 */
const LAYERS = 8

/**
 * Seek steps per second: a seek replays the fragment from its start
 */
const SEEK_RATE = 60

/**
 * The rig of glTF joints: joints in an order where parents come first, clip targets are the joints' controller ids
 */
export function createGltfRig(joints: ReadonlyArray<Transform<NodeData>>): {
  rig: AnimationRig
  joints: Transform<NodeData>[]
} {
  const ordered: Transform<NodeData>[] = []
  const visit = (joint: Transform<NodeData>) => {
    if (ordered.includes(joint)) {
      return
    }
    const parent = joint.parent as Transform<NodeData> | null
    if (parent && joints.includes(parent)) {
      visit(parent)
    }
    ordered.push(joint)
  }
  joints.forEach(visit)
  const pose = new AnimationPose(ordered.length, { scale: true })
  ordered.forEach((joint, i) => {
    const { translation: t, rotation: r, scale: s } = joint
    pose.translations.set([t.x, t.y, t.z], i * 3)
    pose.rotations.set([r.x, r.y, r.z, r.w], i * 4)
    pose.scales.set([s.x, s.y, s.z], i * 3)
  })
  const rig = new AnimationRig({
    names: ordered.map((it) => it.name ?? ''),
    parents: ordered.map((it) => ordered.indexOf(it.parent as Transform<NodeData>)),
    defaultPose: pose,
    // joints without a controller id get ids no clip uses
    targets: ordered.map((it, i) => nodeControllerId(it) ?? -1 - i),
  })
  return { rig, joints: ordered }
}

/**
 * A clip file's animation (nodes by controller id, nwbt `.caf` export) as a gglib clip: tracks keyed by controller id,
 * the played range and the additive flag of `extras.clip` (the whole clip without it)
 */
export function createGltfClip(data: AnimationData, nodes: ReadonlyArray<Transform<NodeData>>): AnimationTrackClip {
  const channels: AnimationData['channels'] = []
  for (const channel of data.channels) {
    const id = nodeControllerId(nodes[channel.target])
    if (id != null) {
      channels.push({ ...channel, target: id })
    }
  }
  const packed = AnimationTrackClip.fromData({ name: data.name, channels })
  const extras = data.extras?.['clip'] as ClipExtras | undefined
  return new AnimationTrackClip({
    name: data.name,
    tracks: [...packed.tracks],
    start: extras?.startTime,
    end: extras?.endTime,
    rate: 1,
    additive: !!extras?.additive,
  })
}

/**
 * Plays one fragment variant ({@link FragmentTimeline}) on glTF joints: each animation layer on its own mixer layer,
 * its clips installed at their start times with their fades, speed, weight and start time, as Mannequin's sequencer.
 * Layers above 0 animate only the joints of their clips, additive clips compose.
 *
 * @remarks
 * {@link time} runs from 0 to the timeline's duration; a one shot stops there, a looping fragment keeps playing its
 * loop. Setting {@link time} replays the fragment up to that time (pose and bars agree).
 */
export class GltfFragmentPlayer {
  public readonly rig: AnimationRig
  public readonly mixer: AnimationMixer
  /**
   * Advances the time in {@link update}
   */
  public playing = false

  private readonly joints: Transform<NodeData>[]
  private readonly pose: AnimationPose
  private timeline: FragmentTimeline | null = null
  /**
   * Per animation layer per clip the source, null for empty entries and missing clips
   */
  private sources: Array<Array<AnimationSource | null>> = []
  /**
   * Per animation layer the next clip to install
   */
  private next: number[] = []
  private elapsed = 0
  private changed = true

  public constructor(joints: ReadonlyArray<Transform<NodeData>>) {
    const { rig, joints: ordered } = createGltfRig(joints)
    this.rig = rig
    this.joints = ordered
    this.mixer = new AnimationMixer(rig, { layers: LAYERS })
    this.pose = new AnimationPose(rig.count, { scale: true })
  }

  /**
   * The playing fragment, null for the rest pose
   */
  public get fragment(): FragmentTimeline | null {
    return this.timeline
  }

  /**
   * Seconds on the timeline, see {@link GltfFragmentPlayer}
   */
  public get time(): number {
    return this.timeline ? timelineTime(this.timeline, this.elapsed) : 0
  }
  public set time(value: number) {
    if (!this.timeline) {
      return
    }
    this.restart()
    const target = Math.max(0, Math.min(value, this.timeline.duration))
    while (this.elapsed < target) {
      this.step(Math.min(1 / SEEK_RATE, target - this.elapsed))
    }
    this.changed = true
  }

  public get duration(): number {
    return this.timeline?.duration ?? 0
  }

  /**
   * Plays a fragment from its start, null restores the rest pose
   *
   * @param clips - the clip of an animation name, null when it is missing (the entry is skipped)
   */
  public play(timeline: FragmentTimeline | null, clips: (name: string) => AnimationTrackClip | null) {
    this.timeline = timeline
    this.sources = (timeline?.animLayers ?? []).slice(0, LAYERS).map((layer) => {
      return layer.map((clip) => {
        const data = clip.name ? clips(clip.name) : null
        return data ? clipSource(this.rig.bind(data)) : null
      })
    })
    this.restart()
    this.playing = !!timeline
    this.changed = true
  }

  /**
   * Advances the time while playing and poses the joints
   *
   * @returns whether the joints changed
   */
  public update(dt: number): boolean {
    if (this.playing && this.timeline) {
      let step = dt
      if (!this.timeline.loop && this.elapsed + step >= this.timeline.duration) {
        step = Math.max(0, this.timeline.duration - this.elapsed)
        this.playing = false
      }
      this.step(step)
      this.changed = true
    }
    if (!this.changed) {
      return false
    }
    this.changed = false
    this.mixer.evaluate(this.pose)
    this.applyPose()
    return true
  }

  private restart() {
    this.mixer.stopAll()
    this.elapsed = 0
    this.next = this.sources.map(() => 0)
    this.install()
    this.mixer.update(0)
  }

  private step(dt: number) {
    this.elapsed += dt
    this.install()
    this.mixer.update(dt)
  }

  /**
   * Installs the clips whose start time has come
   */
  private install() {
    const layers = this.timeline?.animLayers
    if (!layers) {
      return
    }
    for (let layer = 0; layer < this.sources.length; layer++) {
      const clips = layers[layer]
      while (this.next[layer] < clips.length && clips[this.next[layer]].start <= this.elapsed) {
        const index = this.next[layer]++
        this.installClip(layer, index)
      }
    }
  }

  private installClip(layer: number, index: number) {
    const clip = this.timeline.animLayers[layer][index]
    const source = this.sources[layer][index]
    if (!clip.name || !source) {
      if (layer === 0) {
        // an empty entry holds the base layer (the game sets its playback scale to 0)
        const entries = this.mixer.entries(0)
        const newest = entries[entries.length - 1]
        if (newest && !clip.name) {
          newest.speed = 0
        }
      } else if (!clip.name) {
        this.mixer.stop(layer, clip.fade)
      }
      return
    }
    const speed = clip.speed
    const time = source.duration > 0 ? (clip.startTime * (speed === 0 ? 1 : speed)) / source.duration : 0
    // the first clip of the base layer takes the full weight at once, it does not fade in from the rest pose
    const fade = layer === 0 && !this.mixer.entries(0).length ? 0 : clip.fade
    this.mixer.play(source, { layer, fade, speed, weight: clip.weight, loop: clip.loop, time })
  }

  private applyPose() {
    const { translations: t, rotations: r, scales: s } = this.pose
    for (let i = 0; i < this.joints.length; i++) {
      const joint = this.joints[i]
      vec3$init(joint.translation, t[i * 3], t[i * 3 + 1], t[i * 3 + 2])
      vec4$init(joint.rotation, r[i * 4], r[i * 4 + 1], r[i * 4 + 2], r[i * 4 + 3])
      if (s) {
        vec3$init(joint.scale, s[i * 3], s[i * 3 + 1], s[i * 3 + 2])
      }
      joint.markAsChanged()
    }
  }
}
