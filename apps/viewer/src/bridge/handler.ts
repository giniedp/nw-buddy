import type { NwViewer } from '../viewer'
import { isViewerCommand } from './commands'

export function connectPostMessage(viewer: NwViewer) {
  window.addEventListener('message', async (event: MessageEvent) => {
    const { data, source } = event

    if (!isViewerCommand(data)) {
      return
    }

    // viewer.handleCommand(data)
  })
  // send ready message to parent window
  window.parent.postMessage({ type: 'nw_viewer_ready' }, '*')
}
