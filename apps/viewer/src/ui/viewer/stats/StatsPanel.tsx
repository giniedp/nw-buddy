import { Show } from 'solid-js'
import { Graph, Group, SelectWidget, Tabs } from 'tweak-ui'
import { DebugOptions } from '../../../material'
import type { NwViewer } from '../../../viewer'
import { NodeProps } from '../nodes/NodeProps'
import { RenderPipelinePanel } from '../pipeline/RenderPipelinePanel'
import { EnvProbes } from './EnvProbes'
import { createStatsPanelStore } from './StatsPanel.store'
import './StatsPanel.css'

/**
 * The right sidebar of the viewer: stats graphs (tabs), camera, debug, time of day, environment probes and render
 * pipeline
 */
export function StatsPanel(props: { viewer: NwViewer }) {
  const store = createStatsPanelStore(props)
  return (
    <>
      <Tabs
        tabs={store.graphs.map((tab) => ({
          title: tab.title,
          content: () => <Graph collapsed rows={tab.rows} />,
        }))}
      />
      <Tabs
        tabs={[
          { title: 'Camera', content: () => <NodeProps data={store.camera()} /> },
          {
            title: 'Debug',
            content: () => (
              <>
                <SelectWidget {...store.debugOutput} label="Output" options={DebugOptions} />
                <NodeProps data={store.debugShapes()} />
              </>
            ),
          },
          { title: 'Time of day', content: () => <NodeProps data={store.timeOfDay()} /> },
        ]}
      />
      <Group title="Environment Probes" collapsible>
        <Show when={store.envProbes()}>{(it) => <EnvProbes {...it()} />}</Show>
      </Group>
      <Group title="Render Pipeline" collapsible>
        <RenderPipelinePanel pipeline={store.pipeline()} device={store.device()} />
      </Group>
    </>
  )
}
