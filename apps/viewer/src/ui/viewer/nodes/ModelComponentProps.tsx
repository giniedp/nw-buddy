import type { ModelComponent } from '@gglib/components'
import { usePanel } from '../PanelScope'
import { NodeProps } from './NodeProps'

/**
 * The properties of the model of the component
 */
export function ModelComponentProps(props: { data: ModelComponent }) {
  const panel = usePanel()
  return <NodeProps data={panel.pull(() => props.data.model)} />
}
