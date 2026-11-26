import type { MeshComponent } from '@gglib/components'
import { usePanel } from '../PanelScope'
import { NodeProps } from './NodeProps'

/**
 * The properties of the mesh of the component
 */
export function MeshComponentProps(props: { data: MeshComponent }) {
  const panel = usePanel()
  return <NodeProps data={panel.pull(() => props.data.mesh)} />
}
