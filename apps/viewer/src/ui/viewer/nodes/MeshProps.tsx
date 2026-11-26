import type { Mesh } from '@gglib/graphics'
import { Group, TextWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'
import { NodeProps } from './NodeProps'

export function MeshProps(props: { data: Mesh }) {
  const panel = usePanel()
  return (
    <>
      <TextWidget {...panel.bind(props.data, 'name')} label="Name" readonly />
      <TextWidget label="Bone ID" value={panel.pull(() => String(props.data.boneId))} readonly />
      <TextWidget label="Materials" value={panel.pull(() => String(props.data.materials?.length ?? 0))} readonly />
      <TextWidget label="Geometries" value={panel.pull(() => String(props.data.geometries?.length ?? 0))} readonly />
      <Group title="Bounding Box">
        <NodeProps data={panel.pull(() => props.data.boundingBox)} />
      </Group>
      <Group title="Bounding Sphere">
        <NodeProps data={panel.pull(() => props.data.boundingSphere)} />
      </Group>
    </>
  )
}
