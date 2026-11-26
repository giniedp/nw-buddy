import { createEffect, onCleanup, onMount, type JSX } from 'solid-js'
import type { NwViewer } from '../../../viewer'
import { useApp } from '../ViewerApp'

export interface EngineSurfaceProps {
  class?: string
  /**
   * Whether the surface shows the engine, default true. A surface in a hidden pane (a tab or mode that stays mounted)
   * sets it false, it attaches again when it becomes true: the last attached surface shows the canvas.
   */
  active?: boolean
  /**
   * The systems of the engine exist, it may still boot. E.g. to bind the ui. Called on every attach.
   */
  onEngine?: (viewer: NwViewer) => void
  /**
   * The engine runs: booted, content loaded, loop started. E.g. to load a level. Called on every attach.
   */
  onRunning?: (viewer: NwViewer) => void
  /**
   * The surface was detached (hidden or unmounted) while the engine was attached to it
   */
  onDetach?: (viewer: NwViewer) => void
  children?: JSX.Element
}

export type EngineSurfaceStore = ReturnType<typeof createEngineSurfaceStore>

/**
 * Attaches the engine of the app to the surface's element while the surface is active, detaches it when it is
 * hidden or unmounted (see ui/app/engine.ts)
 */
export function createEngineSurfaceStore(props: EngineSurfaceProps) {
  const engine = useApp().engine
  let host: HTMLElement | undefined
  // bumped on every attach and detach, a pending attach of an older generation is dropped
  let generation = 0
  let attachedTo: NwViewer | null = null

  const attach = async (element: HTMLElement) => {
    const current = ++generation
    const attached = await engine.attachSurface(element)
    if (!attached || current !== generation) {
      return
    }
    attachedTo = attached.viewer
    props.onEngine?.(attached.viewer)
    await attached.running
    // another surface may have taken over while the engine booted, e.g. the next route mounts before the old one
    // is disposed: only the surface that shows the engine opens its content
    if (current === generation && engine.isSurface(element)) {
      props.onRunning?.(attached.viewer)
    }
  }
  const detach = () => {
    generation++
    if (host) {
      engine.detachSurface(host)
    }
    const viewer = attachedTo
    attachedTo = null
    if (viewer) {
      props.onDetach?.(viewer)
    }
  }

  onMount(() => {
    createEffect(() => {
      const active = props.active ?? true
      if (!host) {
        return
      }
      if (active) {
        void attach(host)
      } else if (attachedTo || generation) {
        detach()
      }
    })
  })
  onCleanup(detach)

  return {
    /**
     * The element that shows the canvas
     */
    setHost(element: HTMLElement) {
      host = element
    },
  }
}
