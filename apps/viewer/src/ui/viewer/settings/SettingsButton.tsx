import { Button, Icon } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { ModalDialog } from '../../common/ModalDialog'
import svgGear from '../../icons/gear.svg?raw'
import { ConfigActions, ConfigPanel } from './ConfigPanel'
import { createSettingsButtonStore } from './SettingsButton.store'

/**
 * Opens the settings ({@link ViewerConfig}) in a dialog
 */
export function SettingsButton(props: { viewer: NwViewer }) {
  const store = createSettingsButtonStore(props)
  return (
    <>
      <Button square title="Settings" icon={<Icon svg={svgGear} />} onClick={store.open} />
      <ModalDialog
        title="Settings"
        open={store.state.open}
        onClose={store.close}
        actions={<ConfigActions config={store.config()} large />}
      >
        <div class="nw-dialog-content nw-dialog-content-wide">
          <ConfigPanel config={store.config()} />
        </div>
      </ModalDialog>
    </>
  )
}
