import type { AnimationMixer, AnimationSource } from '@gglib/model'
import {
  selectFragmentOptions,
  type AdbAnimation,
  type AdbBlend,
  type AdbFragment,
  type AdbProcedural,
  type AdbFragmentBlend,
  type FragmentCandidate,
  type MannequinScopeDefinition,
} from '../../../formats/mannequin'
import { fragmentScopes, TagState, type MannequinSetup } from './setup'
import { fragmentTimeline, type FragmentTimeline } from './timeline'
import { assembleFragment, findTransitions, type AssembledFragment, type TransitionChoice } from './transitions'

/**
 * What a controller needs from its character
 */
export interface MannequinHost {
  readonly mixer: AnimationMixer
  /**
   * The source of an animation name of the character's set, null when unknown or it fails to load
   */
  source(name: string): Promise<AnimationSource | null>
  /**
   * The variants of a fragment in the database and its sub databases that apply under the tags
   */
  candidates(fragment: string, tags: string[]): Promise<FragmentCandidate[]>
  /**
   * The transitions (`FragmentBlendList`) of the database and its sub databases that apply under the tags
   */
  transitions(tags: string[]): Promise<AdbFragmentBlend[]>
}

/**
 * A clip of a layer, ready to install
 */
export interface MannequinClip {
  blend: AdbBlend
  /**
   * Null for an empty entry: it stops the layer (layer 0 holds its pose)
   */
  animation: AdbAnimation | null
  source: AnimationSource | null
  loop: boolean
  /**
   * Seconds after the previous clip of the layer installed, a negative authored exit time resolved
   */
  exitTime: number
  /**
   * `(duration - StartTime) / speed`, 0 for looping clips, empty entries and zero speed
   */
  referenceLength: number
}

/**
 * Installs the clips of one animation layer at their exit times (Cry `SSequencer`)
 */
class LayerSequencer {
  public readonly layer: number
  public clips: MannequinClip[] = []
  public pos = 0
  public installTime = 0
  public queued = false
  /**
   * The layer has no clips in the fragment: it stops at its install time with the default blend
   */
  public blendingOut = false
  /**
   * The normalized start time of the next installed clip, then cleared (alike characters start at other phases)
   */
  public phase: number | null = null

  public constructor(layer: number) {
    this.layer = layer
  }

  public start(clips: MannequinClip[] | null, phase: number | null) {
    this.pos = 0
    this.queued = true
    this.phase = phase
    if (clips?.length) {
      this.clips = clips
      this.blendingOut = false
      this.installTime = clips[0].exitTime
    } else {
      this.clips = []
      this.blendingOut = true
      this.installTime = 0
    }
  }

  public halt() {
    this.queued = false
    this.clips = []
  }
}

/**
 * A fragment installed on its scopes (Cry `IAction` with its root scope)
 */
export interface MannequinAction {
  fragment: string
  /**
   * The tags of the variant that plays on the root scope
   */
  variantTags: string[]
  /**
   * The random option the variants were picked with (an `AutoReinstall` keeps it)
   */
  option: number
  scopes: MannequinScopeDefinition[]
  /**
   * The transitions the root scope plays before the fragment, as `from → to` (`*` for any)
   */
  transitions: string[]
  /**
   * Seconds since the fragment installed
   */
  time: number
  /**
   * The root scope's scheduled time: the transitions, then the fragment's first layer's exit times plus the last
   * clip's reference length
   */
  duration: number
  /**
   * The last clip of the root scope's first layer does not loop: the fragment ends
   */
  oneShot: boolean
  blendOutDuration: number
  /**
   * The one shot fragment reached `duration - blendOutDuration`
   */
  finished: boolean
  /**
   * The root scope's variant laid out in seconds (its anim and proc layers, without the transitions): its time is
   * {@link time} minus {@link transitionDuration}
   */
  timeline: FragmentTimeline
  /**
   * Seconds of the transitions the root scope plays before the fragment
   */
  transitionDuration: number
}

/**
 * The procedural clips of one proc layer of a scope's fragment (Cry `SProcSequencer`): each clip enters when its delay
 * (the blend's exit time after the clip before) has passed and replaces the one before; an empty clip (`type=""`)
 * only ends it. Only `CAGE-Named` clips do something here: they hold a marker while they run.
 */
interface ProcTrack {
  action: MannequinAction
  clips: Array<{ delay: number; procedural: AdbProcedural | null }>
  pos: number
  wait: number
  current: MannequinProceduralClip | null
}

/**
 * A procedural clip that runs on a scope
 */
export interface MannequinProceduralClip {
  readonly procedural: AdbProcedural
  /**
   * The action whose fragment plays the clip
   */
  readonly action: MannequinAction
  /**
   * Seconds since the clip entered
   */
  time: number
  /**
   * Seconds until the next clip of its track replaces it, Infinity for the last
   */
  readonly duration: number
  /**
   * The handler's state of the clip
   */
  state: unknown
}

/**
 * Runs procedural clips the controller does not know (e.g. the CAGE transition clips of an action list)
 */
export interface MannequinProceduralHandler {
  enter(clip: MannequinProceduralClip): void
  update(clip: MannequinProceduralClip, dt: number): void
  /**
   * @param completed - the next clip of its track replaced it at its time; false when its fragment stopped
   */
  exit(clip: MannequinProceduralClip, completed: boolean): void
}

export interface MannequinScopeFragment {
  fragment: string
  tags: string[]
  action: MannequinAction
}

/**
 * Plays Mannequin fragments on a character's animation layers (CryAction's CActionController / CActionScope, the
 * parts the viewer needs)
 *
 * @remarks
 * - {@link queue} selects the fragment's scopes (overrides by tags), and per scope the best variant for the tags plus
 *   the scope's own tags, which the variant must have (Cry `requiredTags`; sub databases included; equal variants are
 *   options, one picked at random). Each scope installs the variant's layers on its own layer range; scope layers
 *   without clips, and scopes without a variant, blend out.
 * - Each layer installs its clips at their exit times: a negative exit time waits for the previous clip's reference
 *   length. A clip installs with its blend duration as fade, its speed and weight, `StartTime` as start time; clips
 *   without `Loop` hold their last pose. An empty clip stops its layer; on layer 0 it holds the pose.
 * - Transitions (`FragmentBlendList`): per scope, from the fragment it plays to the new one, see
 *   {@link findTransitions}; their layers come before the fragment's, a transition's terminal blend sets the blend of
 *   the fragment's first clip (see {@link assembleFragment}).
 * - Proc layers: `CAGE-Named` clips hold markers ({@link hasMarker}), other clips go to the
 *   {@link proceduralHandler}.
 * - A one shot fragment finishes at `duration - BlendOutDuration`: with {@link autoFinish} the {@link idleFragment}
 *   takes over, scopes it does not cover blend out. A one shot idle fragment stays installed and holds its last key
 *   (the AI's idle action stays while its task requests it, non looping clips repeat their last key).
 *
 * Not ported: scope contexts of other characters, frag tags, outro transitions (no game ADB flags one).
 */
export class MannequinController {
  public readonly setup: MannequinSetup
  public readonly tags: TagState
  /**
   * The fragment that plays when a one shot fragment finished, none when empty
   */
  public idleFragment = 'Idle'
  /**
   * The installed actions, newest last
   */
  public readonly actions: MannequinAction[] = []
  /**
   * A one shot action that reached its end hands its scopes to the {@link idleFragment}. Off when an action list
   * (CAGE) decides when actions end: a finished action then holds its last pose until another replaces it.
   */
  public autoFinish = true
  /**
   * Gets the procedural clips as they enter, update and exit (`CAGE-Named` markers are counted either way)
   */
  public proceduralHandler: MannequinProceduralHandler | null = null
  /**
   * An `AutoReinstall` fragment installed again under changed tags: `next` replaced `previous`
   */
  public onReinstalled: ((previous: MannequinAction, next: MannequinAction) => void) | null = null

  private readonly host: MannequinHost
  private readonly sequencers: LayerSequencer[] = []
  private readonly random: () => number
  private request = 0
  /**
   * The newest request per scope: a request whose scopes got a newer one is dropped when it is ready
   */
  private readonly scopeRequests = new Map<MannequinScopeDefinition, number>()
  /**
   * The requests that are still loading
   */
  private readonly pendingRequests = new Set<number>()
  /**
   * The fragment each scope plays, with the tags it installed under: the `from` side of the next transition
   */
  private readonly scopeFragments = new Map<MannequinScopeDefinition, MannequinScopeFragment>()
  /**
   * The proc layers each scope's fragment plays
   */
  private readonly scopeProcs = new Map<MannequinScopeDefinition, ProcTrack[]>()
  /**
   * `CAGE-Named` markers by lower case name, counted: overlapping clips hold separate references
   */
  private readonly markerCounts = new Map<string, number>()
  /**
   * The tag version the `AutoReinstall` fragments were checked against
   */
  private tagsVersion = -1
  private readonly reinstalling = new Set<MannequinAction>()

  public constructor(setup: MannequinSetup, host: MannequinHost, random: () => number = Math.random) {
    this.setup = setup
    this.host = host
    this.random = random
    this.tags = new TagState(setup.tags)
    for (let layer = 0; layer < host.mixer.layerCount; layer++) {
      this.sequencers.push(new LayerSequencer(layer))
    }
  }

  /**
   * The action on the root scope, the newest one
   */
  public get current(): MannequinAction | null {
    return this.actions[this.actions.length - 1] ?? null
  }

  /**
   * Installs a fragment under the current tags, replacing the actions on its scopes. Resolves false when the fragment
   * has no scope or no variant for the tags, or when a newer request for one of its scopes came first (requests on
   * other scopes, e.g. an upper body draw and the full body idle, install both).
   *
   * @param phase - normalized start time of the first looping clips (looping idles of alike characters)
   * @param option - the random option to pick variants with, a new one when not given
   */
  public async queue(fragment: string, options?: { phase?: number; option?: number }): Promise<boolean> {
    return !!(await this.queueAction(fragment, options))
  }

  /**
   * A `CAGE-Named` procedural clip of that name runs on a scope (`IfMannequinMarker`)
   */
  public hasMarker(name: string): boolean {
    return (this.markerCounts.get(name.toLowerCase()) ?? 0) > 0
  }

  /**
   * {@link queue}, resolving to the installed action, null when it did not install
   */
  public async queueAction(
    fragment: string,
    options?: { phase?: number; option?: number },
  ): Promise<MannequinAction | null> {
    const request = ++this.request
    const tags = this.tags.values()
    const scopes = fragmentScopes(this.setup, fragment, this.tags)
    if (!scopes.length) {
      return null
    }
    for (const scope of scopes) {
      this.scopeRequests.set(scope, request)
    }
    this.pendingRequests.add(request)
    try {
      return await this.install(request, fragment, tags, scopes, options)
    } finally {
      this.pendingRequests.delete(request)
    }
  }

  /**
   * Loads and installs a request's fragment on its scopes, null when a newer request took one of them meanwhile or the
   * root scope has no variant
   */
  private async install(
    request: number,
    fragment: string,
    tags: string[],
    scopes: MannequinScopeDefinition[],
    options?: { phase?: number; option?: number },
  ): Promise<MannequinAction | null> {
    const option = options?.option ?? this.random()
    const installs: Array<{
      scope: MannequinScopeDefinition
      tags: string[]
      variant: FragmentCandidate | null
      assembled: AssembledFragment
      layers: MannequinClip[][]
      transitions: TransitionChoice[]
      duration: (name: string) => number | null
    }> = []
    for (const scope of scopes) {
      const scopeTags = [...tags, ...scope.tags]
      const variant = await this.selectVariant(fragment, scope, tags, option)
      const playing = this.scopeFragments.get(scope)
      const transitions = variant
        ? findTransitions(await this.host.transitions(scopeTags), {
            from: playing?.fragment ?? '',
            to: fragment,
            tagsFrom: playing?.tags ?? [],
            tagsTo: scopeTags,
            required: scope.tags,
            fragmentTime: playing?.action.time ?? 0,
          })
        : []
      const sources = await this.loadSources(transitions, variant)
      const duration = (name: string) => sourceDuration(sources.get(name))
      const assembled = assembleFragment(transitions, variant?.fragment ?? null, duration)
      const layers = assembled.layers.slice(0, scope.numLayers).map((layer) =>
        layer.map(
          (clip): MannequinClip => ({
            blend: clip.blend,
            animation: clip.animation,
            source: clip.animation ? (sources.get(clip.animation.name) ?? null) : null,
            loop: clip.loop,
            exitTime: clip.blend.exitTime,
            referenceLength: clip.referenceLength,
          }),
        ),
      )
      installs.push({ scope, tags: scopeTags, variant, assembled, layers, transitions, duration })
    }
    const root = installs[0]
    if (scopes.some((it) => this.scopeRequests.get(it) !== request) || !root.variant) {
      return null
    }
    this.removeScopes(scopes)
    const action: MannequinAction = {
      fragment,
      variantTags: uniqueTags(root.variant.tags),
      option,
      transitions: root.transitions.map((it) => `${it.from || '*'} → ${it.to || '*'}`),
      scopes,
      time: 0,
      duration: root.assembled.transitionDuration + root.assembled.fragmentDuration,
      oneShot: root.assembled.oneShot,
      blendOutDuration: root.variant.fragment.blendOutDuration,
      finished: false,
      timeline: fragmentTimeline(root.variant.fragment, root.duration),
      transitionDuration: root.assembled.transitionDuration,
    }
    for (const install of installs) {
      for (let i = 0; i < install.scope.numLayers; i++) {
        this.sequencers[install.scope.layer + i]?.start(install.layers[i] ?? null, options?.phase ?? null)
      }
      if (install.variant) {
        this.scopeFragments.set(install.scope, { fragment, tags: install.tags, action })
      } else {
        this.scopeFragments.delete(install.scope)
      }
      this.startProcs(install.scope, action, install.variant?.fragment ?? null, install.assembled.transitionDuration)
    }
    this.actions.push(action)
    // the clips due now install at once, also for characters that do not update (beyond the animation distance)
    this.update(0)
    return action
  }

  /**
   * The best variant of a fragment on a scope under the tags: the scope's tags join the query and are required (a
   * scope without its own variant blends out); equal variants are options, picked by `option` (0..1)
   */
  private async selectVariant(
    fragment: string,
    scope: MannequinScopeDefinition,
    tags: string[],
    option: number,
  ): Promise<FragmentCandidate | null> {
    const scopeTags = [...tags, ...scope.tags]
    const required = scope.tags.map((it) => it.toLowerCase())
    const candidates = (await this.host.candidates(fragment, scopeTags)).filter((candidate) =>
      required.every((tag) => candidate.tags.some((it) => it.toLowerCase() === tag)),
    )
    const options = selectFragmentOptions(candidates, scopeTags)
    return options[Math.min(options.length - 1, Math.floor(option * options.length))] ?? null
  }

  /**
   * The tags changed: an `AutoReinstall` fragment whose root scope now selects another variant installs again, with
   * its option; a `TimewarpAutoReinstall` one starts its looping clips at the phase the root scope's first layer
   * reached. The owner hears of it through {@link onReinstalled}.
   */
  /**
   * A request for one of the scopes is still loading: it replaces what plays there, a reinstall would drop it
   */
  private hasPendingRequest(scopes: MannequinScopeDefinition[]): boolean {
    for (const scope of scopes) {
      const request = this.scopeRequests.get(scope)
      if (request !== undefined && this.pendingRequests.has(request)) {
        return true
      }
    }
    return false
  }

  private async checkReinstall(action: MannequinAction) {
    const root = action.scopes[0]
    const definition = this.setup.controller.fragmentDefinitions.find((it) => it.name === action.fragment)
    if (!root || !definition?.flags.includes('AutoReinstall') || this.hasPendingRequest(action.scopes)) {
      return
    }
    this.reinstalling.add(action)
    try {
      const variant = await this.selectVariant(action.fragment, root, this.tags.values(), action.option)
      if (!variant || !this.actions.includes(action) || this.hasPendingRequest(action.scopes)) {
        return
      }
      if (sameTags(uniqueTags(variant.tags), action.variantTags)) {
        return
      }
      let phase: number | undefined
      if (definition.flags.includes('TimewarpAutoReinstall')) {
        const entries = this.host.mixer.entries(root.layer)
        phase = entries[entries.length - 1]?.time
      }
      const next = await this.queueAction(action.fragment, { phase, option: action.option })
      if (next) {
        this.onReinstalled?.(action, next)
      }
    } finally {
      this.reinstalling.delete(action)
    }
  }

  /**
   * An action ended (its owner released it): its scopes stop their clips and procedural clips and blend out over its
   * `BlendOutDuration`; layer 0 holds its pose for the next fragment instead of fading to the default pose
   */
  public release(action: MannequinAction) {
    const index = this.actions.indexOf(action)
    if (index < 0) {
      return
    }
    this.actions.splice(index, 1)
    for (const scope of action.scopes) {
      if (this.scopeFragments.get(scope)?.action === action) {
        this.scopeFragments.delete(scope)
      }
      this.stopProcs(scope)
      for (let i = 0; i < scope.numLayers; i++) {
        const layer = scope.layer + i
        this.sequencers[layer]?.halt()
        if (layer === 0) {
          this.stopLayer(0, 0)
        } else {
          this.host.mixer.stop(layer, action.blendOutDuration)
        }
      }
    }
  }

  /**
   * Stops installing clips and drops the actions; what plays keeps playing (e.g. a clip played by hand)
   */
  public halt() {
    // pending requests of all scopes are dropped
    this.scopeRequests.clear()
    this.actions.length = 0
    this.scopeFragments.clear()
    // deleting the current key while iterating a Map is safe
    for (const scope of this.scopeProcs.keys()) {
      this.stopProcs(scope)
    }
    for (const sequencer of this.sequencers) {
      sequencer.halt()
    }
  }

  /**
   * Advances the actions and installs the clips that are due. Call before the mixer's update.
   */
  public update(dt: number) {
    for (const sequencer of this.sequencers) {
      let timeLeft = dt
      while (sequencer.queued) {
        if (timeLeft < sequencer.installTime) {
          sequencer.installTime -= timeLeft
          break
        }
        timeLeft -= sequencer.installTime
        this.playPending(sequencer)
      }
    }
    for (const tracks of this.scopeProcs.values()) {
      for (const track of tracks) {
        this.advanceProcs(track, dt)
      }
    }
    if (this.tags.version !== this.tagsVersion) {
      this.tagsVersion = this.tags.version
      for (const action of this.actions) {
        if (!this.reinstalling.has(action)) {
          void this.checkReinstall(action)
        }
      }
    }
    // backwards: a finished action may leave
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const action = this.actions[i]
      action.time += dt
      if (action.oneShot && !action.finished && action.time >= action.duration - action.blendOutDuration) {
        action.finished = true
        if (this.autoFinish) {
          this.finish(action)
        }
      }
    }
  }

  /**
   * Starts the proc layers of a scope's new fragment, after its transitions; the clips of the fragment before end
   */
  private startProcs(
    scope: MannequinScopeDefinition,
    action: MannequinAction,
    fragment: AdbFragment | null,
    offset: number,
  ) {
    this.stopProcs(scope)
    if (!fragment?.procLayers.length) {
      return
    }
    const tracks: ProcTrack[] = fragment.procLayers.map((layer) => ({
      action,
      // the scheduler refuses negative timing, the viewer starts such clips at once
      clips: layer.sequence.map((it) => ({ delay: Math.max(0, it.blend.exitTime), procedural: it.procedural })),
      pos: 0,
      wait: 0,
      current: null,
    }))
    for (const track of tracks) {
      track.wait = offset + (track.clips[0]?.delay ?? 0)
    }
    this.scopeProcs.set(scope, tracks)
  }

  private stopProcs(scope: MannequinScopeDefinition) {
    const tracks = this.scopeProcs.get(scope)
    if (!tracks) {
      return
    }
    this.scopeProcs.delete(scope)
    for (const track of tracks) {
      this.exitProc(track, false)
    }
  }

  /**
   * Enters the clips that are due (each replaces the one before), then updates the running one by the time left
   */
  private advanceProcs(track: ProcTrack, dt: number) {
    let timeLeft = dt
    while (track.pos < track.clips.length && timeLeft >= track.wait) {
      timeLeft -= track.wait
      if (track.current) {
        track.current.time += track.wait
      }
      const clip = track.clips[track.pos++]
      this.exitProc(track, true)
      const next = track.clips[track.pos]
      if (clip.procedural?.type) {
        track.current = {
          procedural: clip.procedural,
          action: track.action,
          time: 0,
          duration: next ? next.delay : Infinity,
          state: null,
        }
        this.marker(clip.procedural, 1)
        this.proceduralHandler?.enter(track.current)
      }
      track.wait = next?.delay ?? 0
    }
    if (track.pos < track.clips.length) {
      track.wait -= timeLeft
    }
    const current = track.current
    if (current) {
      current.time += timeLeft
      this.proceduralHandler?.update(current, timeLeft)
    }
  }

  private exitProc(track: ProcTrack, completed: boolean) {
    const current = track.current
    if (current) {
      track.current = null
      this.marker(current.procedural, -1)
      this.proceduralHandler?.exit(current, completed)
    }
  }

  private marker(procedural: AdbProcedural, change: number) {
    if (procedural.type !== 'CAGE-Named') {
      return
    }
    const name = procedural.params['Name']
    if (typeof name !== 'string' || !name) {
      return
    }
    const key = name.toLowerCase()
    const count = (this.markerCounts.get(key) ?? 0) + change
    if (count > 0) {
      this.markerCounts.set(key, count)
    } else {
      this.markerCounts.delete(key)
    }
  }

  /**
   * A one shot action ends: the idle fragment takes over its scopes, the scopes the idle does not cover blend out and
   * leave the action (the action leaves without scopes). The idle fragment itself stays: its clips hold their last key.
   */
  private finish(action: MannequinAction) {
    const idle = this.idleFragment
    if (idle && action.fragment === idle) {
      return
    }
    const idleScopes = idle ? fragmentScopes(this.setup, idle, this.tags) : []
    const kept = action.scopes.filter((it) => idleScopes.includes(it))
    for (const scope of action.scopes) {
      if (kept.includes(scope)) {
        continue
      }
      this.scopeFragments.delete(scope)
      this.stopProcs(scope)
      for (let i = 0; i < scope.numLayers; i++) {
        this.sequencers[scope.layer + i]?.halt()
        this.host.mixer.stop(scope.layer + i, action.blendOutDuration)
      }
    }
    action.scopes = kept
    if (kept.length) {
      void this.queue(idle)
    } else {
      this.actions.splice(this.actions.indexOf(action), 1)
    }
  }

  private playPending(sequencer: LayerSequencer) {
    sequencer.queued = false
    const mixer = this.host.mixer
    if (sequencer.blendingOut) {
      sequencer.blendingOut = false
      mixer.stop(sequencer.layer, 0.2)
      return
    }
    const clip = sequencer.clips[sequencer.pos]
    if (!clip) {
      return
    }
    sequencer.pos++
    const animation = clip.animation
    if (!animation || !clip.source) {
      this.stopLayer(sequencer.layer, clip.blend.duration)
    } else {
      const source = clip.source
      const speed = animation.speed
      let time = 0
      if (sequencer.phase != null && clip.loop) {
        time = sequencer.phase
      } else if (source.duration > 0) {
        time = (clip.blend.startTime * (speed === 0 ? 1 : speed)) / source.duration
      }
      sequencer.phase = null
      // the first clip of the base layer takes the full weight at once, it does not fade in from the default pose
      const fade = sequencer.layer === 0 && !mixer.entries(0).length ? 0 : clip.blend.duration
      mixer.play(source, {
        layer: sequencer.layer,
        fade,
        speed,
        weight: animation.weight,
        loop: clip.loop,
        time,
      })
    }
    const next = sequencer.clips[sequencer.pos]
    if (next) {
      sequencer.installTime = next.exitTime
      sequencer.queued = true
    }
  }

  /**
   * An empty clip: layer 0 keeps its newest entry and holds it (the game sets its playback scale to 0), other layers
   * stop
   */
  private stopLayer(layer: number, fade: number) {
    const mixer = this.host.mixer
    if (layer === 0) {
      const entries = mixer.entries(0)
      const newest = entries[entries.length - 1]
      if (newest) {
        newest.speed = 0
      }
      return
    }
    mixer.stop(layer, fade)
  }

  /**
   * A new action takes the scopes: every action installed on one of them leaves, and its other scopes blend out
   * (LY `CActionController::Install`: `ExpandOverlappingScopes` and the scope flush mask)
   */
  private removeScopes(scopes: MannequinScopeDefinition[]) {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const action = this.actions[i]
      if (!action.scopes.some((it) => scopes.includes(it))) {
        continue
      }
      this.actions.splice(i, 1)
      for (const scope of action.scopes) {
        if (scopes.includes(scope)) {
          continue
        }
        this.scopeFragments.delete(scope)
        this.stopProcs(scope)
        for (let layer = scope.layer; layer < scope.layer + scope.numLayers; layer++) {
          this.sequencers[layer]?.halt()
          if (layer !== 0) {
            this.host.mixer.stop(layer, action.blendOutDuration)
          }
        }
      }
    }
  }

  /**
   * The sources of the animations of the transitions and the variant, by name (null when unknown)
   */
  private async loadSources(
    transitions: TransitionChoice[],
    variant: FragmentCandidate | null,
  ): Promise<Map<string, AnimationSource | null>> {
    const result = new Map<string, AnimationSource | null>()
    const fragments = [...transitions.map((it) => it.fragment), ...(variant ? [variant.fragment] : [])]
    for (const fragment of fragments) {
      for (const layer of fragment.animLayers) {
        for (const item of layer.sequence) {
          const name = item.animation?.name
          if (name && !result.has(name)) {
            result.set(name, await this.host.source(name))
          }
        }
      }
    }
    return result
  }
}

function sameTags(a: string[], b: string[]): boolean {
  // TODO: optimize
  return tagsKey(a) === tagsKey(b)
}

function tagsKey(tags: string[]): string {
  return tags
    .map((it) => it.toLowerCase())
    .sort()
    .join('+')
}

/**
 * Tags without repeats (a sub database and its variant may name the same tag), first spelling kept
 */
function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>()
  return tags.filter((it) => {
    const key = it.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * The duration of a loaded source, null when it did not load (the game counts an unknown animation as 0 long)
 */
function sourceDuration(source: AnimationSource | null | undefined): number | null {
  return source ? source.duration : null
}
