import { Show } from 'solid-js'
import { Group, Icon, Tree } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { NodeProps } from '../nodes/NodeProps'
import { createSceneBrowserStore } from './SceneBrowser.store'
import './SceneBrowser.css'

/**
 * The scene tree with the properties of the selected node below
 */
export function SceneBrowser(props: { viewer: NwViewer }) {
  const store = createSceneBrowserStore(props)
  return (
    <Show when={store.state.hasScene} fallback={<p class="nw-note">No scene</p>}>
      <div class="nw-scene-browser">
        <Tree
          {...store.tree}
          getIcon={(node) => <Icon svg={store.iconOf(node)} />}
          items={store.roots()}
          expanded={store.state.expanded}
          onExpandedChange={store.setExpanded}
          version={store.state.version}
          selected={store.state.selectedId}
          onSelect={store.select}
        />
        <Group title="Properties" class="nw-scene-props">
          <NodeProps data={store.selection()} />
        </Group>
      </div>
    </Show>
  )
}
