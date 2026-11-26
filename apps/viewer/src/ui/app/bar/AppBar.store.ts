import { useLocation, useMatch, useResolvedPath } from '@solidjs/router'
import type { ToolId } from '../tools'
import { useApp } from '../ViewerApp'

export type ToolSwitchStore = ReturnType<typeof createToolSwitchStore>

/**
 * The tools as links: the shown tool, and the href of each tool, which returns to the location the tool had when it
 * was left (see `ViewerApp.toolLocations`), e.g. the level and camera of the viewer.
 */
export function createToolSwitchStore() {
  const app = useApp()
  const location = useLocation()
  // useMatch tests the full pathname: the pattern starts with the router base, the app may be mounted below the
  // root (`/pak/viewer`). A tool may have more segments (`/data/<family>`).
  const pattern = useResolvedPath(() => '/:tool/*')
  const match = useMatch(() => pattern() ?? '/:tool/*')
  const current = () => match()?.params.tool as ToolId

  return {
    current,
    isCurrent(tool: ToolId) {
      return current() === tool
    },
    /**
     * Relative to the router base. The shown tool links to its own location (for a new tab), a click on it stays (see
     * `Link` `current`).
     */
    href(tool: ToolId) {
      if (tool === current()) {
        return location.pathname.slice(app.base.length) + location.search
      }
      return app.toolLocations[tool] ?? `/${tool}`
    },
  }
}
