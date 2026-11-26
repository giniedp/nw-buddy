import { type Transform, vec3$init, vec4$init } from '@gglib/math'
import { AnimationClip, type AnimationData, type NodeData } from '@gglib/model'

/**
 * The controller id of a node: the CRC of the joint name the game's animations address it by (nwbt exports it as
 * `extras.controllerId`, on the skeleton of a model and on the nodes of a clip file)
 */
export function nodeControllerId(node: Transform<NodeData> | null | undefined): number | null {
  const id = node?.data?.extras?.['controllerId']
  return typeof id === 'number' ? id : null
}

/**
 * A clip of a clip file (nodes without names, by controller id) for the joints of a rig: the channel targets become
 * indices into the rig's joints. Channels of nodes the rig lacks are dropped.
 *
 * @param data - the clip, its targets index the clip file's nodes
 * @param nodes - the clip file's nodes
 * @param joints - the rig's joint index by controller id
 */
export function retargetClip(
  data: AnimationData,
  nodes: ReadonlyArray<Transform<NodeData>>,
  joints: ReadonlyMap<number, number>,
): AnimationData {
  const channels: AnimationData['channels'] = []
  for (const channel of data.channels) {
    const id = nodeControllerId(nodes[channel.target])
    const target = id == null ? undefined : joints.get(id)
    if (target != null) {
      channels.push({ ...channel, target })
    }
  }
  return { ...data, channels }
}

/**
 * A clip of a sequence: the last clip of a sequence may loop
 */
export interface ClipSequenceEntry {
  data: AnimationData
  loop: boolean
}

/**
 * Plays a sequence of clips on the joints of a rig (e.g. the start and the loop of an emote): the clips play one
 * after the other, the last one loops when it is a loop, else the sequence stops at its end.
 *
 * @remarks
 * The time is the sequence time: {@link time} scrubs through all clips, a looping last clip counts once in
 * {@link duration}. Each sample starts from the rest pose (the joints at construction), so the joints a clip doesn't
 * animate keep it. No blending between clips.
 */
export class GltfClipPlayer {
  /**
   * Advances {@link time} in {@link update}. A sequence that stopped at its end plays again from the start.
   */
  public get playing(): boolean {
    return this._playing
  }
  public set playing(value: boolean) {
    if (value && !this._playing && this.ended) {
      this._time = 0
      this.changed = true
    }
    this._playing = value
  }

  /**
   * A sequence without a loop is at its end
   */
  public get ended(): boolean {
    const end = this.duration
    return !this.loops && end > 0 && this._time >= end
  }

  private _playing = false
  private readonly joints: ReadonlyArray<Transform>
  private readonly rest: Float32Array
  private clips: AnimationClip[] = []
  private loops = false
  private _time = 0
  private changed = false
  /**
   * The clip and its time of the last {@link locate}
   */
  private located: AnimationClip | null = null
  private locatedTime = 0

  public constructor(joints: ReadonlyArray<Transform>) {
    this.joints = joints
    this.rest = new Float32Array(joints.length * 10)
    for (let i = 0, o = 0; i < joints.length; i++, o += 10) {
      const { translation: t, rotation: r, scale: s } = joints[i]
      this.rest.set([t.x, t.y, t.z, r.x, r.y, r.z, r.w, s.x, s.y, s.z], o)
    }
  }

  /**
   * The sum of the clip durations
   */
  public get duration(): number {
    let result = 0
    for (const clip of this.clips) {
      result += clip.duration
    }
    return result
  }

  /**
   * Time in the sequence, see {@link GltfClipPlayer}
   */
  public get time(): number {
    return this._time
  }
  public set time(value: number) {
    this._time = this.wrap(value)
    this.changed = true
  }

  /**
   * Whether a sequence is set
   */
  public get active(): boolean {
    return this.clips.length > 0
  }

  /**
   * Plays a sequence from its start, an empty one restores the rest pose
   */
  public setSequence(entries: ReadonlyArray<ClipSequenceEntry>) {
    this.clips = entries.map((it) => new AnimationClip(it.data))
    this.loops = entries.length > 0 && entries[entries.length - 1].loop
    this._time = 0
    this._playing = this.clips.length > 0
    this.changed = true
  }

  /**
   * Advances the time while playing and poses the joints
   *
   * @returns whether the joints changed
   */
  public update(dt: number): boolean {
    if (this._playing && this.clips.length) {
      const end = this.duration
      const time = this._time + dt
      if (!this.loops && time >= end) {
        this._time = end
        this._playing = false
      } else {
        this._time = this.wrap(time)
      }
      this.changed = true
    }
    if (!this.changed) {
      return false
    }
    this.changed = false
    this.restore()
    this.locate(this._time)
    this.located?.sample(this.locatedTime, this.joints)
    return true
  }

  /**
   * The clip at a sequence time and the time in it, into {@link located} and {@link locatedTime}
   */
  private locate(time: number) {
    this.located = null
    this.locatedTime = 0
    let start = 0
    for (let i = 0; i < this.clips.length; i++) {
      const clip = this.clips[i]
      if (time < start + clip.duration || i === this.clips.length - 1) {
        this.located = clip
        this.locatedTime = Math.min(Math.max(time - start, 0), clip.duration)
        return
      }
      start += clip.duration
    }
  }

  /**
   * A sequence time in range: past the end a looping last clip wraps within itself, else the end
   */
  private wrap(time: number): number {
    const end = this.duration
    if (time <= 0 || end <= 0) {
      return 0
    }
    if (time < end) {
      return time
    }
    if (!this.loops) {
      return end
    }
    const last = this.clips[this.clips.length - 1].duration
    if (last <= 0) {
      return end
    }
    const start = end - last
    return start + ((time - start) % last)
  }

  private restore() {
    const pose = this.rest
    for (let i = 0, o = 0; i < this.joints.length; i++, o += 10) {
      const joint = this.joints[i]
      vec3$init(joint.translation, pose[o], pose[o + 1], pose[o + 2])
      vec4$init(joint.rotation, pose[o + 3], pose[o + 4], pose[o + 5], pose[o + 6])
      vec3$init(joint.scale, pose[o + 7], pose[o + 8], pose[o + 9])
      joint.markAsChanged()
    }
  }
}
