import { createMemo, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { BrowseSlice } from '../../../../api/browse'
import type { NwViewer } from '../../../../viewer'
import type { AssetViewProps } from '../registry'
import type { SliceModeState } from './types'

/**
 * How often, and for how long, the camera follows the models while they load (until the user moves it)
 */
const FRAME_POLL_MS = 500
const FRAME_FOLLOW_MS = 15000

export type SliceModeStore = ReturnType<typeof createSliceModeStore>

/**
 * The state and actions of the slice mode: shows the slice of the tab and the slices it spawns in the engine, frames
 * the models while they load until the user moves the camera.
 */
export function createSliceModeStore(props: AssetViewProps) {
  // read from the engine callbacks, outside an owner
  const path = createMemo(() => props.ctx.path)
  const slice = createMemo(() => props.ctx.slice)
  const [state] = createStore<SliceModeState>({
    get info() {
      return info()
    },
  })
  const info = createMemo(() => {
    const it = slice()
    return it ? sliceInfo(it) : ''
  })

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  // the user moved the camera: it is not framed again
  let touched = false

  const stopFollowing = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopFollowing)

  return {
    state,
    /**
     * The engine runs on the surface of the mode: spawns the slices and frames the models as they come in
     */
    attach(it: NwViewer) {
      viewer = it
      const current = slice()
      if (!current) {
        return
      }
      it.showSlice(path(), current.root, current.slices)
      stopFollowing()
      if (touched) {
        return
      }
      const start = performance.now()
      timer = setInterval(() => {
        if (touched || performance.now() - start > FRAME_FOLLOW_MS) {
          stopFollowing()
          return
        }
        viewer?.framePreviewModel()
      }, FRAME_POLL_MS)
    },
    /**
     * Hidden or closed
     */
    detach() {
      stopFollowing()
    },
    /**
     * The user takes the camera
     */
    touch() {
      touched = true
    },
    frame() {
      viewer?.framePreviewModel()
    },
  }
}

export function sliceInfo(slice: Pick<BrowseSlice, 'meshes' | 'slices'>) {
  return `${slice.meshes} meshes in ${Object.keys(slice.slices).length} slices`
}
