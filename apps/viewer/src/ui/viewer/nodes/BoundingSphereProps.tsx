import type { BoundingSphere } from '@gglib/math'
import { BoolWidget, ScalarWidget, VectorWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

export function BoundingSphereProps(props: { data: BoundingSphere }) {
  const panel = usePanel()
  return (
    <>
      <BoolWidget {...panel.bind(props.data, 'isEmpty')} readonly />
      <VectorWidget label="center" value={panel.pull(() => props.data.center)} readonly />
      <ScalarWidget {...panel.bind(props.data, 'radius')} readonly />
    </>
  )
}
