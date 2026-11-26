import { AngleWidget, BoolWidget, ScalarWidget, track } from 'tweak-ui'
import type { TimeOfDay } from '../../../game/level/TimeOfDay'
import { usePanel } from '../PanelScope'

export function TimeOfDayProps(props: { data: TimeOfDay }) {
  const panel = usePanel()
  // advances on its own while animated
  const time = track(() => panel.pull(() => props.data.time))
  return (
    <>
      <ScalarWidget
        {...panel.bind(props.data, 'time')}
        value={time()}
        min={0}
        max={(24 * 60 - 1) / 60.0}
        step={0.1}
        range
      />
      <ScalarWidget {...panel.bind(props.data, 'timeAnimSpeed')} min={0} max={2} step={0.001} range />
      <BoolWidget {...panel.bind(props.data, 'enablePoiLayers')} />
      <BoolWidget {...panel.bind(props.data, 'animate')} />
      <AngleWidget {...panel.bind(props.data, 'sunRotationLatitude')} min={0} max={360} step={1} degree />
      <AngleWidget {...panel.bind(props.data, 'sunRotationLongitude')} min={0} max={360} step={1} degree />
    </>
  )
}
