import { batch, createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import type { CharacterAnimationFile } from '../../../../api'
import type { CharacterComponent } from '../../../../game/character/CharacterComponent'
import { timelineTime, type FragmentTimeline } from '../../../../game/character/mannequin/timeline'
import { isBlendSpaceSource, type BlendSpaceState } from '../../../../game/character/sources'
import type { NwViewer } from '../../../../viewer'
import { setExportAnimations } from '../../../common/exportSelection'
import type { AssetViewProps } from '../registry'
import { exportClips } from './exportClips'
import { hasEnded, newestEntry, readPlayState } from './playState'
import { loadSettings, saveSettings } from './settings'
import type { CharacterModeState, CharacterSettings } from './types'

/**
 * How often the store reads the parts and the playing animation
 */
const POLL_MS = 25

/**
 * Seconds a clicked animation cross fades in
 */
const FADE = 0.2

export type CharacterModeStore = ReturnType<typeof createCharacterModeStore>

/**
 * The state and actions of the character mode: shows the `.cdf` of the tab in the engine, polls its parts and what
 * plays, plays animations, keeps the view settings for the session and the checked animations for the export.
 *
 * @remarks
 * The stores of the lists (animations, ADB fragments) get this store: they read the character through
 * {@link CharacterModeStore.character} and check animations through {@link CharacterModeStore.select}.
 */
export function createCharacterModeStore(props: AssetViewProps) {
  // read from the poll, outside an owner
  const path = createMemo(() => props.ctx.path)
  const previewKey = () => `character:${path()}`

  const [animations, setAnimations] = createSignal<CharacterAnimationFile[]>([])
  // the fragment the controller plays and its time, for the track bar: engine data, not state
  const [trackTimeline, setTrackTimeline] = createSignal<FragmentTimeline | null>(null)
  const [trackTime, setTrackTime] = createSignal(0)
  const [state, setState] = createStore<CharacterModeState>({
    settings: loadSettings(),
    parts: [],
    play: null,
    selected: [],
    following: false,
    hasHitboxes: false,
    tick: 0,
    get database() {
      return database()
    },
  })
  const database = createMemo(() => state.settings.databases[path()] ?? '')

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  // the character the session settings were applied to
  let configured: CharacterComponent | null = null

  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)
  onCleanup(() => setExportAnimations(path(), []))

  const character = (): CharacterComponent | null => {
    if (viewer?.previewKey !== previewKey()) {
      return null
    }
    return viewer.previewCharacter()
  }

  const update = (patch: Partial<CharacterSettings>) => {
    setState('settings', patch)
    saveSettings(state.settings)
  }

  const applyToBase = (it: CharacterComponent) => {
    const entry = newestEntry(it)
    if (entry) {
      entry.speed = state.settings.speed
      entry.loop = state.settings.loop
    }
  }

  const readParts = () => {
    if (viewer?.previewKey === previewKey()) {
      // new part objects every time: reconcile keeps the rows and changes only what differs
      setState('parts', reconcile(viewer.previewCharacterParts()))
    }
  }

  const poll = () => {
    if (!viewer || viewer.previewKey !== previewKey()) {
      return
    }
    batch(() => {
      readParts()
      const it = character()
      if (!viewer || !it?.mixer) {
        return
      }
      if (it.animationSet && it !== configured) {
        configured = it
        setAnimations(it.animationSet.animations)
        // the settings of the session apply to the idle that plays already
        applyToBase(it)
        it.motion.inPlace = state.settings.inPlace
        viewer.showPreviewSkeleton(state.settings.skeleton)
        viewer.showPreviewHitboxes(state.settings.hitboxes)
      }
      setState('play', reconcile(readPlayState(it)))
      const action = it.mannequin?.current ?? null
      // fragments without procedural layers (most idles) have nothing to show
      const timeline = action?.timeline.procLayers.length ? action.timeline : null
      if (timeline !== trackTimeline()) {
        setTrackTimeline(timeline)
      }
      setTrackTime(timeline ? timelineTime(timeline, action.time - action.transitionDuration) : 0)
      setState('following', viewer.followingPreviewCharacter)
      setState('hasHitboxes', viewer.previewHasHitboxes)
      setState('tick', (it) => it + 1)
    })
  }

  const selectedSet = createMemo(() => new Set(state.selected))

  // the export includes the checked animations, the playing one when none is checked
  const exportNames = createMemo(
    () => {
      if (state.selected.length) {
        return [...state.selected]
      }
      const name = state.play?.name
      return name ? [name] : []
    },
    [],
    { equals: (a, b) => a.length === b.length && a.every((it, i) => it === b[i]) },
  )
  let exportRequest = 0
  createEffect(() => {
    const names = exportNames()
    const request = ++exportRequest
    void exportClips(character(), names).then((list) => {
      if (request === exportRequest) {
        setExportAnimations(path(), list)
      }
    })
  })

  return {
    state,
    /**
     * The animations of the character's set. Not part of the state: the engine owns them.
     */
    animations,
    /**
     * The fragment the character's Mannequin controller plays (its root scope), null for none, a plain animation or a
     * fragment without procedural layers
     */
    trackTimeline,
    /**
     * Seconds on {@link trackTimeline}
     */
    trackTime,
    /**
     * The character the engine shows for this tab, null while another content is shown. For the stores of the lists,
     * the views never see it.
     */
    character,
    /**
     * The engine runs on the surface of the mode: shows the character and polls it
     */
    attach(it: NwViewer) {
      viewer = it
      it.showCharacter(path())
      stopPolling()
      timer = setInterval(poll, POLL_MS)
    },
    /**
     * Hidden or closed
     */
    detach() {
      stopPolling()
    },
    update,
    setDatabase(file: string) {
      setState('settings', 'databases', path(), file)
      saveSettings(state.settings)
    },
    /**
     * Draws or hides a part, it stays loaded
     */
    setPartVisible(index: number, visible: boolean) {
      if (viewer?.previewKey === previewKey()) {
        viewer.setPreviewPartVisible(index, visible)
        readParts()
      }
    },
    /**
     * Cross fades to an animation of the set
     */
    playAnimation(name: string) {
      const it = character()
      if (!it) {
        return
      }
      it.paused = false
      void it.play(name, { fade: FADE, speed: state.settings.speed, loop: state.settings.loop })
    },
    togglePause() {
      const it = character()
      if (!it) {
        return
      }
      const entry = newestEntry(it)
      if (entry && hasEnded(entry)) {
        // a clip that played to its end starts over
        entry.time = 0
        it.paused = false
        return
      }
      it.paused = !it.paused
    },
    /**
     * Pauses and moves the playing animation to a time in seconds
     */
    scrub(seconds: number) {
      const it = character()
      const entry = it ? newestEntry(it) : null
      const duration = entry?.source?.duration ?? 0
      if (it && entry && duration > 0) {
        it.paused = true
        entry.time = Math.min(1, Math.max(0, seconds / duration))
      }
    },
    setSpeed(speed: number) {
      update({ speed })
      const it = character()
      if (it) {
        applyToBase(it)
      }
    },
    setLoop(loop: boolean) {
      update({ loop })
      const it = character()
      if (it) {
        applyToBase(it)
      }
    },
    setSkeleton(skeleton: boolean) {
      update({ skeleton })
      viewer?.showPreviewSkeleton(skeleton)
    },
    setHitboxes(hitboxes: boolean) {
      update({ hitboxes })
      viewer?.showPreviewHitboxes(hitboxes)
    },
    setInPlace(inPlace: boolean) {
      update({ inPlace })
      const it = character()
      if (it) {
        it.motion.inPlace = inPlace
      }
    },
    /**
     * Sets a motion parameter. A locked dimension keeps the value of its entry start (as in the game), the preview
     * writes it into the playing blend space too.
     */
    setMotionParameter(param: number, value: number) {
      const it = character()
      if (!it) {
        return
      }
      it.motion.params[param] = value
      const entry = newestEntry(it)
      if (entry && isBlendSpaceSource(entry.source)) {
        const blend = entry.state as BlendSpaceState
        const dimensions = entry.source.space.dimensions
        for (let i = 0; i < dimensions.length; i++) {
          if (dimensions[i].locked && dimensions[i].param === param) {
            blend.params[i] = value
          }
        }
      }
    },
    toggleFollow() {
      if (!viewer) {
        return
      }
      viewer.followPreviewCharacter(!viewer.followingPreviewCharacter)
      setState('following', viewer.followingPreviewCharacter)
    },
    resetCamera() {
      viewer?.framePreviewModel()
    },
    isPlaying(name: string) {
      return state.play?.name === name
    },
    /**
     * Whether all the animations are checked
     */
    isSelected(names: string[]) {
      const set = selectedSet()
      return names.length > 0 && names.every((it) => set.has(it))
    },
    select(names: string[], on: boolean) {
      const set = new Set<string>(state.selected)
      for (const name of names) {
        if (on) {
          set.add(name)
        } else {
          set.delete(name)
        }
      }
      setState('selected', [...set])
    },
  }
}
