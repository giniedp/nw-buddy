import { batch, createMemo, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { NwViewer } from '../../../../viewer'
import type { AssetViewProps } from '../registry'
import type { ModelModeState } from './types'

/**
 * How often the store reads the levels of detail of the shown model (loads finish, the rendered level changes)
 */
const LOD_POLL_MS = 250

export type ModelModeStore = ReturnType<typeof createModelModeStore>

/**
 * The state and actions of the model mode: shows the `.cgf` or `.skin` of the tab in the engine, polls its levels of
 * detail and forces one.
 */
export function createModelModeStore(props: AssetViewProps) {
  // read from the poll, outside an owner
  const path = createMemo(() => props.ctx.path)
  const [state, setState] = createStore<ModelModeState>({
    maxLevel: 0,
    rendered: 0,
    forced: null,
    get levels() {
      return levels()
    },
    get info() {
      return info()
    },
  })
  const levels = createMemo(() => Array.from({ length: state.maxLevel + 1 }, (_, i) => i))
  const info = createMemo(() => lodInfo(state.rendered, state.maxLevel))

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  const poll = () => {
    if (viewer?.previewKey !== `model:${path()}`) {
      return
    }
    const lod = viewer.previewModelLod()
    batch(() => {
      setState('maxLevel', lod.maxLevel)
      setState('rendered', lod.rendered)
    })
    // a level that is forced before the model loaded applies once it is there
    if (lod.forced !== state.forced) {
      viewer.forcePreviewModelLod(state.forced)
    }
  }

  return {
    state,
    /**
     * The engine runs on the surface of the mode: shows the model and polls its levels of detail
     */
    attach(it: NwViewer) {
      viewer = it
      it.showModel(path())
      it.forcePreviewModelLod(state.forced)
      stopPolling()
      timer = setInterval(poll, LOD_POLL_MS)
    },
    /**
     * Hidden or closed
     */
    detach() {
      stopPolling()
    },
    /**
     * Renders a level of detail, null by the distance to the camera
     */
    force(level: number | null) {
      setState('forced', level)
      viewer?.forcePreviewModelLod(level)
    },
    resetCamera() {
      viewer?.framePreviewModel()
    },
  }
}

export function lodInfo(rendered: number, maxLevel: number) {
  if (maxLevel <= 0) {
    return 'no levels of detail'
  }
  return `LOD ${rendered} of ${maxLevel}`
}
