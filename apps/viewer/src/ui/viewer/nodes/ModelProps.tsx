import type { Model } from '@gglib/model'
import { Group, TextWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'
import { NodeProps } from './NodeProps'

export function ModelProps(props: { data: Model }) {
  const panel = usePanel()
  return (
    <>
      <TextWidget {...panel.bind(props.data, 'name')} readonly />
      <TextWidget label="Meshes" value={panel.pull(() => String(props.data.meshes?.length ?? 0))} readonly />
      <TextWidget label="Nodes" value={panel.pull(() => String(props.data.nodes?.length ?? 0))} readonly />
      <TextWidget label="Skins" value={panel.pull(() => String(props.data.skins?.length ?? 0))} readonly />
      <Group title="Bounding Box">
        <NodeProps data={panel.pull(() => props.data.boundingBox)} />
      </Group>
      <Group title="Bounding Sphere">
        <NodeProps data={panel.pull(() => props.data.boundingSphere)} />
      </Group>
    </>
  )
}
