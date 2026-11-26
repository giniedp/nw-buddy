import { createStore } from 'solid-js/store'
import type { NwViewer } from '../../../viewer'
import type { SettingsButtonState } from './types'

export type SettingsButtonStore = ReturnType<typeof createSettingsButtonStore>

/**
 * The settings dialog of the viewer config
 */
export function createSettingsButtonStore(props: { viewer: NwViewer }) {
  const [state, setState] = createStore<SettingsButtonState>({ open: false })
  return {
    state,
    /**
     * The viewer config, see `ViewerConfig`
     */
    config: () => props.viewer.config,
    open() {
      setState('open', true)
    },
    close() {
      setState('open', false)
    },
  }
}
