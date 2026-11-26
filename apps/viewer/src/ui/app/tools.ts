import { useBeforeLeave } from '@solidjs/router'
import { useApp } from './ViewerApp'

export type ToolId = 'viewer' | 'browser' | 'data'

const TOOL_IDS: ToolId[] = ['viewer', 'browser', 'data']

/**
 * Remembers the location of the tool that is left, before every navigation (links, back and forward). Called once,
 * in the root of the router. The tool switch links to these locations (bar/AppBar.store.ts).
 *
 * @remarks
 * Reads `window.location`, not the router's location: the viewer writes its camera into the url without the router.
 */
export function useToolLocations() {
  const app = useApp()
  useBeforeLeave(() => {
    const path = window.location.pathname.slice(app.base.length)
    const tool = toolOf(path)
    if (tool) {
      app.setToolLocation(tool, path + window.location.search)
    }
  })
}

/**
 * The tool of a path relative to the base (`/data/ItemData` → `data`), null for other paths
 */
export function toolOf(path: string): ToolId | null {
  const tool = path.split('/')[1] as ToolId
  if (TOOL_IDS.includes(tool)) {
    return tool
  }
  return null
}
