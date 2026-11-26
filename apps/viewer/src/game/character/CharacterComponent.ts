import { GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import type { IVec3 } from '@gglib/math'
import {
  AnimationMixer,
  AnimationPose,
  poseToModel,
  type AnimationEntry,
  type AnimationMixerPlayOptions,
  type AnimationRig,
  type AnimationSource,
  type SkinPalette,
} from '@gglib/model'
import type { CharacterAnimationFile, CharacterAnimationSet, ViewerCharacterComponent } from '../../api'
import type { CgfSkinBones } from '../../formats/cgf'
import { setInstanceSkinOffset } from '../../material/common'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { MeshLoaderComponent, type SkinnedDraw } from '../slice/MeshLoaderComponent'
import { pickIdleAnimation, type CharacterAssets } from './CharacterAssets'
import { CharacterAnimationSystem } from './CharacterAnimationSystem'
import type { CharacterWeapon } from './CharacterWeapon'
import { skinJointMap } from './rig'
import { SkeletonShapes } from './SkeletonShapes'
import { HitShapes } from './mannequin/HitShapes'
import { MannequinController } from './mannequin/MannequinController'
import { poseHitShapeJoints } from './mannequin/poseHitShapeJoints'
import { timelineTime } from './mannequin/timeline'
import {
  addBlendSpaceRootMotion,
  addRootMotion,
  type BlendSpaceState,
  blendSpaceSource,
  characterClipSource,
  CharacterMotion,
  isBlendSpaceSource,
  isClipSource,
} from './sources'

/**
 * The animation (clip or blend space) a character loops until the Mannequin runtime drives it, and where it came from
 */
interface IdleClip {
  file: CharacterAnimationFile
  speed: number
  source: 'timeline' | 'mannequin'
}

/**
 * A palette range of a part whose bone list differs from the rig, refilled from the character's range
 */
interface RemappedRange {
  offset: number
  /**
   * Rig joint per bone of the part, see {@link skinJointMap}
   */
  joints: Int16Array
}

/**
 * A mixer layer above the game's 16 (Mannequin scopes reach layer 15): clips played by hand over the character, e.g.
 * the second clip of the browser Character mode
 */
export const PREVIEW_LAYER = 16

/**
 * A character of a slice (nwbt ViewerCharacterComponent): its `.cdf`, parts and Mannequin data, animated and skinned
 *
 * @remarks
 * While active it loads the rig of its skeleton and plays its idle: a timeline that runs on activate, else its
 * Mannequin `Idle` fragment under its default tags, else an idle clip by name. It writes its pose into the shared
 * skinning palette of the {@link CharacterAnimationSystem}. {@link play} plays any animation of its set.
 * The parts are skinned mesh loaders, their draws read the character's palette range. A part whose `.skin` lists its
 * bones in another order than the `.chr` gets a range of its own, remapped by name.
 * Without a rig (a load error, a `.skin` without `.cdf`) the parts stay in bind pose.
 */
export class CharacterComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerCharacterComponent
  /**
   * The skinned mesh loaders of the parts
   */
  public readonly parts: ReadonlyArray<MeshLoaderComponent>

  public rig: AnimationRig | null = null
  public mixer: AnimationMixer | null = null
  /**
   * The animation the character loops and where it came from: a timeline that runs on activate, the Mannequin `Idle`
   * fragment or the name fallback
   */
  public idle: { name: string; source: 'timeline' | 'mannequin' | 'name' } | null = null
  /**
   * The animations of the character's skeleton, null until loaded
   */
  public animationSet: CharacterAnimationSet | null = null
  /**
   * Holds the time of every entry, the pose is still evaluated (e.g. while scrubbing {@link AnimationEntry.time})
   */
  public paused = false
  /**
   * Draws the joints and bones (a {@link DebugShapeComponent} on the entity and the debug layer Skeleton)
   */
  public showSkeleton = false
  /**
   * Draws the melee hit shapes of the playing fragment (a {@link DebugShapeComponent} on the entity and the debug
   * layer Hitboxes)
   */
  public showHitboxes = false
  /**
   * The motion parameters the blend spaces read, and whether the root stays in place
   */
  public readonly motion = new CharacterMotion()
  /**
   * The root joint's travel (model space, meters) of the newest base layer clip, summed over the animated frames since
   * the consumer last reset it: the root motion of animation driven movement (e.g. a dodge of the third person
   * character)
   */
  public readonly rootMotion = new Float32Array(4)
  /**
   * Plays Mannequin fragments, null without a Mannequin setup (see {@link useMannequin})
   */
  public mannequin: MannequinController | null = null
  /**
   * The weapons on the character's sockets, see {@link attachWeapon}
   */
  public readonly weapons: CharacterWeapon[] = []

  private system: CharacterAnimationSystem | null = null
  private pose: AnimationPose | null = null
  private modelPose: AnimationPose | null = null
  private paletteOffset = -1
  private readonly remapped: RemappedRange[] = []
  /**
   * Palette offset per bone list of the bound draws (the draws of one model share the list), and per joint map:
   * parts whose bones map alike share one range
   */
  private readonly offsets = new Map<CgfSkinBones, number>()
  private readonly offsetsByMap = new Map<string, number>()
  private readonly bound = new Set<SkinnedDraw>()
  /**
   * The entities of the parts whose load events bind the parts
   */
  private readonly partEntities = new Set<GameEntity>()
  private readonly sourceNames = new WeakMap<AnimationSource, string>()
  private skeleton: SkeletonShapes | null = null
  private hits: HitShapes | null = null
  /**
   * The joint {@link focusPoint} reads
   */
  private focusJoint = 0
  private loading = false
  private destroyed = false

  public constructor(data: ViewerCharacterComponent, parts: MeshLoaderComponent[]) {
    this.data = data
    this.parts = parts
    for (const part of parts) {
      part.skinned = true
    }
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(CharacterAnimationSystem, { optional: true })
  }

  public activate(): void {
    this.listenToParts()
    this.load()
  }

  public destroy(): void {
    this.destroyed = true
    for (const entity of this.partEntities) {
      entity.events.off(MeshLoaderComponent.onLoad, this.bindParts)
    }
    this.partEntities.clear()
    const palette = this.system?.palette
    if (palette && this.rig && this.paletteOffset >= 0) {
      palette.release(this.paletteOffset, this.rig.count)
      for (const range of this.remapped) {
        palette.release(range.offset, range.joints.length)
      }
    }
    this.paletteOffset = -1
    this.remapped.length = 0
    this.skeleton?.dispose()
    this.skeleton = null
    this.hits?.dispose()
    this.hits = null
  }

  /**
   * Places a weapon entity (a child of this entity) on its socket, it follows the socket's joint from then on
   */
  public attachWeapon(weapon: CharacterWeapon) {
    this.weapons.push(weapon)
    if (this.rig && this.modelPose) {
      weapon.bind(this.rig)
      weapon.place(this.modelPose)
    }
  }

  /**
   * Plays an animation of the set by name, a clip or a blend space, see {@link AnimationMixer.play}
   *
   * @returns the entry, null when the rig is not loaded yet, the name is unknown or the animation fails to load
   */
  public async play(name: string, options?: AnimationMixerPlayOptions): Promise<AnimationEntry | null> {
    const set = this.animationSet
    const mixer = this.mixer
    const file = set ? this.system.assets.animationByName(set, name) : null
    if (!mixer || !file) {
      return null
    }
    const source = await this.loadSource(set, mixer.rig, file)
    if (!source || this.destroyed || this.mixer !== mixer) {
      return null
    }
    // a clip played by hand on the game's layers: the Mannequin controller installs no more clips
    if ((options?.layer ?? 0) < PREVIEW_LAYER) {
      this.mannequin?.halt()
    }
    return mixer.play(source, options)
  }

  /**
   * The shared animation data of the characters, null before the component initialized
   */
  public get assets(): CharacterAssets | null {
    return this.system?.assets ?? null
  }

  /**
   * Plays a variant of a Mannequin fragment: the variant's tags replace the set ones, then the fragment installs
   *
   * @returns whether it installed, false without a Mannequin setup (see {@link useDatabase})
   */
  public async playMove(fragment: string, tags: string[]): Promise<boolean> {
    const mannequin = this.mannequin
    if (!mannequin) {
      return false
    }
    this.paused = false
    mannequin.tags.reset(tags)
    return mannequin.queue(fragment)
  }

  /**
   * The animation name of a mixer entry, empty for a source not played by name
   */
  public entryName(entry: AnimationEntry): string {
    return (entry.source && this.sourceNames.get(entry.source)) || ''
  }

  /**
   * Advances the animation and writes the palette, skipped beyond the animation distance (the last palette stays)
   *
   * @param eye - camera position
   * @param distance - the animation distance
   */
  public animate(dt: number, eye: IVec3, distance: number, palette: SkinPalette) {
    const mixer = this.mixer
    if (!mixer || this.paletteOffset < 0) {
      return
    }
    const world = this.entity.getTransform().world
    const dx = world[12] - eye.x
    const dy = world[13] - eye.y
    const dz = world[14] - eye.z
    if (dx * dx + dy * dy + dz * dz > distance * distance) {
      return
    }
    const step = this.paused ? 0 : dt
    this.mannequin?.update(step)
    // root motion of the newest base layer clip over this step (Cry Extract_DeltaMovement, clip path)
    const entries = mixer.entries(0)
    const entry = entries[entries.length - 1]
    const source = entry?.source ?? null
    const from = entry?.time ?? 0
    mixer.update(step)
    if (entry?.active && entry.source === source) {
      const rootTarget = mixer.rig.targets[0]
      if (isClipSource(source)) {
        addRootMotion(source.binding.clip, rootTarget, from, entry.time, entry.loop, this.rootMotion)
      } else if (isBlendSpaceSource(source)) {
        const state = entry.state as BlendSpaceState
        addBlendSpaceRootMotion(source, state, rootTarget, from, entry.time, entry.loop, this.rootMotion)
      }
    }
    mixer.evaluate(this.pose)
    poseToModel(this.pose, mixer.rig.parents, this.modelPose)
    palette.write(this.paletteOffset, this.modelPose, mixer.rig)
    for (const range of this.remapped) {
      palette.remap(this.paletteOffset, range.offset, range.joints)
    }
    for (const weapon of this.weapons) {
      weapon.place(this.modelPose)
    }
    if (this.showSkeleton) {
      this.skeletonShapes()?.update(this.modelPose)
    }
    const hits = this.showHitboxes || this.hits ? this.hitShapes() : null
    if (hits) {
      const action = this.mannequin?.current ?? null
      const timeline = action?.timeline ?? null
      const time = timeline ? timelineTime(timeline, action.time - action.transitionDuration) : 0
      hits.enabled = this.showHitboxes
      hits.update(timeline, time)
    }
  }

  /**
   * Whether the playing fragment has hit shapes to draw (see {@link showHitboxes})
   */
  public get hasHitboxes(): boolean {
    return !!this.hitShapes()?.has(this.mannequin?.current?.timeline ?? null)
  }

  /**
   * The hit shapes, created on first use, null without a rig or a debug shape component
   */
  private hitShapes(): HitShapes | null {
    if (!this.hits && this.mixer && this.modelPose) {
      const debug = this.entity.component(DebugShapeComponent, GetComponent.Optional)
      if (debug) {
        this.hits = new HitShapes(debug, poseHitShapeJoints(this.mixer.rig, this.modelPose))
      }
    }
    return this.hits
  }

  /**
   * The skeleton shapes, created on first use, null without a debug shape component
   */
  private skeletonShapes(): SkeletonShapes | null {
    if (!this.skeleton) {
      const debug = this.entity.component(DebugShapeComponent, GetComponent.Optional)
      if (debug) {
        this.skeleton = new SkeletonShapes(debug, this.mixer.rig, () => this.showSkeleton)
      }
    }
    return this.skeleton
  }

  /**
   * The source of an animation of the set: a clip, or a blend space with the clips of its slots. Null when it fails
   * to load (logged).
   */
  private async loadSource(
    set: CharacterAnimationSet,
    rig: AnimationRig,
    file: CharacterAnimationFile,
  ): Promise<AnimationSource | null> {
    const assets = this.system.assets
    try {
      let source: AnimationSource
      if (file.type === 'caf') {
        source = characterClipSource(rig.bind(await assets.clip(file)), this.motion)
      } else {
        const space = await assets.blendSpace(file.file)
        const clips = await assets.blendSpaceClips(set, space)
        source = blendSpaceSource(
          space,
          clips.map((it) => rig.bind(it)),
          rig,
          this.motion,
        )
      }
      this.sourceNames.set(source, file.name)
      return source
    } catch (err) {
      console.warn(`character ${this.data.model}: ${err instanceof Error ? err.message : String(err)}`)
      return null
    }
  }

  /**
   * Binds the parts when they load: a loaded part emits on its own entity, which is not this one for all but one part
   * (an entity holds one component per type, repeated loaders sit on satellite or child entities). Called on
   * activation and again at setup, for part entities created after this one (the browser preview).
   *
   * TODO(satellite split): a workaround for SliceSystem's satellite entities. To be replaced once gglib lets an entity
   * hold several components of one type.
   */
  private listenToParts() {
    for (const part of this.parts) {
      const entity = part.entity
      if (entity && !this.partEntities.has(entity)) {
        this.partEntities.add(entity)
        entity.events.on(MeshLoaderComponent.onLoad, this.bindParts)
      }
    }
  }

  /**
   * Drives the character by a Mannequin setup (replacing the controller it had) and queues its idle fragment
   *
   * @returns whether the idle fragment installed
   */
  public async useMannequin(database: string, controllerDefinition: string, tags: string[] = []): Promise<boolean> {
    const set = this.animationSet
    const mixer = this.mixer
    if (!set || !mixer) {
      return false
    }
    const assets = this.system.assets
    try {
      const setup = await assets.mannequinSetup(database, controllerDefinition)
      if (this.destroyed || this.mixer !== mixer) {
        return false
      }
      this.mannequin?.halt()
      const controller = new MannequinController(
        setup,
        {
          mixer,
          source: async (name) => {
            const file = assets.animationByName(set, name)
            return file ? this.loadSource(set, mixer.rig, file) : null
          },
          candidates: (fragment, state) => assets.fragmentCandidates(database, fragment, state),
          transitions: (state) => assets.fragmentBlends(database, state),
        },
        seededRandom(this.phase()),
      )
      controller.tags.reset(tags)
      this.mannequin = controller
      return await controller.queue(controller.idleFragment, { phase: this.phase() })
    } catch (err) {
      console.warn(`mannequin ${database}: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }

  /**
   * Drives the character by an animation database, its controller definition found among the candidates (see
   * {@link CharacterAssets.controllerDefinitionFor}). For the browser preview, which has no slice data.
   *
   * @returns whether the idle fragment installed
   */
  public async useDatabase(database: string, controllerDefinitions: string[]): Promise<boolean> {
    if (!this.system) {
      return false
    }
    const controllerDefinition = await this.system.assets.controllerDefinitionFor(database, controllerDefinitions)
    if (!controllerDefinition) {
      console.warn(`mannequin ${database}: no controller definition`)
      return false
    }
    return this.useMannequin(database, controllerDefinition)
  }

  private async load() {
    const model = this.data.model
    if (!this.system || this.loading || this.rig || !/\.(cdf|chr)$/i.test(model)) {
      return
    }
    this.loading = true
    const assets = this.system.assets
    try {
      const set = await assets.animationSet(model)
      const rig = await assets.rig(set.skeleton)
      const timeline = await this.timelineIdle(set)
      const timelineSource = timeline ? await this.loadSource(set, rig, timeline.file) : null
      if (this.destroyed) {
        return
      }
      this.animationSet = set
      this.setup(rig)
      if (timelineSource) {
        // alike characters next to each other start at different phases
        this.mixer.play(timelineSource, { loop: true, speed: timeline.speed, time: this.phase() })
        this.idle = { name: timeline.file.name, source: 'timeline' }
        return
      }
      const mannequin = this.data.mannequin
      if (mannequin?.database && mannequin.controllerDefinition) {
        // the default tags and the tags of the main hand item the spawn action draws
        const tags = [...(mannequin.defaultTags ?? []), ...(mannequin.itemTags ?? [])]
        const ok = await this.useMannequin(mannequin.database, mannequin.controllerDefinition, tags)
        if (ok) {
          this.idle = { name: this.mannequin.idleFragment, source: 'mannequin' }
          return
        }
      }
      const fallback = pickIdleAnimation(set.animations)
      const source = fallback ? await this.loadSource(set, rig, fallback) : null
      if (source && !this.destroyed && !this.mannequin?.current) {
        this.mixer.play(source, { loop: true, time: this.phase() })
        this.idle = { name: fallback.name, source: 'name' }
      }
    } catch (err) {
      console.warn(`character ${model}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      this.loading = false
    }
  }

  /**
   * The first animation clip of a timeline layer that runs on activate, null without one or when its animation is
   * unknown. The timeline's sequence of clips is not played yet, the first clip loops.
   */
  private async timelineIdle(set: CharacterAnimationSet): Promise<IdleClip | null> {
    const assets = this.system.assets
    for (const layer of this.data.timelines ?? []) {
      if (!layer.runOnActivate) {
        continue
      }
      try {
        const [clip] = await assets.timelineClips(layer)
        const file = clip ? assets.animationByName(set, clip.animation) : null
        if (file) {
          return { file, speed: clip.speed, source: 'timeline' }
        }
      } catch (err) {
        console.warn(`timeline ${layer.timeline}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return null
  }

  private setup(rig: AnimationRig) {
    const palette = this.system.palette
    const scale = !!rig.defaultPose.scales
    this.rig = rig
    this.mixer = new AnimationMixer(rig, { layers: PREVIEW_LAYER + 1 })
    this.pose = new AnimationPose(rig.count, { scale })
    this.modelPose = new AnimationPose(rig.count, { scale })
    this.paletteOffset = palette.allocate(rig.count)
    // the default pose until the first animate, a reused range holds another character's palette
    palette.write(this.paletteOffset, rig.defaultModelPose, rig)
    for (const weapon of this.weapons) {
      weapon.bind(rig)
      weapon.place(rig.defaultModelPose)
    }
    this.focusJoint = findFocusJoint(rig)
    this.listenToParts()
    this.bindParts()
  }

  /**
   * The world position of the character's body (its hips) in the pose it plays, e.g. for a camera that follows it.
   * Cutscene clips may move the body far from the root (the hips fly while the root stays).
   *
   * @returns false without a rig
   */
  public focusPoint(out: IVec3): boolean {
    const rig = this.rig
    const pose = this.modelPose
    if (!rig || !pose || this.destroyed) {
      return false
    }
    const j = this.focusJoint
    const x = pose.translations[j * 3]
    const y = pose.translations[j * 3 + 1]
    const z = pose.translations[j * 3 + 2]
    const m = this.entity.getTransform().world
    out.x = m[0] * x + m[4] * y + m[8] * z + m[12]
    out.y = m[1] * x + m[5] * y + m[9] * z + m[13]
    out.z = m[2] * x + m[6] * y + m[10] * z + m[14]
    return true
  }

  /**
   * Points the skinned draws of the loaded parts at their palette range
   */
  private bindParts = () => {
    const rig = this.rig
    if (!rig || this.paletteOffset < 0) {
      return
    }
    for (const part of this.parts) {
      for (const draw of part.skinnedDraws) {
        if (this.bound.has(draw)) {
          continue
        }
        this.bound.add(draw)
        if (draw.bones) {
          setInstanceSkinOffset(draw.data, this.rangeOf(draw.bones))
        }
      }
    }
  }

  /**
   * The palette range of a bone list: the character's own when the list follows the rig, else a remapped range
   */
  private rangeOf(bones: CgfSkinBones): number {
    let offset = this.offsets.get(bones)
    if (offset != null) {
      return offset
    }
    const rig = this.rig
    const joints = skinJointMap(rig, bones)
    const follows = joints.length <= rig.count && joints.every((joint, i) => joint === i)
    if (follows) {
      offset = this.paletteOffset
    } else {
      const key = joints.join(',')
      offset = this.offsetsByMap.get(key)
      if (offset == null) {
        const palette = this.system.palette
        offset = palette.allocate(joints.length)
        this.remapped.push({ offset, joints })
        palette.remap(this.paletteOffset, offset, joints)
        this.offsetsByMap.set(key, offset)
      }
    }
    this.offsets.set(bones, offset)
    return offset
  }

  /**
   * A start phase from the position, so it is the same on every load (fixed clock A/B shots). Also seeds the choice
   * among fragment options.
   */
  private phase(): number {
    const world = this.entity.getTransform().world
    const h = Math.sin(world[12] * 12.9898 + world[13] * 78.233 + world[14] * 37.719) * 43758.5453
    return h - Math.floor(h)
  }
}

/**
 * The joint of a character's body: the first named pelvis or hips (`Bip01 Pelvis`, `bind_hips`), else the child of the
 * root with the most joints below it, else the root
 */
function findFocusJoint(rig: AnimationRig): number {
  const named = rig.names.findIndex((it) => /pelvis|hips/i.test(it))
  if (named >= 0) {
    return named
  }
  const below = new Array<number>(rig.count).fill(0)
  for (let j = rig.count - 1; j > 0; j--) {
    const parent = rig.parents[j]
    if (parent >= 0) {
      below[parent] += below[j] + 1
    }
  }
  let best = 0
  for (let j = 1; j < rig.count; j++) {
    if (rig.parents[j] === 0 && (best === 0 || below[j] > below[best])) {
      best = j
    }
  }
  return best
}

/**
 * A repeatable random sequence in [0, 1) (xorshift32), seeded by a number in [0, 1)
 */
function seededRandom(seed: number): () => number {
  let state = Math.floor(seed * 0xffffffff) >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}
