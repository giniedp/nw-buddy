import { createEffect, createMemo, createResource, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  parseParticleLibrary,
  type ParticleEffectNode,
  type ParticleLibraryDocument,
} from '../../../../formats/particles/parse'
import type { NwViewer } from '../../../../viewer'
import type { AssetViewProps } from '../registry'
import type { ParticleModeState, ParticleStats } from './types'

/**
 * How often the store reads the emitter and particle counts of the shown effect
 */
const STATS_POLL_MS = 500

export type ParticleModeStore = ReturnType<typeof createParticleModeStore>

/**
 * The state and actions of the particle mode: parses the library of the tab, lists its effects with a filter and shows
 * the selected one in the engine, polls its stats.
 */
export function createParticleModeStore(props: AssetViewProps) {
  const app = props.ctx.app
  // read from the engine callbacks, outside an owner
  const path = createMemo(() => props.ctx.path)
  const shown = createMemo(() => props.shown)
  const [loaded] = createResource(path, async (it) =>
    parseParticleLibrary(new TextDecoder().decode(await app.files.contentBytes(it))),
  )
  // reading a failed resource throws: guard every read
  const library = createMemo(() => (loaded.error ? undefined : loaded()))
  const effects = createMemo(() => playableEffects(library()))

  const [state, setState] = createStore<ParticleModeState>({
    get loadError() {
      return loaded.error ? String(loaded.error?.message ?? loaded.error) : null
    },
    get ready() {
      return !!library()
    },
    filter: '',
    selected: null,
    stats: null,
    get count() {
      return `${filtered().length} of ${effects().length} effects`
    },
    get info() {
      return info()
    },
  })
  const filtered = createMemo(() => filterEffects(effects(), state.filter))
  const info = createMemo(() => effectInfo(state.selected, state.stats))

  // the first effect is shown until the user picks another
  createEffect(() => {
    if (!state.selected && effects().length) {
      setState('selected', effects()[0].fullName)
    }
  })

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  // reads the state before the engine check: the effect tracks it before the engine runs
  const show = () => {
    const effect = state.selected
    const visible = shown()
    if (viewer && effect && visible) {
      viewer.showParticleEffect(path(), effect)
    }
  }
  createEffect(show)

  return {
    state,
    /**
     * The effects that match the filter. Not part of the state: they are trees of the parsed library.
     */
    effects: filtered,
    /**
     * The engine runs on the surface of the mode: shows the selected effect and polls its stats
     */
    attach(it: NwViewer) {
      viewer = it
      show()
      stopPolling()
      timer = setInterval(() => setState('stats', viewer?.particlePreviewStats() ?? null), STATS_POLL_MS)
    },
    /**
     * Hidden or closed
     */
    detach() {
      stopPolling()
    },
    setFilter(filter: string) {
      setState('filter', filter)
    },
    select(fullName: string) {
      setState('selected', fullName)
    },
    isSelected(effect: ParticleEffectNode) {
      return state.selected === effect.fullName
    },
  }
}

/**
 * The top level effects with params or sub emitters, as the game spawns them
 */
export function playableEffects(library: ParticleLibraryDocument | undefined): ParticleEffectNode[] {
  return (library?.effects ?? []).filter((it) => it.attrs || it.children.length)
}

export function filterEffects(effects: ParticleEffectNode[], filter: string): ParticleEffectNode[] {
  const text = filter.toLowerCase()
  if (!text) {
    return effects
  }
  return effects.filter((it) => it.fullName.toLowerCase().includes(text))
}

/**
 * The shown effect with its state and counts, and that one shots restart
 */
export function effectInfo(selected: string | null, stats: ParticleStats | null): string {
  let text = selected ?? 'no effect'
  if (stats) {
    text += ` · ${stats.state} · ${stats.emitters} emitters · ${stats.particles} particles`
  }
  return `${text} · one shots restart every 3 s`
}

/**
 * The number of sub emitters, empty for none. Folders have no params of their own.
 */
export function describeEffect(effect: ParticleEffectNode): string {
  const count = countNodes(effect) - 1
  return count ? `+${count}` : ''
}

function countNodes(node: ParticleEffectNode): number {
  let result = 1
  for (const child of node.children) {
    result += countNodes(child)
  }
  return result
}
