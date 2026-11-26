import { useIsRouting } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'
import type { NwViewer } from '../../viewer'
import { useApp } from '../app/ViewerApp'

export type ViewerToolStore = ReturnType<typeof createViewerToolStore>

/**
 * The engine of the viewer tool: opens the content of the url when the engine runs for the tool, and keeps the camera
 * position in the url while the tool is shown
 */
export function createViewerToolStore() {
  const app = useApp()
  const [viewer, setViewer] = createSignal<NwViewer>()
  // the router writes the url into the history after the route rendered: while it routes, `location` is still the
  // url of the tool that was left (e.g. the browser's `?file=`), so the url is read and written once it is done
  const routing = useIsRouting()
  const timer = setInterval(() => {
    if (!routing()) {
      writeCameraToUrl(viewer())
    }
  }, 1000)
  onCleanup(() => clearInterval(timer))

  // the engine runs for this surface: open the content of the url, on every attach
  const [running, setRunning] = createSignal<NwViewer | null>(null, { equals: false })
  createEffect(() => {
    const it = running()
    if (it && !routing()) {
      untrack(() => app.viewerContent.openUrlContent(it))
    }
  })

  return {
    /**
     * The engine, once it is created
     */
    viewer,
    onEngine(it: NwViewer) {
      setViewer(it)
    },
    onRunning(it: NwViewer) {
      setRunning(it)
      it.setThirdPersonAvailable(true)
    },
    /**
     * The other tools show previews with the same camera: no third person there, free mode on return
     */
    onDetach(it: NwViewer) {
      setRunning(null)
      it.setThirdPersonAvailable(false)
    },
  }
}

/**
 * Keeps the camera position in the url, so a reload or a shared link opens the same view.
 * Replaces the history entry without the router: the router does not read these parameters.
 */
function writeCameraToUrl(viewer: NwViewer | undefined) {
  if (!viewer) {
    return
  }
  const params = new URLSearchParams(location.search)
  if (viewer.writeCameraParams(params)) {
    history.replaceState(history.state, '', `${location.pathname}?${params}`)
  }
}
