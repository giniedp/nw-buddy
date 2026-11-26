import { BitmaskWidget } from 'tweak-ui'
import { DebugLayer } from '../../../game/debug/DebugShapeComponent'
import type { DebugShapeSystem } from '../../../game/debug/DebugShapeSystem'
import { usePanel } from '../PanelScope'

export function DebugShapeSystemProps(props: { data: DebugShapeSystem }) {
  const panel = usePanel()
  return (
    <BitmaskWidget
      {...panel.bind(props.data, 'activeLayers')}
      label="Debug Layers"
      bits={DebugLayer}
      bitCount={Object.values(DebugLayer).length}
    />
  )
}
