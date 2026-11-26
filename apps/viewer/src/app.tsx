/**
 * The viewer app (Viewer, Browser and Data tools) as a library, for hosts that mount it below a path of their own
 * (nw-buddy `/pak`). The lib build extracts the styles into `nw-viewer-app.css` next to this module, the mount links
 * it.
 */
import { render } from 'solid-js/web'
import { App } from './ui/app/App'
import { ViewerApp, type ViewerAppOptions } from './ui/app/ViewerApp'
import './ui/styles/index.css'

export type { ViewerAppOptions }

export interface MountedViewerApp {
  /**
   * Shows a location below the base that the host navigated to with its own router (e.g. a menu link to `/pak`): the
   * app's router only sees its own history entries and back/forward. Locations outside the base are ignored.
   *
   * @param location - path and query of the page, with the base (`/pak/data`)
   * @param options - `replace`: the host already added a history entry for it
   */
  navigate(location: string, options?: { replace?: boolean }): void
  /**
   * Unmounts the app, destroys the engine and its GPU device
   */
  dispose(): void
}

/**
 * The stylesheet of the lib build, see vite.config.ts. The dev server injects the imported styles itself.
 */
const STYLESHEET = 'nw-viewer-app.css'

/**
 * Renders the app into the element. The app owns the location below `base`: its tools are `<base>/viewer`,
 * `<base>/browser` and `<base>/data/<family>`, their state is in the query. Host navigations below the base go to
 * {@link MountedViewerApp.navigate}.
 *
 * The element is the containing block of the tools: the host gives it its size (e.g. the page area below the host's
 * navigation), the app fills it.
 */
export function mountViewerApp(element: HTMLElement, options: ViewerAppOptions): MountedViewerApp {
  const app = new ViewerApp(options)
  const stylesheet = import.meta.env.DEV ? null : linkStylesheet()
  element.classList.add('nw-viewer-app')
  const unmount = render(() => <App app={app} />, element)
  return {
    navigate(location, navigateOptions) {
      app.navigate(location, navigateOptions)
    },
    dispose() {
      unmount()
      app.dispose()
      element.classList.remove('nw-viewer-app')
      stylesheet?.remove()
    },
  }
}

function linkStylesheet() {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = new URL(STYLESHEET, import.meta.url).href
  document.head.append(link)
  return link
}
