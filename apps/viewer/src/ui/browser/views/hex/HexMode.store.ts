import { createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { formatBytesExact } from '../../../common/format'
import type { AssetViewProps } from '../registry'
import type { HexModeState } from './types'

export type HexModeStore = ReturnType<typeof createHexModeStore>

/**
 * The state of the hex mode: the bytes of the file and the range to mark, see `ViewerApp.tabs.showBytes`
 */
export function createHexModeStore(props: AssetViewProps) {
  const app = props.ctx.app
  const [loaded] = createResource(
    () => props.ctx.path,
    (path) => app.files.contentBytes(path),
  )
  // reading a failed resource throws: guard every read
  const bytes = createMemo(() => (loaded.error ? undefined : loaded()))

  const [state] = createStore<HexModeState>({
    get loadError() {
      return loaded.error ? String(loaded.error) : null
    },
    get ready() {
      return !!bytes()
    },
    get size() {
      return formatBytesExact(bytes()?.length ?? 0)
    },
  })

  return {
    state,
    /**
     * The bytes of the file. Not part of the state: the content cache of the tab owns them.
     */
    bytes: () => bytes() ?? new Uint8Array(0),
    /**
     * The range to mark and scroll to
     */
    mark: () => app.tabs.hexMark(props.ctx.path),
  }
}
