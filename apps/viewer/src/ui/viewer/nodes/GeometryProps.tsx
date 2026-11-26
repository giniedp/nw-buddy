import type { Geometry } from '@gglib/graphics'
import { ScalarWidget, TextWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

export function GeometryProps(props: { data: Geometry }) {
  const panel = usePanel()
  return (
    <>
      <TextWidget {...panel.bind(props.data, 'name')} readonly />
      <TextWidget {...panel.bind(props.data, 'uid')} readonly />
      <ScalarWidget {...panel.bind(props.data, 'vertexCount')} readonly decimals={0} />
      <ScalarWidget {...panel.bind(props.data, 'vertexOffset')} readonly decimals={0} />
      <ScalarWidget {...panel.bind(props.data, 'indexCount')} readonly decimals={0} />
      <ScalarWidget {...panel.bind(props.data, 'indexOffset')} readonly decimals={0} />
      <ScalarWidget {...panel.bind(props.data, 'instanceOffset')} readonly decimals={0} />
      <ScalarWidget {...panel.bind(props.data, 'instanceCount')} readonly decimals={0} />
    </>
  )
}
