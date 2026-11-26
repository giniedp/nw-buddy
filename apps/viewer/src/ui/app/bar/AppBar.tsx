import { For, type JSX } from 'solid-js'
import { ButtonGroup, Icon, Toolbar } from 'tweak-ui'
import { LinkButton } from '../../common/LinkButton'
import svgFolderTree from '../../icons/folder-tree.svg?raw'
import svgMountainSun from '../../icons/mountain-sun.svg?raw'
import svgTableList from '../../icons/table-list.svg?raw'
import type { ToolId } from '../tools'
import { createToolSwitchStore } from './AppBar.store'
import './AppBar.css'

/**
 * The bar at the top of every tool: the tool switch first, then the items of the tool.
 */
export function AppBar(props: {
  /**
   * Translucent, above the engine canvas (the viewer). Otherwise an opaque bar of the page.
   */
  overlay?: boolean
  start?: JSX.Element
  end?: JSX.Element
}) {
  return (
    <Toolbar
      class={props.overlay ? 'nw-app-bar nw-app-bar-overlay' : 'nw-app-bar'}
      start={
        <>
          <ToolSwitch />
          {props.start}
        </>
      }
      end={props.end}
    />
  )
}

const TOOLS: Array<{ id: ToolId; label: string; icon: string; title: string }> = [
  { id: 'viewer', label: 'Viewer', icon: svgMountainSun, title: 'Levels and models in 3D' },
  { id: 'browser', label: 'Browser', icon: svgFolderTree, title: 'Browse the game files' },
  { id: 'data', label: 'Data', icon: svgTableList, title: 'Browse the game data tables by row type, with links' },
]

/**
 * Switches between the tools, a segmented control of links
 */
function ToolSwitch() {
  const store = createToolSwitchStore()

  return (
    <ButtonGroup class="nw-tool-switch">
      <For each={TOOLS}>
        {(tool) => (
          <LinkButton
            href={store.href(tool.id)}
            active={store.isCurrent(tool.id)}
            // the viewer's camera moves the url without the router, its href may lag: the shown tool stays
            current={store.isCurrent(tool.id)}
            title={tool.title}
            icon={<Icon svg={tool.icon} />}
          >
            {tool.label}
          </LinkButton>
        )}
      </For>
    </ButtonGroup>
  )
}
