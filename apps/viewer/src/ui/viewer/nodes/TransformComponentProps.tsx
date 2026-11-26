import type { TransformComponent } from '@gglib/components'
import { BoolWidget, MatrixWidget, ScalarWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

export function TransformComponentProps(props: { data: TransformComponent }) {
  const panel = usePanel()
  return (
    <>
      <ScalarWidget label="Children" value={panel.pull(() => props.data.children?.length)} readonly decimals={0} />
      <BoolWidget {...panel.bind(props.data, 'keepWorld')} readonly />
      <MatrixWidget label="Transform" value={panel.pull(() => props.data.matrix)} rows={4} cols={4} readonly />
    </>
  )
}
