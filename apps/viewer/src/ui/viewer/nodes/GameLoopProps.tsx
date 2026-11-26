import type { GameLoop } from '@gglib/game'
import { Show } from 'solid-js'
import { BoolWidget, ScalarWidget } from 'tweak-ui'
import { usePanel } from '../PanelScope'

export function GameLoopProps(props: { data: GameLoop }) {
  const panel = usePanel()
  const setTargetFps = (fps: number) => {
    props.data.targetElapsedTime = 1000 / fps
    panel.redraw()
  }
  return (
    <>
      <BoolWidget {...panel.bind(props.data, 'isRunning')} readonly />
      <BoolWidget {...panel.bind(props.data, 'isRunningSlowly')} readonly />
      <BoolWidget {...panel.bind(props.data, 'useFixedTimeStep')} label="Fixed time step" />
      <Show when={panel.pull(() => props.data.useFixedTimeStep)}>
        <ScalarWidget
          label="Target FPS"
          value={panel.pull(() => 1000 / props.data.targetElapsedTime)}
          onInput={setTargetFps}
          min={10}
          max={200}
          step={1}
          range
        />
      </Show>
    </>
  )
}
