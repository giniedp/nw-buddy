import { BoolWidget } from 'tweak-ui'
import type { LightSystem } from '../../../game/light/LightSystem'
import { usePanel } from '../PanelScope'

export function LightSystemProps(props: { data: LightSystem }) {
  const panel = usePanel()
  return <BoolWidget {...panel.bind(props.data, 'enabled')} />
}
