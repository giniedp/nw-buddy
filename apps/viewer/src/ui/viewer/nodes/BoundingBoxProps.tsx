import type { BoundingBox } from '@gglib/math'
import { BoolWidget, VectorWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

export function BoundingBoxProps(props: { data: BoundingBox }) {
  const panel = usePanel()
  return (
    <>
      <BoolWidget {...panel.bind(props.data, 'isEmpty')} readonly />
      <VectorWidget label="min" value={panel.pull(() => props.data.min)} readonly />
      <VectorWidget label="max" value={panel.pull(() => props.data.max)} readonly />
    </>
  )
}
