import { createMemo, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { NwViewer } from '../../../../viewer'
import type { AssetViewProps } from '../registry'
import type { MaterialModeState } from './types'

/**
 * How often the store asks for the sub materials while they load
 */
const NAMES_POLL_MS = 250

export type MaterialModeStore = ReturnType<typeof createMaterialModeStore>

/**
 * The state and actions of the material mode: shows the `.mtl` of the tab in the engine (a shader ball per sub
 * material), reads the names of the sub materials once they load, frames one ball or all of them.
 */
export function createMaterialModeStore(props: AssetViewProps) {
  // read from the engine callbacks, outside an owner
  const path = createMemo(() => props.ctx.path)
  const [state, setState] = createStore<MaterialModeState>({
    names: [],
    focus: null,
    get info() {
      return info()
    },
  })
  const info = createMemo(() => materialInfo(state.names.length))

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  return {
    state,
    /**
     * The engine runs on the surface of the mode: shows the material, waits for the names and frames the balls once
     */
    attach(it: NwViewer) {
      viewer = it
      it.showMaterial(path())
      stopPolling()
      timer = setInterval(() => {
        const names = viewer?.previewMaterialNames() ?? []
        if (names.length) {
          stopPolling()
          setState('names', names)
          viewer?.framePreviewMaterial(state.focus)
        }
      }, NAMES_POLL_MS)
    },
    /**
     * Hidden or closed
     */
    detach() {
      stopPolling()
    },
    /**
     * Frames a shader ball, null for all of them
     */
    frame(index: number | null) {
      setState('focus', index)
      viewer?.framePreviewMaterial(index)
    },
  }
}

export function materialInfo(count: number) {
  if (!count) {
    return 'loading'
  }
  return count === 1 ? '1 sub material' : `${count} sub materials`
}
