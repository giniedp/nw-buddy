import { Show } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { AppBar } from '../../app/bar/AppBar'
import svgCamera from '../../icons/camera-viewfinder.svg?raw'
import svgPause from '../../icons/pause.svg?raw'
import svgPlay from '../../icons/play.svg?raw'
import svgSidebarR from '../../icons/sidebar-right.svg?raw'
import svgSidebar from '../../icons/sidebar.svg?raw'
import svgVolume from '../../icons/volume-high.svg?raw'
import svgVolumeOff from '../../icons/volume-xmark.svg?raw'
import { PanelScope } from '../PanelScope'
import { SceneBrowser } from '../scene/SceneBrowser'
import { ScenesButton } from '../scenes/ScenesButton'
import { SettingsButton } from '../settings/SettingsButton'
import { StatsBar } from '../stats/StatsBar'
import { StatsPanel } from '../stats/StatsPanel'
import svgMap from '../../icons/map.svg?raw'
import { Minimap } from '../minimap/Minimap'
import { TimeOfDayButton } from '../time-of-day/TimeOfDayButton'
import { createViewerOverlayStore } from './ViewerOverlay.store'
import './ViewerOverlay.css'

/**
 * The ui of the viewer tool above the canvas: the toolbar, the scene tree on the left and the stats on the right
 */
export function ViewerOverlay(props: { viewer: NwViewer }) {
  const store = createViewerOverlayStore(props)
  return (
    <div class="tweak-ui nw-overlay">
      <div class="nw-overlay-layout">
        <AppBar
          overlay
          end={
            <>
              <StatsBar viewer={props.viewer} />
              <ScenesButton viewer={props.viewer} />
              <TimeOfDayButton viewer={props.viewer} />
              <Button
                square
                accent={store.state.audio}
                title={store.state.audio ? 'Audio is on, click to mute' : 'Audio is off, click to play it'}
                icon={<Icon svg={store.state.audio ? svgVolume : svgVolumeOff} />}
                onClick={store.toggleAudio}
              />
              <Button
                square
                title={store.state.map ? 'Hide the minimap' : 'Show the minimap: a click teleports the camera'}
                icon={<Icon svg={svgMap} />}
                active={store.state.map}
                onClick={store.toggleMap}
              />
              <Button
                square
                accent={store.state.clockFrozen}
                title={
                  store.state.clockFrozen
                    ? `Time is paused at ${store.state.clockTime} s, click to play`
                    : 'Pause the time (shaders, particles, fog volumes), for comparable shots'
                }
                icon={<Icon svg={store.state.clockFrozen ? svgPlay : svgPause} />}
                onClick={store.toggleClock}
              />
              <Button
                square
                title="Download a screenshot (canvas resolution)"
                icon={<Icon svg={svgCamera} />}
                onClick={store.screenshot}
              />
              {/* the two sidebar toggles side by side, in the order of the sidebars */}
              <Button
                square
                title={store.state.left ? 'Hide the scene tree' : 'Show the scene tree (left sidebar)'}
                icon={<Icon svg={svgSidebar} />}
                active={store.state.left}
                onClick={store.toggleLeft}
              />
              <Button
                square
                title={store.state.right ? 'Hide the stats' : 'Show the stats (right sidebar)'}
                icon={<Icon svg={svgSidebarR} />}
                active={store.state.right}
                onClick={store.toggleRight}
              />
              <SettingsButton viewer={props.viewer} />
            </>
          }
        />
        <div class="nw-overlay-panes">
          <Show when={store.state.left}>
            <aside class="nw-overlay-sidebar">
              <PanelScope>
                <SceneBrowser viewer={props.viewer} />
              </PanelScope>
            </aside>
          </Show>
          <div class="nw-overlay-fluid">
            <Show when={store.state.map}>
              <Minimap viewer={props.viewer} />
            </Show>
          </div>
          <Show when={store.state.right}>
            <aside class="nw-overlay-sidebar">
              <PanelScope>
                <StatsPanel viewer={props.viewer} />
              </PanelScope>
            </aside>
          </Show>
        </div>
      </div>
    </div>
  )
}
