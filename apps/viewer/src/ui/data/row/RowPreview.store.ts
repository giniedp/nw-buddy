import { createEffect, createMemo, createResource, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { NwViewer } from '../../../viewer'
import { useApp } from '../../app/ViewerApp'
import type { FamilyRows } from '../families'
import type { RowPreviewOption } from '../preview'

/**
 * How often, and for how long, the camera follows the models of a slice while they load
 */
const FRAME_POLL_MS = 500
const FRAME_FOLLOW_MS = 15000

export interface RowPreviewState {
  /**
   * The index of the shown option, null for the {@link preferredOption}
   */
  selected: number | null
}

export interface RowPreviewProps {
  rows: FamilyRows
  row: number
  /**
   * The row's tab is visible: a hidden tab releases the engine canvas
   */
  shown: boolean
}

export type RowPreviewStore = ReturnType<typeof createRowPreviewStore>

/**
 * The state and actions of the 3D preview of a row: its options (its own models, the appearances it references), the
 * shown one in the engine with the masks of an appearance, the files to export
 */
export function createRowPreviewStore(props: RowPreviewProps) {
  const app = useApp()
  const [loaded] = createResource(
    () => ({ rows: props.rows, row: props.row }),
    ({ rows, row }) => app.rowPreviews.rowPreviews(rows, row),
  )
  // the options of the row: not part of the state, the preview service builds them from the rows
  const options = createMemo(() => (loaded.error ? [] : (loaded() ?? [])))
  const [state, setState] = createStore<RowPreviewState>({
    selected: null,
  })
  const selectedIndex = createMemo(() => {
    const list = options()
    return Math.min(state.selected ?? preferredOption(list), list.length - 1)
  })
  const option = createMemo((): RowPreviewOption | undefined => options()[selectedIndex()])

  let viewer: NwViewer | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  // the user moved the camera: a slice is no longer framed as its models load
  let touched = false
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
  onCleanup(stopPolling)

  const showSlice = async (slicePath: string) => {
    const slice = await app.nwbt.getSlice(slicePath).catch(() => null)
    if (!slice || !viewer) {
      return
    }
    viewer.showSlice(slicePath, slice.root, slice.slices)
    // the models load after the spawn: frame them as they come in, until the user takes the camera (SliceMode)
    touched = false
    const start = performance.now()
    timer = setInterval(() => {
      if (touched || performance.now() - start > FRAME_FOLLOW_MS) {
        stopPolling()
        return
      }
      viewer?.framePreviewModel()
    }, FRAME_POLL_MS)
  }

  const show = () => {
    const it = option()
    if (!viewer || !it) {
      return
    }
    stopPolling()
    if (it.slice) {
      void showSlice(it.slice)
      return
    }
    viewer.showParts(it.key, it.parts ?? [], it.params)
  }

  // another row starts with its preferred option
  createEffect(
    on(
      () => props.row,
      () => setState('selected', null),
      { defer: true },
    ),
  )
  createEffect(on(option, show, { defer: true }))

  return {
    state,
    options,
    option,
    selectedIndex,
    /**
     * The options for the dropdown, by index
     */
    selectOptions: createMemo(() => options().map((it, index) => ({ label: it.label, value: index }))),
    /**
     * The files of the shown option as the browser exports them: each model with its material, or the slice
     */
    exportFiles: createMemo(() => exportFiles(option())),
    attach(it: NwViewer) {
      viewer = it
      show()
    },
    detach() {
      viewer = null
      stopPolling()
    },
    select(index: number) {
      setState('selected', index)
    },
    /**
     * The user takes the camera
     */
    touch() {
      touched = true
    },
    resetCamera() {
      viewer?.framePreviewModel()
    },
  }
}

/**
 * The option shown first: the `Skin1` of the row or of a referenced appearance (e.g. a gauntlet's hand before its
 * `MeshOverride`), else the first
 */
export function preferredOption(options: Pick<RowPreviewOption, 'label'>[]): number {
  const index = options.findIndex((it) => it.label === 'Skin1' || it.label.endsWith(' · Skin1'))
  return Math.max(index, 0)
}

/**
 * The files of an option as the browser exports them: each model with its material, or the slice
 */
export function exportFiles(option: RowPreviewOption | undefined): { path: string; material: string | undefined }[] {
  if (!option) {
    return []
  }
  if (option.slice) {
    return [{ path: option.slice, material: undefined }]
  }
  return (option.parts ?? []).map((part) => ({ path: part.mesh, material: part.material || undefined }))
}

export function fileStem(path: string) {
  return (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '')
}
